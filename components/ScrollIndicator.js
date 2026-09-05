"use client";

import { useEffect, useRef, useState } from "react";
import { getScrollIndicator } from "../lib/scroll-indicator.mjs";

// Decorative only: native scrolling and keyboard controls remain on the viewport.
export default function ScrollIndicator({ scrollRef, className = "" }) {
  const trackRef = useRef(null);
  const [indicator, setIndicator] = useState({ isScrollable: false, thumbHeight: 0, thumbOffset: 0 });

  useEffect(() => {
    const viewport = scrollRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return undefined;

    let frame = null;
    const update = () => {
      frame = null;
      const next = getScrollIndicator({
        scrollHeight: viewport.scrollHeight,
        clientHeight: viewport.clientHeight,
        scrollTop: viewport.scrollTop,
        trackHeight: track.clientHeight,
      });
      setIndicator((previous) => (
        previous.isScrollable === next.isScrollable
        && previous.thumbHeight === next.thumbHeight
        && previous.thumbOffset === next.thumbOffset
          ? previous : next
      ));
    };
    const scheduleUpdate = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    const observeContent = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(viewport);
      resizeObserver.observe(track);
      // Image/font loads and result lists can resize content, not the viewport.
      for (const child of viewport.children) resizeObserver.observe(child);
      scheduleUpdate();
    };
    const mutationObserver = new MutationObserver(observeContent);
    mutationObserver.observe(viewport, { childList: true, subtree: true, characterData: true });
    observeContent();
    viewport.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      viewport.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [scrollRef]);

  return (
    <div
      className={`scroll-indicator ${className}`}
      ref={trackRef}
      aria-hidden="true"
      style={{ visibility: indicator.isScrollable ? "visible" : "hidden" }}
    >
      <span style={{ height: `${indicator.thumbHeight}px`, top: `${indicator.thumbOffset}px` }} />
    </div>
  );
}
