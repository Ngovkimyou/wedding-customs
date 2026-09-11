import { getAssetSource } from "./media.js";

function addAsset(value, assets) {
  const source = getAssetSource(value);

  if (!source || assets.has(source)) {
    return;
  }

  assets.set(source, value);
}

/**
 * Collect imported image assets from an archive record without coupling the
 * data model to a particular description shape. Image descriptors use a
 * `src` property; imported Next image objects expose `src` directly.
 */
export function collectArchiveImageAssets(value) {
  const assets = new Map();
  const visited = new Set();

  const visit = (candidate) => {
    if (!candidate || typeof candidate !== "object" || visited.has(candidate)) {
      return;
    }

    visited.add(candidate);

    if (typeof candidate.src === "string") {
      addAsset(candidate, assets);
      return;
    }

    if (candidate.src) {
      addAsset(candidate.src, assets);
      return;
    }

    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }

    Object.values(candidate).forEach(visit);
  };

  visit(value);
  return Array.from(assets.values());
}

export function getArchiveImageSources(value) {
  return collectArchiveImageAssets(value)
    .map(getAssetSource)
    .filter(Boolean);
}

