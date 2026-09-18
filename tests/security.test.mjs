import test from "node:test";
import assert from "node:assert/strict";
import {
  countCodePoints,
  EMAIL_MAX_LENGTH,
  isValidEmailAddress,
  limitCodePoints,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  SEARCH_QUERY_MAX_LENGTH,
} from "../lib/security.mjs";
import { buildSecurityHeaders } from "../lib/security-policy.mjs";
import { isAuthPath } from "../lib/auth-routes.mjs";
import {
  CAPTCHA_FAILED_ERROR_MESSAGE,
  getAuthErrorMessage,
  LOGIN_ERROR_MESSAGE,
  SIGNUP_ERROR_MESSAGE,
} from "../lib/auth-security.mjs";

function getHeader(headers, key) {
  return headers.find((header) => header.key === key)?.value;
}

test("auth input validation keeps Unicode passwords and rejects unbounded input", () => {
  assert.equal(isValidEmailAddress("person@example.com"), true);
  assert.equal(isValidEmailAddress("person with spaces@example.com"), false);
  assert.equal(isValidEmailAddress("not-an-email"), false);
  assert.equal(isValidEmailAddress(`${"a".repeat(EMAIL_MAX_LENGTH)}@example.com`), false);

  const unicodePassword = "\u1781\u17d2\u1798\u17c2\u179a\ud83d\udd12";
  assert.equal(countCodePoints(unicodePassword), 6);
  assert.equal(PASSWORD_MIN_LENGTH, 8);
  assert.equal(PASSWORD_MAX_LENGTH >= PASSWORD_MIN_LENGTH, true);
  assert.equal(limitCodePoints("a".repeat(500), PASSWORD_MAX_LENGTH).length, PASSWORD_MAX_LENGTH);
});

test("authentication errors do not reveal account existence", () => {
  const providerErrors = [
    { code: "user_not_found", message: "User not found" },
    { code: "invalid_credentials", message: "Invalid login credentials" },
    { code: "user_already_exists", message: "User already registered" },
  ];

  providerErrors.forEach((error) => {
    assert.equal(getAuthErrorMessage({ isLogin: true, error }), LOGIN_ERROR_MESSAGE);
    assert.equal(getAuthErrorMessage({ isLogin: false, error }), SIGNUP_ERROR_MESSAGE);
  });

  assert.equal(
    getAuthErrorMessage({ isLogin: true, error: { code: "captcha_failed" } }),
    CAPTCHA_FAILED_ERROR_MESSAGE,
  );
});

test("only the login and sign-up routes are public auth routes", () => {
  assert.equal(isAuthPath("/login"), true);
  assert.equal(isAuthPath("/signup"), true);
  assert.equal(isAuthPath("/"), false);
  assert.equal(isAuthPath("/archive/how-my-parents-met"), false);
});

test("search input is bounded without changing normal text", () => {
  assert.equal(limitCodePoints("courtship", SEARCH_QUERY_MAX_LENGTH), "courtship");
  assert.equal(
    countCodePoints(limitCodePoints("x".repeat(SEARCH_QUERY_MAX_LENGTH + 50), SEARCH_QUERY_MAX_LENGTH)),
    SEARCH_QUERY_MAX_LENGTH,
  );
});

test("production security headers protect framing, MIME, referrers and transport", () => {
  const headers = buildSecurityHeaders({
    supabaseUrl: "https://example.supabase.co",
    isDevelopment: false,
  });
  const csp = getHeader(headers, "Content-Security-Policy");

  assert.match(csp, /frame-ancestors 'self'/u);
  assert.match(csp, /https:\/\/\*\.hcaptcha\.com/u);
  assert.match(csp, /https:\/\/example\.supabase\.co/u);
  assert.equal(getHeader(headers, "X-Content-Type-Options"), "nosniff");
  assert.equal(getHeader(headers, "X-Frame-Options"), "SAMEORIGIN");
  assert.equal(getHeader(headers, "Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.match(getHeader(headers, "Strict-Transport-Security"), /max-age=31536000/u);
});

test("development headers do not force HSTS and allow the local toolchain", () => {
  const headers = buildSecurityHeaders({
    supabaseUrl: "http://localhost:54321",
    isDevelopment: true,
  });
  const csp = getHeader(headers, "Content-Security-Policy");

  assert.equal(getHeader(headers, "Strict-Transport-Security"), undefined);
  assert.match(csp, /'unsafe-eval'/u);
  assert.match(csp, /http:\/\/localhost:54321/u);
});
