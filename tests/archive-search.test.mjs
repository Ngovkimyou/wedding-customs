import assert from "node:assert/strict";
import test from "node:test";
import { findTitleMatches, normalizeSearchText } from "../lib/archive-search.mjs";

test("search ignores case and Latin accents without stripping Khmer characters", () => {
  assert.equal(normalizeSearchText("Café"), "cafe");
  assert.equal(normalizeSearchText(null), "");
  assert.equal(normalizeSearchText("ពិធី"), "ពិធី");
});

test("blank and unmatched searches do not produce highlights", () => {
  assert.deepEqual(findTitleMatches("Wedding", "   "), []);
  assert.deepEqual(findTitleMatches("Wedding", "xyz"), []);
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
