import KhmerScriptText from "./KhmerScriptText.js";

const METADATA_FIELDS = [
  ["Archive ID", "id"],
  ["Period", "period"],
  ["Location", "location"],
  ["Interview date", "interviewDate"],
];

export default function ArchiveMetadata({ entry }) {
  return (
    <dl className="archive-metadata">
      {METADATA_FIELDS.map(([label, field]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd><KhmerScriptText>{entry[field]}</KhmerScriptText></dd>
        </div>
      ))}
    </dl>
  );
}
