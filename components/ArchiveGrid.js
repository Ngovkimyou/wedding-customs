import ArchiveCard from "./ArchiveCard.js";
import DecorativeDivider from "./DecorativeDivider.js";
import SectionHeading from "./SectionHeading.js";

export default function ArchiveGrid({ entries }) {
  return (
    <section className="archive-collection" aria-labelledby="collection-title">
      <SectionHeading
        eyebrow="The collection"
        className="collection-title"
        id="collection-title"
        title="Preserved records, waiting to be opened."
        count={`${String(entries.length).padStart(2, "0")} records`}
      >
        <p>
          Each record is a placeholder for an interview, photograph, memory, object, or tradition
          to be added to the archive.
        </p>
      </SectionHeading>
      <DecorativeDivider compact />
      <div className="archive-grid">
        {entries.map((entry) => (
          <ArchiveCard entry={entry} key={entry.id} />
        ))}
      </div>
    </section>
  );
}
