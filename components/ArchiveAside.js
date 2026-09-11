import asideArtwork from "../assets/aside-01.avif";
import { getImageDimensions } from "../lib/media.js";
import ProgressiveImage from "./ProgressiveImage.js";

export default function ArchiveAside({ entry }) {
  if (!entry.showAside) {
    return null;
  }

  const usesFrameArtwork = entry.showAsideArtwork !== false;
  const accentDimensions = getImageDimensions(entry.asideAccentArtwork, 1200, 800);

  return (
    <section
      className={`archive-entry__aside${usesFrameArtwork ? "" : " archive-entry__aside--plain"}`}
      aria-labelledby="aside-title"
    >
      <div className="archive-entry__aside-art">
        {usesFrameArtwork ? (
          <ProgressiveImage
            className="archive-entry__aside-image"
            fill
            src={asideArtwork}
            alt=""
            sizes="(max-width: 48rem) 100vw, 48rem"
            loading="lazy"
          />
        ) : null}
        <div className="archive-entry__aside-copy">
          {entry.asideAccentArtwork ? (
            <ProgressiveImage
              className="archive-entry__aside-copy-artwork"
              src={entry.asideAccentArtwork}
              alt=""
              width={accentDimensions.width}
              height={accentDimensions.height}
              sizes="(max-width: 40rem) 60vw, 18rem"
              loading="lazy"
            />
          ) : null}
          <h2 id="aside-title" data-archive-dynamic="true">
            {entry.asideTitle || "Aside"}
          </h2>
          <p data-archive-dynamic="true">{entry.aside}</p>
        </div>
      </div>
    </section>
  );
}
