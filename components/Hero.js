import DecorativeDivider from "./DecorativeDivider.js";

export default function Hero({ details }) {
  return (
    <section className="hero archive-surface" aria-labelledby="archive-title">
      <p className="eyebrow">{details.metadata}</p>
      <h1 id="archive-title">{details.name}</h1>
      <DecorativeDivider />
      <p className="hero__description">{details.description}</p>
      <p className="hero__introduction">{details.introduction}</p>
      <p className="hero__byline">
        Archived by: <strong>{details.curator}</strong>
      </p>
    </section>
  );
}
