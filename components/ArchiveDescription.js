import Link from "next/link";
import ProgressiveImage from "./ProgressiveImage.js";
import ImageLightbox from "./ImageLightbox.js";
import { DescriptionGallery, DescriptionGalleryStack } from "./ArchiveDescriptionGallery.js";
import { getImageDimensions } from "../lib/media.js";
import { isCommunityArchiveEntry } from "../lib/archive-entry-mapper.mjs";
import ArchiveContentText from "./ArchiveContentText.js";
import LocaleText from "./LocaleText.js";

function DescriptionPart({ part, isCommunityEntry }) {
  if (typeof part === "string") {
    return <ArchiveContentText isCommunityEntry={isCommunityEntry}>{part}</ArchiveContentText>;
  }

  if (!part?.text) {
    return null;
  }

  let content = <ArchiveContentText isCommunityEntry={isCommunityEntry}>{part.text}</ArchiveContentText>;

  if (part.archiveSlug) {
    content = (
      <Link className="archive-entry__description-link" href={`/archive/${part.archiveSlug}`}>
        {content}
      </Link>
    );
  } else if (part.anchorId) {
    content = (
      <a className="archive-entry__description-link" href={`#${part.anchorId}`}>
        {content}
      </a>
    );
  }

  if (part.strong) {
    content = <strong>{content}</strong>;
  }

  if (part.emphasis) {
    content = <em>{content}</em>;
  }

  return content;
}

function DescriptionParagraph({ paragraph, isCommunityEntry }) {
  const parts = Array.isArray(paragraph) ? paragraph : [paragraph];

  return (
    <p>
      {parts.map((part, index) => (
        <DescriptionPart
          part={part}
          isCommunityEntry={isCommunityEntry}
          key={index}
        />
      ))}
    </p>
  );
}

function normalizeGalleryConfig(gallery) {
  if (!gallery) {
    return null;
  }

  if (Array.isArray(gallery)) {
    return { images: gallery };
  }

  return gallery;
}

function DescriptionParagraphWithGallery({ paragraph, gallery, isCommunityEntry }) {
  const paragraphContent = (
    <DescriptionParagraph paragraph={paragraph} isCommunityEntry={isCommunityEntry} />
  );
  let galleryContent = null;

  if (gallery?.galleries?.length) {
    galleryContent = (
      <DescriptionGalleryStack
        galleries={gallery.galleries}
        sharedCaption={gallery.sharedCaption}
        isCommunityEntry={isCommunityEntry}
      />
    );
  } else if (gallery?.images?.length) {
    galleryContent = (
      <DescriptionGallery
        images={gallery.images}
        caption={gallery.caption}
        layout={gallery.layout}
        isCommunityEntry={isCommunityEntry}
      />
    );
  }

  if (gallery?.placement === "right" && gallery.images?.length === 1) {
    return (
      <div className="archive-entry__description-inline-media">
        <div className="archive-entry__description-inline-copy">
          {paragraphContent}
        </div>
        {galleryContent}
      </div>
    );
  }

  if (gallery?.placement === "left" && gallery.images?.length === 1) {
    return (
      <div className="archive-entry__description-inline-media archive-entry__description-inline-media--left">
        {galleryContent}
        <div className="archive-entry__description-inline-copy">
          {paragraphContent}
        </div>
      </div>
    );
  }

  return (
    <>
      {paragraphContent}
      {galleryContent}
    </>
  );
}

function DescriptionSubsection({ sectionTitle, subsection, isCommunityEntry }) {
  const paragraphs = subsection.paragraphs || [];

  return (
    <section className="archive-entry__description-subsection">
      <ArchiveContentText as="h4" isCommunityEntry={isCommunityEntry}>
        {subsection.title}
      </ArchiveContentText>
      {paragraphs.map((paragraph, index) => {
        const initialGallery = index === 0 && subsection.images?.length
          ? { images: subsection.images, caption: subsection.galleryCaption }
          : subsection.imagesAfterParagraph?.[index];

        return (
          <DescriptionParagraphWithGallery
            key={`${sectionTitle}-${subsection.title}-${index}`}
            paragraph={paragraph}
            gallery={normalizeGalleryConfig(initialGallery)}
            isCommunityEntry={isCommunityEntry}
          />
        );
      })}
      {!paragraphs.length ? (
        <DescriptionGallery
          images={subsection.images}
          caption={subsection.galleryCaption}
          isCommunityEntry={isCommunityEntry}
        />
      ) : null}
    </section>
  );
}

