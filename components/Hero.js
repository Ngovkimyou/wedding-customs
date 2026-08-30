import DecorativeDivider from "./DecorativeDivider.js";
import coupleStamp from "../assets/couple-stamp.png";
import pkaSla from "../assets/pka-sla.png";
import prosProng from "../assets/pros-prong.png";

export default function Hero({ details }) {
  return (
    <div className="hero-frame">
      <section className="hero archive-surface" aria-labelledby="archive-title">
        <p className="eyebrow">{details.metadata}</p>
        <h1 id="archive-title">
          Khmer Wedding <span className="hero-title__ending">Tradition Archive</span>
        </h1>
        <DecorativeDivider />
        <p className="hero__description">{details.description}</p>
        <p className="hero__introduction">{details.introduction}</p>
        <p className="hero__byline">
          Archived by: <strong>{details.curator}</strong>
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
