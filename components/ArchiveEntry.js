import { Suspense } from "react";
import { getAdjacentEntries, getRelatedEntries } from "../data/archive.js";
import ArchiveAside from "./ArchiveAside.js";
import ArchiveBackLink, { CollectionBackLink } from "./ArchiveBackLink.js";
import ArchiveDescription from "./ArchiveDescription.js";
import ArchiveEntryImages from "./ArchiveEntryImages.js";
import ArchiveKhmerTitle from "./ArchiveKhmerTitle.js";
import ArchiveMetadata from "./ArchiveMetadata.js";
import ArchiveNavigation from "./ArchiveNavigation.js";
import ArchiveOwnerActions from "./ArchiveOwnerActions.js";
import ArchiveSwipeNavigation from "./ArchiveSwipeNavigation.js";
import ArchiveTitle from "./ArchiveTitle.js";
import ArchiveContentText from "./ArchiveContentText.js";
import DecorativeDivider from "./DecorativeDivider.js";
import RelatedTopics from "./RelatedTopics.js";
import { isCommunityArchiveEntry } from "../lib/archive-entry-mapper.mjs";
import LocaleText from "./LocaleText.js";

export default function ArchiveEntry({ entry, communityNavigation }) {
  const isCommunityEntry = isCommunityArchiveEntry(entry);
  const adjacentEntries = isCommunityEntry
    ? communityNavigation
    : getAdjacentEntries(entry.slug);
  const { previous, next, position, total } = adjacentEntries ?? {
    previous: null,
    next: null,
    position: null,
    total: 0,
  };
  const relatedEntries = getRelatedEntries(entry.slug);
  const canManageEntry = Boolean(entry.dbId && isCommunityEntry);

  return (
    <>
      <ArchiveNavigation
        entryType={isCommunityEntry ? "community" : "record"}
        next={next}
        position={position}
        previous={previous}
        total={total}
      />
      <ArchiveSwipeNavigation nextSlug={next?.slug} previousSlug={previous?.slug} />

      {/* Swipe classes are applied directly to the outgoing DOM node. Remount
          on slug changes so those classes cannot delay the incoming animation. */}
      <article key={entry.slug} className="archive-entry archive-surface">
        <div className="archive-entry__topbar">
          <Suspense fallback={<CollectionBackLink />}>
            <ArchiveBackLink />
          </Suspense>
          {!isCommunityEntry && entry.id ? (
            <p className="eyebrow archive-entry__record-id" data-archive-dynamic="true">
              <ArchiveContentText>{entry.id}</ArchiveContentText>
            </p>
          ) : null}
          {canManageEntry ? (
            <ArchiveOwnerActions
              entryId={entry.dbId}
              ownerId={entry.ownerId}
              slug={entry.slug}
              title={entry.title}
            />
          ) : null}
        </div>

        <header className="archive-entry__header">
          <div className="archive-entry__title-frame">
            <ArchiveTitle
              title={entry.title}
              khmerTitle={entry.khmerTitle}
              isCommunityEntry={isCommunityEntry}
            />
          </div>
          <ArchiveKhmerTitle title={entry.title} khmerTitle={entry.khmerTitle} />
        </header>

        <DecorativeDivider />
        <ArchiveEntryImages images={entry.images} isCommunityEntry={isCommunityEntry} />
        <ArchiveDescription entry={entry} />
        <ArchiveAside entry={entry} />
        <DecorativeDivider compact />

        <section className="archive-entry__section" aria-labelledby="notes-title">
          <h2 className="section-label" id="notes-title"><LocaleText>Archive notes</LocaleText></h2>
          <div data-archive-dynamic="true">
            <ArchiveMetadata entry={entry} />
          </div>
        </section>

        <RelatedTopics entries={relatedEntries} />
      </article>
    </>
  );
}
