import Link from "next/link";
import goBackIcon from "../assets/icons/go-back-icon.avif";

export default function NotFound() {
  return (
    <section className="not-found archive-surface">
      <p className="eyebrow">Archive record unavailable</p>
      <h1>This record has not been catalogued.</h1>
      <p>The archive entry you requested could not be found.</p>
      <Link className="back-link" href="/">
        <img className="back-link__icon" src={goBackIcon.src} alt="" aria-hidden="true" />
        <span className="back-link__label">Return to archive collection</span>
      </Link>
    </section>
  );
}
