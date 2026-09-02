import chanFlower from "../assets/chan-flower.png";

export default function DecorativeDivider({ compact = false }) {
  return (
    <div
      className={`decorative-divider${compact ? " decorative-divider--compact" : ""}`}
      aria-hidden="true"
    >
      <span />
      <img src={chanFlower.src} alt="" />
      <span />
    </div>
  );
}
