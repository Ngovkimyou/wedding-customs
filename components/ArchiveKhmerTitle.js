"use client";

import { useCallback, useRef } from "react";
import { useLocale } from "./LocaleProvider.js";
import { getLocalizedTitles } from "../lib/locale.js";
import useResponsiveTextFit from "./useResponsiveTextFit.js";

const MAX_KHMER_TITLE_LINES = 3;
const MIN_KHMER_TITLE_SCALE = 0.1;
const FIT_SEARCH_STEPS = 10;

function countRenderedLines(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const lineTops = new Set(
    Array.from(range.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => Math.round(rect.top)),
  );

  return lineTops.size;
}

export default function ArchiveKhmerTitle({ title, khmerTitle }) {
  const { locale } = useLocale();
  const titleRef = useRef(null);
  const { alternateTitle: titleText, alternateLocale: titleLanguage } = getLocalizedTitles(
    locale,
    title,
    khmerTitle,
  );

  const fitTitle = useCallback((title) => {
    title.style.setProperty("--archive-khmer-fit-scale", "1");
    if (countRenderedLines(title) <= MAX_KHMER_TITLE_LINES) {
      return;
    }

    let low = MIN_KHMER_TITLE_SCALE;
    let high = 1;
    title.style.setProperty("--archive-khmer-fit-scale", String(low));

    if (countRenderedLines(title) > MAX_KHMER_TITLE_LINES) {
      return;
    }

    for (let step = 0; step < FIT_SEARCH_STEPS; step += 1) {
      const scale = (low + high) / 2;
      title.style.setProperty("--archive-khmer-fit-scale", String(scale));

      if (countRenderedLines(title) <= MAX_KHMER_TITLE_LINES) {
        low = scale;
      } else {
        high = scale;
      }
    }

    title.style.setProperty("--archive-khmer-fit-scale", String(low));
  }, []);

  useResponsiveTextFit(titleRef, titleText, fitTitle);

  if (!titleText?.trim()) {
    return null;
  }

  return (
    <p
      ref={titleRef}
      className="archive-entry__khmer-title"
      data-archive-dynamic="true"
      lang={titleLanguage}
      style={{ "--archive-khmer-fit-scale": 1 }}
    >
      {titleText}
    </p>
  );
}
