import { Suspense } from "react";
import { getAdjacentEntries, getRelatedEntries } from "../data/archive.js";
import ArchiveAside from "./ArchiveAside.js";
import ArchiveBackLink, { CollectionBackLink } from "./ArchiveBackLink.js";
import ArchiveDescription from "./ArchiveDescription.js";
import ArchiveEntryImages from "./ArchiveEntryImages.js";
import ArchiveMetadata from "./ArchiveMetadata.js";
import ArchiveNavigation from "./ArchiveNavigation.js";
import ArchiveOwnerActions from "./ArchiveOwnerActions.js";
import ArchiveSwipeNavigation from "./ArchiveSwipeNavigation.js";
import DecorativeDivider from "./DecorativeDivider.js";
import RelatedTopics from "./RelatedTopics.js";
import { isCommunityArchiveEntry } from "../lib/archive-entry-mapper.mjs";

export default function ArchiveEntry({ entry }) {
  const { previous, next, position, total } = getAdjacentEntries(entry.slug);
  const relatedEntries = getRelatedEntries(entry.slug);
  const isCommunityEntry = isCommunityArchiveEntry(entry);
  const canManageEntry = Boolean(entry.dbId && isCommunityEntry);

  return (
    <>
      <ArchiveNavigation next={next} position={position} previous={previous} total={total} />
      <ArchiveSwipeNavigation nextSlug={next?.slug} previousSlug={previous?.slug} />

      <article className="archive-entry archive-surface">
        <div className="archive-entry__topbar">
          <Suspense fallback={<CollectionBackLink />}>
            <ArchiveBackLink />
          </Suspense>
          {!isCommunityEntry && entry.id ? (
            <p className="eyebrow archive-entry__record-id" data-archive-dynamic="true">
              {entry.id}
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
            <h1 data-archive-dynamic="true">{entry.title}</h1>
          </div>
          <p className="archive-entry__khmer-title" data-archive-dynamic="true">
            {entry.khmerTitle}
          </p>
        </header>

        <DecorativeDivider />
        <ArchiveEntryImages images={entry.images} />
        <ArchiveDescription entry={entry} />
        <ArchiveAside entry={entry} />
        <DecorativeDivider compact />

        <section className="archive-entry__section" aria-labelledby="notes-title">
          <h2 className="section-label" id="notes-title">Archive notes</h2>
          <div data-archive-dynamic="true">
            <ArchiveMetadata entry={entry} />
          </div>
        </section>

        <RelatedTopics entries={relatedEntries} />
      </article>
    </>
  );
}
