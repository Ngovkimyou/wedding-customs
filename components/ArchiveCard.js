import ArchiveCardLink from "./ArchiveCardLink.js";
import ProgressiveImage from "./ProgressiveImage.js";
import { getArchiveImageSources } from "../lib/archive-assets.js";

export default function ArchiveCard({ entry, eager = false }) {
  const image = entry.images?.[0];

  return (
    <ArchiveCardLink href={`/archive/${entry.slug}`} assets={getArchiveImageSources(entry)}>
      <article>
        {image ? (
          <figure className="archive-card__image">
            <ProgressiveImage
              src={image.src}
              alt={image.alt ?? "Archive photograph"}
              fill
              sizes="(max-width: 640px) calc(100vw - 2.5rem), (max-width: 960px) 50vw, 33vw"
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : "auto"}
            />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ) : (
          <div className="archive-card__image-placeholder" role="img" aria-label="Photograph placeholder">
            <span>Family photograph</span>
            <small>[Image to be added]</small>
          </div>
        )}

        <div className="archive-card__body">
          <p className="archive-card__meta">{entry.id}</p>
          <h3>{entry.title}</h3>
          <p className="archive-card__khmer-title">{entry.khmerTitle}</p>
          {entry.summary ? <p className="archive-card__summary">{entry.summary}</p> : null}
        </div>
      </article>
    </ArchiveCardLink>
  );
}