function DescriptionSectionContent({ section, isCommunityEntry }) {
  return (
    <>
      <ArchiveContentText as="h3" isCommunityEntry={isCommunityEntry}>
        {section.title}
      </ArchiveContentText>
      {(section.paragraphs || []).map((paragraph, index) => (
        <DescriptionParagraphWithGallery
          key={`${section.title}-${index}`}
          paragraph={paragraph}
          gallery={normalizeGalleryConfig(section.imagesAfterParagraph?.[index])}
          isCommunityEntry={isCommunityEntry}
        />
      ))}
      {(section.subsections || []).map((subsection) => (
        <DescriptionSubsection
          key={subsection.title}
          sectionTitle={section.title}
          subsection={subsection}
          isCommunityEntry={isCommunityEntry}
        />
      ))}
    </>
  );
}

function DescriptionSection({ section, isCommunityEntry }) {
  const hasArtwork = Boolean(section.artwork);
  const hasBottomRightArtwork = hasArtwork && section.artworkPlacement === "bottom-right";
  const sectionClassName = ["archive-entry__description-section"];

  if (hasArtwork && !hasBottomRightArtwork) {
    sectionClassName.push("archive-entry__description-section--with-art");
  }

  if (hasArtwork && section.artworkPosition === "right") {
    sectionClassName.push("archive-entry__description-section--art-right");
  }

  if (hasBottomRightArtwork) {
    sectionClassName.push("archive-entry__description-section--art-bottom-right");
  }

  const content = (
    <DescriptionSectionContent section={section} isCommunityEntry={isCommunityEntry} />
  );
  const artworkDimensions = getImageDimensions(
    section.artwork,
    hasBottomRightArtwork ? 1254 : 1536,
    hasBottomRightArtwork ? 1254 : 1024,
  );

  return (
    <section className={sectionClassName.join(" ")} id={section.id || undefined}>
      {hasArtwork && !hasBottomRightArtwork ? (
        <div className="archive-entry__description-row">
          <div className="archive-entry__description-art">
            <ImageLightbox
              className="archive-entry__description-image-trigger"
              src={section.artwork}
              alt={section.artworkAlt || "Archive illustration"}
              sizes="(max-width: 40rem) 40vw, 16rem"
              localizeContent={!isCommunityEntry}
            >
              <ProgressiveImage
                className="archive-entry__description-image"
                src={section.artwork}
                alt={section.artworkAlt || ""}
                width={artworkDimensions.width}
                height={artworkDimensions.height}
                sizes="(max-width: 40rem) 40vw, 16rem"
                loading="lazy"
                localizeAlt={!isCommunityEntry}
              />
            </ImageLightbox>
          </div>
          <div className="archive-entry__description-copy">{content}</div>
        </div>
      ) : (
        content
      )}
      {hasBottomRightArtwork ? (
        <ProgressiveImage
          className="archive-entry__description-bottom-art"
          src={section.artwork}
          alt={section.artworkAlt || ""}
          width={artworkDimensions.width}
          height={artworkDimensions.height}
          sizes="(max-width: 40rem) 30vw, 10rem"
          loading="lazy"
          localizeAlt={!isCommunityEntry}
        />
      ) : null}
    </section>
  );
}

export default function ArchiveDescription({ entry }) {
  const isCommunityEntry = isCommunityArchiveEntry(entry);
  const topArtworkDimensions = getImageDimensions(
    entry.descriptionArtworkTopLeft,
    1254,
    1254,
  );

  return (
    <section
      className={`archive-entry__section${entry.descriptionArtworkTopLeft ? " archive-entry__section--description-art" : ""}`}
      aria-labelledby="description-title"
    >
      {entry.descriptionArtworkTopLeft ? (
        <ProgressiveImage
          className="archive-entry__description-top-art"
          src={entry.descriptionArtworkTopLeft}
          alt=""
          width={topArtworkDimensions.width}
          height={topArtworkDimensions.height}
          sizes="(max-width: 40rem) 30vw, 12rem"
          loading="lazy"
        />
      ) : null}
      <h2 className="section-label" id="description-title"><LocaleText>Archive description</LocaleText></h2>
      {entry.descriptionSections?.length ? (
        <div className="archive-entry__description-sections" data-archive-dynamic="true">
          {entry.descriptionSections.map((section) => (
            <DescriptionSection
              key={section.id || section.title}
              section={section}
              isCommunityEntry={isCommunityEntry}
            />
          ))}
        </div>
      ) : (
        <p data-archive-dynamic="true">
          <ArchiveContentText isCommunityEntry={isCommunityEntry}>
            {entry.content}
          </ArchiveContentText>
        </p>
      )}
    </section>
  );
}
