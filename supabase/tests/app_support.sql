-- Tests for create_product and the product_stock flags. Always rolls back.
--   npx supabase db query --linked -f supabase/tests/app_support.sql

do $$
declare
  a uuid := gen_random_uuid();
  p uuid;
  r record;
  msg text;
  checks integer := 0;
begin
  insert into auth.users (id, email) values (a, 'test-a@example.invalid');
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', a::text, true);
  execute 'set local role authenticated';

  -- product with first batch, in one call
  p := public.create_product('  Test Doliprane ', ' 999 ', 'Antalgique', 80, 100, 5, null, 10, current_date + 20);
  select * into r from public.product_stock where id = p;
  assert r.name = 'Test Doliprane', 'name is trimmed';
  assert r.barcode = '999', 'barcode is trimmed';
  assert r.qty = 10, 'first batch created';
  assert r.is_low = false, 'not low at 10 with minimum 5';
  assert r.earliest_expiry = current_date + 20, 'earliest expiry set';
  assert (select count(*) from public.stock_movements where product_id = p and reason = 'purchase' and delta = 10) = 1, 'purchase movement';
  checks := checks + 6;

  -- low flag follows the sellable quantity
  perform public.adjust_stock(p, -6);
  assert (select is_low from public.product_stock where id = p), 'is_low at 4 with minimum 5';
  checks := checks + 1;

  -- expired stock counts for earliest_expiry but not for qty
  perform public.adjust_stock(p, 2, 'purchase', current_date - 3);
  select * into r from public.product_stock where id = p;
  assert r.qty = 4 and r.expired_qty = 2, 'expired stock is separate';
  assert r.earliest_expiry = current_date - 3, 'earliest expiry includes expired batches';
  checks := checks + 2;

  -- product without stock; empty barcode becomes null
  p := public.create_product('No stock', '', null);
  select * into r from public.product_stock where id = p;
  assert r.qty = 0 and r.barcode is null and r.is_low and r.earliest_expiry is null, 'empty product';
  checks := checks + 1;

  -- duplicate barcode
  begin
    perform public.create_product('Other', '999');
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert sqlstate = '23505', format('duplicate barcode: %s %s', sqlstate, msg);
  end;
  -- stock without expiry
  begin
    perform public.create_product('Third', '1000', null, 0, 0, 5, null, 5, null);
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'expiry_required', format('got: %s', msg);
  end;
  assert not exists (select 1 from public.products where name = 'Third'), 'failed create leaves no product';
  checks := checks + 3;

  execute 'reset role';
  raise exception 'TESTS_PASSED % checks (rolled back, nothing was kept)', checks;
end $$;
