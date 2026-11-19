-- Apply after entry-access-policies.sql to add private reviewer notes for
-- returned entries. A return now requires a note and cannot use the old RPC.
begin;

do $$
begin
  if to_regclass('public.entries') is null
     or to_regclass('public.reviewers') is null
     or to_regprocedure('public.is_reviewer()') is null then
    raise exception 'Apply entry-access-policies.sql before reviewer-feedback.sql.';
  end if;
end;
$$;

create table if not exists public.entry_review_feedback (
  entry_id uuid primary key references public.entries(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  note text not null check (char_length(btrim(note)) between 1 and 1000),
  updated_at timestamptz not null default now()
);

alter table public.entry_review_feedback enable row level security;
revoke all on table public.entry_review_feedback from public, anon, authenticated;
grant select on table public.entry_review_feedback to authenticated;

drop policy if exists "entry review feedback: owner and reviewer read" on public.entry_review_feedback;
create policy "entry review feedback: owner and reviewer read"
  on public.entry_review_feedback
  for select to authenticated
  using (
    exists (
      select 1
        from public.entries as entry
       where entry.id = entry_review_feedback.entry_id
         and entry.owner = (select auth.uid())
    )
    or (select public.is_reviewer())
  );

-- Remove the old path: it allowed a reviewer to return without explaining why.
drop function if exists public.review_entry(uuid, text);

create or replace function public.review_entry(
  entry_id uuid,
  decision text,
  return_note text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_return_note text := nullif(btrim(return_note), '');
begin
  if decision is null or decision not in ('published', 'returned') then
    return false;
  end if;

  if decision = 'returned'
     and (clean_return_note is null or char_length(clean_return_note) > 1000) then
    return false;
  end if;

  if (select auth.uid()) is null or not public.is_reviewer() then
    return false;
  end if;

  update public.entries as entry
     set status = decision
   where entry.id = $1
     and entry.status = 'pending';

  if not found then
    return false;
  end if;

  if decision = 'returned' then
    insert into public.entry_review_feedback (entry_id, reviewer_id, note, updated_at)
    values ($1, (select auth.uid()), clean_return_note, now())
    on conflict on constraint entry_review_feedback_pkey do update
      set reviewer_id = excluded.reviewer_id,
          note = excluded.note,
          updated_at = excluded.updated_at;
  else
    delete from public.entry_review_feedback as feedback
     where feedback.entry_id = $1;
  end if;

  return true;
end;
$$;

revoke all on function public.review_entry(uuid, text, text) from public, anon, authenticated;
grant execute on function public.review_entry(uuid, text, text) to authenticated;

-- Preserve older clients during rollout: publishing still works, but a return
-- without contributor feedback is rejected by the three-argument function.
create or replace function public.review_entry(entry_id uuid, decision text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select public.review_entry($1, $2, null);
$$;

revoke all on function public.review_entry(uuid, text) from public, anon, authenticated;
grant execute on function public.review_entry(uuid, text) to authenticated;

commit;
