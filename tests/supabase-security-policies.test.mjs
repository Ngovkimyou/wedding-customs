import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const policySql = await readFile(
  new URL("../supabase/entry-access-policies.sql", import.meta.url),
  "utf8",
);
const validationSql = await readFile(
  new URL("../supabase/entry-validation.sql", import.meta.url),
  "utf8",
);
const usernameMigrationSql = await readFile(
  new URL("../supabase/username-migration.sql", import.meta.url),
  "utf8",
);
const reviewerFeedbackMigrationSql = await readFile(
  new URL("../supabase/reviewer-feedback.sql", import.meta.url),
  "utf8",
);
const reviewPageSource = await readFile(
  new URL("../app/review/page.js", import.meta.url),
  "utf8",
);
const reviewQueueSource = await readFile(
  new URL("../components/ReviewQueue.js", import.meta.url),
  "utf8",
);
const reviewActionSource = await readFile(
  new URL("../app/review/actions.js", import.meta.url),
  "utf8",
);
const myEntriesSource = await readFile(
  new URL("../app/my-entries/page.js", import.meta.url),
  "utf8",
);
const contributionActionsSource = await readFile(
  new URL("../app/contribute/actions.js", import.meta.url),
  "utf8",
);
const publicEntriesSource = await readFile(
  new URL("../lib/supabase/entries.js", import.meta.url),
  "utf8",
);

