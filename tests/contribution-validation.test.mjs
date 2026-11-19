import assert from "node:assert/strict";
import test from "node:test";
import {
  detectSupportedPhoto,
  formatInterviewDateForInput,
  countDescriptionCharacters,
  isValidPeriodForMode,
  normalizePeriodLabel,
  normalizeContributionFields,
  padPeriodDatePart,
  parsePeriodDateParts,
  sanitizePeriodDatePart,
  sanitizePeriodYear,
  sanitizeDescriptionInput,
  sanitizeDescriptionLanguageInput,
  serializePeriodDateParts,
  validateContributionFields,
} from "../lib/contribution-validation.mjs";

const VALID_FIELDS = {
  title_en: "Wedding story",
  title_kh: "ពិធីមង្គលការ",
  summary: "Family wedding story",
  description: "A story about a family's wedding tradition.",
  period_label: "15/08/2026",
  location: "Phnom Penh",
};

test("contribution fields are trimmed and limited to the allowed columns", () => {
  assert.deepEqual(normalizeContributionFields({
    ...VALID_FIELDS,
    title_en: "  Wedding story  ",
    interview_date: "15/08/26",
    owner: "untrusted-user-id",
  }), {
    ...VALID_FIELDS,
    title_en: "Wedding story",
    description_en: VALID_FIELDS.description,
    description_kh: "",
  });
});

test("valid Khmer content, optional fields, and supported period formats are accepted", () => {
  assert.deepEqual(validateContributionFields(VALID_FIELDS).errors, {});
  assert.deepEqual(validateContributionFields({
    ...VALID_FIELDS,
    period_label: "2003",
    location: "",
    summary: "",
  }).errors, {});
});

test("period format selection accepts only the selected optional format", () => {
  assert.equal(isValidPeriodForMode("", "year"), true);
  assert.equal(isValidPeriodForMode(" 2003 ", "year"), true);
  assert.equal(isValidPeriodForMode("15/08/2026", "date"), true);
  assert.equal(isValidPeriodForMode("29/02/2024", "date"), true);
  assert.equal(isValidPeriodForMode("31/02/2026", "date"), false);
  assert.equal(isValidPeriodForMode("15/08/26", "date"), false);
  assert.equal(isValidPeriodForMode("15/08/2026", "year"), false);
  assert.equal(isValidPeriodForMode("2003", "date"), false);
});

test("period date entry strips nondigits, pads single-digit day/month values, and serializes components", () => {
  assert.equal(sanitizePeriodYear("20a3"), "203");
  assert.equal(sanitizePeriodDatePart("1/5"), "15");
  assert.equal(sanitizePeriodDatePart("20a26", 4), "2026");
  assert.equal(padPeriodDatePart("5"), "05");
  assert.equal(padPeriodDatePart("15"), "15");
  assert.deepEqual(parsePeriodDateParts("15/08/2026"), {
    day: "15",
    month: "08",
    year: "2026",
  });
  assert.deepEqual(parsePeriodDateParts("15082026"), {
    day: "15",
    month: "08",
    year: "2026",
  });
  assert.deepEqual(parsePeriodDateParts("15/08/26"), {
    day: "15",
    month: "08",
    year: "2026",
  });
  assert.equal(serializePeriodDateParts({ day: "05", month: "08", year: "2026" }), "05/08/2026");
  assert.equal(normalizePeriodLabel("15/08/26"), "15/08/2026");
});

test("script-like titles remain ordinary bounded text for React to render safely", () => {
  const title = "<script>alert(1)</script>";
  const { values, errors } = validateContributionFields({
    ...VALID_FIELDS,
    title_en: title,
  });

  assert.equal(values.title_en, title);
  assert.equal(errors.title_en, undefined);
});

test("maximum field lengths are accepted and values above them are rejected", () => {
  const atLimits = validateContributionFields({
    title_en: "T".repeat(80),
    title_kh: "ក".repeat(128),
    summary: "S".repeat(128),
    description: "D".repeat(2000),
    period_label: "31/12/9999",
    location: "L".repeat(30),
  });
  assert.deepEqual(atLimits.errors, {});

  const aboveLimits = validateContributionFields({
    title_en: "T".repeat(81),
    title_kh: "ក".repeat(129),
    summary: "S".repeat(129),
    description: "D".repeat(2001),
    period_label: "1".repeat(11),
    location: "L".repeat(31),
  });
  assert.deepEqual(Object.keys(aboveLimits.errors).sort(), [
    "description_en",
    "location",
    "period_label",
    "summary",
    "title_en",
    "title_kh",
  ]);
});

test("a 1,995-code-point Khmer description passes and length errors report the measured count", () => {
  const validDescription = validateContributionFields({
    ...VALID_FIELDS,
    description: "ក".repeat(1995),
  });
  assert.equal(validDescription.errors.description, undefined);

  const tooShort = validateContributionFields({
    ...VALID_FIELDS,
    description: "ក".repeat(19),
  });
  assert.equal(tooShort.errors.description_en, "Description has 19 characters. Enter at least 20.");

  const tooLong = validateContributionFields({
    ...VALID_FIELDS,
    description: "ក".repeat(2001),
  });
  assert.equal(tooLong.errors.description_en, "Description has 2001 characters. The maximum is 2000.");
});

