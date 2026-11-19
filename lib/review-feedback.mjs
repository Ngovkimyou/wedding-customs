export const REVIEW_FEEDBACK_MAX_LENGTH = 1000;

export function normalizeReviewFeedback(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  const length = Array.from(normalized).length;

  if (length < 1 || length > REVIEW_FEEDBACK_MAX_LENGTH) {
    return null;
  }

  return normalized;
}
