import assert from "node:assert/strict";
import test from "node:test";
import {
  detectSupportedPhoto,
  normalizeContributionFields,
  validateContributionFields,
} from "../lib/contribution-validation.mjs";

const VALID_FIELDS = {
  title_en: "Wedding story",
  title_kh: "ពិធីមង្គលការ",
  description: "A story about a family's wedding tradition.",
  period_label: "15/08/26",
  location: "Phnom Penh",
};

test("contribution fields are trimmed and limited to the allowed columns", () => {
  assert.deepEqual(normalizeContributionFields({
    ...VALID_FIELDS,
    title_en: "  Wedding story  ",
    owner: "untrusted-user-id",
  }), {
    ...VALID_FIELDS,
    title_en: "Wedding story",
  });
});

test("valid Khmer content, optional fields, and supported period formats are accepted", () => {
  assert.deepEqual(validateContributionFields(VALID_FIELDS).errors, {});
  assert.deepEqual(validateContributionFields({
    ...VALID_FIELDS,
    period_label: "2003",
    location: "",
  }).errors, {});
});

test("maximum field lengths are accepted and values above them are rejected", () => {
  const atLimits = validateContributionFields({
    title_en: "T".repeat(20),
    title_kh: "ក".repeat(64),
    description: "D".repeat(2000),
    period_label: "31/12/99",
    location: "L".repeat(30),
  });
  assert.deepEqual(atLimits.errors, {});

  const aboveLimits = validateContributionFields({
    title_en: "T".repeat(21),
    title_kh: "ក".repeat(65),
    description: "D".repeat(2001),
    period_label: "1".repeat(11),
    location: "L".repeat(31),
  });
  assert.deepEqual(Object.keys(aboveLimits.errors).sort(), [
    "description",
    "location",
    "period_label",
    "title_en",
    "title_kh",
  ]);
});

test("invalid lengths, controls, and impossible dates are rejected per field", () => {
  const { errors } = validateContributionFields({
    ...VALID_FIELDS,
    title_en: " short ",
    title_kh: "",
    description: "Too short\u0000",
    period_label: "31/02/26",
    location: "x",
  });

  assert.deepEqual(Object.keys(errors).sort(), [
    "description",
    "location",
    "period_label",
    "title_en",
    "title_kh",
  ]);
});

test("photo validation identifies JPEG, PNG, and WebP by file signature", () => {
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
  assert.equal(detectSupportedPhoto(Uint8Array.from([0x25, 0x50, 0x44, 0x46])), null);
});
