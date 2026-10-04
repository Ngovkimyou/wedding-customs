import assert from "node:assert/strict";
import test from "node:test";
import { mapSupabaseEntries, mapSupabaseEntry } from "../lib/archive-entry-mapper.mjs";
import { sortArchiveEntries } from "../lib/archive-entry-order.mjs";

test("Supabase rows map to the existing archive card/search projection", () => {
  const [entry] = mapSupabaseEntries([
    {
      id: "db-id",
      archive_number: 1,
      slug: "how-my-parents-met",
      title_en: "How My Parents First Met",
      title_kh: "ជំនួបគ្នាលើកដំបូង",
      thumbnail_path: "assets\\images\\archive-001.avif",
      summary: "How the couple met",
      description: "First paragraph.\n\nSecond paragraph.",
      period_label: "2003",
      location: "Phnom Penh",
      author_email: null,
      interview_date: "2026-08-15",
      created_at: "2026-09-27T00:00:00Z",
    },
  ], { resolveThumbnail: (path) => `resolved:${path}` });

  assert.equal(entry.id, "ARCHIVE 001");
  assert.equal(entry.dbId, "db-id");
  assert.equal(entry.archiveNumber, 1);
  assert.equal(entry.images[0].src, "resolved:assets\\images\\archive-001.avif");
  assert.equal(entry.descriptionBlocks.length, 3);
  assert.deepEqual(entry.descriptionSections[0].paragraphs, [
    "First paragraph.",
    "Second paragraph.",
  ]);
  assert.equal(entry.content, "First paragraph.\n\nSecond paragraph.");
  assert.equal(entry.descriptionBlocks.at(-1).sectionTitle, "Summary");
  assert.equal(entry.interviewDate, "15/08/26");
});

test("community records map their registration email for the author note", () => {
  const entry = mapSupabaseEntry({
    slug: "community-family-story",
    title_en: "A family story",
    title_kh: "រឿងគ្រួសារ",
    author_email: "contributor@example.com",
  });

  assert.equal(entry.id, "COMMUNITY ENTRY");
  assert.equal(entry.authorEmail, "contributor@example.com");
});

test("placeholder descriptions are not indexed and unknown records get stable labels", () => {
  const entry = mapSupabaseEntry({
    id: "db-id",
    slug: "new-record",
    title_en: "New Record",
    description: "[Full archive story or tradition description will be added here.]\n\n[Additional context or note to be added.]",
  });

  assert.equal(entry.id, "COMMUNITY ENTRY");
  assert.deepEqual(entry.descriptionBlocks, []);
  assert.deepEqual(entry.descriptionSections, []);
  assert.equal(entry.content, "");
  assert.deepEqual(entry.images, []);
});

test("numbered archive records stay ordered while unnumbered records use upload time", () => {
  const ordered = sortArchiveEntries([
    { slug: "new-user-record", archiveNumber: null, createdAt: "2026-09-27T12:00:00Z" },
    { slug: "engagement-traditions", archiveNumber: 3, createdAt: "2026-01-01T00:00:00Z" },
    { slug: "how-my-parents-met", archiveNumber: 1, createdAt: "2026-01-01T00:00:00Z" },
    { slug: "other-user-record", archiveNumber: null, createdAt: "2026-09-26T12:00:00Z" },
  ]);

  assert.deepEqual(ordered.map(({ slug }) => slug), [
    "how-my-parents-met",
    "engagement-traditions",
    "new-user-record",
    "other-user-record",
  ]);
});
