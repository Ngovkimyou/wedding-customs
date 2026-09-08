"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const SWIPE_THRESHOLD = 56;
const DIRECTION_RATIO = 1.2;
const WHEEL_THRESHOLD = 72;
const WHEEL_RESET_DELAY = 140;
const NAVIGATION_LOCK_TIMEOUT = 1200;
const DESKTOP_QUERY = "(min-width: 60.0625rem) and (pointer: fine)";
const INTERACTIVE_TARGET = "a, button, input, textarea, select, summary, [contenteditable=\"true\"], [role=\"button\"]";

function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_TARGET));
}

function prefetchRoute(router, href) {
  try {
    router.prefetch(href, { kind: "full" });
  } catch {
    router.prefetch(href);
  }
}

export default function ArchiveSwipeNavigation({ previousSlug, nextSlug }) {
  const pathname = usePathname();
  const router = useRouter();
  const touchGestureRef = useRef(null);
  const wheelGestureRef = useRef({ deltaX: 0, resetTimer: null });
  const navigationLockedRef = useRef(false);
  const navigationResetTimerRef = useRef(null);

  const navigate = useCallback((direction) => {
    if (navigationLockedRef.current) {
      return;
    }

    const destinationSlug = direction === "next" ? nextSlug : previousSlug;
    if (!destinationSlug) {
      return;
    }

    const href = `/archive/${destinationSlug}`;
    navigationLockedRef.current = true;
    prefetchRoute(router, href);
    router.push(href);

    window.clearTimeout(navigationResetTimerRef.current);
    navigationResetTimerRef.current = window.setTimeout(() => {
      navigationLockedRef.current = false;
    }, NAVIGATION_LOCK_TIMEOUT);
  }, [nextSlug, previousSlug, router]);

  useEffect(() => {
    navigationLockedRef.current = false;
  }, [pathname]);

  useEffect(() => () => {
    window.clearTimeout(navigationResetTimerRef.current);
    window.clearTimeout(wheelGestureRef.current.resetTimer);
  }, []);

  useEffect(() => {
    const page = document.querySelector(".archive-record-page");
    if (!page) {
      return undefined;
    }

    const resetTouchGesture = () => {
      touchGestureRef.current = null;
    };

    const handleTouchStart = (event) => {
      if (event.touches.length !== 1 || isInteractiveTarget(event.target)) {
        resetTouchGesture();
        return;
      }

      const [touch] = event.touches;
      touchGestureRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        horizontal: false,
      };
    };

    const handleTouchMove = (event) => {
      const gesture = touchGestureRef.current;
      if (!gesture) {
        return;
      }

      if (event.touches.length !== 1) {
        // A second finger means this is a pinch or another multi-touch
        // gesture, not a card navigation swipe.
        resetTouchGesture();
        return;
      }

      const [touch] = event.touches;
      gesture.currentX = touch.clientX;
      gesture.currentY = touch.clientY;
      const deltaX = gesture.currentX - gesture.startX;
      const deltaY = gesture.currentY - gesture.startY;

      if (
        Math.abs(deltaX) > 12
        && Math.abs(deltaX) > Math.abs(deltaY) * DIRECTION_RATIO
      ) {
        gesture.horizontal = true;
        // Keep a horizontal swipe from handing control to browser edge-swipe
        // navigation while leaving vertical page scrolling untouched.
        if (event.cancelable) {
          event.preventDefault();
        }
      }
    };

    const handleTouchEnd = (event) => {
      const gesture = touchGestureRef.current;
      resetTouchGesture();
      if (!gesture || event.touches.length > 0 || !gesture.horizontal) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = (touch?.clientX ?? gesture.currentX) - gesture.startX;
      const deltaY = (touch?.clientY ?? gesture.currentY) - gesture.startY;

      if (
        Math.abs(deltaX) < SWIPE_THRESHOLD
        || Math.abs(deltaX) <= Math.abs(deltaY) * DIRECTION_RATIO
      ) {
        return;
      }

      navigate(deltaX < 0 ? "next" : "previous");
    };

    const handleWheel = (event) => {
      // A two-finger horizontal trackpad gesture is reported as a horizontal
      // wheel delta. Restrict this path to desktop fine pointers so normal
      // vertical scrolling on touch devices is never hijacked.
      if (
        !window.matchMedia(DESKTOP_QUERY).matches
        || event.ctrlKey
        || event.shiftKey
        || isInteractiveTarget(event.target)
      ) {
        return;
      }

      const deltaX = Number(event.deltaX) || 0;
      const deltaY = Number(event.deltaY) || 0;
      if (
        Math.abs(deltaX) < 1
        || Math.abs(deltaX) <= Math.abs(deltaY) * DIRECTION_RATIO
      ) {
        return;
      }

      const wheelGesture = wheelGestureRef.current;
      wheelGesture.deltaX += deltaX;
      window.clearTimeout(wheelGesture.resetTimer);
      wheelGesture.resetTimer = window.setTimeout(() => {
        wheelGesture.deltaX = 0;
      }, WHEEL_RESET_DELAY);

      if (Math.abs(wheelGesture.deltaX) < WHEEL_THRESHOLD) {
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      const direction = wheelGesture.deltaX < 0 ? "next" : "previous";
      wheelGesture.deltaX = 0;
      navigate(direction);
    };

    page.addEventListener("touchstart", handleTouchStart, { passive: true });
    page.addEventListener("touchmove", handleTouchMove, { passive: false });
    page.addEventListener("touchend", handleTouchEnd, { passive: true });
    page.addEventListener("touchcancel", resetTouchGesture, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      page.removeEventListener("touchstart", handleTouchStart);
      page.removeEventListener("touchmove", handleTouchMove);
      page.removeEventListener("touchend", handleTouchEnd);
      page.removeEventListener("touchcancel", resetTouchGesture);
      window.removeEventListener("wheel", handleWheel);
      resetTouchGesture();
      window.clearTimeout(wheelGestureRef.current.resetTimer);
    };
  }, [navigate]);

  return null;
}
