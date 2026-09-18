/** Routes that are usable before a session exists. */
const AUTH_PATHS = Object.freeze(["/login", "/signup"]);

export function isAuthPath(pathname) {
  return AUTH_PATHS.includes(pathname);
}
