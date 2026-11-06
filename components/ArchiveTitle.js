"use client";

import { useCallback, useRef } from "react";
import useResponsiveTextFit from "./useResponsiveTextFit.js";

export default function ArchiveTitle({ lines, isCommunityEntry, titleScale }) {
  const titleRef = useRef(null);
  const lineKey = lines.join("\n");

  const fitTitle = useCallback((title) => {
    title.style.setProperty("--archive-title-fit-scale", "1");
    const lineElements = title.querySelectorAll(".archive-entry__title-line");
    let fitScale = 1;
    let needsFitting = false;

    lineElements.forEach((line) => {
      const availableWidth = line.clientWidth;
      const renderedWidth = line.scrollWidth;
      if (availableWidth > 0 && renderedWidth > availableWidth) {
        needsFitting = true;
        fitScale = Math.min(fitScale, availableWidth / renderedWidth);
      }
    });

    title.style.setProperty(
      "--archive-title-fit-scale",
      String(needsFitting ? Math.min(1, fitScale * 0.98) : 1),
    );
  }, []);

  useResponsiveTextFit(titleRef, lineKey, fitTitle);

  return (
    <h1
      ref={titleRef}
      className={isCommunityEntry ? "archive-entry__title-frame--community" : undefined}
      data-archive-dynamic="true"
      style={{
        "--archive-title-scale": isCommunityEntry ? titleScale : 1,
        "--archive-title-fit-scale": 1,
      }}
    >
      {lines.map((line, index) => (
        <span className="archive-entry__title-line" key={`title-line-${index}`}>
          {line}
        </span>
      ))}
    </h1>
  );
}
