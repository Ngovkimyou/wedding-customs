-- Keep the public archive and owner-only writes reproducible in the repo.
-- The restrictive guards prevent an additional permissive policy from
-- accidentally allowing a user to write another owner's rows or files.
begin;

alter table public.entries enable row level security;

drop policy if exists "archive entries: public read" on public.entries;
drop policy if exists "archive entries: owner insert" on public.entries;
drop policy if exists "archive entries: insert owner guard" on public.entries;
drop policy if exists "archive entries: owner update" on public.entries;
drop policy if exists "archive entries: update owner guard" on public.entries;
drop policy if exists "archive entries: owner delete" on public.entries;
drop policy if exists "archive entries: delete owner guard" on public.entries;

create policy "archive entries: public read"
  on public.entries as permissive
  for select to anon, authenticated
  using (true);

create policy "archive entries: owner insert"
  on public.entries as permissive
  for insert to authenticated
  with check ((select auth.uid()) = owner);

create policy "archive entries: insert owner guard"
  on public.entries as restrictive
  for insert to public
  with check ((select auth.uid()) = owner);

create policy "archive entries: owner update"
  on public.entries as permissive
  for update to authenticated
  using ((select auth.uid()) = owner)
  with check ((select auth.uid()) = owner);

create policy "archive entries: update owner guard"
  on public.entries as restrictive
  for update to public
  using ((select auth.uid()) = owner)
  with check ((select auth.uid()) = owner);

create policy "archive entries: owner delete"
  on public.entries as permissive
  for delete to authenticated
  using ((select auth.uid()) = owner);

create policy "archive entries: delete owner guard"
  on public.entries as restrictive
  for delete to public
  using ((select auth.uid()) = owner);

drop policy if exists "archive photos: owner insert" on storage.objects;
drop policy if exists "archive photos: insert owner guard" on storage.objects;
drop policy if exists "archive photos: owner update guard" on storage.objects;
drop policy if exists "archive photos: owner delete" on storage.objects;
drop policy if exists "archive photos: delete owner guard" on storage.objects;

create policy "archive photos: owner insert"
  on storage.objects as permissive
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "archive photos: insert owner guard"
  on storage.objects as restrictive
  for insert to public
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "archive photos: owner update guard"
  on storage.objects as restrictive
  for update to public
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "archive photos: owner delete"
  on storage.objects as permissive
  for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "archive photos: delete owner guard"
  on storage.objects as restrictive
  for delete to public
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;
