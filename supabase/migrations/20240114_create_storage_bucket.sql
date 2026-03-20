insert into storage.buckets (id, name, public)
values ('drawings', 'drawings', true)
on conflict (id) do nothing;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'drawings' );

create policy "Auth Insert"
  on storage.objects for insert
  with check ( bucket_id = 'drawings' and auth.role() = 'authenticated' );
