const METADATA_FIELDS = [
  ["Archive ID", "id"],
  ["Category", "category"],
  ["Period", "period"],
  ["Location", "location"],
  ["People involved", "people"],
  ["Source", "source"],
  ["Interview date", "interviewDate"],
];

export default function ArchiveMetadata({ entry }) {
  return (
    <dl className="archive-metadata">
      {METADATA_FIELDS.map(([label, field]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{entry[field]}</dd>
        </div>
      ))}
    </dl>
  );
}
