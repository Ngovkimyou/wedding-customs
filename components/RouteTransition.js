"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import petalWoosh from "../assets/sound-effects/petals-woosh-se.mp3";
import PetalReveal from "./PetalReveal.js";
import useSoundEffect from "./useSoundEffect.js";

const ABOUT_PATH = "/about";
const PAGE_FADE_DURATION = 520;
const ROUTE_SWAP_DELAY = 90;
const TRANSITION_DURATION = 2250;

export default function RouteTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const firstPath = useRef(true);
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

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(callback, delay);
    timers.current.push(timer);
  }, []);

  const startAboutTransition = useCallback(() => {
    if (transitioning.current) return;
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
        router.push(ABOUT_PATH);
      }, ROUTE_SWAP_DELAY);
    }, revealDelay);
    schedule(() => {
      document.body.classList.remove("about-route-transition", "about-route-transition--leaving", "about-route-transition--entering");
      transitioning.current = false;
      setActive(false);
    }, TRANSITION_DURATION);
  }, [clearTransitionTimers, playPetalWoosh, router, schedule]);

  useEffect(() => {
    const handleAboutClick = (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!anchor || event.defaultPrevented || event.button !== 0 || pathname === ABOUT_PATH || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname !== ABOUT_PATH) return;
      event.preventDefault();
      startAboutTransition();
    };
    document.addEventListener("click", handleAboutClick, true);
    return () => document.removeEventListener("click", handleAboutClick, true);
  }, [pathname, startAboutTransition]);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      previousPath.current = pathname;
      return undefined;
    }

    const fromPath = previousPath.current;
    const shouldAnimate = pathname === ABOUT_PATH && fromPath !== ABOUT_PATH;
    const pathChanged = fromPath !== pathname;
    previousPath.current = pathname;
    if (delayedNavigation.current) {
      delayedNavigation.current = false;
      return undefined;
    }
    if (!shouldAnimate) {
      clearTransitionTimers();
      document.body.classList.remove("about-route-transition", "about-route-transition--leaving", "about-route-transition--entering");
      transitioning.current = false;
      setActive(false);
      window.clearTimeout(pageFadeTimer.current);
      if (pathChanged) {
        document.body.classList.add("route-page-fade");
        pageFadeTimer.current = window.setTimeout(() => document.body.classList.remove("route-page-fade"), PAGE_FADE_DURATION);
      }
      return undefined;
    }

    clearTransitionTimers();
    window.clearTimeout(pageFadeTimer.current);
    document.body.classList.add("about-route-transition", "about-route-transition--entering");
    setActive(true);
    schedule(() => {
      document.body.classList.remove("about-route-transition", "about-route-transition--leaving", "about-route-transition--entering");
      transitioning.current = false;
      setActive(false);
    }, TRANSITION_DURATION);

    return undefined;
  }, [clearTransitionTimers, pathname, schedule]);

  useEffect(() => () => {
    clearTransitionTimers();
    window.clearTimeout(pageFadeTimer.current);
    document.body.classList.remove("about-route-transition", "about-route-transition--leaving", "about-route-transition--entering");
    document.body.classList.remove("route-page-fade");
    transitioning.current = false;
  }, [clearTransitionTimers]);

  if (!active) return null;

  return <PetalReveal className="route-transition__petals" />;
}
