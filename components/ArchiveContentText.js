import KhmerScriptText from "./KhmerScriptText.js";
import LocaleText from "./LocaleText.js";

export default function ArchiveContentText({
  children,
  isCommunityEntry = false,
  as: Element = "span",
  className,
}) {
  if (isCommunityEntry) {
    return (
      <Element className={className}>
        <KhmerScriptText>{children}</KhmerScriptText>
      </Element>
    );
  }

  return (
    <LocaleText
      archiveContent
      as={Element}
      className={className}
      fallback={children}
    />
  );
}
