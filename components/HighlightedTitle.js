import { findTitleMatches } from "../lib/archive-search.mjs";
import { withKhmerScript } from "./KhmerScriptText.js";

export default function HighlightedTitle({ title, query, useKhmerScript = false }) {
  const parts = [];
  let cursor = 0;
  const renderText = (text, keyPrefix) => (
    useKhmerScript ? withKhmerScript(text, keyPrefix) : text
  );

  for (const { start, end } of findTitleMatches(title, query)) {
    parts.push(
      renderText(title.slice(cursor, start), `plain-${cursor}`),
      <mark className="archive-search__match" key={start}>
        {renderText(title.slice(start, end), `match-${start}`)}
      </mark>,
    );
    cursor = end;
  }

  parts.push(renderText(title.slice(cursor), `tail-${cursor}`));
  return parts;
}
