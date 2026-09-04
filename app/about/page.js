import logo from "../../assets/logo.avif";
import largeDivider from "../../assets/large-divider.avif";
import githubIcon from "../../assets/icons/github.avif";
import gmailIcon from "../../assets/icons/gmail.avif";
import telegramIcon from "../../assets/icons/telegram.avif";
import AboutPageShell from "../../components/AboutPageShell.js";
import { archiveContact, archiveSources, musicCredits } from "../../data/about.js";
import { archiveDetails } from "../../data/archive.js";

export const metadata = { title: "About" };

const CONTACT_ICONS = {
  github: githubIcon,
  mail: gmailIcon,
  telegram: telegramIcon,
};

function ExternalLink({ href, children, className, label }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer" aria-label={label}>
      {children}
    </a>
  );
}

function Sources() {
  return (
    <section className="about-page__section about-page__sources" aria-labelledby="about-sources-title">
      <h2 id="about-sources-title">Sources &amp; Acknowledgements</h2>
      <div className="about-page__source-list">
        {archiveSources.map((source) => (
          <article className="about-page__source" key={source.label}>
            <h3>{source.label}</h3>
            {source.detail ? <p>{source.detail}</p> : null}
            {source.href ? (
              <ExternalLink href={source.href}>Visit source <span aria-hidden="true">&nearr;</span></ExternalLink>
            ) : (
              <span className="about-page__source-placeholder">{source.linkText || "Source link to be added"}</span>
            )}
          </article>
        ))}
      </div>

      <h3 className="about-page__subheading">Music credits</h3>
      <ul className="about-page__music-list">
        {musicCredits.map((track) => (
          <li key={track.id}>
            <span className="about-page__music-title">
              {track.label}{track.variant ? <em> {track.variant}</em> : null}
            </span>
            {track.links.length ? (
              <div className="about-page__music-links">
                {track.links.map((link) => (
                  <ExternalLink href={link} key={link}>Music source <span aria-hidden="true">&nearr;</span></ExternalLink>
                ))}
              </div>
            ) : (
              <span className="about-page__source-placeholder">Music source link to be added</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contact() {
  return (
    <section className="about-page__section about-page__contact" aria-labelledby="about-contact-title">
      <h2 id="about-contact-title">Contact</h2>
      <p className="about-page__section-intro">{archiveContact.note}</p>
      <div className="about-page__contact-links" aria-label="Contact links">
        {archiveContact.links.map((link) => {
          const icon = CONTACT_ICONS[link.icon];
          return (
            <div className="about-page__contact-link" key={link.label}>
              {link.href ? (
                <ExternalLink className="about-page__contact-action" href={link.href} label={`Open ${link.label}`}>
                  {icon ? <img src={icon.src} alt="" aria-hidden="true" /> : null}
                  <span>{link.label}</span>
                </ExternalLink>
              ) : (
                <span className="about-page__source-placeholder">Link to be added</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CreditBlock({ duplicate = false }) {
  const headingId = duplicate ? undefined : "about-title";

  return (
    <section
      className={`about-page${duplicate ? " about-page--duplicate" : ""}`}
      aria-labelledby={headingId}
      aria-hidden={duplicate || undefined}
      inert={duplicate || undefined}
    >
      <img className="about-page__logo" src={logo.src} alt="" aria-hidden="true" />
      <p className="eyebrow">About the project</p>
      <h1 id={headingId}>Khmer Wedding Tradition Archive</h1>
      <img className="about-page__divider" src={largeDivider.src} alt="" aria-hidden="true" />
      <p>
        {archiveDetails.name} preserves stories, photographs, ceremonies, objects, and remembered
        details from Khmer wedding traditions as they were passed down through family oral history.
      </p>
      <p>
        The archive begins with memories shared by my parents and grows as a personal record of how
        marriage customs were prepared, witnessed, celebrated, and carried forward across generations.
      </p>
      <dl className="about-page__notes" aria-label="Archive notes">
        <div><dt>Curated by</dt><dd>{archiveDetails.curator}</dd></div>
        <div><dt>Instructor</dt><dd>{archiveDetails.instructor}</dd></div>
        <div><dt>Lecture</dt><dd>{archiveDetails.lecture}</dd></div>
        <div><dt>Primary source</dt><dd>Family oral history shared by my parents.</dd></div>
      </dl>
      <Sources />
      <Contact />
    </section>
  );
}

export default function AboutPage() {
  return (
    <AboutPageShell>
      <div className="about-page__credit-track">
        <CreditBlock />
        <CreditBlock duplicate />
      </div>
    </AboutPageShell>
  );
}
