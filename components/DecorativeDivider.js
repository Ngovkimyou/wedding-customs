export default function DecorativeDivider({ compact = false }) {
  return (
    <div
      className={`decorative-divider${compact ? " decorative-divider--compact" : ""}`}
      aria-hidden="true"
    >
      <span />
      <i>✦</i>
      <span />
    </div>
  );
}
