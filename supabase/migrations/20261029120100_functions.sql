-- Server-side stock logic. Everything runs in one transaction: if any step
-- raises, the whole call is rolled back.

-- adjust_stock: add stock to a batch (positive delta, needs p_expiry) or remove
-- stock (negative delta, earliest-expiry batch first, expired batches included).
create function public.adjust_stock(
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
  if not exists (select 1 from public.products where id = p_product_id) then
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

-- create_sale: p_items = [{"product_id": "...", "quantity": 2}, ...]
-- Prices come from the products table (the client cannot set them). Stock is
-- taken from non-expired batches, earliest expiry first (FEFO). Idempotent on
-- p_sale_id: sending the same sale twice returns the first result.
create function public.create_sale(
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
    from public.products where id = v_line.product_id;
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

-- set_user_role: owner-only; the last owner cannot be demoted.
create function public.set_user_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_role = 'staff' and not exists (
    select 1 from public.profiles where role = 'owner' and id <> p_user_id
  ) then
    raise exception 'last_owner';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
end $$;

-- Only signed-in users may call these.
revoke all on function public.adjust_stock(uuid, integer, public.movement_reason, date, text) from public, anon;
revoke all on function public.create_sale(jsonb, uuid) from public, anon;
revoke all on function public.set_user_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.adjust_stock(uuid, integer, public.movement_reason, date, text) to authenticated;
grant execute on function public.create_sale(jsonb, uuid) to authenticated;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_owner() to authenticated;
