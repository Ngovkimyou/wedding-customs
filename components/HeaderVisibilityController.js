"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const IDLE_DELAY = 5000;

export default function HeaderVisibilityController() {
  const pathname = usePathname();

  useEffect(() => {
    const header = document.querySelector("[data-site-header]");
    const openingScreen = document.querySelector(".opening-screen");

    if (!header) {
      return undefined;
    }

    let idleTimer;
    let isInteractingWithHeader = false;

    const isInOpeningScreen = () => openingScreen?.getBoundingClientRect().bottom > 0;

    const showHeader = () => {
      header.classList.remove("site-header--idle-hidden");
    };

    const clearIdleTimer = () => {
      window.clearTimeout(idleTimer);
    };

    const scheduleIdleFade = () => {
      clearIdleTimer();

      if (isInOpeningScreen() || isInteractingWithHeader) {
        showHeader();
        return;
      }

      idleTimer = window.setTimeout(() => {
        if (!isInOpeningScreen() && !isInteractingWithHeader) {
          header.classList.add("site-header--idle-hidden");
        }
      }, IDLE_DELAY);
    };

    const handleActivity = () => {
      showHeader();
      scheduleIdleFade();
    };

    const handlePointerActivity = (event) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        handleActivity();
      }
    };

    const handleTouchActivity = () => {
      handleActivity();
    };

    const handleHeaderEnter = () => {
      isInteractingWithHeader = true;
      showHeader();
      clearIdleTimer();
    };

    const handleHeaderLeave = () => {
      isInteractingWithHeader = false;
      scheduleIdleFade();
    };

    const handleHeaderFocusOut = (event) => {
      if (header.contains(event.relatedTarget)) {
        return;
      }

      handleHeaderLeave();
    };

    handleActivity();
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("resize", handleActivity);
    window.addEventListener("pointerdown", handlePointerActivity, { passive: true });
    document.addEventListener("touchstart", handleTouchActivity, { capture: true, passive: true });
    header.addEventListener("pointerenter", handleHeaderEnter);
    header.addEventListener("pointerleave", handleHeaderLeave);
    header.addEventListener("focusin", handleHeaderEnter);
    header.addEventListener("focusout", handleHeaderFocusOut);

    return () => {
      clearIdleTimer();
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("resize", handleActivity);
      window.removeEventListener("pointerdown", handlePointerActivity);
      document.removeEventListener("touchstart", handleTouchActivity, { capture: true });
      header.removeEventListener("pointerenter", handleHeaderEnter);
      header.removeEventListener("pointerleave", handleHeaderLeave);
      header.removeEventListener("focusin", handleHeaderEnter);
      header.removeEventListener("focusout", handleHeaderFocusOut);
      header.classList.remove("site-header--idle-hidden");
    };
  }, [pathname]);

  return null;
}
