import assert from "node:assert/strict";
import test from "node:test";
import {
  getOwnedContributionPhotoPath,
  removeUnreferencedContributionPhoto,
  verifyContributionPhoto,
} from "../lib/supabase/contribution-photo-storage.mjs";

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
  references = [],
  lookupError = null,
  removeError = null,
  photoBlob = new Blob([Uint8Array.from([0xff, 0xd8, 0xff, 0x00])]),
} = {}) {
  const calls = [];
  const query = {
    select(...args) { calls.push(["select", ...args]); return this; },
    eq(...args) { calls.push(["eq", ...args]); return this; },
    neq(...args) { calls.push(["neq", ...args]); return this; },
    limit(...args) { calls.push(["limit", ...args]); return this; },
    then(resolve, reject) {
      return Promise.resolve({ data: references, error: lookupError }).then(resolve, reject);
    },
  };
  const supabase = {
    from(table) {
      calls.push(["from", table]);
      return query;
    },
    storage: {
      from(bucket) {
        calls.push(["bucket", bucket]);
        return {
          getPublicUrl(path) {
            calls.push(["getPublicUrl", path]);
            return { data: { publicUrl: PHOTO_URL } };
          },
          async remove(paths) {
            calls.push(["remove", paths]);
            return { error: removeError };
          },
          async download(path) {
            calls.push(["download", path]);
            return { data: photoBlob, error: null };
          },
        };
      },
    },
  };
  return { supabase, calls };
}

test("photo URL parsing only accepts a supported photo in the owner's bucket folder", () => {
  assert.equal(getOwnedContributionPhotoPath(PHOTO_URL, USER_ID, SUPABASE_URL), PHOTO_PATH);
  assert.equal(
    getOwnedContributionPhotoPath(PHOTO_URL.replace(/\.jpg$/u, ".avif"), USER_ID, SUPABASE_URL),
    PHOTO_PATH.replace(/\.jpg$/u, ".avif"),
  );
  assert.equal(getOwnedContributionPhotoPath(PHOTO_URL, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", SUPABASE_URL), null);
  assert.equal(
    getOwnedContributionPhotoPath(PHOTO_URL.replace("/photos/", "/other/"), USER_ID, SUPABASE_URL),
    null,
  );
  assert.equal(
    getOwnedContributionPhotoPath(PHOTO_URL.replace("project.supabase.co", "other.supabase.co"), USER_ID, SUPABASE_URL),
    null,
  );
});

test("unreferenced photo removal excludes the entry being deleted", async () => {
  const { supabase, calls } = makeSupabase();

  const result = await removeUnreferencedContributionPhoto(supabase, PHOTO_PATH, PHOTO_URL, {
    ignoreEntryId: ENTRY_ID,
  });

  assert.deepEqual(result, { ok: true, removed: true });
  assert.ok(calls.some(([method, column, value]) => method === "neq" && column === "id" && value === ENTRY_ID));
  assert.ok(calls.some(([method, paths]) => method === "remove" && paths[0] === PHOTO_PATH));
});

test("shared photos are kept and storage lookup failures stop deletion", async () => {
  const shared = makeSupabase({ references: [{ id: "another-entry" }] });
  assert.deepEqual(
    await removeUnreferencedContributionPhoto(shared.supabase, PHOTO_PATH, PHOTO_URL),
    { ok: true, removed: false, referenced: true },
  );
  assert.equal(shared.calls.some(([method]) => method === "remove"), false);

  const failedLookup = makeSupabase({ lookupError: new Error("offline") });
  const result = await withConsoleErrorsMuted(() =>
    removeUnreferencedContributionPhoto(failedLookup.supabase, PHOTO_PATH, PHOTO_URL));
  assert.deepEqual(result, { ok: false, removed: false });
  assert.equal(failedLookup.calls.some(([method]) => method === "remove"), false);
});

test("uploaded photo verification checks the owner's path and the image signature", async () => {
  const { supabase, calls } = makeSupabase();
  const verified = await verifyContributionPhoto(supabase, PHOTO_PATH, USER_ID);
  assert.deepEqual(verified, { ok: true, publicUrl: PHOTO_URL });

  const rejected = await verifyContributionPhoto(supabase, `another-user/${PHOTO_PATH.split("/")[1]}`, USER_ID);
  assert.equal(rejected.ok, false);
  assert.ok(rejected.fieldErrors.photo);
  assert.equal(calls.filter(([method]) => method === "download").length, 1);
});

test("uploaded photo verification rejects a declared MIME type that disagrees with its bytes", async () => {
  const mismatched = makeSupabase({
    photoBlob: new Blob([Uint8Array.from([0xff, 0xd8, 0xff, 0x00])], { type: "image/png" }),
  });

  const result = await verifyContributionPhoto(mismatched.supabase, PHOTO_PATH, USER_ID);
  assert.equal(result.ok, false);
  assert.match(result.fieldErrors.photo, /matching file type/u);
});

test("uploaded photo verification rejects files above the 10 MiB limit", async () => {
  const oversized = makeSupabase({
    photoBlob: {
      size: 10 * 1024 * 1024 + 1,
      type: "image/jpeg",
      slice() {
        throw new Error("Oversized file bytes should not be read.");
      },
    },
  });

  const result = await verifyContributionPhoto(oversized.supabase, PHOTO_PATH, USER_ID);
  assert.equal(result.ok, false);
  assert.match(result.fieldErrors.photo, /10 MB/u);
});
