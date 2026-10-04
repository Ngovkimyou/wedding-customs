/** Routes that are usable before a session exists. */
const AUTH_PATHS = Object.freeze(["/login", "/signup"]);
const PUBLIC_PATHS = Object.freeze(["/", "/about", "/search", "/contribute"]);

export function isAuthPath(pathname) {
  return AUTH_PATHS.includes(pathname);
}

/** Public pages and archive records are readable without a session. The
 * contribution route only exposes its form after a server-side user check. */
export function isPublicPath(pathname) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/archive/");
}
