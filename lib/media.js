export function getAssetSource(asset) {
  return typeof asset === "string" ? asset : asset?.src ?? "";
}

export function getImageDimensions(asset, fallbackWidth, fallbackHeight) {
  if (asset && typeof asset === "object") {
    return {
      width: asset.width || fallbackWidth,
      height: asset.height || fallbackHeight,
    };
  }

  return { width: fallbackWidth, height: fallbackHeight };
}
