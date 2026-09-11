export const ARCHIVE_READY_EVENT = "archive:loading-complete";

const FULL_PREFETCH_OPTIONS = { kind: "full" };

export function prefetchRoute(router, href) {
  try {
    // Dynamic routes benefit from a full RSC prefetch when the installed Next
    // runtime supports it. The fallback keeps this helper version-safe.
    router.prefetch(href, FULL_PREFETCH_OPTIONS);
  } catch {
    router.prefetch(href);
  }
}
