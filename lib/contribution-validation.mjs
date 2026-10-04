export const CONTRIBUTION_LIMITS = Object.freeze({
  titleEnMin: 8,
  titleEnMax: 20,
  titleKhMax: 64,
  descriptionMin: 20,
  descriptionMax: 2000,
  periodMax: 10,
  locationMin: 3,
  locationMax: 30,
  photoMaxBytes: 5 * 1024 * 1024,
});

export const CONTRIBUTION_FIELDS = Object.freeze([
  "title_en",
  "title_kh",
  "description",
  "period_label",
  "location",
]);

export const CAMBODIAN_PROVINCES = Object.freeze([
  "Banteay Meanchey",
  "Battambang",
  "Kampong Cham",
  "Kampong Chhnang",
  "Kampong Speu",
  "Kampong Thom",
  "Kampot",
  "Kandal",
  "Kep",
  "Koh Kong",
  "Kratié",
  "Mondulkiri",
  "Phnom Penh",
  "Preah Sihanouk",
  "Preah Vihear",
  "Prey Veng",
  "Pursat",
  "Ratanakiri",
  "Siem Reap",
  "Stung Treng",
  "Svay Rieng",
  "Takeo",
  "Oddar Meanchey",
  "Pailin",
  "Tboung Khmum",
]);

function countCharacters(value) {
  return Array.from(value).length;
}

export function normalizeContributionFields(fields = {}) {
  return Object.fromEntries(
    CONTRIBUTION_FIELDS.map((field) => [
      field,
      typeof fields[field] === "string" ? fields[field].trim() : "",
    ]),
  );
}

function isValidPeriod(value) {
  if (!value) {
    return true;
  }

  if (/^\d{4}$/u.test(value) && Number(value) > 0) {
    return true;
  }

  const match = /^(\d{2})\/(\d{2})\/(\d{2})$/u.exec(value);

  if (!match) {
    return false;
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = 2000 + Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function containsControlCharacters(value, { allowLineBreaks = false } = {}) {
  if (allowLineBreaks) {
    return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
  }

  return /[\u0000-\u001f\u007f]/u.test(value);
}

export function validateContributionFields(fields = {}) {
  const values = normalizeContributionFields(fields);
  const errors = {};

  const titleEnLength = countCharacters(values.title_en);
  if (
    titleEnLength < CONTRIBUTION_LIMITS.titleEnMin
    || titleEnLength > CONTRIBUTION_LIMITS.titleEnMax
    || containsControlCharacters(values.title_en)
  ) {
    errors.title_en = `Enter a title between ${CONTRIBUTION_LIMITS.titleEnMin} and ${CONTRIBUTION_LIMITS.titleEnMax} characters.`;
  }

  const titleKhLength = countCharacters(values.title_kh);
  if (
    titleKhLength === 0
    || titleKhLength > CONTRIBUTION_LIMITS.titleKhMax
    || containsControlCharacters(values.title_kh)
  ) {
    errors.title_kh = `Enter a Khmer title (up to ${CONTRIBUTION_LIMITS.titleKhMax} characters).`;
  }

  const descriptionLength = countCharacters(values.description);
  if (
    descriptionLength < CONTRIBUTION_LIMITS.descriptionMin
    || descriptionLength > CONTRIBUTION_LIMITS.descriptionMax
    || containsControlCharacters(values.description, { allowLineBreaks: true })
  ) {
    errors.description = `Enter a description between ${CONTRIBUTION_LIMITS.descriptionMin} and ${CONTRIBUTION_LIMITS.descriptionMax} characters.`;
  }

  const periodLength = countCharacters(values.period_label);
  if (periodLength > CONTRIBUTION_LIMITS.periodMax || !isValidPeriod(values.period_label)) {
    errors.period_label = "Use a year such as 2003 or a valid date in DD/MM/YY format.";
  }

  const locationLength = countCharacters(values.location);
  if (values.location && (
    locationLength < CONTRIBUTION_LIMITS.locationMin
    || locationLength > CONTRIBUTION_LIMITS.locationMax
    || containsControlCharacters(values.location)
  )) {
    errors.location = `Location must be ${CONTRIBUTION_LIMITS.locationMin}–${CONTRIBUTION_LIMITS.locationMax} characters.`;
  }

  return { values, errors };
}

export function detectSupportedPhoto(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    return null;
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngSignature.every((byte, index) => bytes[index] === byte)) {
    return { mimeType: "image/png", extension: "png" };
  }

  const isWebp = bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (isWebp) {
    return { mimeType: "image/webp", extension: "webp" };
  }

  return null;
}
