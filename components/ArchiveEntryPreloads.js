import { getImageProps } from "next/image";
import { preload } from "react-dom";
import asideArtwork from "../assets/aside-01.avif";
import archive01Background from "../assets/archive-01-bg.avif";
import archive03Background from "../assets/archive-03-bg.avif";
import archive05Background from "../assets/archive-05-bg.avif";
import archive07Background from "../assets/archive-07-bg.avif";
import bodyBackground from "../assets/body-bg.jpg";
import chanFlower from "../assets/chan-flower.avif";
import goBackIcon from "../assets/icons/go-back-icon.avif";
import mobileBodyBackground from "../assets/mobile-body-bg.avif";
import tabletBodyBackground from "../assets/tablet-body-bg.avif";
import thumbNailFrame from "../assets/thumb-nail-frame.avif";
import titleFrame from "../assets/title-frame.avif";
import { collectArchiveImageAssets } from "../lib/archive-assets.js";
import { getAssetSource, getImageDimensions } from "../lib/media.js";

const DESKTOP_QUERY = "(min-width: 60.0625rem)";
const TABLET_QUERY = "(min-width: 40.0625rem) and (max-width: 60rem)";
const MOBILE_QUERY = "(max-width: 40rem)";
const ENTRY_IMAGE_SIZES = "(max-width: 40rem) 100vw, 48rem";

const DESKTOP_BACKGROUNDS = {
  "how-my-parents-met": archive01Background,
  "courtship-and-family-involvement": archive01Background,
  "engagement-traditions": archive03Background,
  "wedding-preparation": archive03Background,
  "traditional-khmer-wedding-ceremonies": archive05Background,
  "wedding-ceremonies-afternoon": archive05Background,
  "ceremonial-objects": archive07Background,
  food: archive07Background,
};

function preloadSource(asset, options = {}) {
  const source = getAssetSource(asset);

  if (source) {
    preload(source, { as: "image", ...options });
  }
}

function preloadOptimizedImage(asset, { fetchPriority = "low" } = {}) {
  const source = getAssetSource(asset);

  if (!source) {
    return;
  }

  const dimensions = getImageDimensions(asset, 1600, 1000);
  const { props } = getImageProps({
    src: asset,
    alt: "",
    width: dimensions.width,
    height: dimensions.height,
    sizes: ENTRY_IMAGE_SIZES,
  });

  if (!props.src) {
    return;
  }

  preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    fetchPriority,
  });
}

function preloadBackgroundVariants(slug) {
  preloadSource(DESKTOP_BACKGROUNDS[slug] || bodyBackground, {
    fetchPriority: "high",
    media: DESKTOP_QUERY,
  });
  preloadSource(tabletBodyBackground, {
    fetchPriority: "high",
    media: TABLET_QUERY,
  });
  preloadSource(mobileBodyBackground, {
    fetchPriority: "high",
    media: MOBILE_QUERY,
  });
}

export default function ArchiveEntryPreloads({ entry }) {
  preloadBackgroundVariants(entry.slug);

  // These are CSS artwork layers. Preloading their source keeps the title,
  // frame and decorative divider present while the rest of the record mounts.
  [titleFrame, thumbNailFrame, chanFlower, goBackIcon].forEach((asset) => {
    preloadSource(asset, { fetchPriority: "high" });
  });

  if (entry.showAside && entry.showAsideArtwork !== false) {
    preloadOptimizedImage(asideArtwork, { fetchPriority: "low" });
  }

  const leadSource = getAssetSource(entry.images?.[0]?.src);
  const seenSources = new Set([leadSource].filter(Boolean));

  collectArchiveImageAssets(entry).forEach((asset) => {
    const source = getAssetSource(asset);

    if (!source || seenSources.has(source)) {
      return;
    }

    seenSources.add(source);
    preloadOptimizedImage(asset, {
      fetchPriority: source === leadSource ? "high" : "low",
    });
  });

  return null;
}
