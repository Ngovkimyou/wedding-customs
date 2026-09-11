export default function ArchiveLoading() {
  return (
    <div className="archive-record-page">
      <article className="archive-entry archive-entry--loading archive-surface" aria-busy="true">
        <div className="archive-entry__loading-topbar" aria-hidden="true">
          <span className="archive-entry__loading-back-link" />
          <span className="archive-entry__loading-record-id" />
        </div>
        <div className="archive-entry__loading-title-frame" aria-hidden="true">
          <span className="archive-entry__loading-title-line" />
        </div>
        <div className="archive-entry__loading-divider" aria-hidden="true" />
        <div className="archive-entry__loading-image-frame" aria-hidden="true">
          <span className="archive-entry__loading-image" />
        </div>
        <div className="archive-entry__loading-copy" aria-hidden="true">
          <span className="archive-entry__loading-line" />
          <span className="archive-entry__loading-line" />
          <span className="archive-entry__loading-line archive-entry__loading-line--short" />
        </div>
        <span className="archive-entry__loading-note">Preparing the record…</span>
      </article>
    </div>
  );
}
