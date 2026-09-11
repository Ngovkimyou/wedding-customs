const LATIN_DIACRITICS = /[\u0300-\u036f]/g;
const LATIN_DIACRITIC_CHARACTER = /[\u0300-\u036f]/u;
const SEARCH_PUNCTUATION_OR_CONTROL = /[\p{White_Space}\p{P}\p{C}]/u;
const SEARCH_SYMBOL = /\p{S}/u;
const SEARCH_EMOJI = /\p{Extended_Pictographic}/u;

function isSearchNoise(character) {
  if (SEARCH_PUNCTUATION_OR_CONTROL.test(character)) {
    return true;
  }

  // Keep emoji searchable, but treat currency, operators, and other symbols
  // as separators so inputs such as `m @ et` still find “Met”.
  return SEARCH_SYMBOL.test(character) && !SEARCH_EMOJI.test(character);
}

function normalizeCharacter(character) {
  return character
    .normalize("NFD")
    .replace(LATIN_DIACRITICS, "")
    // Uppercase then lowercase gives a small, predictable case-folding step:
    // for example, Greek final sigma (ς) and sigma (σ) compare equally.
    .toUpperCase()
    .toLowerCase();
}

function getSearchCharacters(value) {
  return Array.from(String(value ?? ""))
    .flatMap((character) => Array.from(normalizeCharacter(character)))
    .filter((character) => !isSearchNoise(character));
}

export function normalizeSearchText(value) {
  return getSearchCharacters(String(value ?? "")).join("");
}

// Return original-string offsets so highlights preserve spelling, accents,
// and any punctuation/spaces that occur between matched title characters.
export function findTitleMatches(title, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  const originalTitle = String(title ?? "");
  const offsets = [];
  const normalizedCharacters = [];
  let originalOffset = 0;

  for (const character of originalTitle) {
    const start = originalOffset;
    originalOffset += character.length;
    const normalized = getSearchCharacters(character);

    normalized.forEach((normalizedCharacter) => {
      normalizedCharacters.push(normalizedCharacter);
      // `indexOf` addresses UTF-16 code units, while `for…of` iterates code
      // points. Keep one offset per code unit so emoji and other astral
      // characters retain complete, accurate highlight ranges.
      for (let unit = 0; unit < normalizedCharacter.length; unit += 1) {
        offsets.push({ start, end: originalOffset });
      }
    });

    // A decomposed Latin accent is a separate code point. Include it in the
    // highlighted slice even though it is intentionally ignored for matching.
    if (!normalized.length && LATIN_DIACRITIC_CHARACTER.test(character) && offsets.length) {
      offsets[offsets.length - 1].end = originalOffset;
    }
  }

  const normalizedTitle = normalizedCharacters.join("");
  const matches = [];
  let index = normalizedTitle.indexOf(normalizedQuery);

  while (index !== -1) {
    const lastOffset = index + normalizedQuery.length - 1;
    matches.push({ start: offsets[index].start, end: offsets[lastOffset].end });
    index = normalizedTitle.indexOf(normalizedQuery, index + normalizedQuery.length);
  }

  return matches;
}
