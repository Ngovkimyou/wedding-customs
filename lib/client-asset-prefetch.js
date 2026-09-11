import { getAssetSource } from "./media.js";

const prefetchedSources = new Set();

/**
 * Warm image bytes after the user shows intent to open a record. These are
 * low-priority hints, so hovering across the collection cannot compete with
 * the page currently being read.
 */
export function prefetchImageSources(assets = []) {
  if (typeof document === "undefined") {
    return;
  }

  assets.forEach((asset) => {
    const source = getAssetSource(asset);

    if (!source || prefetchedSources.has(source)) {
      return;
    }

    prefetchedSources.add(source);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = source;
    link.setAttribute("fetchpriority", "low");
    link.dataset.archiveAssetPrefetch = "true";
    document.head.append(link);
  });
}

