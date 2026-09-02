import chanFlower from "../assets/chan-flower.avif";

export default function DecorativeDivider({ compact = false, loading = "eager" }) {
  return (
    <div
      className={`decorative-divider${compact ? " decorative-divider--compact" : ""}`}
      aria-hidden="true"
    >
      <span />
      <img src={chanFlower.src} alt="" loading={loading} decoding="async" />
      <span />
    </div>
  );
}
