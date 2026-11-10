import KhmerScriptText from "./KhmerScriptText.js";

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
          <dt>{label}</dt>
          <dd>
            {field === "authorUsername" ? (
              <span className="archive-metadata__author-value">
                <KhmerScriptText>
                  {entry.authorUsername || "Name unavailable"}
                </KhmerScriptText>
              </span>
            ) : (
              <KhmerScriptText>
                {entry[field] || "Not provided"}
              </KhmerScriptText>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
