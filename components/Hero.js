import DecorativeDivider from "./DecorativeDivider.js";
import KhmerScriptText from "./KhmerScriptText.js";
import coupleStamp from "../assets/couple-stamp.avif";
import pkaSla from "../assets/pka-sla.avif";
import prosProng from "../assets/pros-prong.avif";

export default function Hero({ details }) {
  return (
    <div className="hero-frame">
      <section className="hero archive-surface" aria-labelledby="archive-title">
        <p className="eyebrow"><KhmerScriptText>{details.metadata}</KhmerScriptText></p>
        <h1 id="archive-title">
          Khmer Wedding <span className="hero-title__ending">Tradition Archive</span>
        </h1>
        <DecorativeDivider />
        <p className="hero__description"><KhmerScriptText>{details.description}</KhmerScriptText></p>
        <p className="hero__introduction"><KhmerScriptText>{details.introduction}</KhmerScriptText></p>
        <p className="hero__byline">
          Archived by: <strong><KhmerScriptText>{details.curator}</KhmerScriptText></strong>
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
