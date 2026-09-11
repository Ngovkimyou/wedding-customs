import assert from "node:assert/strict";
import test from "node:test";
import {
  clampSwipeOffset,
  getSwipeDirection,
  hasHorizontalWheelIntent,
  isHorizontalSwipe,
  shouldCommitTouchSwipe,
} from "../lib/archive-swipe.mjs";

test("swipe direction follows the reader's finger", () => {
  assert.equal(getSwipeDirection(-40), "next");
  assert.equal(getSwipeDirection(40), "previous");
});

test("vertical movement does not trigger archive navigation", () => {
  assert.equal(isHorizontalSwipe(30, 40), false);
  assert.equal(shouldCommitTouchSwipe(40, 90, 40), false);
  assert.equal(hasHorizontalWheelIntent(8, 12), false);
  assert.equal(hasHorizontalWheelIntent(8, 2), true);
});

test("touch navigation accepts deliberate distance or sufficient velocity", () => {
  assert.equal(shouldCommitTouchSwipe(-90, 8, 500), true);
  assert.equal(shouldCommitTouchSwipe(36, 4, 50), true);
  assert.equal(shouldCommitTouchSwipe(36, 4, 500), false);
});

test("visual drag stays bounded on narrow and wide screens", () => {
  assert.equal(clampSwipeOffset(1000, 320), 18 * 16);
  assert.equal(clampSwipeOffset(-1000, 1920), -(34 * 16));
  assert.equal(clampSwipeOffset(120, 1200), 120);
});
