"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import champaFlower from "../assets/champa-flower.avif";
import petalWoosh from "../assets/sound-effects/petals-woosh-se.mp3";
import { ARCHIVE_READY_EVENT } from "../lib/client-navigation.js";
import { preloadInitialAssets } from "../lib/initial-asset-loader.js";
import { isAuthPath } from "../lib/auth-routes.mjs";
import PetalReveal from "./PetalReveal.js";
import useSoundEffect from "./useSoundEffect.js";

const REVEAL_FADE_DELAY = 950;
const PETAL_SEQUENCE_DURATION = 1800;
const BLOCKED_PAGE_SELECTORS = ["[data-site-header]", "main"];

function getBlockedPageElements() {
  return BLOCKED_PAGE_SELECTORS
    .map((selector) => document.querySelector(selector))
    .filter(Boolean);
}

function setPageElementsInert(elements, isInert) {
  elements.forEach((element) => {
    element.inert = isInert;
  });
}

export default function LoadingScreen() {
  const pathname = usePathname();
  const isAuthRoute = isAuthPath(pathname);
  const previousPathnameRef = useRef(pathname);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isRevealActive, setIsRevealActive] = useState(false);
  // The loading gate belongs to the home experience. Auth pages stay usable
  // while assets prepare in the background, and a successful auth redirect to
  // the home route starts the gate exactly once for that transition.
  const [isVisible, setIsVisible] = useState(() => !isAuthRoute && pathname === "/");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const revealTimersRef = useRef([]);
  const playPetalWoosh = useSoundEffect(petalWoosh);

  useEffect(() => {
    const controller = new AbortController();

    setProgress(0);
    setIsReady(false);
    setLoadError(false);

    void preloadInitialAssets({
      signal: controller.signal,
      onProgress: setProgress,
    }).then((allLoaded) => {
      if (controller.signal.aborted) {
        return;
      }

      if (allLoaded) {
        setProgress(100);
        setIsReady(true);
      } else {
        setProgress(99);
        setLoadError(true);
      }
    }).catch(() => {
      if (!controller.signal.aborted) {
        setProgress(99);
        setLoadError(true);
      }
    });

    return () => controller.abort();
  }, [loadAttempt]);

  useEffect(() => () => {
    revealTimersRef.current.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    const isInitialRoute = previousPathname === pathname;
    const enteredHomeFromAuth = pathname === "/" && isAuthPath(previousPathname);

    previousPathnameRef.current = pathname;
    revealTimersRef.current.forEach(window.clearTimeout);
    revealTimersRef.current = [];
    setIsRevealActive(false);
    setIsExiting(false);
    setIsVisible(pathname === "/" && (isInitialRoute || enteredHomeFromAuth));
  }, [pathname]);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const scrollY = window.scrollY;
    const root = document.documentElement;
    const body = document.body;
    const blockedElements = getBlockedPageElements();
    const previousStyles = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      rootOverflow: root.style.overflow,
    };

    setPageElementsInert(blockedElements, true);
    body.classList.add("loading-screen-open");
    root.classList.add("loading-screen-open");
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    root.style.overflow = "hidden";

    const preventScroll = (event) => event.preventDefault();
    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("wheel", preventScroll);
      setPageElementsInert(blockedElements, false);
      body.classList.remove("loading-screen-open");
      root.classList.remove("loading-screen-open");
      body.style.overflow = previousStyles.bodyOverflow;
      body.style.position = previousStyles.bodyPosition;
      body.style.top = previousStyles.bodyTop;
      body.style.width = previousStyles.bodyWidth;
      root.style.overflow = previousStyles.rootOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && isExiting) {
      // Once the opaque layer stops accepting input, let the first interaction
      // with the revealed page pass through while its scroll position stays locked.
      setPageElementsInert(getBlockedPageElements(), false);
    }
  }, [isExiting, isVisible]);

  const beginArchive = () => {
    if (!isReady || isExiting || isRevealActive) {
      return;
    }

    playPetalWoosh();
    window.dispatchEvent(new Event(ARCHIVE_READY_EVENT));
    setIsRevealActive(true);
    revealTimersRef.current = [
      window.setTimeout(() => setIsExiting(true), REVEAL_FADE_DELAY),
      window.setTimeout(() => setIsVisible(false), PETAL_SEQUENCE_DURATION),
    ];
  };

  const retryLoading = () => {
    if (!isExiting && !isRevealActive) {
      setLoadAttempt((attempt) => attempt + 1);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      beginArchive();
    }
  };

  if (!isVisible) {
    return null;
  }

  const isLoading = !isReady && !loadError;

  return (
    <>
      <PetalReveal
        className={`loading-screen__petals${isRevealActive ? " loading-screen__petals--active" : ""}`}
      />
      <div
        className={`loading-screen${isExiting ? " loading-screen--exiting" : ""}`}
        role={isReady ? "button" : isLoading ? "progressbar" : "status"}
        tabIndex={isReady ? 0 : -1}
        aria-label={isReady
          ? "Start Khmer Wedding Tradition Archive"
          : loadError
            ? "Archive assets could not be loaded"
            : "Loading archive"}
        aria-valuemin={isLoading ? 0 : undefined}
        aria-valuemax={isLoading ? 100 : undefined}
        aria-valuenow={isLoading ? progress : undefined}
        aria-live="polite"
        onClick={isReady ? beginArchive : undefined}
        onKeyDown={isReady ? handleKeyDown : undefined}
      >
        <div className="loading-screen__content">
          <div
            className={`loading-screen__flower${isReady ? " loading-screen__flower--ready" : ""}`}
            aria-hidden="true"
          >
            <img
              className="loading-screen__flower-layer loading-screen__flower-layer--dim"
              src={champaFlower.src}
              alt=""
              draggable={false}
            />
            <img
              className="loading-screen__flower-layer loading-screen__flower-layer--color"
              src={champaFlower.src}
              alt=""
              draggable={false}
              style={{ "--flower-reveal": `${progress}%` }}
            />
          </div>
          <p className="loading-screen__status">{progress}%</p>
          {isReady ? <p className="loading-screen__prompt">Click to start</p> : null}
          {loadError ? (
            <div className="loading-screen__error" role="alert">
              <span>Some archive assets could not be loaded.</span>
              <button type="button" onClick={retryLoading}>Try again</button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
