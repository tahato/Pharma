-- handle_new_user only ever runs as a trigger on auth.users. It must not be
-- callable through the public API (/rest/v1/rpc/handle_new_user).
revoke all on function public.handle_new_user() from public, anon, authenticated;
