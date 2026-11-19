import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeReviewFeedback,
  REVIEW_FEEDBACK_MAX_LENGTH,
} from "../lib/review-feedback.mjs";

test("review feedback is trimmed, required, and bounded by Unicode characters", () => {
  assert.equal(normalizeReviewFeedback("  Please add the date.  "), "Please add the date.");
  assert.equal(normalizeReviewFeedback("  "), null);
  assert.equal(normalizeReviewFeedback(null), null);
  assert.equal(normalizeReviewFeedback("ក".repeat(REVIEW_FEEDBACK_MAX_LENGTH)), "ក".repeat(REVIEW_FEEDBACK_MAX_LENGTH));
  assert.equal(normalizeReviewFeedback("ក".repeat(REVIEW_FEEDBACK_MAX_LENGTH + 1)), null);
  assert.equal(normalizeReviewFeedback("😀".repeat(REVIEW_FEEDBACK_MAX_LENGTH)).length, REVIEW_FEEDBACK_MAX_LENGTH * 2);
});
