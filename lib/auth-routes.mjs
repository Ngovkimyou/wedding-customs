/** Routes that are usable before a session exists. */
const AUTH_PATHS = Object.freeze(["/login", "/signup"]);
const PUBLIC_PATHS = Object.freeze(["/", "/about", "/search"]);

export function isAuthPath(pathname) {
  return AUTH_PATHS.includes(pathname);
}

/**
 * Archive content is intentionally readable without an account. Write
 * access remains protected by Supabase RLS, so public pages can safely use
 * the publishable client for their read-only queries.
 */
export function isPublicPath(pathname) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/archive/");
}
