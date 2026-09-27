"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ARCHIVE_READY_EVENT, prefetchRoute } from "../lib/client-navigation.js";

export default function ArchiveRoutePrefetcher({ slugs = [] }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let hasWarmedRoutes = false;
    const coreRoutes = pathname === "/"
      ? ["/search"]
      : pathname === "/search"
        ? ["/"]
        : ["/", "/search"];
    const archiveRoutes = [
      "/about",
      ...slugs.map((slug) => `/archive/${slug}`),
    ];
    let archiveWarmTimer;

    const warmRoutes = () => {
      if (hasWarmedRoutes) {
        return;
      }

      hasWarmedRoutes = true;
      coreRoutes.forEach((href) => prefetchRoute(router, href));
      // Warm the less likely routes after the home/search route has had a
      // chance to start, so a click on a header icon is not competing with
      // every archive prefetch at once.
      archiveWarmTimer = window.setTimeout(() => {
        archiveRoutes.forEach((href) => prefetchRoute(router, href));
      }, 500);
    };

    // Wait until the initial visual gate is complete so route requests do not
    // compete with the critical opening-screen assets. The reveal itself then
    // provides a warm-up window before the user reaches a card or About link.
    window.addEventListener(ARCHIVE_READY_EVENT, warmRoutes, { once: true });

    return () => {
      window.removeEventListener(ARCHIVE_READY_EVENT, warmRoutes);
      window.clearTimeout(archiveWarmTimer);
    };
  }, [pathname, router, slugs]);

  return null;
}
