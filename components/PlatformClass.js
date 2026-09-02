"use client";

import { useEffect } from "react";

export default function PlatformClass() {
  useEffect(() => {
    const root = document.documentElement;
    const platform = navigator.userAgentData?.platform || navigator.platform || "";
    const isMacOS = /mac/i.test(platform) || /Macintosh/i.test(navigator.userAgent);

    root.classList.toggle("platform-macos", isMacOS);

    return () => {
      root.classList.remove("platform-macos");
    };
  }, []);

  return null;
}
