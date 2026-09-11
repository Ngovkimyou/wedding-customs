import assert from "node:assert/strict";
import test from "node:test";
import {
  findTitleMatches,
  getArchiveDescriptionSnippets,
  getArchiveDescriptionText,
  normalizeSearchText,
} from "../lib/archive-search.mjs";

test("search ignores case and Latin accents without stripping Khmer characters", () => {
  assert.equal(normalizeSearchText("Café"), "cafe");
  assert.equal(normalizeSearchText(null), "");
  assert.equal(normalizeSearchText("ពិធី"), "ពិធី");
});

test("blank and unmatched searches do not produce highlights", () => {
  assert.deepEqual(findTitleMatches("Wedding", "   "), []);
  assert.deepEqual(findTitleMatches("Wedding", "---___@@@"), []);
  assert.deepEqual(findTitleMatches("Wedding", "xyz"), []);
});

test("quotes, punctuation, and repeated spaces do not change a match", () => {
  assert.equal(normalizeSearchText('  "m   et"  '), "met");
  assert.deepEqual(findTitleMatches("How My Parents First Met", '"m   et"'), [
    { start: 21, end: 24 },
  ]);
  assert.deepEqual(findTitleMatches("M—et", "m @ et"), [{ start: 0, end: 4 }]);
});

test("description search flattens rich text and returns matching sentences only", () => {
  const entry = {
    descriptionSections: [
      {
        title: "The Tradition",
        paragraphs: [
          [
            "The family prepared tea. The couple first met at the family home, ",
            { text: "then spoke privately", strong: true },
            ". The celebration continued afterward.",
          ],
        ],
      },
    ],
  };

  assert.match(getArchiveDescriptionText(entry), /then spoke privately/);
  assert.deepEqual(getArchiveDescriptionSnippets(entry, '"m   et"'), [
    {
      sectionTitle: "The Tradition",
      text: "The couple first met at the family home, then spoke privately.",
    },
  ]);
});

test("description search ignores placeholder content and limits long matches", () => {
  const entry = {
    content: "[Full archive story or tradition description to be added here.]",
    aside: "A long aside that mentions a special meeting and continues with context.",
  };

  assert.deepEqual(getArchiveDescriptionSnippets(entry, "story"), []);
  const [snippet] = getArchiveDescriptionSnippets(entry, "meeting");
  assert.equal(snippet.sectionTitle, "Aside");
  assert.match(snippet.text, /meeting/);
});

test("description search accepts the text-only server projection", () => {
  const entry = {
    descriptionBlocks: [
      { sectionTitle: "Morning", text: "The procession begins at sunrise." },
      { sectionTitle: "Afternoon", text: "The family visits the studio." },
    ],
    // This should not be read when the projection is present.
    descriptionSections: [{ paragraphs: ["A different hidden description."] }],
  };

  assert.deepEqual(getArchiveDescriptionSnippets(entry, "studio"), [
    { sectionTitle: "Afternoon", text: "The family visits the studio." },
  ]);
});

test("description search includes a record summary", () => {
  const entry = {
    summary: "Morning wedding customs",
    descriptionSections: [],
  };

  assert.deepEqual(getArchiveDescriptionSnippets(entry, "customs"), [
    { sectionTitle: "Summary", text: "Morning wedding customs" },
  ]);
});

test("Khmer titles are searchable and preserve the matched title text", () => {
  const khmerTitle = "ជំនួបគ្នាលើកដំបូង";
  const [match] = findTitleMatches(khmerTitle, "លើក");

  assert.equal(normalizeSearchText(khmerTitle), khmerTitle);
  assert.equal(khmerTitle.slice(match.start, match.end), "លើក");
});

test("repeated matches preserve the original title text and casing", () => {
  const title = "Family and FAMILY";
  const matches = findTitleMatches(title, "  family  ");
  assert.deepEqual(matches, [{ start: 0, end: 6 }, { start: 11, end: 17 }]);
  assert.deepEqual(matches.map(({ start, end }) => title.slice(start, end)), ["Family", "FAMILY"]);
});

test("precomposed and combining accents map back to their original offsets", () => {
  const title = "Café Cafe\u0301";
  const matches = findTitleMatches(title, "cafe");
  assert.deepEqual(matches, [{ start: 0, end: 4 }, { start: 5, end: 10 }]);
});

test("emoji and Khmer matches preserve complete characters", () => {
  assert.deepEqual(findTitleMatches("🌸 Wedding 🌸", "🌸"), [{ start: 0, end: 2 }, { start: 11, end: 13 }]);
  assert.deepEqual(findTitleMatches("ពិធីមង្គលការ", "ពិធី"), [{ start: 0, end: 4 }]);
});

test("case conversion with context agrees with the title search", () => {
  assert.deepEqual(findTitleMatches("ΟΣ", "ος"), [{ start: 0, end: 2 }]);
});

test("adjacent matches do not overlap or duplicate title text", () => {
  assert.deepEqual(findTitleMatches("aaaaa", "aa"), [{ start: 0, end: 2 }, { start: 2, end: 4 }]);
});
