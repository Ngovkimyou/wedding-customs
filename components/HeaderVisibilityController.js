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

    const isInOpeningScreen = () => openingScreen?.getBoundingClientRect().bottom > 0;

    const showHeader = () => {
      header.classList.remove("site-header--idle-hidden");
    };

    const clearIdleTimer = () => {
      window.clearTimeout(idleTimer);
    };

    const scheduleIdleFade = () => {
      clearIdleTimer();

      if (isInOpeningScreen()) {
        showHeader();
        return;
      }

      idleTimer = window.setTimeout(() => {
        if (!isInOpeningScreen()) {
          header.classList.add("site-header--idle-hidden");
        }
      }, IDLE_DELAY);
    };

    const handleActivity = () => {
      showHeader();
      scheduleIdleFade();
    };

    handleActivity();
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("resize", handleActivity);

    return () => {
      clearIdleTimer();
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("resize", handleActivity);
      header.classList.remove("site-header--idle-hidden");
    };
  }, [pathname]);

  return null;
}
