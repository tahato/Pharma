-- Team management and shared settings.
--  * profiles get the e-mail (shown to the owner) and an active flag;
--  * app_settings holds values the owner can change (expiry alert window).
-- Creating accounts, resetting passwords and deactivating users need the
-- service key, so they live in the manage-staff edge function, not in the app.

alter table public.profiles
  add column email text,
  add column active boolean not null default true;

update public.profiles p set email = u.email
from auth.users u where u.id = p.id;

-- New accounts also record their e-mail. (Users can still only edit full_name.)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles where role = 'owner')
         then 'staff'::public.app_role else 'owner'::public.app_role end,
    new.email
  );
  return new;
end $$;

-- ---------------------------------------------------------- app_settings

create table public.app_settings (
  id                 boolean primary key default true check (id),
  expiry_alert_days  integer not null default 30
                     check (expiry_alert_days between 1 and 365),
  updated_at         timestamptz not null default now()
);
insert into public.app_settings default values;

create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon;

create policy app_settings_select on public.app_settings
  for select to authenticated using (true);
create policy app_settings_update_owner on public.app_settings
  for update to authenticated
  using (public.is_owner()) with check (public.is_owner());
