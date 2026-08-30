import Link from "next/link";
import ArchiveMetadata from "./ArchiveMetadata.js";
import DecorativeDivider from "./DecorativeDivider.js";

const ARCHIVE_DETAIL_FIELDS = [
  ["Wedding custom / tradition", "tradition"],
  ["Related objects", "objects"],
  ["Research notes", "researchNotes"],
];

export default function ArchiveEntry({ entry }) {
  const hasImages = Boolean(entry.images?.length);

  return (
    <article className="archive-entry archive-surface">
      <Link className="back-link" href="/">
        <span aria-hidden="true">←</span> Back to archive collection
      </Link>

      <header className="archive-entry__header">
        <p className="eyebrow">{entry.id}</p>
        <p className="archive-entry__category">{entry.category} · {entry.period}</p>
        <h1>{entry.title}</h1>
        <p className="archive-entry__khmer-title">{entry.khmerTitle}</p>
      </header>

      <DecorativeDivider />

      {hasImages ? (
        <div className="archive-entry__images">
          {entry.images.map((image) => (
            <figure className="archive-entry__figure" key={image.src}>
              <img src={image.src} alt={image.alt || "Archive photograph"} />
              <figcaption>
                {image.caption || "[Image caption]"}
                {image.approximateDate ? ` · ${image.approximateDate}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="archive-entry__image-placeholder" role="img" aria-label="Family photograph placeholder">
          <span>Family photograph</span>
          <p>[Photograph to be added]</p>
        </div>
      )}

      <section className="archive-entry__section" aria-labelledby="description-title">
        <h2 className="section-label" id="description-title">Archive description</h2>
        <p>{entry.content}</p>
      </section>

      <DecorativeDivider compact />

      <section className="oral-history" aria-labelledby="oral-history-title">
        <h2 className="section-label" id="oral-history-title">Oral history</h2>
        <blockquote>“{entry.oralHistory}”</blockquote>
        <p className="oral-history__attribution">— {entry.interviewee} · {entry.interviewDate}</p>
      </section>

      <DecorativeDivider compact />

      <section className="archive-entry__section" aria-labelledby="notes-title">
        <h2 className="section-label" id="notes-title">Archive notes</h2>
        <ArchiveMetadata entry={entry} />
      </section>

      <section className="archive-entry__section archive-entry__details" aria-labelledby="details-title">
        <h2 className="section-label" id="details-title">Custom & objects</h2>
        {ARCHIVE_DETAIL_FIELDS.map(([title, field]) => (
          <div key={field}>
            <h3>{title}</h3>
            <p>{entry[field]}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
