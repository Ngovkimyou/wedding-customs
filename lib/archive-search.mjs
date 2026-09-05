export function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Return original-string offsets so highlights preserve spelling and accents.
export function findTitleMatches(title, query) {
  const normalizedQuery = normalizeSearchText(String(query ?? "").trim());
  if (!normalizedQuery) return [];

  const originalTitle = String(title ?? "");
  const offsets = [];
  const normalizedTitle = normalizeSearchText(originalTitle);
  let originalOffset = 0;

  for (const character of originalTitle) {
    const start = originalOffset;
    originalOffset += character.length;
    const normalized = normalizeSearchText(character);

    for (let index = 0; index < normalized.length; index += 1) {
      offsets.push({ start, end: originalOffset });
    }
    if (!normalized.length && offsets.length) {
      offsets[offsets.length - 1].end = originalOffset;
    }
  }

  const matches = [];
  let index = normalizedTitle.indexOf(normalizedQuery);

  while (index !== -1) {
    matches.push({ start: offsets[index].start, end: offsets[index + normalizedQuery.length - 1].end });
    index = normalizedTitle.indexOf(normalizedQuery, index + normalizedQuery.length);
  }

  return matches;
}
