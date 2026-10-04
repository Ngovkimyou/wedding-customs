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

test("author email is sourced from the account and cannot be changed through entry edits", () => {
  assert.match(validationSql, /add column if not exists author_email text/iu);
  assert.match(validationSql, /security definer\s+set search_path = ''/iu);
  assert.match(validationSql, /new\.owner = auth\.uid\(\)/iu);
  assert.match(validationSql, /from auth\.users as account/iu);
  assert.match(validationSql, /new\.author_email := old\.author_email/iu);
  assert.match(validationSql, /revoke all on function public\.set_entry_author_email\(\) from public, anon, authenticated/iu);
});
