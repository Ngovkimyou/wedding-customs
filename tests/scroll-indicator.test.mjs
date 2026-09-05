import assert from "node:assert/strict";
import test from "node:test";
import { getScrollIndicator } from "../lib/scroll-indicator.mjs";

const viewport = { scrollHeight: 2000, clientHeight: 500, trackHeight: 480, scrollTop: 0 };

test("short content and hidden tracks need no indicator", () => {
  for (const overrides of [{ scrollHeight: 500 }, { scrollHeight: 100 }, { trackHeight: 0 }, { clientHeight: 0 }]) {
    assert.deepEqual(getScrollIndicator({ ...viewport, ...overrides }), {
      isScrollable: false, thumbHeight: 0, thumbOffset: 0,
    });
  }
});

test("thumb follows the start, middle and exact bottom of the real track", () => {
  assert.deepEqual(getScrollIndicator(viewport), { isScrollable: true, thumbHeight: 120, thumbOffset: 0 });
  assert.equal(getScrollIndicator({ ...viewport, scrollTop: 750 }).thumbOffset, 180);
  const end = getScrollIndicator({ ...viewport, scrollTop: 1500 });
  assert.equal(end.thumbHeight + end.thumbOffset, viewport.trackHeight);
});

test("touch overscroll cannot escape either end of the track", () => {
  assert.equal(getScrollIndicator({ ...viewport, scrollTop: -200 }).thumbOffset, 0);
  assert.equal(getScrollIndicator({ ...viewport, scrollTop: 3000 }).thumbOffset, 360);
});

test("very long content keeps a usable thumb, even on a tiny track", () => {
  const result = getScrollIndicator({ ...viewport, scrollHeight: 100000 });
  assert.equal(result.thumbHeight, 24);
  const small = getScrollIndicator({ ...viewport, scrollHeight: 100000, trackHeight: 12 });
  assert.equal(small.thumbHeight, 12);
  assert.equal(small.thumbOffset, 0);
});
