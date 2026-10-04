import KhmerScriptText from "./KhmerScriptText.js";

export default function ArchiveMetadata({ entry }) {
  const isCommunityEntry = entry.id === "COMMUNITY ENTRY" || Boolean(entry.authorEmail);
  const metadataFields = isCommunityEntry
    ? [
      ["Author", "authorEmail"],
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
            <KhmerScriptText>
              {field === "authorEmail"
                ? entry.authorEmail || "Email unavailable"
                : entry[field] || "Not provided"}
            </KhmerScriptText>
          </dd>
        </div>
      ))}
    </dl>
  );
}
