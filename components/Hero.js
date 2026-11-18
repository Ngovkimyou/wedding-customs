import DecorativeDivider from "./DecorativeDivider.js";
import KhmerScriptText from "./KhmerScriptText.js";
import coupleStamp from "../assets/couple-stamp.avif";
import pkaSla from "../assets/pka-sla.avif";
import prosProng from "../assets/pros-prong.avif";
import LocaleText from "./LocaleText.js";

export default function Hero({ details }) {
  return (
    <div className="hero-frame">
      <section className="hero archive-surface" aria-labelledby="archive-title">
        <p className="eyebrow"><KhmerScriptText><LocaleText fallback={details.metadata} /></KhmerScriptText></p>
        <h1 id="archive-title">
          <LocaleText>Khmer Wedding</LocaleText> <span className="hero-title__ending"><LocaleText>Tradition Archive</LocaleText></span>
        </h1>
        <DecorativeDivider />
        <p className="hero__description"><KhmerScriptText><LocaleText fallback={details.description} /></KhmerScriptText></p>
        <p className="hero__introduction"><KhmerScriptText><LocaleText fallback={details.introduction} /></KhmerScriptText></p>
        <p className="hero__byline">
          <LocaleText>Archived by:</LocaleText> <strong><KhmerScriptText>{details.curator}</KhmerScriptText></strong>
        </p>
      </section>
      <img
        className="hero-frame__object hero-frame__pros-prong"
        src={prosProng.src}
        alt=""
        aria-hidden="true"
      />
      <img
        className="hero-frame__object hero-frame__pka-sla"
        src={pkaSla.src}
        alt=""
        aria-hidden="true"
      />
      <img className="hero-frame__stamp" src={coupleStamp.src} alt="" aria-hidden="true" />
    </div>
  );
}
