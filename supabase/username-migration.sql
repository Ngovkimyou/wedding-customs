-- Run once from Supabase SQL Editor as a separate username migration.
-- Existing accounts without signup usernames receive a non-identifying fallback.
-- The entries.author_email column is dropped to stop public REST reads exposing emails.

begin;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from public, anon, authenticated;

insert into public.profiles (user_id, username)
select
  account.id,
  case
    when candidate.username is not null
      and char_length(candidate.username) between 1 and 64
      and candidate.username !~ '[[:cntrl:]]'
      then candidate.username
    else 'contributor-' || substring(account.id::text from 1 for 8)
  end
from auth.users as account
cross join lateral (
  select btrim(coalesce(account.raw_user_meta_data ->> 'username', '')) as username
) as candidate
on conflict (user_id) do nothing;

update public.profiles
set username = 'contributor-' || substring(user_id::text from 1 for 8)
where username is null
  or username <> btrim(username)
  or char_length(btrim(username)) not between 1 and 64
  or username ~ '[[:cntrl:]]';

alter table public.profiles
  alter column username set not null,
  drop constraint if exists profiles_username_rule_check,
  add constraint profiles_username_rule_check check (
    username = btrim(username)
    and char_length(btrim(username)) between 1 and 64
    and username !~ '[[:cntrl:]]'
  );

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := pg_catalog.btrim(
    coalesce(new.raw_user_meta_data ->> 'username', '')
  );

  if char_length(requested_username) not between 1 and 64
    or requested_username ~ '[[:cntrl:]]' then
    raise exception using
      errcode = '22023',
      message = 'A valid username is required.';
  end if;

  insert into public.profiles (user_id, username)
  values (new.id, requested_username);

  return new;
end;
$$;

revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;

drop trigger if exists auth_users_create_public_profile on auth.users;
create trigger auth_users_create_public_profile
after insert on auth.users
for each row
execute function public.create_profile_for_auth_user();

alter table public.entries
  add column if not exists author_username text;

alter table public.entries
  alter column author_username type text using author_username::text;

drop trigger if exists entries_sync_author_email on public.entries;
drop function if exists public.set_entry_author_email();
drop trigger if exists entries_sync_author_username on public.entries;

alter table public.entries
  drop constraint if exists entries_author_email_rule_check,
  drop constraint if exists entries_author_username_rule_check;

update public.entries as entry
set author_username = profile.username
from public.profiles as profile
where entry.owner = profile.user_id
  and entry.slug not in (
    'how-my-parents-met',
    'courtship-and-family-involvement',
    'engagement-traditions',
    'wedding-preparation',
    'traditional-khmer-wedding-ceremonies',
    'wedding-ceremonies-afternoon',
    'during-the-night',
    'ceremonial-objects'
  )
  and entry.author_username is distinct from profile.username;

alter table public.entries
  add constraint entries_author_username_rule_check check (
    author_username is null
    or (
      author_username = btrim(author_username)
      and char_length(btrim(author_username)) between 1 and 64
      and author_username !~ '[[:cntrl:]]'
    )
  );

create or replace function public.set_entry_author_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.owner is not null and new.owner = auth.uid() then
      select profile.username
        into new.author_username
        from public.profiles as profile
       where profile.user_id = new.owner;

      if not found then
        raise exception using
          errcode = '23514',
          message = 'A contributor profile is required to create an archive entry.';
      end if;
    else
      new.author_username := null;
    end if;
  else
    new.author_username := old.author_username;
  end if;

  return new;
end;
$$;

revoke all on function public.set_entry_author_username() from public, anon, authenticated;

create trigger entries_sync_author_username
before insert or update of owner, author_username on public.entries
for each row
execute function public.set_entry_author_username();

alter table public.entries drop column if exists author_email;

commit;
