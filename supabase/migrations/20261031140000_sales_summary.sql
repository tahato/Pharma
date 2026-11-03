-- Totals computed in the database, so they stay right however many sales
-- there are (the app only loads the latest sales for the list).
-- Runs with the caller's rights: row-level security on sales still applies.
create function public.sales_summary(p_from timestamptz)
returns table (sales_count bigint, total numeric)
language sql stable set search_path = '' as $$
  select count(*), coalesce(sum(s.total), 0)
  from public.sales s
  where s.created_at >= p_from
$$;

revoke all on function public.sales_summary(timestamptz) from public, anon;
grant execute on function public.sales_summary(timestamptz) to authenticated;
