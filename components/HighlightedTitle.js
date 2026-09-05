import { findTitleMatches } from "../lib/archive-search.mjs";

export default function HighlightedTitle({ title, query }) {
  const parts = [];
  let cursor = 0;

  for (const { start, end } of findTitleMatches(title, query)) {
    parts.push(
      title.slice(cursor, start),
      <mark className="archive-search__match" key={start}>
        {title.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }

  parts.push(title.slice(cursor));
  return parts;
}
