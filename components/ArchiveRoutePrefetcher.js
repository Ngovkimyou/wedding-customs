"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const START_EVENT = "archive:loading-complete";
const FULL_PREFETCH_OPTIONS = { kind: "full" };

function prefetchRoute(router, href) {
  try {
    // Dynamic archive records need a full prefetch. The default App Router
    // mode may only fetch the nearest loading boundary, leaving the first
    // click waiting for the page's RSC payload.
    router.prefetch(href, FULL_PREFETCH_OPTIONS);
  } catch {
    // Keep this compatible with older Next runtimes that only accept href.
    router.prefetch(href);
  }
}

export default function ArchiveRoutePrefetcher({ slugs = [] }) {
  const router = useRouter();

  useEffect(() => {
    let hasWarmedRoutes = false;
    const routes = [
      "/about",
      ...slugs.map((slug) => `/archive/${slug}`),
    ];

    const warmRoutes = () => {
      if (hasWarmedRoutes) {
        return;
      }

      hasWarmedRoutes = true;
      routes.forEach((href) => prefetchRoute(router, href));
    };

    // Wait until the initial visual gate is complete so route requests do not
    // compete with the critical opening-screen assets. The reveal itself then
    // provides a warm-up window before the user reaches a card or About link.
    window.addEventListener(START_EVENT, warmRoutes, { once: true });

    return () => window.removeEventListener(START_EVENT, warmRoutes);
  }, [router, slugs]);

  return null;
}
