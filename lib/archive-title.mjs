export const ARCHIVE_TITLE_MAX_LINE_LENGTH = 44;

/** Balance a long title into at most two lines for the decorative title frame. */
export function getArchiveTitleLines(title, maxLineLength = ARCHIVE_TITLE_MAX_LINE_LENGTH) {
  const text = typeof title === "string" ? title : "";
  const characters = Array.from(text);

  if (characters.length <= maxLineLength || maxLineLength < 1) {
    return [text];
  }

  const targetLength = Math.ceil(characters.length / 2);
  let breakAt = targetLength;
  let closestBreakDistance = Number.POSITIVE_INFINITY;

  for (let index = 1; index < characters.length; index += 1) {
    if (!/\s/u.test(characters[index] ?? "")) {
      continue;
    }

    const distance = Math.abs(index - targetLength);
    if (distance < closestBreakDistance) {
      breakAt = index;
      closestBreakDistance = distance;
    }
  }

  const firstLine = characters.slice(0, breakAt).join("").trim();
  const secondLine = characters.slice(breakAt).join("").trim();
  return [firstLine, secondLine].filter(Boolean);
}
