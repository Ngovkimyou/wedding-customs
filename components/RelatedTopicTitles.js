"use client";

import { useLocale } from "./LocaleProvider.js";
import { getLocalizedTitles } from "../lib/locale.js";

export default function RelatedTopicTitles({ title, khmerTitle }) {
  const { locale } = useLocale();
  const { primaryTitle, alternateTitle, primaryLocale, alternateLocale } = getLocalizedTitles(
    locale,
    title,
    khmerTitle,
  );

  return (
    <>
      <span
        className="archive-entry__related-title"
        lang={primaryLocale}
      >
        {primaryTitle}
      </span>
      {alternateTitle ? (
        <span
          className="archive-entry__related-alternate"
          lang={alternateLocale}
        >
          {alternateTitle}
        </span>
      ) : null}
    </>
  );
}
