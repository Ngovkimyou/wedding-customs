"use client";

import { useEffect, useRef, useState } from "react";
import champaFlower from "../assets/champa-flower.avif";
import chanFlower from "../assets/chan-flower.avif";
import chanFlowerBackdrop from "../assets/chan-flower-backdrop.avif";
import collectionFrame from "../assets/collection-frame.avif";
import coupleStamp from "../assets/couple-stamp.avif";
import densePetals from "../assets/dense-petals.avif";
import desktopSmallerPkaSlaGarland from "../assets/desktop-smaller-pka-sla-garland.avif";
import lightPetals from "../assets/light-petals.avif";
import headerFrame from "../assets/header-frame.avif";
import heroFrame from "../assets/hero-frame.avif";
import mobileBodyBg from "../assets/mobile-body-bg.avif";
import mobileHeroFrame from "../assets/mobile-hero-frame.avif";
import mobileOpeningBg from "../assets/mobile-opening-bg.avif";
import mobilePkaSlaGarland from "../assets/mobile-pka-sla-garland.avif";
import mobileSectionHeading from "../assets/mobile-section-heading.avif";
import musicPanelFrame from "../assets/music-panel-frame.avif";
import mediumPetals from "../assets/medium-petals.avif";
import onePetal from "../assets/one-petal.avif";
import openingBg from "../assets/opening-bg.jpg";
import pkaSla from "../assets/pka-sla.avif";
import pkaSlaGarland from "../assets/pka-sla-garland.avif";
import prosProng from "../assets/pros-prong.avif";
import sectionHeading from "../assets/section-heading-bg.avif";
import smallHeaderFrame from "../assets/small-header-frame.avif";
import tabletBodyBg from "../assets/tablet-body-bg.avif";
import tabletHeaderFrame from "../assets/medium-header-frame.avif";
import tabletOpeningBg from "../assets/tablet-opening-bg.avif";
import tabletPkaSlaGarland from "../assets/tablet-pka-sla-garland.avif";
import bodyBg from "../assets/body-bg.jpg";

const START_EVENT = "archive:loading-complete";
const REVEAL_FADE_DELAY = 950;
const PETAL_SEQUENCE_DURATION = 2300;

const PETAL_LAYERS = [
  ["light", lightPetals],
  ["medium", mediumPetals],
  ["dense", densePetals],
  ["hero", onePetal],
  ["tail", mediumPetals],
];

function assetSource(asset) {
  return typeof asset === "string" ? asset : asset.src;
}

function getVisualSources() {
  const width = window.innerWidth;
  const isMobile = width <= 640;
  const isTablet = width <= 960;
  const usesCompactDesktopGarland = width < 1500;
  let garland = pkaSlaGarland;

  if (isMobile) {
    garland = mobilePkaSlaGarland;
  } else if (isTablet) {
    garland = tabletPkaSlaGarland;
  } else if (usesCompactDesktopGarland) {
    garland = desktopSmallerPkaSlaGarland;
  }

  const sources = [
    champaFlower,
    chanFlower,
    chanFlowerBackdrop,
    collectionFrame,
    coupleStamp,
    densePetals,
    musicPanelFrame,
    mediumPetals,
    lightPetals,
    onePetal,
    pkaSla,
    prosProng,
    isMobile ? smallHeaderFrame : isTablet ? tabletHeaderFrame : headerFrame,
    isMobile ? mobileHeroFrame : heroFrame,
    isMobile ? mobileOpeningBg : isTablet ? tabletOpeningBg : openingBg,
    isMobile ? mobileBodyBg : isTablet ? tabletBodyBg : bodyBg,
    isMobile ? mobileSectionHeading : sectionHeading,
    garland,
  ];

  return Array.from(new Set(sources.map(assetSource)));
}

