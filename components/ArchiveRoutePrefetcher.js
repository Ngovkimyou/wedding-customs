"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ARCHIVE_READY_EVENT, prefetchRoute } from "../lib/client-navigation.js";

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
    window.addEventListener(ARCHIVE_READY_EVENT, warmRoutes, { once: true });

    return () => window.removeEventListener(ARCHIVE_READY_EVENT, warmRoutes);
  }, [router, slugs]);

  return null;
}
