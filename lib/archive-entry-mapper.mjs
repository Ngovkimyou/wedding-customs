import { formatInterviewDateForInput } from "./contribution-validation.mjs";

const PLACEHOLDER_DESCRIPTION = /^(?:\s*\[[^\]]+\]\s*)+$/u;

const ARCHIVE_LABELS_BY_SLUG = new Map([
  ["how-my-parents-met", "ARCHIVE 001"],
  ["courtship-and-family-involvement", "ARCHIVE 002"],
  ["engagement-traditions", "ARCHIVE 003"],
  ["wedding-preparation", "ARCHIVE 004"],
  ["traditional-khmer-wedding-ceremonies", "ARCHIVE 005"],
  ["wedding-ceremonies-afternoon", "ARCHIVE 006"],
  ["during-the-night", "ARCHIVE 007"],
  ["ceremonial-objects", "ARCHIVE 008"],
]);

const ARCHIVE_NUMBERS_BY_SLUG = new Map(
  Array.from(ARCHIVE_LABELS_BY_SLUG, ([slug, label]) => [
    slug,
    Number.parseInt(label.replace(/\D/gu, ""), 10),
  ]),
);

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getDescriptionParagraphs(row) {
  const description = asText(row.description);
  if (!description || PLACEHOLDER_DESCRIPTION.test(description)) {
    return [];
  }

  return description
    .split(/\r?\n\s*\r?\n/gu)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getDescriptionBlocks(row, paragraphs) {
  const blocks = paragraphs.map((text) => ({
    sectionTitle: asText(row.title_en),
    text,
  }));
  const summary = asText(row.summary);

  if (summary) {
    blocks.push({ sectionTitle: "Summary", text: summary });
  }

  return blocks;
}

function getRecordLabel(row) {
  const explicitLabel = asText(row.archive_label || row.record_label || row.archive_code);

  if (explicitLabel) {
    return explicitLabel;
  }

  const archiveNumber = getArchiveNumber(row);
  return archiveNumber
    ? `ARCHIVE ${String(archiveNumber).padStart(3, "0")}`
    : "COMMUNITY ENTRY";
}

function getArchiveNumber(row) {
  const explicitNumber = Number(row?.archive_number ?? row?.archive_no);

  if (Number.isInteger(explicitNumber) && explicitNumber > 0) {
    return explicitNumber;
  }

  return ARCHIVE_NUMBERS_BY_SLUG.get(asText(row?.slug)) ?? null;
}

/**
 * Convert the deliberately small public `entries` table shape into the
 * existing archive-card/search projection. Keeping this adapter separate
 * means the rest of the UI does not need to know Supabase column names.
 */
export function mapSupabaseEntry(row, { resolveThumbnail = () => null } = {}) {
  const slug = asText(row?.slug);
  const title = asText(row?.title_en);

  if (!slug || !title) {
    return null;
  }

  const recordLabel = getRecordLabel(row);
  const thumbnail = resolveThumbnail(row.thumbnail_path, slug);
  const descriptionParagraphs = getDescriptionParagraphs(row);

  return {
    id: recordLabel,
    dbId: row.id ?? null,
    archiveNumber: getArchiveNumber(row),
    authorEmail: asText(row.author_email),
    slug,
    title,
    khmerTitle: asText(row.title_kh),
    summary: asText(row.summary),
    images: thumbnail
      ? [{ src: thumbnail, alt: `Photograph for ${recordLabel}`, caption: "Contributed photograph" }]
      : [],
    descriptionBlocks: getDescriptionBlocks(row, descriptionParagraphs),
    descriptionSections: descriptionParagraphs.length
      ? [{
        title: "Story",
        paragraphs: descriptionParagraphs,
      }]
      : [],
    content: descriptionParagraphs.join("\n\n"),
    showAside: false,
    period: asText(row.period_label),
    location: asText(row.location),
    interviewDate: typeof row.interview_date === "string"
      ? formatInterviewDateForInput(row.interview_date)
      : null,
    createdAt: row.created_at ?? null,
  };
}

export function mapSupabaseEntries(rows, options) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => mapSupabaseEntry(row, options))
    .filter(Boolean);
}