function loadImage(source) {
  return new Promise((resolve) => {
    const image = new window.Image();
    const finish = (loaded) => resolve(loaded);

    image.addEventListener("load", async () => {
      try {
        await image.decode();
      } catch {
        // The image is still usable when decoding is unavailable or interrupted.
      }
      finish(true);
    }, { once: true });
    image.addEventListener("error", () => finish(false), { once: true });
    image.decoding = "async";
    image.fetchPriority = "high";
    image.src = assetSource(source);
  });
}

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isPetalReveal, setIsPetalReveal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const revealTimersRef = useRef([]);

  useEffect(() => {
    const sources = getVisualSources();
    let completed = 0;
    let failed = false;
    let isActive = true;

    Promise.all(sources.map((source) => loadImage(source).then((loaded) => {
      if (!isActive) {
        return loaded;
      }

      completed += 1;
      failed ||= !loaded;
      const nextProgress = Math.round((completed / sources.length) * 100);
      // A failed required asset must never produce a false 100% ready state.
      setProgress(Math.min(failed ? 99 : 100, nextProgress));
      return loaded;
    }))).then((results) => {
      if (!isActive) {
        return;
      }

      // Only a completely successful preload can unlock the archive.
      const allLoaded = sources.length > 0
        && results.length === sources.length
        && results.every(Boolean);
      if (allLoaded) {
        setProgress(100);
        setIsReady(true);
      } else {
        setProgress(99);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => () => {
    revealTimersRef.current.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const blockedElements = [
      document.querySelector("[data-site-header]"),
      document.querySelector("main"),
    ].filter(Boolean);

    blockedElements.forEach((element) => {
      element.inert = true;
    });
    document.body.classList.add("loading-screen-open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      blockedElements.forEach((element) => {
        element.inert = false;
      });
      document.body.classList.remove("loading-screen-open");
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [isVisible]);

  const beginArchive = () => {
    if (!isReady || isExiting || isPetalReveal) {
      return;
    }

    window.dispatchEvent(new Event(START_EVENT));
    setIsPetalReveal(true);

    // Let the petals establish their flight before the black loading layer
    // begins to fade, so the reveal feels like one continuous transition.
    // The first layers establish the wind; the oversized camera-wipe starts
    // after its 0.8-second delay; the fade begins as it reaches the center.
    revealTimersRef.current = [
      window.setTimeout(() => setIsExiting(true), REVEAL_FADE_DELAY),
      window.setTimeout(() => setIsVisible(false), PETAL_SEQUENCE_DURATION),
    ];
  };

  const handleKeyDown = (event) => {
    if (isReady && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      beginArchive();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {isPetalReveal ? (
        <div className="loading-screen__petals" aria-hidden="true">
          {PETAL_LAYERS.map(([name, asset]) => (
            <img
              className={`loading-screen__petal loading-screen__petal--${name}`}
              src={asset.src}
              alt=""
              key={name}
            />
          ))}
        </div>
      ) : null}
      <div
        className={`loading-screen${isExiting ? " loading-screen--exiting" : ""}`}
        role={isReady ? "button" : "status"}
        tabIndex={isReady ? 0 : -1}
        aria-label={isReady ? "Start Khmer Wedding Tradition Archive" : "Loading archive"}
        aria-live="polite"
        onClick={beginArchive}
        onKeyDown={handleKeyDown}
      >
        <div className="loading-screen__content">
          <div
            className={`loading-screen__flower${isReady ? " loading-screen__flower--ready" : ""}`}
            aria-hidden="true"
          >
            <img className="loading-screen__flower-layer loading-screen__flower-layer--dim" src={champaFlower.src} alt="" />
            <img
              className="loading-screen__flower-layer loading-screen__flower-layer--color"
              src={champaFlower.src}
              alt=""
              style={{ "--flower-reveal": `${progress}%` }}
            />
          </div>
          <p className="loading-screen__status">{progress}%</p>
          {isReady ? <p className="loading-screen__prompt">Click to start</p> : null}
        </div>
      </div>
    </>
  );
}
