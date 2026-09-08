import Link from "next/link";

export default function RelatedTopics({ entries = [] }) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="archive-entry__section archive-entry__related" data-archive-dynamic="true" aria-labelledby="related-topics-title">
      <h2 className="section-label" id="related-topics-title">Related topics</h2>
      <div className="archive-entry__related-grid">
        {entries.map((entry) => (
          <Link
            className="archive-entry__related-link"
            href={`/archive/${entry.slug}`}
            key={entry.slug}
            prefetch={true}
          >
            <span className="archive-entry__related-id">{entry.id}</span>
            <span className="archive-entry__related-title">{entry.title}</span>
            <span className="archive-entry__related-action">
              Open topic <span aria-hidden="true">&rarr;</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
