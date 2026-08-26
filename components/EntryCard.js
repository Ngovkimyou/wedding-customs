export default function EntryCard({
  title,
  description,
  contributor,
  place,
  number,
}) {
  const formattedNumber = String(number).padStart(2, "0");

  return (
    <article className="entry-card">
      <div className="entry-card-top">
        <span className="entry-number">Entry {formattedNumber}</span>
        <span className="entry-tag">Oral history</span>
      </div>

      <div className="entry-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <footer className="entry-card-footer">
        <div className="entry-meta">
          <div>
            <span className="meta-label">Contributor</span>
            <strong>{contributor}</strong>
          </div>
          <div>
            <span className="meta-label">Place</span>
            <strong>{place}</strong>
          </div>
        </div>
        <span className="entry-arrow" aria-hidden="true">
          ↗
        </span>
      </footer>
    </article>
  );
}
