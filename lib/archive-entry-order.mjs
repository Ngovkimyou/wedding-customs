function compareCreatedAtDescending(left, right) {
  const leftTime = Date.parse(left.createdAt ?? "");
  const rightTime = Date.parse(right.createdAt ?? "");

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  if (Number.isFinite(leftTime) !== Number.isFinite(rightTime)) {
    return Number.isFinite(rightTime) ? 1 : -1;
  }

  return left.slug.localeCompare(right.slug);
}

/**
 * Numbered records are the curator's ordered collection. Rows without an
 * archive number are user-created records, so they remain newest-first by
 * upload time after the numbered collection.
 */
export function sortArchiveEntries(entries) {
  return [...entries].sort((left, right) => {
    const leftNumbered = Number.isInteger(left.archiveNumber);
    const rightNumbered = Number.isInteger(right.archiveNumber);

    if (leftNumbered && rightNumbered) {
      return left.archiveNumber - right.archiveNumber;
    }

    if (leftNumbered !== rightNumbered) {
      return leftNumbered ? -1 : 1;
    }

    return compareCreatedAtDescending(left, right);
  });
}
