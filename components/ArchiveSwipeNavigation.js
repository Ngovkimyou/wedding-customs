"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  WHEEL_SWIPE_THRESHOLD,
  clampSwipeOffset,
  getSwipeDirection,
  hasHorizontalWheelIntent,
  isHorizontalSwipe,
  shouldCommitTouchSwipe,
} from "../lib/archive-swipe.mjs";
import { prefetchRoute } from "../lib/client-navigation.js";

// A deliberate swipe should cover enough distance to avoid accidental
// navigation while the reader is simply scrolling. The visual drag itself
// remains one-to-one with the pointer; this threshold only decides whether
// the gesture commits to another record.
const WHEEL_RESET_DELAY = 140;
const NAVIGATION_LOCK_TIMEOUT = 1200;
// Covers the exit/enter motion plus trackpad inertia so one physical gesture
// can never be interpreted as multiple record changes.
const NAVIGATION_COOLDOWN = 1300;
const SWIPE_RETURN_DURATION = 460;
// Start resolving the next record a little earlier so there is less empty
// space between records while the 460/500ms transforms remain unhurried.
const SWIPE_ROUTE_PUSH_DELAY = 150;
const SWIPE_ENTER_DURATION = 500;
const SWIPE_TRANSITION_CLEANUP_DELAY = 1700;
const DESKTOP_QUERY = "(min-width: 60.0625rem) and (pointer: fine)";
const INTERACTIVE_TARGET = "a, button, input, textarea, select, summary, [contenteditable=\"true\"], [role=\"button\"]";
const SWIPE_BODY_CLASSES = [
  "archive-swipe-transition",
  "archive-swipe-transition--next",
  "archive-swipe-transition--previous",
];

function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_TARGET));
}

function getArchiveEntryElement() {
  return document.querySelector(".archive-record-page > .archive-entry");
}

function removeSwipeBodyClasses() {
  document.body.classList.remove(...SWIPE_BODY_CLASSES);
}

function getGlobalNavigationCooldown() {
  return Number(document.body.dataset.archiveSwipeCooldownUntil) || 0;
}

function setGlobalNavigationCooldown() {
  const cooldownUntil = Date.now() + NAVIGATION_COOLDOWN;
  document.body.dataset.archiveSwipeCooldownUntil = String(cooldownUntil);
  return cooldownUntil;
}

function resetDocumentScrollImmediately() {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previousScrollBehavior;
}

