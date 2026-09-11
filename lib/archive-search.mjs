const LATIN_DIACRITICS = /[\u0300-\u036f]/g;
const LATIN_DIACRITIC_CHARACTER = /[\u0300-\u036f]/u;
const SEARCH_PUNCTUATION_OR_CONTROL = /[\p{White_Space}\p{P}\p{C}]/u;
const SEARCH_SYMBOL = /\p{S}/u;
const SEARCH_EMOJI = /\p{Extended_Pictographic}/u;
const SENTENCE_BOUNDARY = /[^.!?…。！？]+(?:[.!?…。！？]+|$)/gu;
const PLACEHOLDER_TEXT = /^\[[^\]]+\]$/u;
const CONTEXT_BEFORE_MATCH = 72;
const CONTEXT_AFTER_MATCH = 148;

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

function getDescriptionPartText(part) {
  if (typeof part === "string") {
    return part;
  }

  return part?.text || "";
}

function getParagraphText(paragraph) {
  if (Array.isArray(paragraph)) {
    return paragraph.map(getDescriptionPartText).join("");
  }

  return getDescriptionPartText(paragraph);
}

function cleanDescriptionText(value) {
  return String(value ?? "").replace(/\s+/gu, " ").trim();
}

function addDescriptionBlock(blocks, text, sectionTitle = "") {
  const cleanedText = cleanDescriptionText(text);

  if (!cleanedText || PLACEHOLDER_TEXT.test(cleanedText)) {
    return;
  }

  blocks.push({ text: cleanedText, sectionTitle });
}

function collectDescriptionSection(blocks, section, parentTitle = "") {
  if (!section || typeof section !== "object") {
    return;
  }

  const sectionTitle = section.title || parentTitle;
  const paragraphs = Array.isArray(section.paragraphs)
    ? section.paragraphs
    : section.paragraphs
      ? [section.paragraphs]
      : [];
  const subsections = Array.isArray(section.subsections) ? section.subsections : [];

  paragraphs.forEach((paragraph) => {
    addDescriptionBlock(blocks, getParagraphText(paragraph), sectionTitle);
  });

  subsections.forEach((subsection) => {
    collectDescriptionSection(blocks, subsection, sectionTitle);
  });
}

export function getArchiveDescriptionBlocks(entry) {
  const blocks = [];

  // Search pages receive a server-created, text-only projection so the
  // interactive bundle never needs to carry archive artwork or gallery data.
  // Accepting that projection here also keeps the matcher reusable in tests
  // and other consumers that already have flattened description blocks.
  if (Array.isArray(entry?.descriptionBlocks)) {
    entry.descriptionBlocks.forEach((block) => {
      if (typeof block === "string") {
        addDescriptionBlock(blocks, block);
        return;
      }

      addDescriptionBlock(blocks, block?.text, block?.sectionTitle || "");
    });
    return blocks;
  }

  const sections = Array.isArray(entry?.descriptionSections) ? entry.descriptionSections : [];

  sections.forEach((section) => {
    collectDescriptionSection(blocks, section);
  });

  if (!blocks.length) {
    addDescriptionBlock(blocks, entry?.content, "Archive description");
  }

  addDescriptionBlock(blocks, entry?.summary, "Summary");

  if (entry?.showAside !== false) {
    addDescriptionBlock(blocks, entry?.aside, entry?.asideTitle || "Aside");
  }

  return blocks;
}

export function getArchiveDescriptionText(entry) {
  return getArchiveDescriptionBlocks(entry)
    .map(({ text }) => text)
    .join(" ");
}

function splitIntoSentences(text) {
  return Array.from(text.matchAll(SENTENCE_BOUNDARY), ([sentence]) => sentence.trim())
    .filter(Boolean);
}

function getBoundedMatchContext(text, match) {
  const start = Math.max(0, match.start - CONTEXT_BEFORE_MATCH);
  const end = Math.min(text.length, match.end + CONTEXT_AFTER_MATCH);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function addSnippet(snippets, seen, text, sectionTitle) {
  const cleanedText = cleanDescriptionText(text);
  const key = normalizeSearchText(cleanedText);

  if (!cleanedText || !key || seen.has(key)) {
    return;
  }

  seen.add(key);
  snippets.push({ text: cleanedText, sectionTitle });
}

/**
 * Return only the sentences that contain the query. A bounded context is used
 * when a paragraph has no sentence punctuation or the match crosses a
 * sentence boundary, keeping result cards useful without exposing full prose.
 */
export function getArchiveDescriptionSnippets(entry, query, limit = 3) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery || limit <= 0) {
    return [];
  }

  const snippets = [];
  const seen = new Set();

  for (const block of getArchiveDescriptionBlocks(entry)) {
    if (snippets.length >= limit) {
      break;
    }

    const sentences = splitIntoSentences(block.text);
    const matchingSentences = sentences.filter((sentence) => (
      findMatchesWithNormalizedQuery(sentence, normalizedQuery).length > 0
    ));

    if (matchingSentences.length) {
      matchingSentences.forEach((sentence) => {
        if (snippets.length < limit) {
          addSnippet(snippets, seen, sentence, block.sectionTitle);
        }
      });
      continue;
    }

    const [match] = findMatchesWithNormalizedQuery(block.text, normalizedQuery);
    if (match) {
      addSnippet(snippets, seen, getBoundedMatchContext(block.text, match), block.sectionTitle);
    }
  }

  return snippets;
}

// Return original-string offsets so highlights preserve spelling, accents,
// and any punctuation/spaces that occur between matched title characters.
function findMatchesWithNormalizedQuery(title, normalizedQuery) {
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

export function findTitleMatches(title, query) {
  return findMatchesWithNormalizedQuery(title, normalizeSearchText(query));
}
