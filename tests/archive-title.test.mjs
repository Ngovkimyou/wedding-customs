import assert from "node:assert/strict";
import test from "node:test";
import { getArchiveTitleLines } from "../lib/archive-title.mjs";

test("short archive titles stay on one line", () => {
  assert.deepEqual(getArchiveTitleLines("The Golden Castle"), ["The Golden Castle"]);
});

test("unbroken long titles split into balanced lines", () => {
  const title = "G".repeat(80);
  const lines = getArchiveTitleLines(title);

  assert.deepEqual(lines.map((line) => line.length), [40, 40]);
  assert.equal(lines.join(""), title);
});

test("even overlong legacy titles stay within two balanced lines", () => {
  const title = "K".repeat(120);
  const lines = getArchiveTitleLines(title);

  assert.equal(lines.length, 2);
  assert.deepEqual(lines.map((line) => line.length), [60, 60]);
  assert.equal(lines.join(""), title);
});

test("long titles prefer a nearby word boundary while staying balanced", () => {
  const title = "A traditional wedding story from Battambang recorded by the family archive";
  const lines = getArchiveTitleLines(title);

  assert.equal(lines.length, 2);
  assert.ok(Math.abs(lines[0].length - lines[1].length) <= 12);
  assert.equal(lines.join(" "), title);
});
