import Link from "next/link";
import ArchiveCard from "./ArchiveCard.js";
import DecorativeDivider from "./DecorativeDivider.js";
import SectionHeading from "./SectionHeading.js";
import pkaSlaGarland from "../assets/pka-sla-garland.avif";
import desktopSmallerPkaSlaGarland from "../assets/desktop-smaller-pka-sla-garland.avif";
import tabletPkaSlaGarland from "../assets/tablet-pka-sla-garland.avif";
import mobilePkaSlaGarland from "../assets/mobile-pka-sla-garland.avif";

// The opening screen occupies the first viewport, so only the first card is
// promoted to high priority. Remaining thumbnails stay lazy and can load as
// the collection approaches the viewport.
const INITIAL_CARD_COUNT = 1;

export default function ArchiveGrid({ entries = [], status = "ready" }) {
  const curatorEntries = entries.filter((entry) => Number.isInteger(entry.archiveNumber));
  const communityEntries = entries.filter((entry) => !Number.isInteger(entry.archiveNumber));
  const statusMessage = status === "loading"
    ? "Loading archive records…"
    : status === "error"
      ? "The archive is temporarily unavailable. Please try again shortly."
      : "";

  return (
    <section className="archive-collection" aria-labelledby="collection-title">
      <SectionHeading
        eyebrow="The collection"
        titleClassName="collection-title"
        id="collection-title"
        title="Stories and traditions, preserved together."
        count={status === "loading"
          ? "Loading"
          : status === "error"
            ? "Unavailable"
            : `${String(entries.length).padStart(2, "0")} records`}
      >
        <p>
          Browse the numbered archive collection, then explore stories shared by the community.
        </p>
      </SectionHeading>
      <div className="archive-collection__stage">
        <div className="archive-collection__body" aria-hidden="true" />
        <div className="archive-collection__body-inner">
          <DecorativeDivider compact loading="lazy" />
          {statusMessage ? (
            <p className="archive-collection__state" role={status === "error" ? "alert" : "status"}>
              {statusMessage}
            </p>
          ) : (
            <div className="archive-collection__groups">
              <section className="archive-collection__group" aria-labelledby="curated-collection-title">
                <header className="archive-collection__group-header">
                  <div>
                    <p className="archive-collection__group-eyebrow">Curated records</p>
                    <h2 id="curated-collection-title">Archive Collection</h2>
                  </div>
                  <span className="archive-collection__group-count">
                    {String(curatorEntries.length).padStart(2, "0")} {curatorEntries.length === 1 ? "record" : "records"}
                  </span>
                </header>
                {curatorEntries.length ? (
                  <div className="archive-grid">
                    {curatorEntries.map((entry, index) => (
                      <ArchiveCard
                        entry={entry}
                        eager={index < INITIAL_CARD_COUNT}
                        key={entry.dbId ?? entry.id}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="archive-collection__group-empty">The numbered archive records will appear here.</p>
                )}
              </section>

              <div className="archive-collection__group-divider" aria-hidden="true">
                <span />
                <span>Community stories</span>
                <span />
              </div>

              <section className="archive-collection__group" aria-labelledby="community-collection-title">
                <header className="archive-collection__group-header">
                  <div>
                    <p className="archive-collection__group-eyebrow">Shared by contributors</p>
                    <h2 id="community-collection-title">Community Contributions</h2>
                  </div>
                  <div className="archive-collection__group-actions">
                    <span className="archive-collection__group-count">
                      {String(communityEntries.length).padStart(2, "0")} {communityEntries.length === 1 ? "entry" : "entries"}
                    </span>
                    <Link
                      aria-label="Contribute an entry"
                      className="archive-collection__group-cta"
                      href="/contribute"
                      prefetch={true}
                    >
                      <span aria-hidden="true">+</span>
                    </Link>
                  </div>
                </header>
                {communityEntries.length ? (
                  <div className="archive-grid">
                    {communityEntries.map((entry) => (
                      <ArchiveCard entry={entry} key={entry.dbId ?? entry.slug} />
                    ))}
                  </div>
                ) : (
                  <div className="archive-collection__group-empty">
                    <p>No community contributions yet. Be the first to share a story.</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
        <picture className="archive-collection__garland" aria-hidden="true">
          <source media="(max-width: 640px)" srcSet={mobilePkaSlaGarland.src} />
          <source media="(max-width: 960px)" srcSet={tabletPkaSlaGarland.src} />
          <source media="(max-width: 1499px)" srcSet={desktopSmallerPkaSlaGarland.src} />
          <img
            src={pkaSlaGarland.src}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
    </section>
  );
}
