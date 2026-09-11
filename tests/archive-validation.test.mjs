import assert from "node:assert/strict";
import test from "node:test";
import {
  assertValidArchiveEntries,
  validateArchiveEntries,
} from "../lib/archive-validation.mjs";

test("archive validation accepts populated records and intentional placeholders", () => {
  const entries = [
    {
      id: "ARCHIVE 001",
      slug: "first-record",
      title: "First Record",
      summary: "A short summary",
      images: [{ src: "/first.avif" }],
    },
    {
      id: "ARCHIVE 002",
      slug: "future-record",
      title: "Future Record",
      summary: "",
      images: [],
    },
  ];

  assert.deepEqual(validateArchiveEntries(entries), []);
  assert.doesNotThrow(() => assertValidArchiveEntries(entries));
});

test("archive validation reports missing content and invalid identifiers", () => {
  const errors = validateArchiveEntries([
    {
      id: "ARCHIVE 001",
      slug: "Bad Slug",
      title: "",
      summary: "",
      images: [{ alt: "Missing source" }],
    },
    {
      id: "ARCHIVE 001",
      slug: "duplicate",
      title: "Duplicate",
      summary: "Summary",
      images: [{ src: "/duplicate.avif" }],
    },
  ]);

  assert.equal(errors.length, 5);
  assert.throws(() => assertValidArchiveEntries([{ slug: "broken" }]), /Invalid archive data/);
});

test("archive validation checks rich description links and gallery media", () => {
  const errors = validateArchiveEntries([
    {
      id: "ARCHIVE 001",
      slug: "first-record",
      title: "First Record",
      summary: "A short summary",
      images: [{ src: "/first.avif" }],
      descriptionSections: [
        {
          id: "known-section",
          title: "First section",
          paragraphs: [[
            { text: "Missing record", archiveSlug: "missing-record" },
            { text: "Missing section", anchorId: "missing-section" },
          ]],
          imagesAfterParagraph: {
            0: [{ alt: "Missing source" }],
          },
        },
      ],
    },
  ]);

  assert.equal(errors.length, 3);
  assert.match(errors.join("\n"), /unknown slug "missing-record"/);
  assert.match(errors.join("\n"), /unknown section "missing-section"/);
  assert.match(errors.join("\n"), /image 1 must include a src/);
});
