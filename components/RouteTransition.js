"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import petalWoosh from "../assets/sound-effects/petals-woosh-se.mp3";
import PetalReveal from "./PetalReveal.js";
import useSoundEffect from "./useSoundEffect.js";

const ABOUT_PATH = "/about";
const PAGE_FADE_DURATION = 760;
const ROUTE_SWAP_DELAY = 90;
const TRANSITION_DURATION = 2250;
const ABOUT_CLASSES = [
  "about-route-transition",
  "about-route-transition--leaving",
  "about-route-transition--entering",
];

export default function RouteTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const previousPath = useRef(pathname);
  const delayedNavigation = useRef(false);
  const transitioning = useRef(false);
  const timers = useRef([]);
  const pageFadeTimer = useRef(null);
  const [active, setActive] = useState(false);
  const playPetalWoosh = useSoundEffect(petalWoosh);

  const clearTransitionTimers = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);

  const clearPageFade = useCallback(() => {
    window.clearTimeout(pageFadeTimer.current);
    document.body.classList.remove("route-page-fade");
    document.body.style.removeProperty("--route-page-fade-duration");
  }, []);

  const schedule = useCallback((callback, delay) => {
    timers.current.push(window.setTimeout(callback, delay));
  }, []);

  const finishAboutTransition = useCallback(() => {
    clearTransitionTimers();
    document.body.classList.remove(...ABOUT_CLASSES);
    transitioning.current = false;
    delayedNavigation.current = false;
    setActive(false);
  }, [clearTransitionTimers]);

  const startAboutTransition = useCallback((href) => {
    if (transitioning.current) return;
    clearPageFade();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }

    transitioning.current = true;
    clearTransitionTimers();
    document.body.classList.add("about-route-transition");
    playPetalWoosh();
    setActive(true);
    const revealDelay = window.matchMedia("(max-width: 40rem)").matches ? 700 : 850;
    schedule(() => {
      document.body.classList.add("about-route-transition--leaving");
      schedule(() => {
        document.body.classList.remove("about-route-transition--leaving");
        document.body.classList.add("about-route-transition--entering");
        delayedNavigation.current = true;
        router.push(href);
      }, ROUTE_SWAP_DELAY);
    }, revealDelay);
    schedule(finishAboutTransition, TRANSITION_DURATION);
  }, [clearPageFade, clearTransitionTimers, finishAboutTransition, playPetalWoosh, router, schedule]);

  useEffect(() => {
    const handleAboutClick = (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (
        !anchor || event.defaultPrevented || event.button !== 0 || pathname === ABOUT_PATH
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
        || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")
      ) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname !== ABOUT_PATH) return;
      event.preventDefault();
      startAboutTransition(destination.pathname + destination.search + destination.hash);
    };

    document.addEventListener("click", handleAboutClick, true);
    return () => document.removeEventListener("click", handleAboutClick, true);
  }, [pathname, startAboutTransition]);

  // Run before paint, so a freshly committed page cannot flash ahead of its fade.
  useLayoutEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    clearPageFade();

    if (pathname === ABOUT_PATH && delayedNavigation.current) {
      delayedNavigation.current = false;
      return;
    }

    finishAboutTransition();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (pathname === ABOUT_PATH) {
      // Also cover client navigation that did not originate from an About link.
      document.body.classList.add("about-route-transition", "about-route-transition--entering");
      transitioning.current = true;
      setActive(true);
      schedule(finishAboutTransition, TRANSITION_DURATION);
      return;
    }

    // Flush removal of the previous animation before starting another quick navigation.
    const main = document.querySelector("main");
    if (main) void window.getComputedStyle(main).opacity;
    document.body.style.setProperty("--route-page-fade-duration", `${PAGE_FADE_DURATION}ms`);
    document.body.classList.add("route-page-fade");
    pageFadeTimer.current = window.setTimeout(clearPageFade, PAGE_FADE_DURATION);
  }, [clearPageFade, finishAboutTransition, pathname, schedule]);

  useEffect(() => () => {
    clearTransitionTimers();
    clearPageFade();
    document.body.classList.remove(...ABOUT_CLASSES);
    transitioning.current = false;
    delayedNavigation.current = false;
  }, [clearPageFade, clearTransitionTimers]);

  return active ? <PetalReveal className="route-transition__petals" /> : null;
}
