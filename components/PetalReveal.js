import densePetals from "../assets/dense-petals.avif";
import lightPetals from "../assets/light-petals.avif";
import mediumPetals from "../assets/medium-petals.avif";
import onePetal from "../assets/one-petal.avif";

export const PETAL_ASSETS = [lightPetals, mediumPetals, densePetals, onePetal];

const PETAL_LAYERS = [
  ["light", lightPetals],
  ["medium", mediumPetals],
  ["dense", densePetals],
  ["hero", onePetal],
  ["tail", mediumPetals],
];

export default function PetalReveal({ className = "loading-screen__petals" }) {
  return (
    <div className={className} aria-hidden="true">
      {PETAL_LAYERS.map(([name, asset]) => (
        <img className={`loading-screen__petal loading-screen__petal--${name}`} src={asset.src} alt="" key={name} />
      ))}
    </div>
  );
}
