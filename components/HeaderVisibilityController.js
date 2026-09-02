"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const IDLE_DELAY = 5000;

export default function HeaderVisibilityController() {
  const pathname = usePathname();

  useEffect(() => {
    const header = document.querySelector("[data-site-header]");
    const headerInner = header?.querySelector(".site-header__inner");
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
      if (headerInner?.contains(event.relatedTarget)) {
        return;
      }

      handleHeaderLeave();
    };

    handleActivity();
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("resize", handleActivity);
    headerInner?.addEventListener("pointerenter", handleHeaderEnter);
    headerInner?.addEventListener("pointerleave", handleHeaderLeave);
    headerInner?.addEventListener("focusin", handleHeaderEnter);
    headerInner?.addEventListener("focusout", handleHeaderFocusOut);

    return () => {
      clearIdleTimer();
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("resize", handleActivity);
      headerInner?.removeEventListener("pointerenter", handleHeaderEnter);
      headerInner?.removeEventListener("pointerleave", handleHeaderLeave);
      headerInner?.removeEventListener("focusin", handleHeaderEnter);
      headerInner?.removeEventListener("focusout", handleHeaderFocusOut);
      header.classList.remove("site-header--idle-hidden");
    };
  }, [pathname]);

  return null;
}
