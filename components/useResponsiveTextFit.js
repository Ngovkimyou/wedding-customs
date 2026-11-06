"use client";

import { useLayoutEffect } from "react";

export default function useResponsiveTextFit(ref, contentKey, fitText) {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    let active = true;
    const fit = () => {
      if (active) {
        fitText(element);
      }
    };

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(fit);
    if (resizeObserver && element.parentElement) {
      resizeObserver.observe(element.parentElement);
    }

    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit);
    fit();

    return () => {
      active = false;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [contentKey, fitText, ref]);
}
