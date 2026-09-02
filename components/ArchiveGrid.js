import ArchiveCard from "./ArchiveCard.js";
import DecorativeDivider from "./DecorativeDivider.js";
import SectionHeading from "./SectionHeading.js";
import pkaSlaGarland from "../assets/pka-sla-garland.png";
import desktopSmallerPkaSlaGarland from "../assets/desktop-smaller-pka-sla-garland.png";
import tabletPkaSlaGarland from "../assets/tablet-pka-sla-garland.png";
import mobilePkaSlaGarland from "../assets/mobile-pka-sla-garland.png";

export default function ArchiveGrid({ entries }) {
  return (
    <section className="archive-collection" aria-labelledby="collection-title">
      <SectionHeading
        eyebrow="The collection"
        titleClassName="collection-title"
        id="collection-title"
        title="Preserved records, waiting to be opened."
        count={`${String(entries.length).padStart(2, "0")} records`}
      >
        <p>
          Each record is a placeholder for an interview, photograph, memory, object, or tradition
          to be added to the archive.
        </p>
      </SectionHeading>
      <div className="archive-collection__stage">
        <div className="archive-collection__body" aria-hidden="true" />
        <div className="archive-collection__body-inner">
          <DecorativeDivider compact />
          <div className="archive-grid">
            {entries.map((entry) => (
              <ArchiveCard entry={entry} key={entry.id} />
            ))}
          </div>
        </div>
        <picture className="archive-collection__garland" aria-hidden="true">
          <source media="(max-width: 640px)" srcSet={mobilePkaSlaGarland.src} />
          <source media="(max-width: 960px)" srcSet={tabletPkaSlaGarland.src} />
          <source media="(max-width: 1499px)" srcSet={desktopSmallerPkaSlaGarland.src} />
          <img src={pkaSlaGarland.src} alt="" />
        </picture>
      </div>
    </section>
  );
}