test("entry RLS hides unpublished rows and requires review for publication", () => {
  assert.match(policySql, /alter table public\.entries enable row level security/iu);
  assert.match(
    policySql,
    /for select to anon, authenticated\s+using \([\s\S]*?status = 'published'[\s\S]*?owner = \(select auth\.uid\(\)\)[\s\S]*?public\.is_reviewer\(\)/iu,
  );
  assert.match(
    policySql,
    /as restrictive\s+for select to public\s+using \([\s\S]*?status = 'published'[\s\S]*?owner = \(select auth\.uid\(\)\)[\s\S]*?public\.is_reviewer\(\)/iu,
  );
  assert.doesNotMatch(policySql, /for select to anon, authenticated\s+using \(true\)/iu);
  assert.doesNotMatch(policySql, /using \(true\)/iu);
  assert.match(policySql, /for insert to authenticated\s+with check \([\s\S]*?\(select auth\.uid\(\)\) = owner[\s\S]*?status = 'pending'/iu);
  assert.match(policySql, /for insert to public\s+with check \([\s\S]*?\(select auth\.uid\(\)\) = owner[\s\S]*?status = 'pending'/iu);
  assert.match(
    policySql,
    /for update to authenticated\s+using \([\s\S]*?\(select auth\.uid\(\)\) = owner[\s\S]*?\)\s+with check \([\s\S]*?\(select auth\.uid\(\)\) = owner[\s\S]*?status = 'pending'[\s\S]*?public\.is_reviewer\(\)/iu,
  );
  assert.match(
    policySql,
    /for update to public\s+using \([\s\S]*?\(select auth\.uid\(\)\) = owner[\s\S]*?\)\s+with check \([\s\S]*?\(select auth\.uid\(\)\) = owner[\s\S]*?status = 'pending'[\s\S]*?public\.is_reviewer\(\)/iu,
  );
  assert.match(policySql, /for delete to authenticated\s+using \([\s\S]*?\(select auth\.uid\(\)\) = owner[\s\S]*?slug not in/iu);
  assert.match(policySql, /for delete to public\s+using \([\s\S]*?\(select auth\.uid\(\)\) = owner[\s\S]*?slug not in/iu);
  assert.match(policySql, /drop policy if exists "anyone can read entries"/iu);
  assert.match(policySql, /drop policy if exists "anyone can read published entries"/iu);
});

test("reviewer roster is private and review RPC is the guarded status transition", () => {
  assert.match(policySql, /create table if not exists public\.reviewers/iu);
  assert.match(policySql, /alter table public\.reviewers enable row level security/iu);
  assert.match(policySql, /revoke all on table public\.reviewers from public, anon, authenticated/iu);
  assert.match(policySql, /create or replace function public\.is_reviewer\(\)[\s\S]*?security definer[\s\S]*?set search_path = ''/iu);
  assert.match(policySql, /revoke all on function public\.is_reviewer\(\) from public, anon, authenticated/iu);
  assert.match(policySql, /grant execute on function public\.is_reviewer\(\) to anon, authenticated/iu);
  assert.match(policySql, /drop function if exists public\.review_entry\(uuid, text\)/iu);
  assert.match(policySql, /create or replace function public\.review_entry\(\s*entry_id uuid,\s*decision text,\s*return_note text\s*\)[\s\S]*?security definer[\s\S]*?set search_path = ''/iu);
  assert.match(policySql, /decision not in \('published', 'returned'\)/iu);
  assert.match(policySql, /decision = 'returned'[\s\S]*?clean_return_note is null or char_length\(clean_return_note\) > 1000/iu);
  assert.match(policySql, /entry\.status = 'pending'[\s\S]*?if not found then[\s\S]*?insert into public\.entry_review_feedback/iu);
  assert.match(policySql, /on conflict on constraint entry_review_feedback_pkey do update/iu);
  assert.match(policySql, /revoke all on function public\.review_entry\(uuid, text, text\) from public, anon, authenticated/iu);
  assert.match(policySql, /grant execute on function public\.review_entry\(uuid, text, text\) to authenticated/iu);
  assert.match(policySql, /create or replace function public\.review_entry\(entry_id uuid, decision text\)[\s\S]*?select public\.review_entry\(\$1, \$2, null\)/iu);
  assert.match(policySql, /create policy "entry review feedback: owner and reviewer read"[\s\S]*?entry\.owner = \(select auth\.uid\(\)\)[\s\S]*?public\.is_reviewer\(\)/iu);
});

test("review feedback is private and only read by the author or a reviewer", () => {
  assert.match(reviewerFeedbackMigrationSql, /create table if not exists public\.entry_review_feedback/iu);
  assert.match(reviewerFeedbackMigrationSql, /alter table public\.entry_review_feedback enable row level security/iu);
  assert.match(reviewerFeedbackMigrationSql, /revoke all on table public\.entry_review_feedback from public, anon, authenticated/iu);
  assert.match(reviewerFeedbackMigrationSql, /grant select on table public\.entry_review_feedback to authenticated/iu);
  assert.match(reviewerFeedbackMigrationSql, /entry\.owner = \(select auth\.uid\(\)\)[\s\S]*?public\.is_reviewer\(\)/iu);
  assert.doesNotMatch(reviewerFeedbackMigrationSql, /create policy[\s\S]*?for (?:insert|update|delete)/iu);
  assert.match(reviewerFeedbackMigrationSql, /drop function if exists public\.review_entry\(uuid, text\)/iu);
  assert.match(reviewerFeedbackMigrationSql, /on conflict on constraint entry_review_feedback_pkey do update/iu);
  assert.match(reviewerFeedbackMigrationSql, /create or replace function public\.review_entry\(entry_id uuid, decision text\)[\s\S]*?select public\.review_entry\(\$1, \$2, null\)/iu);
});

test("review page gates before loading and only removes successful decisions; returned edits requeue", () => {
  assert.ok(reviewPageSource.indexOf('rpc("is_reviewer")') < reviewPageSource.indexOf('.from("entries")'));
  assert.match(reviewActionSource, /supabase\.rpc\("review_entry"/u);
  assert.match(reviewActionSource, /return_note: decision === "returned" \? cleanReturnNote : null/u);
  assert.match(reviewActionSource, /if \(data !== true\)/u);
  assert.doesNotMatch(reviewQueueSource, /What should the contributor change\?/u);
  assert.match(reviewQueueSource, /Explain what needs to change before this entry can be resubmitted\./u);
  assert.match(reviewQueueSource, /Send Feedback/u);
  assert.match(reviewQueueSource, /review-decision--publish review-feedback-form__submit/u);
  assert.match(reviewQueueSource, /result\?\.ok === true/u);
  assert.match(myEntriesSource, /\.from\("entry_review_feedback"\)/u);
  assert.match(myEntriesSource, /feedbackByEntryId\.get\(entry\.id\)/u);
  assert.match(myEntriesSource, /This requested change has no feedback\./u);
  assert.match(contributionActionsSource, /status: "pending"/u);
  assert.match(contributionActionsSource, /\.eq\("owner", user\.id\)/u);
  assert.equal(publicEntriesSource.match(/\.eq\("status", "published"\)/gu)?.length, 2);
});

test("photo storage policies limit writes to the authenticated user's folder", () => {
  const ownerFolderRule = /bucket_id = 'photos'\s+and \(storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)::text\)/iu;

  assert.match(policySql, /for insert to authenticated[\s\S]*?with check \([\s\S]*?\)/iu);
  assert.match(policySql, /for insert to public[\s\S]*?with check \([\s\S]*?\)/iu);
  assert.match(policySql, /for update to public[\s\S]*?using \([\s\S]*?\)\s+with check \([\s\S]*?\)/iu);
  assert.match(policySql, /for delete to authenticated[\s\S]*?using \([\s\S]*?\)/iu);
  assert.match(policySql, /for delete to public[\s\S]*?using \([\s\S]*?\)/iu);
  assert.equal(policySql.match(new RegExp(ownerFolderRule.source, "giu"))?.length, 6);
});

test("photo bucket configuration limits upload size and declared types", () => {
  assert.match(validationSql, /file_size_limit\s*=\s*10485760/iu);
  assert.match(
    validationSql,
    /allowed_mime_types\s*=\s*array\['image\/jpeg',\s*'image\/png',\s*'image\/webp',\s*'image\/avif'\]/iu,
  );
});

test("period dates use four-digit years and migrate legacy two-digit labels", () => {
  assert.ok(validationSql.includes("set period_label = substring(period_label from 1 for 6)"));
  assert.ok(validationSql.includes("|| '20'"));
  assert.ok(validationSql.includes("where period_label ~ '^[0-9]{2}/[0-9]{2}/[0-9]{2}$'"));
  assert.ok(validationSql.includes("when period_label ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$'"));
  assert.ok(validationSql.includes("substring(period_label from 7 for 4)"));
});

test("public author usernames come from private profiles and emails are removed", () => {
  assert.match(validationSql, /create table if not exists public\.profiles/iu);
  assert.match(validationSql, /new\.raw_user_meta_data ->> 'username'/iu);
  assert.match(validationSql, /revoke all on table public\.profiles from public, anon, authenticated/iu);
  assert.match(validationSql, /add column if not exists author_username text/iu);
  assert.match(validationSql, /security definer\s+set search_path = ''/iu);
  assert.match(validationSql, /new\.owner = auth\.uid\(\)/iu);
  assert.match(validationSql, /from public\.profiles as profile/iu);
  assert.match(validationSql, /new\.author_username := old\.author_username/iu);
  assert.match(validationSql, /revoke all on function public\.set_entry_author_username\(\) from public, anon, authenticated/iu);
  assert.match(validationSql, /drop column if exists author_email/iu);
});

test("the focused username migration does not reapply unrelated entry or storage rules", () => {
  assert.match(usernameMigrationSql, /create table if not exists public\.profiles/iu);
  assert.match(usernameMigrationSql, /create trigger auth_users_create_public_profile/iu);
  assert.match(usernameMigrationSql, /create trigger entries_sync_author_username/iu);
  assert.match(usernameMigrationSql, /drop column if exists author_email/iu);
  assert.doesNotMatch(usernameMigrationSql, /entries_description_rule_check|storage\.buckets/iu);
});
