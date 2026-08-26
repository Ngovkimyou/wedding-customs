import Link from "next/link";

export default function ArchiveCard({ entry }) {
  const image = entry.images?.[0];

  return (
    <Link className="archive-card" href={`/archive/${entry.slug}`}>
      <article>
        <div className="archive-card__topline">
          <span>{entry.id}</span>
          <span>{entry.category}</span>
        </div>

        {image ? (
          <figure className="archive-card__image">
            <img src={image.src} alt={image.alt || "Archive photograph"} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ) : (
          <div className="archive-card__image-placeholder" role="img" aria-label="Photograph placeholder">
            <span>Family photograph</span>
            <small>[Image to be added]</small>
          </div>
        )}

        <div className="archive-card__body">
          <p className="archive-card__period">{entry.period}</p>
          <h3>{entry.title}</h3>
          <p className="archive-card__khmer-title">{entry.khmerTitle}</p>
          <p className="archive-card__summary">{entry.summary}</p>
        </div>

        <span className="archive-card__open">
          Open record <b aria-hidden="true">→</b>
        </span>
      </article>
    </Link>
  );
}
