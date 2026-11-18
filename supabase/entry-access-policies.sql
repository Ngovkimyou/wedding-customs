-- Apply after the Lab 10 status migration. This keeps the reviewer queue and
-- owner-only contribution rules reproducible and blocks older permissive RLS
-- policies from exposing unpublished entries or bypassing review.
begin;

do $$
begin
  if not exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'entries'
       and column_name = 'status'
  ) then
    raise exception 'Apply the Lab 10 status migration before entry access policies.';
  end if;
end;
$$;

alter table public.entries
  alter column status set default 'pending',
  alter column status set not null,
  drop constraint if exists entries_status_rule_check,
  add constraint entries_status_rule_check
    check (status in ('pending', 'published', 'returned'));

create table if not exists public.reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.reviewers enable row level security;
revoke all on table public.reviewers from public, anon, authenticated;

-- A narrow boolean lookup is safe for the policies and the server-side page
-- gate; the reviewer list itself remains inaccessible through the Data API.
create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.reviewers
     where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_reviewer() from public, anon, authenticated;
grant execute on function public.is_reviewer() to anon, authenticated;

-- This is the only reviewer write path: it changes only a still-pending row's
-- status, and reports success only when exactly that transition happened.
create or replace function public.review_entry(entry_id uuid, decision text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if decision is null or decision not in ('published', 'returned') then
    return false;
  end if;

  if (select auth.uid()) is null or not public.is_reviewer() then
    return false;
  end if;

  update public.entries as entry
     set status = decision
   where entry.id = entry_id
     and entry.status = 'pending';

  return found;
end;
$$;

revoke all on function public.review_entry(uuid, text) from public, anon, authenticated;
grant execute on function public.review_entry(uuid, text) to authenticated;

alter table public.entries enable row level security;

-- Remove policies used before the status-aware review gate. PostgreSQL
-- combines permissive policies with OR, so an old public-read policy would
-- otherwise defeat a newer published-only policy.
drop policy if exists "anyone can read entries" on public.entries;
drop policy if exists "anyone can read published entries" on public.entries;
drop policy if exists "owners add their own entries" on public.entries;
drop policy if exists "owners edit their own entries" on public.entries;
drop policy if exists "owners delete their own entries" on public.entries;

drop policy if exists "archive entries: public read" on public.entries;
drop policy if exists "archive entries: read published owner or reviewer" on public.entries;
drop policy if exists "archive entries: read visibility guard" on public.entries;
drop policy if exists "archive entries: owner insert" on public.entries;
drop policy if exists "archive entries: owner insert pending" on public.entries;
drop policy if exists "archive entries: insert owner guard" on public.entries;
drop policy if exists "archive entries: owner update" on public.entries;
drop policy if exists "archive entries: update owner guard" on public.entries;
drop policy if exists "archive entries: owner delete" on public.entries;
drop policy if exists "archive entries: owner delete community" on public.entries;
drop policy if exists "archive entries: delete owner guard" on public.entries;

create policy "archive entries: read published owner or reviewer"
  on public.entries as permissive
  for select to anon, authenticated
  using (
    status = 'published'
    or owner = (select auth.uid())
    or (select public.is_reviewer())
  );

-- Restrictive guards prevent any other permissive policy from expanding
-- visibility or write access beyond these rules.
create policy "archive entries: read visibility guard"
  on public.entries as restrictive
  for select to public
  using (
    status = 'published'
    or owner = (select auth.uid())
    or (select public.is_reviewer())
  );

create policy "archive entries: owner insert pending"
  on public.entries as permissive
  for insert to authenticated
  with check (
    (select auth.uid()) = owner
    and status = 'pending'
    and slug not in (
      'how-my-parents-met',
      'courtship-and-family-involvement',
      'engagement-traditions',
      'wedding-preparation',
      'traditional-khmer-wedding-ceremonies',
      'wedding-ceremonies-afternoon',
      'during-the-night',
      'ceremonial-objects'
    )
  );

create policy "archive entries: insert owner guard"
  on public.entries as restrictive
  for insert to public
  with check (
    (select auth.uid()) = owner
    and status = 'pending'
    and slug not in (
      'how-my-parents-met',
      'courtship-and-family-involvement',
      'engagement-traditions',
      'wedding-preparation',
      'traditional-khmer-wedding-ceremonies',
      'wedding-ceremonies-afternoon',
      'during-the-night',
      'ceremonial-objects'
    )
  );

create policy "archive entries: owner update"
  on public.entries as permissive
  for update to authenticated
  using (
    (select auth.uid()) = owner
    and slug not in (
      'how-my-parents-met',
      'courtship-and-family-involvement',
      'engagement-traditions',
      'wedding-preparation',
      'traditional-khmer-wedding-ceremonies',
      'wedding-ceremonies-afternoon',
      'during-the-night',
      'ceremonial-objects'
    )
  )
  with check (
    (select auth.uid()) = owner
    and slug not in (
      'how-my-parents-met',
      'courtship-and-family-involvement',
      'engagement-traditions',
      'wedding-preparation',
      'traditional-khmer-wedding-ceremonies',
      'wedding-ceremonies-afternoon',
      'during-the-night',
      'ceremonial-objects'
    )
    and (status = 'pending' or (select public.is_reviewer()))
  );

create policy "archive entries: update owner guard"
  on public.entries as restrictive
  for update to public
  using (
    (select auth.uid()) = owner
    and slug not in (
      'how-my-parents-met',
      'courtship-and-family-involvement',
      'engagement-traditions',
      'wedding-preparation',
      'traditional-khmer-wedding-ceremonies',
      'wedding-ceremonies-afternoon',
      'during-the-night',
      'ceremonial-objects'
    )
  )
  with check (
    (select auth.uid()) = owner
    and slug not in (
      'how-my-parents-met',
      'courtship-and-family-involvement',
      'engagement-traditions',
      'wedding-preparation',
      'traditional-khmer-wedding-ceremonies',
      'wedding-ceremonies-afternoon',
      'during-the-night',
      'ceremonial-objects'
    )
    and (status = 'pending' or (select public.is_reviewer()))
  );

create policy "archive entries: owner delete community"
  on public.entries as permissive
  for delete to authenticated
  using (
    (select auth.uid()) = owner
    and slug not in (
      'how-my-parents-met',
      'courtship-and-family-involvement',
      'engagement-traditions',
      'wedding-preparation',
      'traditional-khmer-wedding-ceremonies',
      'wedding-ceremonies-afternoon',
      'during-the-night',
      'ceremonial-objects'
    )
  );

create policy "archive entries: delete owner guard"
  on public.entries as restrictive
  for delete to public
  using (
    (select auth.uid()) = owner
    and slug not in (
      'how-my-parents-met',
      'courtship-and-family-involvement',
      'engagement-traditions',
      'wedding-preparation',
      'traditional-khmer-wedding-ceremonies',
      'wedding-ceremonies-afternoon',
      'during-the-night',
      'ceremonial-objects'
    )
  );

grant select on table public.entries to anon, authenticated;
grant insert, update, delete on table public.entries to authenticated;

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
