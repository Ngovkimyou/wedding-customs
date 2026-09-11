import { PETAL_LAYERS } from "../data/petals.js";

export default function PetalReveal({ className = "loading-screen__petals" }) {
  return (
    <div className={className} aria-hidden="true">
      {PETAL_LAYERS.map(([name, asset]) => (
        <img className={`loading-screen__petal loading-screen__petal--${name}`} src={asset.src} alt="" key={name} />
      ))}
    </div>
  );
}
