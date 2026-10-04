-- Apply in the Supabase SQL Editor after reviewing existing entries.
-- This updates the schema and enforces the contribution rules in PostgreSQL
-- and Supabase Storage. It preserves story data and backfills public author
-- email only for community rows.

begin;

alter table public.entries
  add column if not exists summary text,
  add column if not exists interview_date date,
  add column if not exists author_email text;

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
  drop constraint if exists entries_author_email_rule_check;

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
  alter column author_email type text using author_email::text;

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
      when period_label ~ '^[0-9]{2}/[0-9]{2}/[0-9]{2}$' then
        to_char(
          make_date(
            2000 + substring(period_label from 7 for 2)::integer,
            substring(period_label from 4 for 2)::integer,
            substring(period_label from 1 for 2)::integer
          ),
          'DD/MM/YY'
        ) = period_label
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
  add constraint entries_author_email_rule_check check (
    author_email is null
    or (
      author_email = btrim(author_email)
      and char_length(author_email) between 3 and 320
    )
  );

-- Author emails are intentionally public for community-entry attribution.
-- Existing numbered archive records remain curator-authored and keep their
-- interview dates. Backfill community emails before adding the immutability trigger.
drop trigger if exists entries_sync_author_email on public.entries;

update public.entries as entry
set author_email = account.email
from auth.users as account
where entry.owner = account.id
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
  and account.email is not null
  and entry.author_email is distinct from account.email;

-- Source the public author email from the authenticated owner, never from a
-- submitted form field. Preserve the original email on later edits.
create or replace function public.set_entry_author_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.owner is not null and new.owner = auth.uid() then
      select account.email
        into new.author_email
        from auth.users as account
       where account.id = new.owner;
    else
      new.author_email := null;
    end if;
  else
    new.author_email := old.author_email;
  end if;

  return new;
end;
$$;

revoke all on function public.set_entry_author_email() from public, anon, authenticated;

create trigger entries_sync_author_email
before insert or update of owner, author_email on public.entries
for each row
execute function public.set_entry_author_email();

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
