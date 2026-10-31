-- Tests for editing and archiving products. Always rolls back.
--   npx supabase db query --linked -f supabase/tests/product_admin.sql

do $$
declare
  a uuid := gen_random_uuid();   -- owner
  b uuid := gen_random_uuid();   -- staff
  p uuid;
  p2 uuid;
  msg text;
  checks integer := 0;
begin
  insert into auth.users (id, email) values (a, 'test-a@example.invalid'), (b, 'test-b@example.invalid');

  -- ---- owner edits and archives
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', a::text, true);
  execute 'set local role authenticated';

  p := public.create_product('Old name', 'AD-1', 'Old class', 10, 20, 5, null, 8, current_date + 90);
  perform public.update_product(p, '  New name ', ' AD-2 ', '', 15, 25, 7, 'photo.jpg');
  assert (select name from public.products where id = p) = 'New name', 'name updated and trimmed';
  assert (select barcode from public.products where id = p) = 'AD-2', 'barcode updated';
  assert (select classe from public.products where id = p) is null, 'empty class becomes null';
  assert (select price_ppa from public.products where id = p) = 25, 'price updated';
  assert (select min_stock from public.products where id = p) = 7, 'minimum updated';
  assert (select image_path from public.products where id = p) = 'photo.jpg', 'image updated';
  assert (select qty from public.product_stock where id = p) = 8, 'stock untouched by an edit';
  checks := checks + 7;

  -- barcode already used by another active product
  p2 := public.create_product('Second', 'AD-3');
  begin
    perform public.update_product(p2, 'Second', 'AD-2', null, 0, 0, 5, null);
    raise exception 'expected failure';
  exception when others then
    assert sqlstate = '23505', format('duplicate barcode: %s', sqlstate);
  end;
  begin
    perform public.update_product(gen_random_uuid(), 'x', null, null, 0, 0, 5, null);
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'product_not_found', format('got: %s', msg);
  end;
  checks := checks + 2;

  -- archive hides the product everywhere but keeps history
  perform public.create_sale(jsonb_build_array(jsonb_build_object('product_id', p, 'quantity', 2)));
  perform public.archive_product(p);
  assert not exists (select 1 from public.product_stock where id = p), 'archived product leaves the stock view';
  assert exists (select 1 from public.products where id = p and archived_at is not null), 'row kept';
  assert (select count(*) from public.sale_items where product_id = p) = 1, 'sale history kept';
  assert (select count(*) from public.stock_movements where product_id = p) >= 2, 'movements kept';
  checks := checks + 4;

  -- archived products cannot be sold, restocked or edited
  begin
    perform public.create_sale(jsonb_build_array(jsonb_build_object('product_id', p, 'quantity', 1)));
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'product_not_found', format('sale: %s', msg);
  end;
  begin
    perform public.adjust_stock(p, 5, 'purchase', current_date + 30);
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'product_not_found', format('restock: %s', msg);
  end;
  begin
    perform public.update_product(p, 'x', null, null, 0, 0, 5, null);
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'product_not_found', format('edit: %s', msg);
  end;
  checks := checks + 3;

  -- the archived barcode can be reused
  perform public.create_product('Reuse', 'AD-2');
  assert (select count(*) from public.product_stock where barcode = 'AD-2') = 1, 'barcode reused by an active product';
  checks := checks + 1;

  -- ---- staff are refused
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', b::text, true);
  execute 'set local role authenticated';
  begin
    perform public.update_product(p2, 'Hacked', null, null, 0, 0, 5, null);
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'forbidden', format('staff edit: %s', msg);
  end;
  begin
    perform public.archive_product(p2);
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'forbidden', format('staff archive: %s', msg);
  end;
  assert (select name from public.product_stock where id = p2) = 'Second', 'staff cannot change anything';
  checks := checks + 3;

  execute 'reset role';
  raise exception 'TESTS_PASSED % checks (rolled back, nothing was kept)', checks;
end $$;
