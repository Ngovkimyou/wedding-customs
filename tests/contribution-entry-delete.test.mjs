import assert from "node:assert/strict";
import test from "node:test";
import { deleteOwnedContributionEntry } from "../lib/supabase/delete-contribution-entry.mjs";

const USER_ID = "4a321c96-b82a-45ae-91d1-123456789abc";
const ENTRY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PHOTO_PATH = `${USER_ID}/3dc89c76-4a86-48a8-ab76-123456789abc.jpg`;
const SUPABASE_URL = "https://project.supabase.co";
const PHOTO_URL = `${SUPABASE_URL}/storage/v1/object/public/photos/${PHOTO_PATH}`;

async function withConsoleErrorsMuted(callback) {
  const originalError = console.error;
  console.error = () => {};
  try {
    return await callback();
  } finally {
    console.error = originalError;
  }
}

function makeSupabase({
  entry = { id: ENTRY_ID, owner: USER_ID, slug: "my-family-story", thumbnail_path: PHOTO_URL },
  references = [],
  lookupError = null,
  removeError = null,
  deleteError = null,
  deleteDespiteError = false,
} = {}) {
  const events = [];
  let readCount = 0;
  let deleted = false;
  const photoBlob = new Blob([Uint8Array.from([0xff, 0xd8, 0xff, 0x00])], { type: "image/jpeg" });

  const supabase = {
    from(table) {
      assert.equal(table, "entries");
      let operation = "select";
      const filters = {};
      const query = {
        select() { return this; },
        eq(column, value) { filters[column] = value; return this; },
        neq() { return this; },
        limit() { return this; },
        delete() { operation = "delete"; return this; },
        maybeSingle() {
          if (operation === "delete") {
            events.push("delete-entry");
            if (!entry || filters.id !== entry.id || filters.owner !== entry.owner || deleteError) {
              if (deleteDespiteError && entry && filters.id === entry.id && filters.owner === entry.owner) {
                deleted = true;
              }
              return Promise.resolve({ data: null, error: deleteError });
            }
            deleted = true;
            return Promise.resolve({ data: { id: entry.id, slug: entry.slug }, error: null });
          }

          readCount += 1;
          if (readCount === 1) {
            events.push("read-entry");
            return Promise.resolve({
              data: entry && filters.id === entry.id && filters.owner === entry.owner ? entry : null,
              error: null,
            });
          }

          events.push("reconcile-entry");
          return Promise.resolve({ data: deleted ? null : entry, error: null });
        },
        then(resolve, reject) {
          events.push("check-photo-references");
          return Promise.resolve({ data: references, error: lookupError }).then(resolve, reject);
        },
      };
      return query;
    },
    storage: {
      from(bucket) {
        assert.equal(bucket, "photos");
        return {
          async download(path) {
            events.push(["download-photo", path]);
            return { data: photoBlob, error: null };
          },
          async remove(paths) {
            events.push(["remove-photo", paths[0]]);
            return { error: removeError };
          },
          async upload(path) {
            events.push(["restore-photo", path]);
            return { error: null };
          },
        };
      },
    },
  };

  return { supabase, events };
}

test("deleting an owned entry removes its unshared photo before deleting the row", async () => {
  const { supabase, events } = makeSupabase();

  const result = await withConsoleErrorsMuted(() =>
    deleteOwnedContributionEntry(supabase, ENTRY_ID, USER_ID, SUPABASE_URL));

  assert.deepEqual(result, { ok: true, slug: "my-family-story" });
  assert.deepEqual(events.map((event) => Array.isArray(event) ? event[0] : event), [
    "read-entry",
    "check-photo-references",
    "download-photo",
    "remove-photo",
    "delete-entry",
  ]);
});

test("a photo referenced by another entry is kept while the owned entry is deleted", async () => {
  const { supabase, events } = makeSupabase({ references: [{ id: "another-entry" }] });

  const result = await deleteOwnedContributionEntry(supabase, ENTRY_ID, USER_ID, SUPABASE_URL);

  assert.deepEqual(result, { ok: true, slug: "my-family-story" });
  assert.equal(events.some((event) => Array.isArray(event) && event[0] === "download-photo"), false);
  assert.equal(events.some((event) => Array.isArray(event) && event[0] === "remove-photo"), false);
  assert.ok(events.includes("delete-entry"));
});

test("a storage failure preserves the database entry", async () => {
  const { supabase, events } = makeSupabase({ removeError: new Error("storage policy denied delete") });

  const result = await withConsoleErrorsMuted(() =>
    deleteOwnedContributionEntry(supabase, ENTRY_ID, USER_ID, SUPABASE_URL));

  assert.deepEqual(result, { ok: false });
  assert.equal(events.includes("delete-entry"), false);
});

test("if the row delete fails, the photo is restored when the row remains", async () => {
  const { supabase, events } = makeSupabase({ deleteError: new Error("delete refused") });

  const result = await withConsoleErrorsMuted(() =>
    deleteOwnedContributionEntry(supabase, ENTRY_ID, USER_ID, SUPABASE_URL));

  assert.deepEqual(result, { ok: false });
  assert.ok(events.some((event) => Array.isArray(event) && event[0] === "restore-photo"));
});

test("an entry owned by someone else is not deleted or used for storage cleanup", async () => {
  const otherOwnerEntry = {
    id: ENTRY_ID,
    owner: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    slug: "someone-elses-story",
    thumbnail_path: PHOTO_URL,
  };
  const { supabase, events } = makeSupabase({ entry: otherOwnerEntry });

  const result = await withConsoleErrorsMuted(() =>
    deleteOwnedContributionEntry(supabase, ENTRY_ID, USER_ID, SUPABASE_URL));

  assert.deepEqual(result, { ok: false });
  assert.equal(events.length, 1);
});
