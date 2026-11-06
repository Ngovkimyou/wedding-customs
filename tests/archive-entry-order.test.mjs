import assert from "node:assert/strict";
import test from "node:test";
import { getCircularAdjacentEntries } from "../lib/archive-entry-order.mjs";

const communityEntries = [
  { slug: "first-story" },
  { slug: "middle-story" },
  { slug: "last-story" },
];

test("circular community navigation wraps from the first contribution to the last", () => {
  const navigation = getCircularAdjacentEntries(communityEntries, "first-story");

  assert.equal(navigation.previous.slug, "last-story");
  assert.equal(navigation.next.slug, "middle-story");
  assert.equal(navigation.position, 1);
  assert.equal(navigation.total, 3);
});

test("circular community navigation wraps forward from the last contribution", () => {
  const navigation = getCircularAdjacentEntries(communityEntries, "last-story");

  assert.equal(navigation.previous.slug, "middle-story");
  assert.equal(navigation.next.slug, "first-story");
  assert.equal(navigation.position, 3);
});

test("missing and single-entry community collections have no swipe destinations", () => {
  const missing = getCircularAdjacentEntries(communityEntries, "unknown-story");
  const single = getCircularAdjacentEntries([{ slug: "only-story" }], "only-story");

  assert.equal(missing.previous, null);
  assert.equal(missing.next, null);
  assert.equal(single.previous, null);
  assert.equal(single.next, null);
});
