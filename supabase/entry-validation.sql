-- Apply in the Supabase SQL Editor after reviewing existing entries.
-- This updates the schema and enforces the contribution rules in PostgreSQL
-- and Supabase Storage. It preserves story data and migrates community author
-- attribution from public email addresses to public usernames.

begin;

-- Keep profile data private. Only the username snapshot on a public archive
-- entry is readable through the entries table.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from public, anon, authenticated;

-- Existing accounts did not collect a public username. Use any valid username
-- already present in auth metadata; otherwise assign a non-identifying fallback
-- instead of exposing part of the account email.
insert into public.profiles (user_id, username)
select
  account.id,
  case
    when candidate.username is not null
      and candidate.username = btrim(candidate.username)
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
  add column if not exists summary text,
  add column if not exists interview_date date,
  add column if not exists author_username text;

drop trigger if exists entries_sync_author_email on public.entries;
drop function if exists public.set_entry_author_email();

alter table public.entries
  -- Remove the previous ruleset's conventional names if it was applied.
  drop constraint if exists entries_title_en_check,
  drop constraint if exists entries_title_en_check1,
  drop constraint if exists entries_title_kh_check,
  drop constraint if exists entries_title_kh_check1,
  drop constraint if exists entries_summary_check,
  drop constraint if exists entries_summary_check1,
  drop constraint if exists entries_description_check,
  drop constraint if exists entries_description_check1,
  drop constraint if exists entries_period_label_check,
  drop constraint if exists entries_period_label_check1,
  drop constraint if exists entries_location_check,
  drop constraint if exists entries_location_check1,
  drop constraint if exists entries_interview_date_check,
  drop constraint if exists entries_interview_date_check1,
  drop constraint if exists entries_title_en_length_check,
  drop constraint if exists entries_title_kh_length_check,
  drop constraint if exists entries_summary_length_check,
  drop constraint if exists entries_description_length_check,
  drop constraint if exists entries_period_label_format_check,
  drop constraint if exists entries_location_length_check,
  drop constraint if exists entries_interview_date_format_check,
  drop constraint if exists entries_thumbnail_path_check,
  drop constraint if exists entries_title_en_rule_check,
  drop constraint if exists entries_title_kh_rule_check,
  drop constraint if exists entries_summary_rule_check,
  drop constraint if exists entries_description_rule_check,
  drop constraint if exists entries_period_label_rule_check,
  drop constraint if exists entries_location_rule_check,
  drop constraint if exists entries_interview_date_rule_check,
  drop constraint if exists entries_thumbnail_path_rule_check,
  drop constraint if exists entries_author_email_rule_check,
  drop constraint if exists entries_author_username_rule_check;

-- Use text columns so the explicit character checks, rather than an older
-- VARCHAR limit, define the accepted lengths.
alter table public.entries
  alter column title_en type text using title_en::text,
  alter column title_kh type text using title_kh::text,
  alter column summary type text using summary::text,
  alter column description type text using description::text,
  alter column period_label type text using period_label::text,
  alter column location type text using location::text,
  alter column thumbnail_path type text using thumbnail_path::text,
  alter column author_username type text using author_username::text;

-- Preserve existing dates saved with the previous DD/MM/YY format by
-- expanding their years to the same 2000-2099 range used by that rule.
update public.entries
set period_label = substring(period_label from 1 for 6)
  || '20'
  || substring(period_label from 7 for 2)
where period_label ~ '^[0-9]{2}/[0-9]{2}/[0-9]{2}$';

alter table public.entries
  add constraint entries_title_en_rule_check check (
    title_en is not null
    and title_en = btrim(title_en)
    and char_length(btrim(title_en)) between 3 and 80
  ),
  add constraint entries_title_kh_rule_check check (
    title_kh is not null
    and title_kh = btrim(title_kh)
    and char_length(btrim(title_kh)) between 1 and 128
  ),
  add constraint entries_summary_rule_check check (
    summary is null
    or (
      summary = btrim(summary)
      and char_length(btrim(summary)) <= 128
    )
  ),
  add constraint entries_description_rule_check check (
    description is not null
    and description = btrim(description)
    and char_length(btrim(description)) between 20 and 2000
  ),
  add constraint entries_period_label_rule_check check (
    case
      when period_label is null then true
      when period_label <> btrim(period_label) then false
      when period_label = '' then true
      when period_label ~ '^[0-9]{4}$' then period_label::integer > 0
      when period_label ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' then
        case
          when substring(period_label from 7 for 4)::integer < 1 then false
          when substring(period_label from 4 for 2)::integer not between 1 and 12 then false
          when substring(period_label from 1 for 2)::integer < 1 then false
          else substring(period_label from 1 for 2)::integer <= case
            when substring(period_label from 4 for 2)::integer = 2 then
              case
                when substring(period_label from 7 for 4)::integer % 400 = 0
                  or (
                    substring(period_label from 7 for 4)::integer % 4 = 0
                    and substring(period_label from 7 for 4)::integer % 100 <> 0
                  ) then 29
                else 28
              end
            when substring(period_label from 4 for 2)::integer in (4, 6, 9, 11) then 30
            else 31
          end
        end
      else false
    end
  ),
  add constraint entries_location_rule_check check (
    location is null
    or (
      location = btrim(location)
      and (location = '' or char_length(btrim(location)) between 3 and 30)
    )
  ),
  add constraint entries_interview_date_rule_check check (
    case
      when interview_date is null then true
      when interview_date::text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then false
      else to_char(interview_date::date, 'YYYY-MM-DD') = interview_date::text
    end
  ),
  add constraint entries_thumbnail_path_rule_check check (
    (
      id in (
        'ac4c325e-a809-4d2d-b632-921a3b444aa9'::uuid,
        'ba04145c-7237-43ee-84a6-38f101433b2d'::uuid
      )
      and thumbnail_path is null
    )
    or (thumbnail_path is not null and char_length(btrim(thumbnail_path)) > 0)
  ),
  add constraint entries_author_username_rule_check check (
    author_username is null
    or (
      author_username = btrim(author_username)
      and char_length(btrim(author_username)) between 1 and 64
      and author_username !~ '[[:cntrl:]]'
    )
  );

-- Existing numbered archive records remain curator-authored and keep their
-- interview dates. Attribute community entries with a profile username and
-- never derive a public value from auth.users.email.
drop trigger if exists entries_sync_author_username on public.entries;

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

-- Source the public author username from the private profiles table, never
-- from a submitted entry field. Preserve the snapshot on later edits.
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

-- Remove the formerly public email column entirely. Public entry reads must
-- not leak account email addresses through select(*), REST, or direct API use.
alter table public.entries drop column if exists author_email;

-- Bucket metadata also rejects unapproved declared MIME types and files over
-- 10 MiB. The application additionally verifies bytes against the MIME type.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'photos') then
    raise exception 'The public photos storage bucket does not exist. Create it before applying these upload settings.';
  end if;
end;
$$;

update storage.buckets
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'photos';

commit;
