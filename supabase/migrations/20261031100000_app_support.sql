-- Support for the app screens:
--  * product_stock gets is_low and earliest_expiry so the app can filter on the
--    server without combining several OR filters;
--  * create_product creates a product and its first batch in one transaction.

-- is_low: sellable stock at or under the product's minimum.
-- earliest_expiry: earliest expiry among batches that still hold stock,
--   including already-expired ones (so "expiring or expired" is one comparison).
-- New columns are appended at the end; existing ones keep their position.
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
group by p.id;

revoke all on public.product_stock from anon;

create function public.create_product(
  p_name       text,
  p_barcode    text default null,
  p_classe     text default null,
  p_price_ht   numeric default 0,
  p_price_ppa  numeric default 0,
  p_min_stock  integer default 5,
  p_image_path text default null,
  p_qty        integer default 0,
  p_expiry     date default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if coalesce(p_qty, 0) > 0 and p_expiry is null then
    raise exception 'expiry_required';
  end if;

  insert into public.products
    (name, barcode, classe, price_ht, price_ppa, min_stock, image_path)
  values
    (btrim(p_name), nullif(btrim(p_barcode), ''), nullif(btrim(p_classe), ''),
     coalesce(p_price_ht, 0), coalesce(p_price_ppa, 0), coalesce(p_min_stock, 5),
     nullif(p_image_path, ''))
  returning id into v_id;

  if coalesce(p_qty, 0) > 0 then
    perform public.adjust_stock(v_id, p_qty, 'purchase', p_expiry);
  end if;
  return v_id;
end $$;

revoke all on function public.create_product(text, text, text, numeric, numeric, integer, text, integer, date) from public, anon;
grant execute on function public.create_product(text, text, text, numeric, numeric, integer, text, integer, date) to authenticated;
