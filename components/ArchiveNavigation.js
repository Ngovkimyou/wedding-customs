"use client";

import Link from "next/link";
import { getLocalizedTitles, translate } from "../lib/locale.js";
import { translateArchiveContent } from "../lib/archive-content-km.js";
import { useLocale } from "./LocaleProvider.js";

function NavigationItem({ entry, direction, entryType }) {
  const { locale } = useLocale();
  const isPrevious = direction === "previous";
  const label = isPrevious ? "Previous" : "Next";
  const localizedTitle = getLocalizedTitles(locale, entry.title, entry.khmerTitle);
  const target = entryType === "community"
    ? localizedTitle.primaryTitle
    : translateArchiveContent(locale, entry.id);
  const itemType = entryType === "community" ? "community contribution" : "record";
  const arrow = String.fromCodePoint(isPrevious ? 0x2190 : 0x2192);

  return (
    <Link
      className={`archive-entry__navigation-item archive-entry__navigation-item--${direction}`}
      href={`/archive/${entry.slug}`}
      prefetch={true}
      aria-label={`${translate(locale, label)} ${translate(locale, itemType)}: ${target}`}
      title={target}
    >
      <span className="archive-entry__navigation-label">
        {isPrevious ? <>{arrow} {translate(locale, label)}</> : <>{translate(locale, label)} {arrow}</>}
      </span>
      <span className="archive-entry__navigation-target" lang={entryType === "community" ? localizedTitle.primaryLocale : locale}>
        {target}
      </span>
    </Link>
  );
}

export default function ArchiveNavigation({ previous, next, position, total, entryType = "record" }) {
  const { locale } = useLocale();
  if (!previous || !next) {
    return null;
  }

  return (
    <nav
      className="archive-entry__navigation"
      data-archive-navigation
      data-entry-type={entryType}
      aria-label={translate(locale, entryType === "community" ? "Community contribution navigation" : "Archive record navigation")}
    >
      <NavigationItem direction="previous" entry={previous} entryType={entryType} />
      {position && total ? (
        <span className="archive-entry__navigation-count" aria-label={`${translate(locale, entryType === "community" ? "Contribution" : "Record")} ${position} ${translate(locale, "of")} ${total}`}>
          {String(position).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      ) : null}
      <NavigationItem direction="next" entry={next} entryType={entryType} />
    </nav>
  );
}
