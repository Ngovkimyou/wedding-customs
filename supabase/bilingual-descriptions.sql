-- Apply in the Supabase SQL Editor before deploying the bilingual form.
-- Existing `description` values are copied as the English-version fallback;
-- the original column remains as the compatibility field used by older code.
begin;

alter table public.entries
  add column if not exists description_en text,
  add column if not exists description_kh text;

update public.entries
set description_en = description
where description_en is null
  and description is not null;

alter table public.entries
  drop constraint if exists entries_description_locale_required_check,
  drop constraint if exists entries_description_en_rule_check,
  drop constraint if exists entries_description_kh_rule_check,
  add constraint entries_description_locale_required_check check (
    description_en is not null or description_kh is not null
  ),
  add constraint entries_description_en_rule_check check (
    description_en is null
    or (
      description_en = btrim(description_en)
      and char_length(btrim(description_en)) between 20 and 2000
    )
  ),
  add constraint entries_description_kh_rule_check check (
    description_kh is null
    or (
      description_kh = btrim(description_kh)
      and char_length(btrim(description_kh)) between 20 and 2000
    )
  );

commit;

notify pgrst, 'reload schema';
