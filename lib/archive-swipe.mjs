export const TOUCH_SWIPE_THRESHOLD = 84;
export const TOUCH_FAST_SWIPE_MIN_DISTANCE = 32;
export const TOUCH_FAST_SWIPE_VELOCITY = 0.45;
export const WHEEL_SWIPE_THRESHOLD = 96;

const DIRECTION_RATIO = 1.2;
const MIN_DIRECTION_DISTANCE = 12;
const MIN_WHEEL_DISTANCE = 1;
const MIN_VISUAL_OFFSET = 18 * 16;
const MAX_VISUAL_OFFSET = 34 * 16;

export function hasHorizontalWheelIntent(deltaX, deltaY) {
  return (
    Math.abs(deltaX) >= MIN_WHEEL_DISTANCE
    && Math.abs(deltaX) > Math.abs(deltaY) * DIRECTION_RATIO
  );
}

export function isHorizontalSwipe(deltaX, deltaY) {
  return (
    Math.abs(deltaX) > MIN_DIRECTION_DISTANCE
    && hasHorizontalWheelIntent(deltaX, deltaY)
  );
}

export function getSwipeDirection(deltaX) {
  return deltaX < 0 ? "next" : "previous";
}

export function clampSwipeOffset(deltaX, viewportWidth) {
  const maxOffset = Math.min(
    Math.max(viewportWidth * 0.78, MIN_VISUAL_OFFSET),
    MAX_VISUAL_OFFSET,
  );

  return Math.max(-maxOffset, Math.min(maxOffset, deltaX));
}

export function shouldCommitTouchSwipe(deltaX, deltaY, elapsedMilliseconds) {
  if (!isHorizontalSwipe(deltaX, deltaY)) {
    return false;
  }

  const distance = Math.abs(deltaX);
  const elapsed = Math.max(elapsedMilliseconds, 1);
  const isFastSwipe = (
    distance >= TOUCH_FAST_SWIPE_MIN_DISTANCE
    && distance / elapsed >= TOUCH_FAST_SWIPE_VELOCITY
  );

  return distance >= TOUCH_SWIPE_THRESHOLD || isFastSwipe;
}
