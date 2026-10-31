-- Owner tools for products: edit and "delete".
-- Deleting archives the product: it disappears from lists, search, scans and
-- sales, but past sales and stock movements keep pointing to it.

alter table public.products add column archived_at timestamptz;

-- A barcode only has to be unique among active products, so an archived
-- product's barcode can be reused.
alter table public.products drop constraint products_barcode_key;
create unique index products_barcode_active on public.products (barcode)
  where archived_at is null;

create or replace view public.product_stock with (security_invoker = true) as
select
  p.id, p.barcode, p.name, p.classe, p.price_ht, p.price_ppa, p.image_path,
  p.min_stock, p.created_at,
  coalesce(sum(b.quantity) filter (where b.expiry_date >= current_date), 0)::int as qty,
  coalesce(sum(b.quantity) filter (where b.expiry_date <  current_date), 0)::int as expired_qty,
  min(b.expiry_date) filter (where b.quantity > 0 and b.expiry_date >= current_date) as next_expiry,
  coalesce(sum(b.quantity) filter (where b.expiry_date >= current_date), 0) <= p.min_stock as is_low,
  min(b.expiry_date) filter (where b.quantity > 0) as earliest_expiry
from public.products p
left join public.batches b on b.product_id = p.id
where p.archived_at is null
group by p.id;

revoke all on public.product_stock from anon;

create function public.update_product(
  p_id         uuid,
  p_name       text,
  p_barcode    text,
  p_classe     text,
  p_price_ht   numeric,
  p_price_ppa  numeric,
  p_min_stock  integer,
  p_image_path text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.products set
    name       = btrim(p_name),
    barcode    = nullif(btrim(p_barcode), ''),
    classe     = nullif(btrim(p_classe), ''),
    price_ht   = coalesce(p_price_ht, 0),
    price_ppa  = coalesce(p_price_ppa, 0),
    min_stock  = coalesce(p_min_stock, 5),
    image_path = nullif(p_image_path, '')
  where id = p_id and archived_at is null;
  if not found then
    raise exception 'product_not_found';
  end if;
end $$;

create function public.archive_product(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.products set archived_at = now()
  where id = p_id and archived_at is null;
  if not found then
    raise exception 'product_not_found';
  end if;
end $$;

-- Archived products can no longer receive stock or be sold.
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_delta      integer,
  p_reason     public.movement_reason default 'adjustment',
  p_expiry     date default null,
  p_note       text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_batch_id   uuid;
  v_batch      record;
  v_take       integer;
  v_remaining  integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'invalid_quantity';
  end if;
  if not exists (
    select 1 from public.products where id = p_product_id and archived_at is null
  ) then
    raise exception 'product_not_found';
  end if;

  if p_delta > 0 then
    if p_expiry is null then
      raise exception 'expiry_required';
    end if;
    insert into public.batches as b (product_id, quantity, expiry_date)
    values (p_product_id, p_delta, p_expiry)
    on conflict (product_id, expiry_date)
      do update set quantity = b.quantity + excluded.quantity
    returning id into v_batch_id;

    insert into public.stock_movements (product_id, batch_id, delta, reason, note)
    values (p_product_id, v_batch_id, p_delta, p_reason, p_note);
    return;
  end if;

  v_remaining := -p_delta;
  for v_batch in
    select id, quantity from public.batches
    where product_id = p_product_id and quantity > 0
    order by expiry_date, id
    for update
  loop
    v_take := least(v_batch.quantity, v_remaining);
    update public.batches set quantity = quantity - v_take where id = v_batch.id;
    insert into public.stock_movements (product_id, batch_id, delta, reason, note)
    values (p_product_id, v_batch.id, -v_take, p_reason, p_note);
    v_remaining := v_remaining - v_take;
    exit when v_remaining = 0;
  end loop;

  if v_remaining > 0 then
    raise exception 'insufficient_stock';
  end if;
end $$;

create or replace function public.create_sale(
  p_items   jsonb,
  p_sale_id uuid default gen_random_uuid()
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_line       record;
  v_batch      record;
  v_name       text;
  v_price      numeric(12, 2);
  v_take       integer;
  v_remaining  integer;
  v_total      numeric(12, 2) := 0;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if exists (select 1 from public.sales where id = p_sale_id) then
    return p_sale_id;
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_sale';
  end if;

  insert into public.sales (id, created_by, total) values (p_sale_id, auth.uid(), 0);

  for v_line in
    select x.product_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantity integer)
    group by x.product_id
    order by x.product_id
  loop
    if v_line.product_id is null or v_line.quantity is null or v_line.quantity <= 0 then
      raise exception 'invalid_quantity';
    end if;

    select name, price_ppa into v_name, v_price
    from public.products
    where id = v_line.product_id and archived_at is null;
    if not found then
      raise exception 'product_not_found';
    end if;

    v_remaining := v_line.quantity;
    for v_batch in
      select id, quantity from public.batches
      where product_id = v_line.product_id
        and quantity > 0 and expiry_date >= current_date
      order by expiry_date, id
      for update
    loop
      v_take := least(v_batch.quantity, v_remaining);
      update public.batches set quantity = quantity - v_take where id = v_batch.id;
      insert into public.sale_items (sale_id, product_id, batch_id, quantity, unit_price)
      values (p_sale_id, v_line.product_id, v_batch.id, v_take, v_price);
      insert into public.stock_movements (product_id, batch_id, delta, reason, sale_id)
      values (v_line.product_id, v_batch.id, -v_take, 'sale', p_sale_id);
      v_total := v_total + v_take * v_price;
      v_remaining := v_remaining - v_take;
      exit when v_remaining = 0;
    end loop;

    if v_remaining > 0 then
      raise exception 'insufficient_stock' using detail = v_name;
    end if;
  end loop;

  update public.sales set total = v_total where id = p_sale_id;
  return p_sale_id;
end $$;

revoke all on function public.update_product(uuid, text, text, text, numeric, numeric, integer, text) from public, anon;
revoke all on function public.archive_product(uuid) from public, anon;
grant execute on function public.update_product(uuid, text, text, text, numeric, numeric, integer, text) to authenticated;
grant execute on function public.archive_product(uuid) to authenticated;
