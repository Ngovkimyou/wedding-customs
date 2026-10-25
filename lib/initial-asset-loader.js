import aboutBg from "../assets/about-bg.jpg";
import bodyBg from "../assets/body-bg.jpg";
import champaFlower from "../assets/champa-flower.avif";
import chanFlower from "../assets/chan-flower.avif";
import chanFlowerBackdrop from "../assets/chan-flower-backdrop.avif";
import collectionFrame from "../assets/collection-frame.avif";
import coupleStamp from "../assets/couple-stamp.avif";
import desktopSmallerPkaSlaGarland from "../assets/desktop-smaller-pka-sla-garland.avif";
import headerFrame from "../assets/header-frame.avif";
import heroFrame from "../assets/hero-frame.avif";
import logo from "../assets/logo.avif";
import mobileAboutBg from "../assets/mobile-about-bg.avif";
import mobileBodyBg from "../assets/mobile-body-bg.avif";
import mobileHeroFrame from "../assets/mobile-hero-frame.avif";
import mobileOpeningBg from "../assets/mobile-opening-bg.avif";
import mobilePkaSlaGarland from "../assets/mobile-pka-sla-garland.avif";
import mobileSectionHeading from "../assets/mobile-section-heading.avif";
import musicPanelFrame from "../assets/music-panel-frame.avif";
import openingBg from "../assets/opening-bg.jpg";
import pkaSla from "../assets/pka-sla.avif";
import pkaSlaGarland from "../assets/pka-sla-garland.avif";
import prosProng from "../assets/pros-prong.avif";
import searchBackground from "../assets/search-background.avif";
import sectionHeading from "../assets/section-heading-bg.avif";
import smallHeaderFrame from "../assets/small-header-frame.avif";
import tabletAboutBg from "../assets/tablet-about-bg.avif";
import tabletBodyBg from "../assets/tablet-body-bg.avif";
import tabletHeaderFrame from "../assets/medium-header-frame.avif";
import tabletOpeningBg from "../assets/tablet-opening-bg.avif";
import tabletPkaSlaGarland from "../assets/tablet-pka-sla-garland.avif";
import goBackIcon from "../assets/icons/go-back-icon.avif";
import thumbNailFrame from "../assets/thumb-nail-frame.avif";
import titleFrame from "../assets/title-frame.avif";
import aboutIcon from "../assets/icons/about-icon.avif";
import addContributionIcon from "../assets/add-contribution.avif";
import musicIcon from "../assets/icons/music-icon.avif";
import searchIcon from "../assets/icons/search-icon.avif";
import { PETAL_ASSETS } from "../data/petals.js";
import { getAssetSource } from "./media.js";

const ASSET_TIMEOUT = 15000;
const IMAGE_DECODE_TIMEOUT = 3000;
const REQUIRED_BACKGROUND_TARGETS = [
  [".opening-screen"],
  [".hero-frame", "::before"],
];
const OPTIONAL_BACKGROUND_TARGETS = [
  [".archive-record-page", "::before"],
  [".archive-entry__title-frame"],
  [".archive-entry__figure-frame"],
  [".archive-search", "::before"],
  [".about-page-shell", "::before"],
  [".section-heading"],
  [".archive-collection__body"],
];

function absoluteSource(source) {
  const assetSource = getAssetSource(source);

  try {
    return new URL(assetSource, window.location.href).href;
  } catch {
    return assetSource;
  }
}

function getVisualSources() {
  const width = window.innerWidth;
  const isMobile = width <= 640;
  const isTablet = width <= 960;
  let garland = pkaSlaGarland;

  if (isMobile) {
    garland = mobilePkaSlaGarland;
  } else if (isTablet) {
    garland = tabletPkaSlaGarland;
  } else if (width < 1500) {
    garland = desktopSmallerPkaSlaGarland;
  }

  const sources = [
    champaFlower,
    aboutIcon,
    addContributionIcon,
    chanFlower,
    chanFlowerBackdrop,
    collectionFrame,
    coupleStamp,
    goBackIcon,
    musicPanelFrame,
    musicIcon,
    searchIcon,
    thumbNailFrame,
    titleFrame,
    logo,
    ...PETAL_ASSETS,
    pkaSla,
    prosProng,
    isMobile ? smallHeaderFrame : isTablet ? tabletHeaderFrame : headerFrame,
    isMobile ? mobileHeroFrame : heroFrame,
    isMobile ? mobileOpeningBg : isTablet ? tabletOpeningBg : openingBg,
    isMobile ? mobileBodyBg : isTablet ? tabletBodyBg : bodyBg,
    isMobile ? mobileAboutBg : isTablet ? tabletAboutBg : aboutBg,
    isMobile ? mobileSectionHeading : sectionHeading,
    garland,
  ];

  if (window.location.pathname === "/search") {
    sources.push(searchBackground);
  }

  return sources.map(getAssetSource).filter(Boolean);
}

function extractCssImageSources(backgroundImage) {
  if (!backgroundImage || backgroundImage === "none") {
    return [];
  }

  return Array.from(backgroundImage.matchAll(/url\((?:["']?)([^)"']+)(?:["']?)\)/g))
    .map((match) => match[1])
    .filter(Boolean);
}

