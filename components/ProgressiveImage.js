"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getAssetSource } from "../lib/media.js";

export default function ProgressiveImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  loading = "lazy",
  fetchPriority,
  className = "",
}) {
  const sourceKey = getAssetSource(src);
  const [imageState, setImageState] = useState({
    source: sourceKey,
    status: "loading",
  });
  const imageRef = useRef(null);
  const status = imageState.source === sourceKey ? imageState.status : "loading";
  const isLoading = status === "loading";
  const isLoaded = status === "loaded";
  const hasFailed = status === "failed";

  const updateStatus = (nextStatus) => {
    setImageState({ source: sourceKey, status: nextStatus });
  };

  useEffect(() => {
    setImageState({ source: sourceKey, status: "loading" });
    const image = imageRef.current;

    if (!image || !image.complete) {
      return;
    }

    setImageState({
      source: sourceKey,
      status: image.naturalWidth > 0 ? "loaded" : "failed",
    });
  }, [sourceKey]);

  return (
    <span
      className={`progressive-image${fill ? " progressive-image--fill" : ""}${
        isLoaded ? " progressive-image--loaded" : ""
      }${className ? ` ${className}` : ""}`}
    >
      {isLoading ? <span className="progressive-image__placeholder" aria-hidden="true" /> : null}
      {hasFailed ? (
        <span className="progressive-image__fallback">Image unavailable</span>
      ) : (
        <Image
          ref={imageRef}
          className="progressive-image__image"
          src={src}
          alt={alt}
          {...(fill ? { fill: true } : { width, height })}
          sizes={sizes}
          loading={loading}
          fetchPriority={fetchPriority}
          onLoad={() => updateStatus("loaded")}
          onError={() => updateStatus("failed")}
        />
      )}
    </span>
  );
}
