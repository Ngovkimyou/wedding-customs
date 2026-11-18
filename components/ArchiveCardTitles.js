"use client";

import { useLocale } from "./LocaleProvider.js";
import { getLocalizedTitles } from "../lib/locale.js";

export default function ArchiveCardTitles({ title, khmerTitle }) {
  const { locale } = useLocale();
  const {
    primaryTitle,
    alternateTitle,
    primaryLocale,
    alternateLocale,
    showKhmerAsPrimary,
  } = getLocalizedTitles(locale, title, khmerTitle);

  return (
    <>
      <h3
        className={showKhmerAsPrimary ? "archive-card__title--khmer" : undefined}
        lang={primaryLocale}
      >
        {primaryTitle}
      </h3>
      {alternateTitle ? (
        <p className="archive-card__khmer-title" lang={alternateLocale}>
          {alternateTitle}
        </p>
      ) : null}
    </>
  );
}