function getOptionalCssSources() {
  return getCssImageSources(OPTIONAL_BACKGROUND_TARGETS);
}

function getCssImageSources(targets) {
  return targets.flatMap(([selector, pseudoElement]) => (
    Array.from(document.querySelectorAll(selector)).flatMap((element) => {
      const styles = window.getComputedStyle(element, pseudoElement);
      return extractCssImageSources(styles.backgroundImage);
    })
  ));
}

function getRequiredImageSources() {
  return Array.from(new Set([
    champaFlower,
    ...getCssImageSources(REQUIRED_BACKGROUND_TARGETS),
  ].map(absoluteSource))).filter(Boolean);
}

function getOptionalImageSources(requiredSources) {
  return Array.from(new Set([
    ...getVisualSources(),
    ...getOptionalCssSources(),
  ].map(absoluteSource))).filter((source) => source && !requiredSources.has(source));
}

function createImageTasks(sources, signal, category) {
  return sources.map((source) => ({
    source,
    category,
    load: () => loadImage(source, signal),
  }));
}

function getSafeAssetPath(source) {
  try {
    const url = new URL(source, window.location.href);
    return url.origin === window.location.origin
      ? url.pathname
      : `${url.origin}${url.pathname}`;
  } catch {
    return String(source).split(/[?#]/u, 1)[0];
  }
}

function reportAssetFailure(task, error) {
  console.warn(`[archive preload] ${task.category} failed to load`, {
    asset: getSafeAssetPath(task.source),
    reason: error?.message || "The asset request did not complete.",
  });
}

function scheduleOptionalPreloads(tasks, signal) {
  if (tasks.length === 0 || signal?.aborted) {
    return;
  }

  const startPreloading = () => {
    if (signal?.aborted) {
      return;
    }

    void Promise.all(tasks.map(async (task) => {
      try {
        const loaded = await task.load();

        if (!loaded && !signal?.aborted) {
          reportAssetFailure(task);
        }
      } catch (error) {
        if (!signal?.aborted) {
          reportAssetFailure(task, error);
        }
      }
    }));
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(startPreloading, { timeout: 2500 });
  } else {
    window.setTimeout(startPreloading, 1000);
  }
}

function decodeImageBlob(blob, signal) {
  if (signal?.aborted) {
    return Promise.resolve(false);
  }

  if (typeof window.createImageBitmap !== "function") {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let hasSettled = false;

    const finish = (decoded) => {
      if (hasSettled) {
        return;
      }

      hasSettled = true;
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", handleAbort);
      resolve(decoded);
    };
    const handleAbort = () => finish(false);
    const timeoutId = window.setTimeout(() => finish(true), IMAGE_DECODE_TIMEOUT);

    signal?.addEventListener("abort", handleAbort, { once: true });
    window.createImageBitmap(blob)
      .then((decodedBitmap) => {
        decodedBitmap.close();
        finish(true);
      })
      // Fetching the bytes is still a successful preload on browsers whose
      // bitmap decoder does not support the source format.
      .catch(() => finish(true));
  });
}

function loadImage(source, signal) {
  if (signal?.aborted) {
    return Promise.resolve(false);
  }

  const controller = new AbortController();
  let timedOut = false;
  const abort = () => {
    timedOut = true;
    controller.abort();
  };
  const timeoutId = window.setTimeout(abort, ASSET_TIMEOUT);

  signal?.addEventListener("abort", abort, { once: true });

  return fetch(absoluteSource(source), {
    cache: "force-cache",
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Image request failed with ${response.status}`);
      }

      return response.blob();
    })
    .then((blob) => decodeImageBlob(blob, signal))
    .catch((error) => {
      if (timedOut) {
        throw new Error(`The request timed out after ${ASSET_TIMEOUT} ms.`);
      }

      throw error;
    })
    .finally(() => {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abort);
    });
}

export async function preloadInitialAssets({ signal, onProgress }) {
  const requiredSources = new Set(getRequiredImageSources());
  const requiredTasks = createImageTasks(
    Array.from(requiredSources),
    signal,
    "Required opening visual",
  );
  const optionalTasks = createImageTasks(
    getOptionalImageSources(requiredSources),
    signal,
    "Optional image",
  );
  let completed = 0;

  const results = await Promise.all(requiredTasks.map(async (task) => {
    let loaded = false;
    let error;

    try {
      loaded = await task.load();
      if (!loaded) {
        error = new Error("The asset request did not complete.");
      }
    } catch (loadError) {
      error = loadError;
      loaded = false;
    }

    if (!loaded && !signal?.aborted) {
      reportAssetFailure(task, error);
    }

    if (!signal?.aborted) {
      completed += 1;
      const nextProgress = Math.round((completed / requiredTasks.length) * 100);
      // The UI owns 100% and only reaches it after the opening visuals load.
      onProgress?.(Math.min(99, nextProgress));
    }

    return loaded;
  }));

  const allRequiredVisualsLoaded = (
    !signal?.aborted
    && results.length === requiredTasks.length
    && results.every(Boolean)
  );

  if (allRequiredVisualsLoaded) {
    scheduleOptionalPreloads(optionalTasks, signal);
  }

  return allRequiredVisualsLoaded;
}
