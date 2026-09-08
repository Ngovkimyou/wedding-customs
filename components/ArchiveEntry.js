import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import ArchiveBackLink, { CollectionBackLink } from "./ArchiveBackLink.js";
import ArchiveMetadata from "./ArchiveMetadata.js";
import ArchiveNavigation from "./ArchiveNavigation.js";
import ArchiveSwipeNavigation from "./ArchiveSwipeNavigation.js";
import DecorativeDivider from "./DecorativeDivider.js";
import ProgressiveImage from "./ProgressiveImage.js";
import RelatedTopics from "./RelatedTopics.js";
import asideArtwork from "../assets/aside-01.avif";
import { getAdjacentEntries, getRelatedEntries } from "../data/archive.js";

function DescriptionParagraph({ paragraph }) {
  const parts = Array.isArray(paragraph) ? paragraph : [paragraph];

  return (
    <p>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          return part;
        }

        if (part?.archiveSlug) {
          const linkKey = `${part.archiveSlug}-${index}`;

          if (part.emphasis) {
            return (
              <em key={linkKey}>
                <Link
                  className="archive-entry__description-link"
                  href={`/archive/${part.archiveSlug}`}
                >
                  {part.text}
                </Link>
              </em>
            );
          }

          return (
            <Link
              className="archive-entry__description-link"
              href={`/archive/${part.archiveSlug}`}
              key={linkKey}
            >
              {part.text}
            </Link>
          );
        }

        if (part?.emphasis) {
          return <em key={`emphasis-${index}`}>{part.text}</em>;
        }

        return part?.text ?? null;
      })}
    </p>
  );
}

export default function ArchiveEntry({ entry }) {
  const hasImages = Boolean(entry.images?.length);
  const { previous, next, position, total } = getAdjacentEntries(entry.slug);
  const relatedEntries = getRelatedEntries(entry.slug);

  return (
    <article className="archive-entry archive-surface">
      <div className="archive-entry__topbar">
        <Suspense fallback={<CollectionBackLink />}>
          <ArchiveBackLink />
        </Suspense>
        <p className="eyebrow archive-entry__record-id" data-archive-dynamic="true">{entry.id}</p>
      </div>

      <ArchiveNavigation next={next} position={position} previous={previous} total={total} />
      <ArchiveSwipeNavigation nextSlug={next?.slug} previousSlug={previous?.slug} />

      <div className="archive-entry__content">
      <header className="archive-entry__header">
        <div className="archive-entry__title-frame">
          <h1 data-archive-dynamic="true">{entry.title}</h1>
        </div>
        <p className="archive-entry__khmer-title" data-archive-dynamic="true">{entry.khmerTitle}</p>
      </header>

      <DecorativeDivider />

      {hasImages ? (
        <div className="archive-entry__images">
          {entry.images.map((image, index) => {
            const dimensions = typeof image.src === "object" ? image.src : null;
            const imageKey = dimensions?.src ?? image.src;

            return (
              <figure className="archive-entry__figure" key={index}>
                <div className="archive-entry__figure-frame">
                  <div className="archive-entry__figure-media">
                    <div className="archive-entry__figure-image" data-archive-dynamic="true" key={imageKey}>
                      <ProgressiveImage
                        src={image.src}
                        alt={image.alt || "Archive photograph"}
                        width={dimensions?.width ?? 1600}
                        height={dimensions?.height ?? 1000}
                        sizes="(max-width: 48rem) 100vw, 48rem"
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                      />
                    </div>
                  </div>
                </div>
                {image.caption || image.approximateDate ? (
                  <figcaption data-archive-dynamic="true">
                    {image.caption || "[Image caption]"}
                    {image.approximateDate ? ` · ${image.approximateDate}` : ""}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>
      ) : (
        <div className="archive-entry__image-placeholder" data-archive-dynamic="true" role="img" aria-label="Family photograph placeholder">
          <span>Family photograph</span>
          <p>[Photograph to be added]</p>
        </div>
      )}

      <section className="archive-entry__section" aria-labelledby="description-title">
        <h2 className="section-label" id="description-title">Archive description</h2>
        {entry.descriptionSections?.length ? (
          <div className="archive-entry__description-sections" data-archive-dynamic="true">
            {entry.descriptionSections.map((section) => {
              const hasArtwork = Boolean(section.artwork);

              return (
                <div
                  className={`archive-entry__description-section${hasArtwork ? " archive-entry__description-section--with-art" : ""}`}
                  key={section.title}
                >
                  {hasArtwork ? (
                    <div className="archive-entry__description-row">
                      <div className="archive-entry__description-art">
                        <Image
                          src={section.artwork}
                          alt={section.artworkAlt || ""}
                          width={section.artwork.width || 1536}
                          height={section.artwork.height || 1024}
                          sizes="(max-width: 40rem) 40vw, 16rem"
                          loading="lazy"
                        />
                      </div>
                      <div className="archive-entry__description-copy">
                        <h3>{section.title}</h3>
                        {section.paragraphs.map((paragraph, index) => (
                          <DescriptionParagraph key={`${section.title}-${index}`} paragraph={paragraph} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{section.title}</h3>
                      {section.paragraphs.map((paragraph, index) => (
                        <DescriptionParagraph key={`${section.title}-${index}`} paragraph={paragraph} />
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p data-archive-dynamic="true">{entry.content}</p>
        )}
      </section>

      {entry.showAside ? (
        <section className="archive-entry__aside" aria-labelledby="aside-title">
          <div className="archive-entry__aside-art">
            <Image
              src={asideArtwork}
              alt=""
              width={2172}
              height={724}
              sizes="(max-width: 48rem) 100vw, 48rem"
              loading="lazy"
            />
            <div className="archive-entry__aside-copy">
              <h2 id="aside-title">Aside</h2>
              <p data-archive-dynamic="true">{entry.aside}</p>
            </div>
          </div>
        </section>
      ) : null}

      <DecorativeDivider compact />

      <section className="archive-entry__section" aria-labelledby="notes-title">
        <h2 className="section-label" id="notes-title">Archive notes</h2>
        <div data-archive-dynamic="true">
          <ArchiveMetadata entry={entry} />
        </div>
      </section>

      <RelatedTopics entries={relatedEntries} />
      </div>
    </article>
  );
}
