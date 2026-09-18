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
import musicIcon from "../assets/icons/music-icon.avif";
import searchIcon from "../assets/icons/search-icon.avif";
import { MUSIC_PLAYLISTS, getPageMusicMode } from "../data/music.js";
import { PETAL_ASSETS } from "../data/petals.js";
import { getAssetSource } from "./media.js";

const ASSET_TIMEOUT = 15000;
const IMAGE_DECODE_TIMEOUT = 3000;
const FONT_TIMEOUT = 8000;
const CRITICAL_BACKGROUND_TARGETS = [
  [".archive-record-page", "::before"],
  [".archive-entry__title-frame"],
  [".archive-entry__figure-frame"],
  [".archive-search", "::before"],
  [".about-page-shell", "::before"],
  [".opening-screen"],
  [".hero-frame", "::before"],
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

function getCriticalCssSources() {
  return CRITICAL_BACKGROUND_TARGETS.flatMap(([selector, pseudoElement]) => (
    Array.from(document.querySelectorAll(selector)).flatMap((element) => {
      const styles = window.getComputedStyle(element, pseudoElement);
      return extractCssImageSources(styles.backgroundImage);
    })
  ));
}

function getCriticalDomImages() {
  return Array.from(document.querySelectorAll('main img:not([loading="lazy"])'));
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
  const abort = () => controller.abort();
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
    .catch(() => false)
    .finally(() => {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abort);
    });
}

function loadDomImage(image, signal) {
  return new Promise((resolve) => {
    if (!image || signal?.aborted) {
      resolve(false);
      return;
    }

    let hasSettled = false;
    let timeoutId;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", handleAbort);
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
    };
    const finish = (loaded) => {
      if (hasSettled) {
        return;
      }

      hasSettled = true;
      cleanup();
      resolve(loaded);
    };
    const handleLoad = () => {
      const loaded = image.naturalWidth > 0;

      if (loaded && typeof image.decode === "function") {
        void image.decode().catch(() => {});
      }

      finish(loaded);
    };
    const handleError = () => finish(false);
    const handleAbort = () => finish(false);

    image.addEventListener("load", handleLoad, { once: true });
    image.addEventListener("error", handleError, { once: true });
    signal?.addEventListener("abort", handleAbort, { once: true });
    timeoutId = window.setTimeout(() => finish(false), ASSET_TIMEOUT);

    if (image.complete && image.naturalWidth > 0) {
      handleLoad();
    } else if (image.complete) {
      const retrySource = image.currentSrc || image.src;

      if (retrySource) {
        image.src = retrySource;
      } else {
        finish(false);
      }
    }
  });
}

function hasAudioSource(audio, source) {
  const sourceUrl = new URL(source, window.location.href).href;
  return audio.src === sourceUrl || audio.currentSrc === sourceUrl;
}

function loadAudio(source, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }

    const sharedAudio = document.querySelector("[data-music-audio]");
    const audio = sharedAudio && hasAudioSource(sharedAudio, source)
      ? sharedAudio
      : new Audio();
    const isSharedAudio = audio === sharedAudio;
    let hasSettled = false;
    let timeoutId;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", handleAbort);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
    const finish = (loaded) => {
      if (hasSettled) {
        return;
      }

      hasSettled = true;
      cleanup();
      // A hidden loading screen can still preload the current page's track
      // after the music player has resumed from session state. Never pause
      // that shared player while merely checking that its source is ready.
      if (!isSharedAudio || audio.paused) {
        audio.pause();
      }
      resolve(loaded);
    };
    const handleCanPlay = () => finish(true);
    const handleError = () => finish(false);
    const handleAbort = () => finish(false);

    audio.addEventListener("canplay", handleCanPlay, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    signal?.addEventListener("abort", handleAbort, { once: true });
    audio.preload = "auto";
    timeoutId = window.setTimeout(() => finish(false), ASSET_TIMEOUT);

    if (!hasAudioSource(audio, source)) {
      audio.src = source;
      audio.load();
    } else if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      finish(true);
    } else if (
      audio.networkState === HTMLMediaElement.NETWORK_EMPTY
      || audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
      || audio.error
    ) {
      audio.load();
    }
  });
}

function loadFonts(signal) {
  if (signal?.aborted) {
    return Promise.resolve(false);
  }

  if (!document.fonts?.ready) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let hasSettled = false;

    const finish = (loaded) => {
      if (hasSettled) {
        return;
      }

      hasSettled = true;
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", handleAbort);
      resolve(loaded);
    };
    const handleAbort = () => finish(false);
    const timeoutId = window.setTimeout(() => finish(false), FONT_TIMEOUT);

    signal?.addEventListener("abort", handleAbort, { once: true });
    document.fonts.ready.then(() => finish(true)).catch(() => finish(false));
  });
}

function getRequiredAudioSources() {
  const mode = getPageMusicMode(window.location.pathname);
  const firstTrack = MUSIC_PLAYLISTS[mode]?.[0];
  return firstTrack ? [firstTrack.source] : [];
}

function createLoadTasks(signal) {
  const domImages = getCriticalDomImages();
  const domImageSources = new Set(
    domImages
      .map((image) => absoluteSource(image.currentSrc || image.src))
      .filter(Boolean),
  );
  const visualSources = Array.from(new Set([
    ...getVisualSources(),
    ...getCriticalCssSources(),
  ].map(absoluteSource))).filter((source) => !domImageSources.has(source));

  return [
    ...getRequiredAudioSources().map((source) => () => loadAudio(source, signal)),
    ...visualSources.map((source) => () => loadImage(source, signal)),
    ...domImages.map((image) => () => loadDomImage(image, signal)),
    () => loadFonts(signal),
  ];
}

export async function preloadInitialAssets({ signal, onProgress }) {
  const tasks = createLoadTasks(signal);
  let completed = 0;

  const results = await Promise.all(tasks.map(async (loadAsset) => {
    let loaded = false;

    try {
      loaded = await loadAsset();
    } catch {
      loaded = false;
    }

    if (!signal?.aborted) {
      completed += 1;
      const nextProgress = Math.round((completed / tasks.length) * 100);
      // The UI owns 100%: it sets progress and readiness together only after
      // every task has been verified successfully.
      onProgress?.(Math.min(99, nextProgress));
    }

    return loaded;
  }));

  return !signal?.aborted && results.length === tasks.length && results.every(Boolean);
}
