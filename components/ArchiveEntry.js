import Link from "next/link";
import ArchiveMetadata from "./ArchiveMetadata.js";
import DecorativeDivider from "./DecorativeDivider.js";

export default function ArchiveEntry({ entry }) {
  const hasImages = entry.images && entry.images.length > 0;

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
        <p className="section-label" id="description-title">Archive description</p>
        <p>{entry.content}</p>
      </section>

      <DecorativeDivider compact />

      <section className="oral-history" aria-labelledby="oral-history-title">
        <p className="section-label" id="oral-history-title">Oral history</p>
        <blockquote>“{entry.oralHistory}”</blockquote>
        <p className="oral-history__attribution">— {entry.interviewee} · {entry.interviewDate}</p>
      </section>

      <DecorativeDivider compact />

      <section className="archive-entry__section" aria-labelledby="notes-title">
        <p className="section-label" id="notes-title">Archive notes</p>
        <ArchiveMetadata entry={entry} />
      </section>

      <section className="archive-entry__section archive-entry__details" aria-labelledby="details-title">
        <p className="section-label" id="details-title">Custom & objects</p>
        <div>
          <h2>Wedding custom / tradition</h2>
          <p>{entry.tradition}</p>
        </div>
        <div>
          <h2>Related objects</h2>
          <p>{entry.objects}</p>
        </div>
        <div>
          <h2>Research notes</h2>
          <p>{entry.researchNotes}</p>
        </div>
      </section>
    </article>
  );
}
