-- Product photos. The bucket is public-read (the app shows images by URL, file
-- names are random UUIDs); only signed-in users can upload, only the owner can
-- replace or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "product images list" on storage.objects
  for select to authenticated using (bucket_id = 'product-images');
create policy "product images upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy "product images update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_owner());
create policy "product images delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_owner());
