"use client";

import { translate } from "../lib/locale.js";
import { translateArchiveContent } from "../lib/archive-content-km.js";
import KhmerScriptText from "./KhmerScriptText.js";
import { useLocale } from "./LocaleProvider.js";

export default function LocaleText({ children, fallback, as: Element = null, className, en, km, archiveContent = false }) {
  const { locale } = useLocale();
  const isBilingualText = typeof en === "string" || typeof km === "string";
  const sourceText = fallback ?? children;
  const text = isBilingualText
    ? locale === "km" ? km ?? en : en ?? km
    : archiveContent
      ? translate(locale, translateArchiveContent(locale, sourceText))
      : translate(locale, sourceText);
  const localizedText = <KhmerScriptText keyPrefix="locale-text">{text}</KhmerScriptText>;
  return Element
    ? <Element className={className} lang={locale}>{localizedText}</Element>
    : localizedText;
}
