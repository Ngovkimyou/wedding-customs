"use client";

import { useCallback, useRef } from "react";
import { getArchiveTitleLines } from "../lib/archive-title.mjs";
import { getLocalizedTitles } from "../lib/locale.js";
import { useLocale } from "./LocaleProvider.js";
import useResponsiveTextFit from "./useResponsiveTextFit.js";

const ARCHIVE_TITLE_REFERENCE_LENGTH = 24;
const ARCHIVE_KHMER_TITLE_SAFE_HEIGHT_RATIO = 0.24;
const ARCHIVE_KHMER_TITLE_MIN_SAFE_HEIGHT = 32;

export default function ArchiveTitle({ title, khmerTitle, isCommunityEntry }) {
  const { locale } = useLocale();
  const titleRef = useRef(null);
  const { primaryTitle, primaryLocale, showKhmerAsPrimary } = getLocalizedTitles(
    locale,
    title,
    khmerTitle,
  );
  const lines = isCommunityEntry || showKhmerAsPrimary
    ? getArchiveTitleLines(primaryTitle)
    : [primaryTitle ?? ""];
  const lineKey = lines.join("\n");
  const longestTitleLine = Math.max(0, ...lines.map((line) => Array.from(line).length));
  const titleScale = isCommunityEntry && longestTitleLine > ARCHIVE_TITLE_REFERENCE_LENGTH
    ? ARCHIVE_TITLE_REFERENCE_LENGTH / longestTitleLine
    : 1;

  const fitTitle = useCallback((title) => {
    title.style.setProperty("--archive-title-fit-scale", "1");
    const lineElements = title.querySelectorAll(".archive-entry__title-line");
    let fitScale = 1;

    lineElements.forEach((line) => {
      const availableWidth = line.clientWidth;
      const renderedWidth = line.scrollWidth;
      if (availableWidth > 0 && renderedWidth > availableWidth) {
        fitScale = Math.min(fitScale, availableWidth / renderedWidth);
      }
    });

    if (title.classList.contains("archive-entry__title-frame--khmer")) {
      const frameHeight = title.parentElement?.clientHeight ?? 0;
      const safeHeight = Math.max(
        ARCHIVE_KHMER_TITLE_MIN_SAFE_HEIGHT,
        frameHeight * ARCHIVE_KHMER_TITLE_SAFE_HEIGHT_RATIO,
      );
      const renderedHeight = title.scrollHeight;

      if (renderedHeight > safeHeight) {
        fitScale = Math.min(fitScale, (safeHeight / renderedHeight) * 0.9);
      }
    }

    title.style.setProperty(
      "--archive-title-fit-scale",
      String(fitScale < 1 ? Math.max(0.1, fitScale * 0.96) : 1),
    );
  }, []);

  useResponsiveTextFit(titleRef, lineKey, fitTitle);

  return (
    <h1
      ref={titleRef}
      className={[
        isCommunityEntry ? "archive-entry__title-frame--community" : "",
        showKhmerAsPrimary ? "archive-entry__title-frame--khmer" : "",
      ].filter(Boolean).join(" ") || undefined}
      lang={primaryLocale}
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