export default function ArchiveSwipeNavigation({ previousSlug, nextSlug }) {
  const pathname = usePathname();
  const router = useRouter();
  const touchGestureRef = useRef(null);
  const wheelGestureRef = useRef({ deltaX: 0, resetTimer: null });
  const navigationLockedRef = useRef(false);
  const navigationCooldownRef = useRef(0);
  const navigationResetTimerRef = useRef(null);
  const routePushTimerRef = useRef(null);
  const swipeReturnTimerRef = useRef(null);
  const swipeBodyCleanupTimerRef = useRef(null);

  const clearSwipeVisualImmediately = useCallback(() => {
    const entry = getArchiveEntryElement();
    if (!entry) {
      return;
    }

    window.clearTimeout(swipeReturnTimerRef.current);
    entry.classList.remove(
      "archive-entry--swipe-dragging",
      "archive-entry--swipe-returning",
      "archive-entry--swipe-exiting",
      "archive-entry--swipe-settled",
    );
    entry.style.removeProperty("--archive-swipe-offset");
  }, []);

  const resetSwipeVisual = useCallback(() => {
    const entry = getArchiveEntryElement();
    if (!entry) {
      return;
    }

    window.clearTimeout(swipeReturnTimerRef.current);
    // Keep the dragging transform in place while the returning transition is
    // enabled. This gives the browser a real start value instead of briefly
    // dropping to `transform: none` between the two classes.
    entry.classList.remove("archive-entry--swipe-exiting");
    entry.classList.remove("archive-entry--swipe-settled");
    entry.classList.add("archive-entry--swipe-returning");
    entry.style.setProperty("--archive-swipe-offset", "0px");
    entry.classList.remove("archive-entry--swipe-dragging");

    swipeReturnTimerRef.current = window.setTimeout(() => {
      swipeReturnTimerRef.current = null;
      if (!entry.isConnected) {
        return;
      }

      entry.classList.remove("archive-entry--swipe-returning");
      entry.style.removeProperty("--archive-swipe-offset");
    }, SWIPE_RETURN_DURATION);
  }, []);

  const updateSwipeVisual = useCallback((offset) => {
    const entry = getArchiveEntryElement();
    if (!entry) {
      return;
    }

    window.clearTimeout(swipeReturnTimerRef.current);
    entry.classList.remove("archive-entry--swipe-settled");
    entry.classList.remove("archive-entry--swipe-returning", "archive-entry--swipe-exiting");
    entry.classList.add("archive-entry--swipe-dragging");
    entry.style.setProperty("--archive-swipe-offset", `${offset}px`);
  }, []);

  const navigate = useCallback((direction) => {
    const now = Date.now();
    if (
      navigationLockedRef.current
      || now < navigationCooldownRef.current
      || now < getGlobalNavigationCooldown()
    ) {
      return;
    }

    const destinationSlug = direction === "next" ? nextSlug : previousSlug;
    if (!destinationSlug) {
      resetSwipeVisual();
      return;
    }

    const href = `/archive/${destinationSlug}`;
    navigationLockedRef.current = true;
    navigationCooldownRef.current = setGlobalNavigationCooldown();
    prefetchRoute(router, href);

    // A prior rejected gesture may still have a snap-back timer. Clear it
    // before routing so it cannot find the newly mounted card and nudge it
    // after the incoming animation has started.
    window.clearTimeout(swipeReturnTimerRef.current);
    swipeReturnTimerRef.current = null;
    window.clearTimeout(navigationResetTimerRef.current);
    window.clearTimeout(routePushTimerRef.current);
    window.clearTimeout(swipeBodyCleanupTimerRef.current);
    navigationResetTimerRef.current = window.setTimeout(() => {
      navigationLockedRef.current = false;
    }, NAVIGATION_LOCK_TIMEOUT);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      clearSwipeVisualImmediately();
      resetDocumentScrollImmediately();
      router.push(href, { scroll: false });
      return;
    }

    const entry = getArchiveEntryElement();
    if (!entry) {
      router.push(href, { scroll: false });
      return;
    }

    const exitOffset = direction === "next" ? "-100vw" : "100vw";
    entry.classList.remove("archive-entry--swipe-settled");
    entry.classList.remove("archive-entry--swipe-dragging", "archive-entry--swipe-returning");
    entry.classList.add("archive-entry--swipe-exiting");
    entry.style.setProperty("--archive-swipe-offset", exitOffset);

    routePushTimerRef.current = window.setTimeout(() => {
      routePushTimerRef.current = null;
      document.body.classList.add(
        "archive-swipe-transition",
        `archive-swipe-transition--${direction}`,
      );
      router.push(href, { scroll: false });

      // The pathname effect removes this sooner when the new record mounts;
      // this timeout is a fallback for a slow or interrupted route update.
      swipeBodyCleanupTimerRef.current = window.setTimeout(
        removeSwipeBodyClasses,
        SWIPE_TRANSITION_CLEANUP_DELAY,
      );
    }, SWIPE_ROUTE_PUSH_DELAY);
  }, [clearSwipeVisualImmediately, nextSlug, previousSlug, resetSwipeVisual, router]);

  useLayoutEffect(() => {
    navigationLockedRef.current = false;
    wheelGestureRef.current.deltaX = 0;
    window.clearTimeout(wheelGestureRef.current.resetTimer);
    window.clearTimeout(swipeReturnTimerRef.current);
    swipeReturnTimerRef.current = null;
    window.clearTimeout(swipeBodyCleanupTimerRef.current);
    swipeBodyCleanupTimerRef.current = null;

    if (!document.body.classList.contains("archive-swipe-transition")) {
      return undefined;
    }

    // Next is asked not to perform its own scroll reset for swipe routes. Do
    // this before paint so the incoming card does not drift vertically while
    // its horizontal entrance animation is running.
    resetDocumentScrollImmediately();

    const entry = getArchiveEntryElement();
    const direction = document.body.classList.contains("archive-swipe-transition--next")
      ? "next"
      : document.body.classList.contains("archive-swipe-transition--previous")
        ? "previous"
        : null;
    const expectedAnimation = direction === "next"
      ? "archive-entry-swipe-in-from-right"
      : direction === "previous"
        ? "archive-entry-swipe-in-from-left"
        : null;
    let cleanupTimer;
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) {
        return;
      }

      cleanedUp = true;
      window.clearTimeout(cleanupTimer);
      if (entry && !entry.classList.contains("archive-entry--loading")) {
        entry.classList.remove(
          "archive-entry--swipe-dragging",
          "archive-entry--swipe-returning",
          "archive-entry--swipe-exiting",
        );
        entry.style.removeProperty("--archive-swipe-offset");
        entry.classList.add("archive-entry--swipe-settled");
      }
      removeSwipeBodyClasses();
    };

    const handleAnimationEnd = (event) => {
      if (event.target === entry && event.animationName === expectedAnimation) {
        cleanup();
      }
    };

    if (entry && !entry.classList.contains("archive-entry--loading") && expectedAnimation) {
      entry.addEventListener("animationend", handleAnimationEnd);
      cleanupTimer = window.setTimeout(cleanup, SWIPE_ENTER_DURATION + 260);
    } else {
      // Keep the class available for a slow RSC response. The loading shell
      // must not consume the incoming-record animation before the real entry
      // is mounted.
      cleanupTimer = window.setTimeout(cleanup, SWIPE_TRANSITION_CLEANUP_DELAY);
    }

    return () => {
      window.clearTimeout(cleanupTimer);
      entry?.removeEventListener("animationend", handleAnimationEnd);
    };
  }, [pathname]);

  useEffect(() => () => {
    window.clearTimeout(navigationResetTimerRef.current);
    window.clearTimeout(routePushTimerRef.current);
    window.clearTimeout(wheelGestureRef.current.resetTimer);
    window.clearTimeout(swipeReturnTimerRef.current);
    window.clearTimeout(swipeBodyCleanupTimerRef.current);
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
      if (
        event.touches.length !== 1
        || isInteractiveTarget(event.target)
        || Date.now() < navigationCooldownRef.current
        || Date.now() < getGlobalNavigationCooldown()
      ) {
        resetTouchGesture();
        return;
      }

      const [touch] = event.touches;
      touchGestureRef.current = {
        identifier: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: performance.now(),
        horizontal: false,
      };
    };

    const handleTouchMove = (event) => {
      const gesture = touchGestureRef.current;
      if (!gesture) {
        return;
      }

      if (event.touches.length !== 1) {
        resetTouchGesture();
        resetSwipeVisual();
        return;
      }

      const [touch] = event.touches;
      gesture.currentX = touch.clientX;
      gesture.currentY = touch.clientY;
      const deltaX = gesture.currentX - gesture.startX;
      const deltaY = gesture.currentY - gesture.startY;

      if (isHorizontalSwipe(deltaX, deltaY)) {
        gesture.horizontal = true;
        updateSwipeVisual(clampSwipeOffset(deltaX, window.innerWidth));

        if (event.cancelable) {
          event.preventDefault();
        }
      }
    };

    const handleTouchEnd = (event) => {
      const gesture = touchGestureRef.current;
      resetTouchGesture();

      if (!gesture || event.touches.length > 0) {
        if (gesture?.horizontal) {
          resetSwipeVisual();
        }
        return;
      }

      const touch = Array.from(event.changedTouches).find(
        (candidate) => candidate.identifier === gesture.identifier,
      ) ?? event.changedTouches[0];
      const deltaX = (touch?.clientX ?? gesture.currentX) - gesture.startX;
      const deltaY = (touch?.clientY ?? gesture.currentY) - gesture.startY;
      const elapsed = Math.max(performance.now() - gesture.startTime, 1);

      if (!shouldCommitTouchSwipe(deltaX, deltaY, elapsed)) {
        resetSwipeVisual();
        return;
      }

      navigate(getSwipeDirection(deltaX));
    };

    const handleWheel = (event) => {
      if (
        !window.matchMedia(DESKTOP_QUERY).matches
        || event.ctrlKey
        || event.shiftKey
        || isInteractiveTarget(event.target)
        || navigationLockedRef.current
        || Date.now() < navigationCooldownRef.current
        || Date.now() < getGlobalNavigationCooldown()
      ) {
        return;
      }

      const deltaX = Number(event.deltaX) || 0;
      const deltaY = Number(event.deltaY) || 0;
      if (!hasHorizontalWheelIntent(deltaX, deltaY)) {
        return;
      }

      const wheelGesture = wheelGestureRef.current;
      // Wheel delta follows the content scroll direction, opposite to the
      // direction a user's fingers travel on a natural-scrolling trackpad.
      // Convert it to finger travel so both input paths share one mapping:
      // left = next, right = previous. The same normalized value drives the
      // card transform, keeping the card under the gesture.
      const fingerDeltaX = -deltaX;
      wheelGesture.deltaX += fingerDeltaX;
      const direction = getSwipeDirection(wheelGesture.deltaX);
      updateSwipeVisual(clampSwipeOffset(wheelGesture.deltaX, window.innerWidth));

      if (event.cancelable) {
        event.preventDefault();
      }

      window.clearTimeout(wheelGesture.resetTimer);
      wheelGesture.resetTimer = window.setTimeout(() => {
        const accumulatedDelta = wheelGesture.deltaX;
        wheelGesture.deltaX = 0;
        if (Math.abs(accumulatedDelta) < WHEEL_SWIPE_THRESHOLD) {
          resetSwipeVisual();
        }
      }, WHEEL_RESET_DELAY);

      if (Math.abs(wheelGesture.deltaX) < WHEEL_SWIPE_THRESHOLD) {
        return;
      }

      wheelGesture.deltaX = 0;
      window.clearTimeout(wheelGesture.resetTimer);
      navigate(direction);
    };

    const handleTouchCancel = () => {
      resetTouchGesture();
      resetSwipeVisual();
    };

    page.addEventListener("touchstart", handleTouchStart, { passive: true });
    page.addEventListener("touchmove", handleTouchMove, { passive: false });
    page.addEventListener("touchend", handleTouchEnd, { passive: true });
    page.addEventListener("touchcancel", handleTouchCancel, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      page.removeEventListener("touchstart", handleTouchStart);
      page.removeEventListener("touchmove", handleTouchMove);
      page.removeEventListener("touchend", handleTouchEnd);
      page.removeEventListener("touchcancel", handleTouchCancel);
      window.removeEventListener("wheel", handleWheel);
      resetTouchGesture();
      window.clearTimeout(wheelGestureRef.current.resetTimer);
    };
  }, [navigate, nextSlug, previousSlug, resetSwipeVisual, updateSwipeVisual]);

  return null;
}
