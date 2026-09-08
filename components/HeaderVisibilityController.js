"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const IDLE_DELAY = 5000;
const ARCHIVE_NAVIGATION_HIDDEN_CLASS = "archive-entry__navigation--idle-hidden";

export default function HeaderVisibilityController() {
  const pathname = usePathname();

  useEffect(() => {
    const header = document.querySelector("[data-site-header]");
    const openingScreen = document.querySelector(".opening-screen");
    const archiveNavigation = document.querySelector("[data-archive-navigation]");

    if (!header) {
      return undefined;
    }

    let idleTimer;
    let isInteractingWithHeader = false;
    let isInteractingWithArchiveNavigation = false;

    const isInOpeningScreen = () => openingScreen?.getBoundingClientRect().bottom > 0;

    const showHeader = () => {
      header.classList.remove("site-header--idle-hidden");
    };

    const showArchiveNavigation = () => {
      archiveNavigation?.classList.remove(ARCHIVE_NAVIGATION_HIDDEN_CLASS);
    };

    const clearIdleTimer = () => {
      window.clearTimeout(idleTimer);
    };

    const scheduleIdleFade = () => {
      clearIdleTimer();

      if (isInOpeningScreen() || isInteractingWithHeader || isInteractingWithArchiveNavigation) {
        showHeader();
        showArchiveNavigation();
        return;
      }

      idleTimer = window.setTimeout(() => {
        if (!isInOpeningScreen() && !isInteractingWithHeader && !isInteractingWithArchiveNavigation) {
          header.classList.add("site-header--idle-hidden");
          archiveNavigation?.classList.add(ARCHIVE_NAVIGATION_HIDDEN_CLASS);
        }
      }, IDLE_DELAY);
    };

    const handleActivity = () => {
      showHeader();
      showArchiveNavigation();
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

    const handleArchiveNavigationEnter = () => {
      isInteractingWithArchiveNavigation = true;
      showArchiveNavigation();
      clearIdleTimer();
    };

    const handleArchiveNavigationLeave = () => {
      isInteractingWithArchiveNavigation = false;
      scheduleIdleFade();
    };

    const handleArchiveNavigationFocusOut = (event) => {
      if (archiveNavigation?.contains(event.relatedTarget)) {
        return;
      }

      handleArchiveNavigationLeave();
    };

    const handleHeaderFocusOut = (event) => {
      if (header.contains(event.relatedTarget)) {
        return;
      }

      handleHeaderLeave();
    };

    handleActivity();
    // Capture scrolls from nested viewports (search, credits, and the music panel).
    window.addEventListener("scroll", handleActivity, { capture: true, passive: true });
    window.addEventListener("resize", handleActivity);
    window.addEventListener("pointerdown", handlePointerActivity, { passive: true });
    document.addEventListener("touchstart", handleTouchActivity, { capture: true, passive: true });
    header.addEventListener("pointerenter", handleHeaderEnter);
    header.addEventListener("pointerleave", handleHeaderLeave);
    header.addEventListener("focusin", handleHeaderEnter);
    header.addEventListener("focusout", handleHeaderFocusOut);
    archiveNavigation?.addEventListener("pointerenter", handleArchiveNavigationEnter);
    archiveNavigation?.addEventListener("pointerleave", handleArchiveNavigationLeave);
    archiveNavigation?.addEventListener("focusin", handleArchiveNavigationEnter);
    archiveNavigation?.addEventListener("focusout", handleArchiveNavigationFocusOut);

    return () => {
      clearIdleTimer();
      window.removeEventListener("scroll", handleActivity, { capture: true });
      window.removeEventListener("resize", handleActivity);
      window.removeEventListener("pointerdown", handlePointerActivity);
      document.removeEventListener("touchstart", handleTouchActivity, { capture: true });
      header.removeEventListener("pointerenter", handleHeaderEnter);
      header.removeEventListener("pointerleave", handleHeaderLeave);
      header.removeEventListener("focusin", handleHeaderEnter);
      header.removeEventListener("focusout", handleHeaderFocusOut);
      archiveNavigation?.removeEventListener("pointerenter", handleArchiveNavigationEnter);
      archiveNavigation?.removeEventListener("pointerleave", handleArchiveNavigationLeave);
      archiveNavigation?.removeEventListener("focusin", handleArchiveNavigationEnter);
      archiveNavigation?.removeEventListener("focusout", handleArchiveNavigationFocusOut);
      header.classList.remove("site-header--idle-hidden");
      archiveNavigation?.classList.remove(ARCHIVE_NAVIGATION_HIDDEN_CLASS);
    };
  }, [pathname]);

  return null;
}
