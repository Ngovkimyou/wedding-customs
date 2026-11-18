import logo from "../../assets/logo.avif";
import largeDivider from "../../assets/large-divider.avif";
import githubIcon from "../../assets/icons/github.avif";
import gmailIcon from "../../assets/icons/gmail.avif";
import telegramIcon from "../../assets/icons/telegram.avif";
import AboutPageShell from "../../components/AboutPageShell.js";
import KhmerScriptText from "../../components/KhmerScriptText.js";
import { archiveContact, archiveSources, musicCredits } from "../../data/about.js";
import { archiveDetails } from "../../data/archive.js";
import LocaleText from "../../components/LocaleText.js";

export const metadata = { title: "About" };

const CONTACT_ICONS = {
  github: githubIcon,
  mail: gmailIcon,
  telegram: telegramIcon,
};

function ExternalLink({ href, children, className, label }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {children}
    </a>
  );
}

function Sources({ idPrefix }) {
  return (
    <section className="about-page__section about-page__sources" aria-labelledby={`${idPrefix}-sources-title`}>
      <h2 id={`${idPrefix}-sources-title`}><LocaleText>Sources &amp; Acknowledgements</LocaleText></h2>
      <div className="about-page__source-list">
        {archiveSources.map((source) => (
          <article className="about-page__source" key={source.label}>
            <h3><LocaleText fallback={source.label} /></h3>
            {source.detail ? <p><LocaleText fallback={source.detail} /></p> : null}
            {source.href ? (
              <ExternalLink href={source.href}><LocaleText>Visit source</LocaleText> <span aria-hidden="true">↗</span></ExternalLink>
            ) : (
              <span className="about-page__source-placeholder">{source.linkText || <LocaleText>Source link to be added</LocaleText>}</span>
            )}
          </article>
        ))}
      </div>

      <h3 className="about-page__subheading"><LocaleText>Music credits</LocaleText></h3>
      <ul className="about-page__music-list">
        {musicCredits.map((track) => (
          <li key={track.id}>
            <span className="about-page__music-title">
              <LocaleText fallback={track.label} />
              {track.variant ? <em> <LocaleText fallback={track.variant} /></em> : null}
            </span>
            {track.links.length ? (
              <div className="about-page__music-links">
                {track.links.map((link) => (
                  <ExternalLink href={link} key={link}><LocaleText>Music source</LocaleText> <span aria-hidden="true">↗</span></ExternalLink>
                ))}
              </div>
            ) : (
              <span className="about-page__source-placeholder"><LocaleText>Music source link to be added</LocaleText></span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contact({ idPrefix }) {
  return (
    <section className="about-page__section about-page__contact" aria-labelledby={`${idPrefix}-contact-title`}>
      <h2 id={`${idPrefix}-contact-title`}><LocaleText>Contact</LocaleText></h2>
      <p className="about-page__section-intro">
        <LocaleText fallback={archiveContact.note} />
      </p>
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
                <span className="about-page__source-placeholder"><LocaleText>Link to be added</LocaleText></span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CreditBlock({ idPrefix }) {
  const headingId = `${idPrefix}-title`;

  return (
    <section
      className="about-page"
      aria-labelledby={headingId}
    >
      <img className="about-page__logo" src={logo.src} alt="" aria-hidden="true" />
      <p className="eyebrow"><LocaleText>About the project</LocaleText></p>
      <h1 id={headingId}><LocaleText>Khmer Wedding Tradition Archive</LocaleText></h1>
      <img className="about-page__divider" src={largeDivider.src} alt="" aria-hidden="true" />
      <p>
        <LocaleText fallback={`${archiveDetails.name} preserves stories, photographs, ceremonies, objects, and remembered details from Khmer wedding traditions as they were passed down through family oral history.`} />
      </p>
      <p>
        <LocaleText>The archive begins with memories shared by my parents and grows as a personal record of how marriage customs were prepared, witnessed, celebrated, and carried forward across generations.</LocaleText>
      </p>
      <dl className="about-page__notes" aria-label="Archive notes">
        <div><dt><LocaleText>Curated by</LocaleText></dt><dd><KhmerScriptText>{archiveDetails.curator}</KhmerScriptText></dd></div>
        <div><dt><LocaleText>Instructor</LocaleText></dt><dd><KhmerScriptText>{archiveDetails.instructor}</KhmerScriptText></dd></div>
        <div><dt><LocaleText>Lecture</LocaleText></dt><dd><KhmerScriptText>{archiveDetails.lecture}</KhmerScriptText></dd></div>
        <div><dt><LocaleText>Primary source</LocaleText></dt><dd><LocaleText>Family oral history shared by my parents.</LocaleText></dd></div>
      </dl>
      <Sources idPrefix={idPrefix} />
      <Contact idPrefix={idPrefix} />
    </section>
  );
}

export default function AboutPage() {
  return (
    <AboutPageShell>
      <div className="about-page__credit-track">
        <CreditBlock idPrefix="about" />
        <CreditBlock idPrefix="about-repeat" />
      </div>
    </AboutPageShell>
  );
}
