import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found archive-surface">
      <p className="eyebrow">Archive record unavailable</p>
      <h1>This record has not been catalogued.</h1>
      <p>The archive entry you requested could not be found.</p>
      <Link className="back-link" href="/">
        <span aria-hidden="true">←</span> Return to archive collection
      </Link>
    </section>
  );
}
