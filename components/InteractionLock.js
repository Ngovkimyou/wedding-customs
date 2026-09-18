export default function InteractionLock({ message }) {
  return (
    <div
      className="site-interaction-lock"
      role="status"
      aria-label={message}
      aria-live="assertive"
    >
      <span className="site-interaction-lock__label">{message}</span>
    </div>
  );
}
