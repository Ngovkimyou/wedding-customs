export default function ArchiveLoading() {
  return (
    <article className="archive-entry archive-entry--loading archive-surface" aria-busy="true">
      <p className="eyebrow">Opening archive record</p>
      <div className="archive-entry__loading-line" aria-hidden="true" />
      <div className="archive-entry__loading-line archive-entry__loading-line--short" aria-hidden="true" />
      <span className="archive-entry__loading-note">Preparing the record…</span>
    </article>
  );
}
