"use client";

import { useEffect } from "react";

const OPENING_HEIGHT_PROPERTY = "--opening-height-lock";

export default function ViewportHeightLock() {
  useEffect(() => {
    const root = document.documentElement;
    let animationFrameId;
    let viewportWidth = window.innerWidth;

    const applyOpeningHeight = () => {
      root.style.setProperty(OPENING_HEIGHT_PROPERTY, `${Math.round(window.innerHeight)}px`);
    };

    const scheduleOpeningHeightUpdate = () => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(applyOpeningHeight);
    };

    const handleResize = () => {
      if (window.innerWidth === viewportWidth) {
        return;
      }

      viewportWidth = window.innerWidth;
      scheduleOpeningHeightUpdate();
    };

    applyOpeningHeight();
    window.addEventListener("orientationchange", scheduleOpeningHeightUpdate);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("orientationchange", scheduleOpeningHeightUpdate);
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrameId);
      root.style.removeProperty(OPENING_HEIGHT_PROPERTY);
    };
  }, []);

  return null;
}
