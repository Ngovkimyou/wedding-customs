import ProgressiveImage from "./ProgressiveImage.js";
import ImageLightbox from "./ImageLightbox.js";
import KhmerScriptText from "./KhmerScriptText.js";
import { getAssetSource, getImageDimensions } from "../lib/media.js";

export function DescriptionGallery({ images, caption, layout }) {
  if (!images?.length) {
    return null;
  }

  const classNames = ["archive-entry__subsection-gallery"];

  if (caption) {
    classNames.push("archive-entry__subsection-gallery--connected");
  }

  if (layout === "full") {
    classNames.push("archive-entry__subsection-gallery--full");
  }

  if (layout === "triple") {
    classNames.push("archive-entry__subsection-gallery--triple");
  }

  return (
    <div className={classNames.join(" ")}>
      <div className="archive-entry__subsection-gallery-grid">
        {images.map((image, index) => {
          const dimensions = getImageDimensions(image.src, 1441, 1062);
          const imageKey = getAssetSource(image.src) || `${image.alt || "image"}-${index}`;

          return (
            <figure key={imageKey}>
              <ImageLightbox
                src={image.src}
                alt={image.alt || "Wedding ceremony photograph"}
                caption={image.caption || caption || ""}
                sizes="(max-width: 40rem) 100vw, 22rem"
              >
                <ProgressiveImage
                  src={image.src}
                  alt={image.alt || "Wedding ceremony photograph"}
                  width={dimensions.width}
                  height={dimensions.height}
                  sizes="(max-width: 40rem) 100vw, 22rem"
                  loading="lazy"
                />
              </ImageLightbox>
              {image.caption ? (
                <figcaption><KhmerScriptText>{image.caption}</KhmerScriptText></figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>
      {caption ? (
        <p className="archive-entry__subsection-gallery-caption">
          <KhmerScriptText>{caption}</KhmerScriptText>
        </p>
      ) : null}
    </div>
  );
}

export function DescriptionGalleryStack({ galleries, sharedCaption }) {
  if (!galleries?.length) {
    return null;
  }

  const stackClassNames = ["archive-entry__subsection-gallery-stack"];
  const leadGallery = sharedCaption ? galleries[0] : null;
  const groupedGalleries = sharedCaption ? galleries.slice(1) : galleries;

  if (sharedCaption) {
    stackClassNames.push("archive-entry__subsection-gallery-stack--connected");
  }

  return (
    <>
      {leadGallery ? (
        <DescriptionGallery
          images={leadGallery.images}
          caption={leadGallery.caption}
          layout={leadGallery.layout}
        />
      ) : null}
      <div className={stackClassNames.join(" ")}>
        {groupedGalleries.map((gallery, index) => (
          <DescriptionGallery
            key={
              getAssetSource(gallery.images?.[0]?.src)
              || gallery.caption
              || `${gallery.layout || "gallery"}-${index}`
            }
            images={gallery.images}
            caption={gallery.caption}
            layout={gallery.layout}
          />
        ))}
        {sharedCaption ? (
          <p className="archive-entry__subsection-gallery-caption">
            <KhmerScriptText>{sharedCaption}</KhmerScriptText>
          </p>
        ) : null}
      </div>
    </>
  );
}
