export default function ArchiveMetadata({ entry }) {
  const metadata = [
    ["Archive ID", entry.id],
    ["Category", entry.category],
    ["Period", entry.period],
    ["Location", entry.location],
    ["People involved", entry.people],
    ["Source", entry.source],
    ["Interview date", entry.interviewDate],
  ];

  return (
    <dl className="archive-metadata">
      {metadata.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
