import Link from "next/link";

function NavigationItem({ entry, direction, entryType }) {
  const isPrevious = direction === "previous";
  const label = isPrevious ? "Previous" : "Next";
  const target = entryType === "community" ? entry.title : entry.id;
  const itemType = entryType === "community" ? "community contribution" : "record";
  const arrow = String.fromCodePoint(isPrevious ? 0x2190 : 0x2192);

  return (
    <Link
      className={`archive-entry__navigation-item archive-entry__navigation-item--${direction}`}
      href={`/archive/${entry.slug}`}
      prefetch={true}
      aria-label={label + " " + itemType + ": " + entry.title}
      title={entry.title}
    >
      <span className="archive-entry__navigation-label">
        {isPrevious ? `${arrow} ${label}` : `${label} ${arrow}`}
      </span>
      <span className="archive-entry__navigation-target">{target}</span>
    </Link>
  );
}

export default function ArchiveNavigation({ previous, next, position, total, entryType = "record" }) {
  if (!previous || !next) {
    return null;
  }

  return (
    <nav
      className="archive-entry__navigation"
      data-archive-navigation
      data-entry-type={entryType}
      aria-label={entryType === "community" ? "Community contribution navigation" : "Archive record navigation"}
    >
      <NavigationItem direction="previous" entry={previous} entryType={entryType} />
      {position && total ? (
        <span className="archive-entry__navigation-count" aria-label={(entryType === "community" ? "Contribution " : "Record ") + position + " of " + total}>
          {String(position).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      ) : null}
      <NavigationItem direction="next" entry={next} entryType={entryType} />
    </nav>
  );
}
