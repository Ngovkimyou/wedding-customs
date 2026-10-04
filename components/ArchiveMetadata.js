import KhmerScriptText from "./KhmerScriptText.js";

const METADATA_FIELDS = [
  ["Archive ID", "id"],
  ["Period", "period"],
  ["Location", "location"],
  ["Interview date", "interviewDate"],
];

export default function ArchiveMetadata({ entry }) {
  const fields = METADATA_FIELDS.filter(([label, field]) => (
    label === "Archive ID" || (typeof entry[field] === "string" && entry[field].trim())
  ));

  return (
    <dl className="archive-metadata">
      {fields.map(([label, field]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd><KhmerScriptText>{entry[field]}</KhmerScriptText></dd>
        </div>
      ))}
    </dl>
  );
}
