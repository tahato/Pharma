-- Tests for profile e-mail/active and app_settings. Always rolls back.
--   npx supabase db query --linked -f supabase/tests/team_settings.sql

do $$
declare
  a uuid := gen_random_uuid();   -- owner
  b uuid := gen_random_uuid();   -- staff
  n integer;
  msg text;
  checks integer := 0;
begin
  insert into auth.users (id, email) values (a, 'owner-test@example.invalid'), (b, 'staff-test@example.invalid');

  -- the trigger function is not exposed as an API call
  assert not has_function_privilege('anon', 'public.handle_new_user()', 'execute'), 'anon cannot call it';
  assert not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'), 'signed-in users cannot call it';
  assert exists (select 1 from public.profiles where id = a) and exists (select 1 from public.profiles where id = b), 'the trigger still creates profiles';
  checks := checks + 3;
  assert (select email from public.profiles where id = a) = 'owner-test@example.invalid', 'email copied to the profile';
  assert (select active from public.profiles where id = b), 'new accounts are active';
  checks := checks + 2;

  -- owner changes the setting
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', a::text, true);
  execute 'set local role authenticated';
  update public.app_settings set expiry_alert_days = 90;
  get diagnostics n = row_count;
  assert n = 1, 'owner can update the setting';
  assert (select expiry_alert_days from public.app_settings) = 90, 'value stored';
  begin
    update public.app_settings set expiry_alert_days = 0;
    raise exception 'expected failure';
  exception when others then
    assert sqlstate = '23514', format('range check: %s', sqlstate);
  end;
  begin
    insert into public.app_settings (id) values (false);
    raise exception 'expected failure';
  exception when others then
    assert sqlstate in ('42501', '23514', '23505'), format('single row: %s', sqlstate);
  end;
  checks := checks + 4;

  -- staff can read but not change; cannot touch active or role
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', b::text, true);
  execute 'set local role authenticated';
  assert (select expiry_alert_days from public.app_settings) = 90, 'staff can read the setting';
  update public.app_settings set expiry_alert_days = 5;
  get diagnostics n = row_count;
  assert n = 0, 'staff cannot change the setting';
  begin
    update public.profiles set active = false where id = b;
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg like '%permission denied%', format('active column: %s', msg);
  end;
  update public.profiles set full_name = 'Renamed' where id = b;
  assert (select full_name from public.profiles where id = b) = 'Renamed', 'staff can rename themself';
  checks := checks + 4;

  -- visitors see nothing
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';
  begin
    perform 1 from public.app_settings;
    raise exception 'expected failure';
  exception when others then
    get stacked diagnostics msg = message_text;
    assert msg like '%permission denied%', format('anon: %s', msg);
  end;
  checks := checks + 1;

  execute 'reset role';
  raise exception 'TESTS_PASSED % checks (rolled back, nothing was kept)', checks;
end $$;
