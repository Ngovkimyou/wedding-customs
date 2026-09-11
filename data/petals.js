import densePetals from "../assets/dense-petals.avif";
import lightPetals from "../assets/light-petals.avif";
import mediumPetals from "../assets/medium-petals.avif";
import onePetal from "../assets/one-petal.avif";

export const PETAL_ASSETS = [lightPetals, mediumPetals, densePetals, onePetal];

export const PETAL_LAYERS = [
  ["light", lightPetals],
  ["medium", mediumPetals],
  ["dense", densePetals],
  ["hero", onePetal],
  ["tail", mediumPetals],
];
