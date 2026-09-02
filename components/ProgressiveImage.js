"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProgressiveImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  loading = "lazy",
  fetchPriority,
}) {
  const [status, setStatus] = useState("loading");
  const isLoading = status === "loading";
  const isLoaded = status === "loaded";
  const hasFailed = status === "failed";

  return (
    <span
      className={`progressive-image${fill ? " progressive-image--fill" : ""}${
        isLoaded ? " progressive-image--loaded" : ""
      }`}
    >
      {isLoading ? <span className="progressive-image__placeholder" aria-hidden="true" /> : null}
      {hasFailed ? (
        <span className="progressive-image__fallback">Image unavailable</span>
      ) : (
        <Image
          className="progressive-image__image"
          src={src}
          alt={alt}
          {...(fill ? { fill: true } : { width, height })}
          sizes={sizes}
          loading={loading}
          fetchPriority={fetchPriority}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("failed")}
        />
      )}
    </span>
  );
}
