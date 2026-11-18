import Link from "next/link";
import LocaleText from "./LocaleText.js";
import ArchiveContentText from "./ArchiveContentText.js";
import RelatedTopicTitles from "./RelatedTopicTitles.js";
import { isCommunityArchiveEntry } from "../lib/archive-entry-mapper.mjs";

export default function RelatedTopics({ entries = [] }) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="archive-entry__section archive-entry__related" data-archive-dynamic="true" aria-labelledby="related-topics-title">
      <h2 className="section-label" id="related-topics-title"><LocaleText>Related topics</LocaleText></h2>
      <div className="archive-entry__related-grid">
        {entries.map((entry) => (
          <Link
            className="archive-entry__related-link"
            href={`/archive/${entry.slug}`}
            key={entry.slug}
            prefetch={true}
          >
            <span className="archive-entry__related-id">
              <ArchiveContentText isCommunityEntry={isCommunityArchiveEntry(entry)}>
                {entry.id}
              </ArchiveContentText>
            </span>
            <RelatedTopicTitles title={entry.title} khmerTitle={entry.khmerTitle} />
            <span className="archive-entry__related-action">
              <LocaleText>Open topic</LocaleText> <span aria-hidden="true">&rarr;</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
