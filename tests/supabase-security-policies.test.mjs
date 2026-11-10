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

test("database policies allow public reads but constrain entry writes to the owner", () => {
  assert.match(policySql, /alter table public\.entries enable row level security/iu);
  assert.match(policySql, /for select to anon, authenticated\s+using \(true\)/iu);
  assert.match(policySql, /for insert to authenticated\s+with check \(\(select auth\.uid\(\)\) = owner\)/iu);
  assert.match(policySql, /for insert to public\s+with check \(\(select auth\.uid\(\)\) = owner\)/iu);
  assert.match(
    policySql,
    /for update to authenticated\s+using \(\(select auth\.uid\(\)\) = owner\)\s+with check \(\(select auth\.uid\(\)\) = owner\)/iu,
  );
  assert.match(
    policySql,
    /for update to public\s+using \(\(select auth\.uid\(\)\) = owner\)\s+with check \(\(select auth\.uid\(\)\) = owner\)/iu,
  );
  assert.match(policySql, /for delete to authenticated\s+using \(\(select auth\.uid\(\)\) = owner\)/iu);
  assert.match(policySql, /for delete to public\s+using \(\(select auth\.uid\(\)\) = owner\)/iu);
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
