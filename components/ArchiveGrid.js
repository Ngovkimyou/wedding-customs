import Link from "next/link";
import ArchiveCard from "./ArchiveCard.js";
import CommunityArchiveCards from "./CommunityArchiveCards.js";
import DecorativeDivider from "./DecorativeDivider.js";
import SectionHeading from "./SectionHeading.js";
import LocaleText from "./LocaleText.js";
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
        eyebrow={<LocaleText>The collection</LocaleText>}
        titleClassName="collection-title"
        id="collection-title"
        title={<LocaleText>Stories and traditions, preserved together.</LocaleText>}
        count={status === "loading"
          ? <LocaleText>Loading</LocaleText>
          : status === "error"
            ? <LocaleText>Unavailable</LocaleText>
            : <>{String(entries.length).padStart(2, "0")} <LocaleText>records</LocaleText></>}
      >
        <p>
          <LocaleText>Browse the numbered archive collection, then explore stories shared by the community.</LocaleText>
        </p>
      </SectionHeading>
      <div className="archive-collection__stage">
        <div className="archive-collection__body" aria-hidden="true" />
        <div className="archive-collection__body-inner">
          <DecorativeDivider compact loading="lazy" />
          {statusMessage ? (
            <p className="archive-collection__state" role={status === "error" ? "alert" : "status"}>
              <LocaleText fallback={statusMessage} />
            </p>
          ) : (
            <div className="archive-collection__groups">
              <section className="archive-collection__group" aria-labelledby="curated-collection-title">
                <header className="archive-collection__group-header">
                  <div>
                    <p className="archive-collection__group-eyebrow"><LocaleText>Curated records</LocaleText></p>
                    <h2 id="curated-collection-title"><LocaleText>Archive Collection</LocaleText></h2>
                  </div>
                  <span className="archive-collection__group-count">
                    {String(curatorEntries.length).padStart(2, "0")} <LocaleText>{curatorEntries.length === 1 ? "record" : "records"}</LocaleText>
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
                  <p className="archive-collection__group-empty"><LocaleText>The numbered archive records will appear here.</LocaleText></p>
                )}
              </section>

              <div className="archive-collection__group-divider" aria-hidden="true">
                <span />
                <span><LocaleText>Community stories</LocaleText></span>
                <span />
              </div>

              <section className="archive-collection__group" aria-labelledby="community-collection-title">
                <header className="archive-collection__group-header">
                  <div>
                    <p className="archive-collection__group-eyebrow"><LocaleText>Shared by contributors</LocaleText></p>
                    <h2 id="community-collection-title"><LocaleText>Community Contributions</LocaleText></h2>
                  </div>
                </header>
                {communityEntries.length === 0 ? (
                  <div className="archive-collection__group-empty">
                    <p><LocaleText>No community contributions yet. Be the first to share a story.</LocaleText></p>
                  </div>
                ) : null}
                <div className="archive-grid archive-grid--community">
                  {communityEntries.length > 0 ? (
                    <CommunityArchiveCards
                      entries={communityEntries.map((entry) => ({
                        dbId: entry.dbId,
                        slug: entry.slug,
                        title: entry.title,
                        khmerTitle: entry.khmerTitle,
                        authorUsername: entry.authorUsername,
                        summary: entry.summary,
                        images: entry.images,
                        archiveNumber: entry.archiveNumber,
                      }))}
                    />
                  ) : null}
                  <Link
                    className="archive-grid__contribute"
                    href="/contribute"
                    prefetch={true}
                  >
                    <span className="visually-hidden"><LocaleText>Contribute an entry</LocaleText></span>
                    <span aria-hidden="true">+</span>
                  </Link>
                </div>
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
