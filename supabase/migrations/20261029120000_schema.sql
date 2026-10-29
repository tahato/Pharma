-- Pharma schema: tables, view, indexes, row-level security.
-- Stock only changes through the functions in the next migration.

create extension if not exists pg_trgm with schema extensions;

create type public.app_role as enum ('owner', 'staff');
create type public.movement_reason as enum
  ('purchase', 'sale', 'adjustment', 'expired', 'sync_conflict');

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  role        public.app_role not null default 'staff',
  created_at  timestamptz not null default now()
);

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  barcode     text unique,
  name        text not null check (length(btrim(name)) > 0),
  classe      text,
  price_ht    numeric(12, 2) not null default 0 check (price_ht >= 0),
  price_ppa   numeric(12, 2) not null default 0 check (price_ppa >= 0),
  image_path  text,
  min_stock   integer not null default 5 check (min_stock >= 0),
  created_by  uuid references auth.users (id) default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.batches (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  quantity     integer not null check (quantity >= 0),
  expiry_date  date not null,
  received_at  timestamptz not null default now(),
  unique (product_id, expiry_date)
);

create table public.sales (
  id          uuid primary key default gen_random_uuid(),
  number      bigint generated always as identity,
  created_by  uuid not null references auth.users (id) default auth.uid(),
  total       numeric(12, 2) not null default 0 check (total >= 0),
  created_at  timestamptz not null default now()
);

create table public.sale_items (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid not null references public.sales (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete restrict,
  batch_id    uuid not null references public.batches (id) on delete restrict,
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(12, 2) not null check (unit_price >= 0)
);

create table public.stock_movements (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete restrict,
  batch_id    uuid references public.batches (id) on delete set null,
  delta       integer not null check (delta <> 0),
  reason      public.movement_reason not null,
  sale_id     uuid references public.sales (id) on delete set null,
  note        text,
  created_by  uuid references auth.users (id) default auth.uid(),
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------- indexes

create index products_name_trgm on public.products
  using gin (name extensions.gin_trgm_ops);
create index batches_product_expiry on public.batches (product_id, expiry_date);
create index sales_created_at on public.sales (created_at desc);
create index sale_items_sale on public.sale_items (sale_id);
create index stock_movements_product on public.stock_movements (product_id, created_at desc);

-- -------------------------------------------------------------- triggers

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- Every new auth user gets a profile. The first account ever created becomes the
-- owner; later ones are staff. (Public sign-ups are disabled, so accounts are
-- created by the owner.)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles where role = 'owner')
         then 'staff'::public.app_role else 'owner'::public.app_role end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'owner'
  )
$$;

-- ------------------------------------------------------------------ view

-- qty = sellable stock (non-expired batches); expired_qty = stock past expiry.
create view public.product_stock with (security_invoker = true) as
select
  p.id, p.barcode, p.name, p.classe, p.price_ht, p.price_ppa, p.image_path,
  p.min_stock, p.created_at,
  coalesce(sum(b.quantity) filter (where b.expiry_date >= current_date), 0)::int as qty,
  coalesce(sum(b.quantity) filter (where b.expiry_date <  current_date), 0)::int as expired_qty,
  min(b.expiry_date) filter (where b.quantity > 0 and b.expiry_date >= current_date) as next_expiry
from public.products p
left join public.batches b on b.product_id = p.id
group by p.id;

-- -------------------------------------------------------------- security

alter table public.profiles        enable row level security;
alter table public.products        enable row level security;
alter table public.batches         enable row level security;
alter table public.sales           enable row level security;
alter table public.sale_items      enable row level security;
alter table public.stock_movements enable row level security;

revoke all on public.profiles, public.products, public.batches, public.sales,
  public.sale_items, public.stock_movements, public.product_stock from anon;

-- Everyone signed in can read; writes are limited below or go through functions.
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy products_select on public.products
  for select to authenticated using (true);
create policy batches_select on public.batches
  for select to authenticated using (true);
create policy sales_select on public.sales
  for select to authenticated using (true);
create policy sale_items_select on public.sale_items
  for select to authenticated using (true);
create policy stock_movements_select on public.stock_movements
  for select to authenticated using (true);

-- A user may rename themself but never change their own role.
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Staff can create products; only the owner edits prices or deletes.
create policy products_insert on public.products
  for insert to authenticated with check (true);
create policy products_update_owner on public.products
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy products_delete_owner on public.products
  for delete to authenticated using (public.is_owner());

-- Direct batch corrections are owner-only; normal changes use adjust_stock / create_sale.
create policy batches_update_owner on public.batches
  for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy batches_delete_owner on public.batches
  for delete to authenticated using (public.is_owner());

-- sales, sale_items, stock_movements have no insert/update/delete policies:
-- they are written only by the security definer functions.
