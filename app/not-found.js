import Link from "next/link";
import goBackIcon from "../assets/icons/go-back-icon.avif";

import LocaleText from "../components/LocaleText.js";

export default function NotFound() {
  return (
    <section className="not-found archive-surface">
      <p className="eyebrow"><LocaleText>Archive record unavailable</LocaleText></p>
      <h1><LocaleText>This record has not been catalogued.</LocaleText></h1>
      <p><LocaleText>The archive entry you requested could not be found.</LocaleText></p>
      <Link className="back-link" href="/">
        <img className="back-link__icon" src={goBackIcon.src} alt="" aria-hidden="true" />
        <span className="back-link__label"><LocaleText>Return to archive collection</LocaleText></span>
      </Link>
    </section>
  );
}
