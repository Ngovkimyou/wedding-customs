import KhmerScriptText from "./KhmerScriptText.js";
import LocaleText from "./LocaleText.js";
import ArchiveContentText from "./ArchiveContentText.js";

export default function ArchiveMetadata({ entry }) {
  const isCommunityEntry = entry.id === "COMMUNITY ENTRY" || Boolean(entry.authorUsername);
  const metadataFields = isCommunityEntry
    ? [
      ["Author", "authorUsername"],
      ["Archive ID", "id"],
      ["Period", "period"],
      ["Location", "location"],
    ]
    : [
      ["Archive ID", "id"],
      ["Interview date", "interviewDate"],
      ["Period", "period"],
      ["Location", "location"],
    ];

  return (
    <dl className="archive-metadata">
      {metadataFields.map(([label, field]) => (
        <div key={label}>
          <dt><LocaleText>{label}</LocaleText></dt>
          <dd>
            {field === "authorUsername" ? (
              <span className="archive-metadata__author-value">
                <KhmerScriptText>
                  {entry.authorUsername || <LocaleText>Name unavailable</LocaleText>}
                </KhmerScriptText>
              </span>
            ) : entry[field] ? (
              <ArchiveContentText isCommunityEntry={isCommunityEntry}>
                {entry[field]}
              </ArchiveContentText>
            ) : (
              <LocaleText>Not provided</LocaleText>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