test("description counters and validation use the same trimmed code-point length", () => {
  const description = `  ${"ក".repeat(1995)}  `;
  assert.equal(countDescriptionCharacters(description), 1995);
  assert.equal(countDescriptionCharacters(undefined), 0);

  const { errors } = validateContributionFields({
    ...VALID_FIELDS,
    description: "",
    description_en: "An English family story with enough detail.",
    description_kh: "ក".repeat(2016),
  });
  assert.equal(errors.description_kh, "Description has 2016 characters. The maximum is 2000.");
});

test("localized descriptions can be provided in either or both languages", () => {
  assert.deepEqual(validateContributionFields({
    ...VALID_FIELDS,
    description: "",
    description_en: "An English family story with enough detail.",
    description_kh: "",
  }).errors, {});

  assert.deepEqual(validateContributionFields({
    ...VALID_FIELDS,
    description: "",
    description_en: "",
    description_kh: "រឿងរ៉ាវអំពីប្រពៃណីមង្គលការរបស់គ្រួសារ។",
  }).errors, {});

  assert.deepEqual(validateContributionFields({
    ...VALID_FIELDS,
    description: "",
    description_en: "An English family story with enough detail.",
    description_kh: "រឿងរ៉ាវអំពីប្រពៃណីមង្គលការរបស់គ្រួសារ។",
  }).errors, {});

  const missing = validateContributionFields({
    ...VALID_FIELDS,
    description: "",
    description_en: "",
    description_kh: "",
  });
  assert.equal(missing.errors.description, "Add a description in Khmer or English, or both.");

  const shortKhmer = validateContributionFields({
    ...VALID_FIELDS,
    description: "",
    description_en: "An English family story with enough detail.",
    description_kh: "ខ្លី",
  });
  assert.equal(shortKhmer.errors.description_kh, "Description has 4 characters. Enter at least 20.");
});

test("invalid lengths, controls, and impossible dates are rejected per field", () => {
  const { errors } = validateContributionFields({
    ...VALID_FIELDS,
    title_en: " ab ",
    title_kh: "",
    description: "Too short\u0000",
    period_label: "31/02/2026",
    location: "x",
  });

  assert.deepEqual(Object.keys(errors).sort(), [
    "description_en",
    "location",
    "period_label",
    "title_en",
    "title_kh",
  ]);
});

test("description input removes invisible controls but preserves normal line breaks", () => {
  assert.equal(
    sanitizeDescriptionInput("First\u0000 line\u000b\nSecond\u001f line\t\r\nThird"),
    "First line\nSecond line\t\r\nThird",
  );

  const { errors } = validateContributionFields({
    ...VALID_FIELDS,
    description: `${VALID_FIELDS.description.slice(0, 10)}\u000b${VALID_FIELDS.description.slice(10)}`,
  });
  assert.equal(errors.description_en, "Remove unsupported control characters from the description.");
});

test("description language input keeps its selected script and allows digits and punctuation", () => {
  assert.equal(
    sanitizeDescriptionLanguageInput("Hello ក, café cafe\u0301! 123🙂", "en"),
    "Hello , café cafe\u0301! 123🙂",
  );
  assert.equal(
    sanitizeDescriptionLanguageInput("សួស្តីhello! ២០២៦", "km"),
    "សួស្តី! ២០២៦",
  );

  const englishError = validateContributionFields({
    ...VALID_FIELDS,
    description: "",
    description_en: "A wedding story includes enough detail ក.",
    description_kh: "",
  });
  assert.equal(englishError.errors.description_en, "Use Latin letters in the English description.");

  const khmerError = validateContributionFields({
    ...VALID_FIELDS,
    description: "",
    description_en: "",
    description_kh: "នេះជារឿងអំពីពិធីមង្គលការ family",
  });
  assert.equal(khmerError.errors.description_kh, "Use Khmer letters in the Khmer description.");
});

test("curator interview dates are formatted for archive notes", () => {
  assert.equal(formatInterviewDateForInput("2026-08-15"), "15/08/26");
});

test("photo validation identifies supported formats by file signature", () => {
  assert.deepEqual(detectSupportedPhoto(Uint8Array.from([0xff, 0xd8, 0xff, 0x00])), {
    mimeType: "image/jpeg",
    extension: "jpg",
  });
  assert.deepEqual(detectSupportedPhoto(Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ])), {
    mimeType: "image/png",
    extension: "png",
  });
  assert.deepEqual(detectSupportedPhoto(Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ])), {
    mimeType: "image/webp",
    extension: "webp",
  });
  assert.deepEqual(detectSupportedPhoto(Uint8Array.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
    0x61, 0x76, 0x69, 0x66, 0x00, 0x00, 0x00, 0x00,
  ])), {
    mimeType: "image/avif",
    extension: "avif",
  });
  assert.equal(detectSupportedPhoto(Uint8Array.from([0x25, 0x50, 0x44, 0x46])), null);
});
