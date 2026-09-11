import Link from "next/link";

function NavigationItem({ entry, direction }) {
  const isPrevious = direction === "previous";
  const label = isPrevious ? "Previous" : "Next";
  const arrow = String.fromCodePoint(isPrevious ? 0x2190 : 0x2192);

  return (
    <Link
      className={`archive-entry__navigation-item archive-entry__navigation-item--${direction}`}
      href={`/archive/${entry.slug}`}
      prefetch={true}
      aria-label={`${label} record: ${entry.title}`}
      title={entry.title}
    >
      <span className="archive-entry__navigation-label">
        {isPrevious ? `${arrow} ${label}` : `${label} ${arrow}`}
      </span>
      <span className="archive-entry__navigation-target">{entry.id}</span>
    </Link>
  );
}

export default function ArchiveNavigation({ previous, next, position, total }) {
  if (!previous || !next) {
    return null;
  }

  return (
    <nav
      className="archive-entry__navigation"
      data-archive-navigation
      aria-label="Archive record navigation"
    >
      <NavigationItem direction="previous" entry={previous} />
      {position && total ? (
        <span className="archive-entry__navigation-count" aria-label={`Record ${position} of ${total}`}>
          {String(position).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      ) : null}
      <NavigationItem direction="next" entry={next} />
    </nav>
  );
}
