export const EMAIL_MAX_LENGTH = 320;
export const USERNAME_MAX_LENGTH = 64;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 256;
export const SEARCH_QUERY_MAX_LENGTH = 256;

export function countCodePoints(value) {
  return Array.from(String(value ?? "")).length;
}

export function limitCodePoints(value, maxLength) {
  return Array.from(String(value ?? "")).slice(0, maxLength).join("");
}

export function isValidUsername(value) {
  const username = String(value ?? "");
  const length = countCodePoints(username);

  return username === username.trim()
    && length > 0
    && length <= USERNAME_MAX_LENGTH
    && !/\p{Cc}/u.test(username);
}

/**
 * Deliberately modest email validation for the client. Supabase remains the
 * authority for account validation; this only avoids sending obviously bad
 * or unbounded input over the network.
 */
export function isValidEmailAddress(value) {
  const email = String(value ?? "").trim();

  if (!email || countCodePoints(email) > EMAIL_MAX_LENGTH || /\s/u.test(email)) {
    return false;
  }

  const atIndex = email.indexOf("@");
  return atIndex > 0
    && atIndex === email.lastIndexOf("@")
    && atIndex < email.length - 1;
}
