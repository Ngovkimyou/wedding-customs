import { getAssetSource, getImageDimensions } from "../lib/media.js";
import ImageLightbox from "./ImageLightbox.js";
import ArchiveContentText from "./ArchiveContentText.js";
import ProgressiveImage from "./ProgressiveImage.js";
import LocaleText from "./LocaleText.js";

const ENTRY_IMAGE_SIZES = "(max-width: 48rem) 100vw, 48rem";

function getImageCaption(image) {
  return [image.caption, image.approximateDate]
    .filter(Boolean)
    .join(" · ");
}

export default function ArchiveEntryImages({ images, isCommunityEntry = false }) {
  if (!images.length) {
    return (
      <div
        className="archive-entry__image-placeholder"
        data-archive-dynamic="true"
        role="img"
      >
        <span><LocaleText>Family photograph</LocaleText></span>
        <p><LocaleText>[Photograph to be added]</LocaleText></p>
      </div>
    );
  }

  return (
    <div className="archive-entry__images">
      {images.map((image, index) => {
        const dimensions = getImageDimensions(image.src, 1600, 1000);
        const imageKey = getAssetSource(image.src) || `${image.alt || "image"}-${index}`;
        const caption = getImageCaption(image);
        const displayCaption = [image.caption || "[Image caption]", image.approximateDate]
          .filter(Boolean)
          .join(" · ");

        return (
          <figure className="archive-entry__figure" key={imageKey}>
            <div className="archive-entry__figure-frame">
              <div className="archive-entry__figure-media">
                <ImageLightbox
                  className="archive-entry__figure-image-trigger"
                  src={image.src}
                  alt={image.alt || "Archive photograph"}
                  caption={caption}
                  sizes={ENTRY_IMAGE_SIZES}
                  localizeContent={!isCommunityEntry}
                >
                  <span className="archive-entry__figure-image" data-archive-dynamic="true">
                    <ProgressiveImage
                      src={image.src}
                      alt={image.alt || "Archive photograph"}
                      width={dimensions.width}
                      height={dimensions.height}
                      sizes={ENTRY_IMAGE_SIZES}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      localizeAlt={!isCommunityEntry}
                    />
                  </span>
                </ImageLightbox>
              </div>
            </div>
            {caption ? (
              <figcaption data-archive-dynamic="true">
                <ArchiveContentText isCommunityEntry={isCommunityEntry}>
                  {displayCaption}
                </ArchiveContentText>
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}
