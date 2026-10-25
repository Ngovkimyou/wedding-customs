import { countCodePoints } from "./security.mjs";

export const CONTRIBUTION_LIMITS = Object.freeze({
  titleEnMin: 3,
  titleEnMax: 80,
  titleKhMin: 1,
  titleKhMax: 128,
  summaryMax: 128,
  descriptionMin: 20,
  descriptionMax: 2000,
  periodMax: 10,
  locationMin: 3,
  locationMax: 30,
  photoMaxBytes: 10 * 1024 * 1024,
});

export const CONTRIBUTION_FIELDS = Object.freeze([
  "title_en",
  "title_kh",
  "summary",
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

export function sanitizePeriodYear(value) {
  return typeof value === "string" ? value.replace(/\D/gu, "").slice(0, 4) : "";
}

export function sanitizePeriodDatePart(value, maxLength = 2) {
  return typeof value === "string" ? value.replace(/\D/gu, "").slice(0, maxLength) : "";
}

export function padPeriodDatePart(value) {
  const digits = sanitizePeriodDatePart(value);
  return digits.length === 1 ? `0${digits}` : digits;
}

export function parsePeriodDateParts(value) {
  if (typeof value !== "string") {
    return { day: "", month: "", year: "" };
  }

  const match = /^(\d{2})\/?(\d{2})\/?(\d{2}|\d{4})$/u.exec(value.trim());
  if (!match) return { day: "", month: "", year: "" };

  return {
    day: match[1],
    month: match[2],
    year: match[3].length === 2 ? `20${match[3]}` : match[3],
  };
}

export function serializePeriodDateParts(parts = {}) {
  const day = sanitizePeriodDatePart(parts.day);
  const month = sanitizePeriodDatePart(parts.month);
  const year = sanitizePeriodDatePart(parts.year, 4);
  return day || month || year ? `${day}/${month}/${year}` : "";
}

export function normalizePeriodLabel(value) {
  if (typeof value !== "string") return "";
  const normalizedValue = value.trim();
  const dateParts = parsePeriodDateParts(normalizedValue);
  return dateParts.day ? serializePeriodDateParts(dateParts) : normalizedValue;
}

export function normalizeContributionFields(fields = {}) {
  return Object.fromEntries(
    CONTRIBUTION_FIELDS.map((field) => [
      field,
      typeof fields[field] === "string" ? fields[field].trim() : "",
    ]),
  );
}

function parseDayMonthYear(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/u.exec(value);
  if (!match) return null;

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;

  const isLeapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month - 1]) {
    return null;
  }

  return { day, month, year };
}

function isValidPeriod(value) {
  if (!value) return true;
  if (/^\d{4}$/u.test(value) && Number(value) > 0) return true;
  return Boolean(parseDayMonthYear(value));
}

export function isValidPeriodForMode(value, mode) {
  if (typeof value !== "string") return false;
  const normalizedValue = value.trim();
  if (!normalizedValue) return true;

  if (mode === "year") {
    return /^\d{4}$/u.test(normalizedValue) && Number(normalizedValue) > 0;
  }

  if (mode === "date") {
    return Boolean(parseDayMonthYear(normalizedValue));
  }

  return false;
}

export function formatInterviewDateForInput(value) {
  if (typeof value !== "string") return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value.trim());
  if (!match) return value;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, Number(monthText) - 1, Number(dayText)));
  if (date.getUTCFullYear() !== year
    || date.getUTCMonth() + 1 !== Number(monthText)
    || date.getUTCDate() !== Number(dayText)
    || year < 2000
    || year > 2099) {
    return value;
  }

  return `${dayText}/${monthText}/${yearText.slice(-2)}`;
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

  const titleEnLength = countCodePoints(values.title_en);
  if (
    titleEnLength < CONTRIBUTION_LIMITS.titleEnMin
    || titleEnLength > CONTRIBUTION_LIMITS.titleEnMax
    || containsControlCharacters(values.title_en)
  ) {
    errors.title_en = `Enter a title between ${CONTRIBUTION_LIMITS.titleEnMin} and ${CONTRIBUTION_LIMITS.titleEnMax} characters.`;
  }

  const titleKhLength = countCodePoints(values.title_kh);
  if (
    titleKhLength < CONTRIBUTION_LIMITS.titleKhMin
    || titleKhLength > CONTRIBUTION_LIMITS.titleKhMax
    || containsControlCharacters(values.title_kh)
  ) {
    errors.title_kh = `Enter a Khmer title (up to ${CONTRIBUTION_LIMITS.titleKhMax} characters).`;
  }

  const summaryLength = countCodePoints(values.summary);
  if (
    summaryLength > CONTRIBUTION_LIMITS.summaryMax
    || containsControlCharacters(values.summary)
  ) {
    errors.summary = `Summary must be no longer than ${CONTRIBUTION_LIMITS.summaryMax} characters.`;
  }

  const descriptionLength = countCodePoints(values.description);
  if (
    descriptionLength < CONTRIBUTION_LIMITS.descriptionMin
    || descriptionLength > CONTRIBUTION_LIMITS.descriptionMax
    || containsControlCharacters(values.description, { allowLineBreaks: true })
  ) {
    errors.description = `Enter a description between ${CONTRIBUTION_LIMITS.descriptionMin} and ${CONTRIBUTION_LIMITS.descriptionMax} characters.`;
  }

  const periodLength = countCodePoints(values.period_label);
  if (periodLength > CONTRIBUTION_LIMITS.periodMax || !isValidPeriod(values.period_label)) {
    errors.period_label = "Use a year such as 2003 or a valid date in DD/MM/YYYY format.";
  }

  const locationLength = countCodePoints(values.location);
  if (values.location && (
    locationLength < CONTRIBUTION_LIMITS.locationMin
    || locationLength > CONTRIBUTION_LIMITS.locationMax
    || containsControlCharacters(values.location)
  )) {
    errors.location = `Location must be ${CONTRIBUTION_LIMITS.locationMin} to ${CONTRIBUTION_LIMITS.locationMax} characters.`;
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

  const isIsoBmff = bytes.length >= 16
    && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
  if (isIsoBmff) {
    const brands = [String.fromCharCode(...bytes.slice(8, 12))];
    for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
      brands.push(String.fromCharCode(...bytes.slice(offset, offset + 4)));
    }
    if (brands.includes("avif") || brands.includes("avis")) {
      return { mimeType: "image/avif", extension: "avif" };
    }
  }

  return null;
}
