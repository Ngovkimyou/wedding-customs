"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { prefetchImageSources } from "../lib/client-asset-prefetch.js";

export default function ArchiveCardLink({ href, assets = [], children }) {
  const hasWarmedAssets = useRef(false);

  const warmAssets = useCallback(() => {
    if (hasWarmedAssets.current) {
      return;
    }

    hasWarmedAssets.current = true;
    prefetchImageSources(assets);
  }, [assets]);

  return (
    <Link
      className="archive-card ornate-frame"
      href={href}
      prefetch={true}
      onPointerEnter={warmAssets}
      onFocus={warmAssets}
      onPointerDown={warmAssets}
    >
      {children}
    </Link>
  );
}

