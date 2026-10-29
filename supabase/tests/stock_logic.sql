-- Functional test for the stock functions and security rules.
-- Runs inside one DO block and always ends with an exception, so nothing it
-- creates is ever kept: success is reported as the message "TESTS_PASSED ...".
--
--   npx supabase db query --linked -f supabase/tests/stock_logic.sql

do $$
declare
  a uuid := gen_random_uuid();   -- first user: becomes owner
  b uuid := gen_random_uuid();   -- second user: staff
  p1 uuid;
  p2 uuid;
  sale uuid := gen_random_uuid();
  n integer;
  v integer;
  msg text;
  checks integer := 0;
begin
  -- ---- setup as the database owner (profiles come from the auth.users trigger)
  insert into auth.users (id, email) values (a, 'test-a@example.invalid'), (b, 'test-b@example.invalid');
  assert (select role from public.profiles where id = a) = 'owner', 'first user must be owner';
  assert (select role from public.profiles where id = b) = 'staff', 'second user must be staff';
  checks := checks + 2;

  -- ---- act as the owner
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', a::text, true);
  execute 'set local role authenticated';

  insert into public.products (name, barcode, price_ht, price_ppa) values ('Test P1', 'T-P1', 80, 100) returning id into p1;
  insert into public.products (name, barcode, price_ht, price_ppa) values ('Test P2', 'T-P2', 40, 50) returning id into p2;

  perform public.adjust_stock(p1, 10, 'purchase', current_date + 20);
  perform public.adjust_stock(p1, 5,  'purchase', current_date + 200);
  perform public.adjust_stock(p1, 3,  'purchase', current_date - 1);       -- expired batch
  perform public.adjust_stock(p1, 2,  'purchase', current_date + 20);      -- same batch grows
  select qty into v from public.product_stock where id = p1;
  assert v = 17, format('sellable qty should be 17, got %s', v);
  select expired_qty into v from public.product_stock where id = p1;
  assert v = 3, 'expired qty should be 3';
  assert (select count(*) from public.batches where product_id = p1) = 3, 'same expiry must reuse the batch';
  checks := checks + 3;

  begin
    perform public.adjust_stock(p1, 4);
    raise exception 'expected expiry_required';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'expiry_required', format('got: %s', msg);
  end;
  checks := checks + 1;

  -- ---- sale: earliest expiry first, expired batch untouched
  perform public.create_sale(jsonb_build_array(jsonb_build_object('product_id', p1, 'quantity', 14)), sale);
  assert (select total from public.sales where id = sale) = 1400, 'sale total should be 1400';
  assert (select count(*) from public.sale_items where sale_id = sale) = 2, 'sale spans two batches';
  select qty into v from public.product_stock where id = p1;
  assert v = 3, format('sellable qty after sale should be 3, got %s', v);
  select expired_qty into v from public.product_stock where id = p1;
  assert v = 3, 'expired batch must not be sold';
  assert (select quantity from public.batches where product_id = p1 and expiry_date = current_date + 20) = 0, 'earliest batch emptied first';
  assert (select sum(delta) from public.stock_movements where sale_id = sale) = -14, 'movements recorded';
  checks := checks + 6;

  -- ---- idempotent retry
  perform public.create_sale(jsonb_build_array(jsonb_build_object('product_id', p1, 'quantity', 14)), sale);
  assert (select count(*) from public.sales where id = sale) = 1, 'retry must not create a second sale';
  select qty into v from public.product_stock where id = p1;
  assert v = 3, 'retry must not change stock';
  checks := checks + 2;

  -- ---- insufficient stock rolls the sale back
  begin
    perform public.create_sale(jsonb_build_array(jsonb_build_object('product_id', p2, 'quantity', 0)));
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'invalid_quantity', format('got: %s', msg);
  end;
  begin
    perform public.create_sale(jsonb_build_array(jsonb_build_object('product_id', p1, 'quantity', 4)));
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'insufficient_stock', format('got: %s', msg);
  end;
  select count(*) into n from public.sales;
  assert n = 1, 'failed sales must leave no trace';
  select qty into v from public.product_stock where id = p1;
  assert v = 3, 'failed sale must not change stock';
  checks := checks + 4;

  -- ---- removing stock takes expired batches first
  perform public.adjust_stock(p1, -4, 'expired');
  select expired_qty into v from public.product_stock where id = p1;
  assert v = 0, 'expired batch removed first';
  select qty into v from public.product_stock where id = p1;
  assert v = 2, format('1 box taken from the next batch, got %s', v);
  begin
    perform public.adjust_stock(p1, -100);
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'insufficient_stock', format('got: %s', msg);
  end;
  checks := checks + 3;

  -- ---- last owner cannot be demoted
  begin
    perform public.set_user_role(a, 'staff');
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'last_owner', format('got: %s', msg);
  end;
  checks := checks + 1;

  -- ---- act as staff
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', b::text, true);
  execute 'set local role authenticated';

  update public.products set price_ppa = 1 where id = p1;
  get diagnostics n = row_count;
  assert n = 0, 'staff must not change prices';
  delete from public.products where id = p2;
  get diagnostics n = row_count;
  assert n = 0, 'staff must not delete products';
  begin
    insert into public.sales (total) values (1);
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg like '%row-level security%', format('got: %s', msg);
  end;
  begin
    update public.profiles set role = 'owner' where id = b;
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg like '%permission denied%', format('got: %s', msg);
  end;
  begin
    perform public.set_user_role(b, 'owner');
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg = 'forbidden', format('got: %s', msg);
  end;
  -- staff can still sell and add products
  insert into public.products (name, price_ppa) values ('Staff product', 10);
  perform public.adjust_stock(p1, 1, 'purchase', current_date + 300);
  perform public.create_sale(jsonb_build_array(jsonb_build_object('product_id', p1, 'quantity', 1)));
  checks := checks + 5;

  -- ---- act as anonymous visitor
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';
  begin
    perform 1 from public.products limit 1;
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg like '%permission denied%', format('anon read: %s', msg);
  end;
  begin
    perform public.create_sale('[]'::jsonb);
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg like '%permission denied%', format('anon rpc: %s', msg);
  end;
  checks := checks + 2;

  execute 'reset role';
  raise exception 'TESTS_PASSED % checks (rolled back, nothing was kept)', checks;
end $$;
