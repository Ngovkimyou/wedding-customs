const KHMER_RUN_PATTERN = /([\u1780-\u17ff\u19e0-\u19ff]+)/gu;
const KHMER_RUN_ONLY_PATTERN = /^[\u1780-\u17ff\u19e0-\u19ff]+$/u;

/**
 * Keep the Khmer script font scoped to Khmer character runs. This preserves
 * each component's existing Latin typography when a sentence mixes English
 * and Khmer text.
 */
export function withKhmerScript(value, keyPrefix = "khmer") {
  const text = String(value ?? "");
  const parts = text.split(KHMER_RUN_PATTERN);

  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => (
    KHMER_RUN_ONLY_PATTERN.test(part)
      ? <span className="khmer-script" key={`${keyPrefix}-${index}`}>{part}</span>
      : part
  ));
}

export default function KhmerScriptText({ children, keyPrefix = "khmer" }) {
  if (typeof children !== "string" && typeof children !== "number") {
    return children;
  }

  return withKhmerScript(children, keyPrefix);
}
