import ArchiveCardLink from "./ArchiveCardLink.js";
import ProgressiveImage from "./ProgressiveImage.js";
import KhmerScriptText from "./KhmerScriptText.js";
import { getArchiveImageSources } from "../lib/archive-assets.js";
import LocaleText from "./LocaleText.js";
import ArchiveCardTitles from "./ArchiveCardTitles.js";

export default function ArchiveCard({ entry, eager = false, isOwnedByCurrentUser = false }) {
  const image = entry.images?.[0];
  const isNumberedArchiveEntry = Number.isInteger(entry.archiveNumber);

  return (
    <ArchiveCardLink
      href={`/archive/${entry.slug}`}
      assets={getArchiveImageSources(entry)}
    >
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
            {image.caption ? (
              <figcaption>
                {isNumberedArchiveEntry
                  ? <LocaleText fallback={image.caption} />
                  : <KhmerScriptText>{image.caption}</KhmerScriptText>}
              </figcaption>
            ) : null}
          </figure>
        ) : (
          <div className="archive-card__image-placeholder" role="img">
            <span><LocaleText>Family photograph</LocaleText></span>
            <small><LocaleText>[Image to be added]</LocaleText></small>
          </div>
        )}

        <div className="archive-card__body">
          {isNumberedArchiveEntry ? (
            <p className="archive-card__meta">
              <LocaleText en="ARCHIVE" km="បណ្ណសារ" /> {String(entry.archiveNumber).padStart(3, "0")}
            </p>
          ) : (
            <div className="archive-card__meta-spacer" aria-hidden="true" />
          )}
          <ArchiveCardTitles title={entry.title} khmerTitle={entry.khmerTitle} />
          {entry.summary ? (
            <p className="archive-card__summary">
              {isNumberedArchiveEntry
                ? <LocaleText fallback={entry.summary} />
                : <KhmerScriptText>{entry.summary}</KhmerScriptText>}
            </p>
          ) : null}
          {!isNumberedArchiveEntry ? (
            <footer className="archive-card__community-credit">
              <div className="archive-card__community-credit-header">
                <span className="archive-card__community-author-label"><LocaleText>Author</LocaleText></span>
                {isOwnedByCurrentUser ? (
                  <span className="archive-card__owner-badge">
                    <span aria-hidden="true">✦</span>
                    <span className="archive-card__owner-label"><LocaleText>Your contribution</LocaleText></span>
                  </span>
                ) : null}
              </div>
              <span className="archive-card__community-author-name" dir="auto" title={entry.authorUsername || undefined}>
                {entry.authorUsername
                  ? <KhmerScriptText>{entry.authorUsername}</KhmerScriptText>
                  : <LocaleText>Name unavailable</LocaleText>}
              </span>
            </footer>
          ) : null}
        </div>
      </article>
    </ArchiveCardLink>
  );
}
