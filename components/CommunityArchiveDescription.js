"use client";

import { useLocale } from "./LocaleProvider.js";
import { translate } from "../lib/locale.js";
import { splitArchiveDescriptionParagraphs } from "../lib/archive-entry-mapper.mjs";

export default function CommunityArchiveDescription({
  descriptionEn = "",
  descriptionKh = "",
  fallback = "",
}) {
  const { locale } = useLocale();
  const localizedVersions = locale === "km"
    ? [
      { language: "km", label: "Khmer version", text: descriptionKh },
      { language: "en", label: "English version", text: descriptionEn },
    ]
    : [
      { language: "en", label: "English version", text: descriptionEn },
      { language: "km", label: "Khmer version", text: descriptionKh },
    ];
  const availableVersions = localizedVersions.filter((version) => version.text.trim());
  const showVersionLabels = availableVersions.length > 1;
  const versions = availableVersions.length
    ? availableVersions
    : fallback.trim()
      ? [{ language: locale, label: null, text: fallback }]
      : [];

  if (!versions.length) return null;

  return (
    <div className="archive-entry__description-sections" data-archive-dynamic="true">
      {versions.map((version) => (
        <section
          className="archive-entry__description-section archive-entry__description-section--community-copy"
          key={version.language}
        >
          {showVersionLabels && version.label ? (
            <h3 className="archive-entry__community-language-label" lang={locale}>
              {translate(locale, version.label)}
            </h3>
          ) : null}
          {splitArchiveDescriptionParagraphs(version.text).map((paragraph, index) => (
            <p lang={version.language} dir="auto" key={index}>{paragraph}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
