"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useLocale } from "./LocaleProvider.js";
import cambodiaFlag from "../assets/icons/cambodia.avif";
import usaFlag from "../assets/icons/usa.avif";

const LANGUAGE_OPTIONS = [
  { locale: "en", flag: usaFlag, label: "English" },
  { locale: "km", flag: cambodiaFlag, label: "ខ្មែរ" },
];

export default function LanguageSwitcher({ floating = false }) {
  const { locale, setLocale } = useLocale();
  const switcherRef = useRef(null);
  const current = LANGUAGE_OPTIONS.find((option) => option.locale === locale) ?? LANGUAGE_OPTIONS[1];

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (switcherRef.current?.open && !switcherRef.current.contains(event.target)) {
        switcherRef.current.open = false;
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && switcherRef.current?.open) {
        switcherRef.current.open = false;
        switcherRef.current.querySelector("summary")?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const chooseLanguage = (nextLocale) => {
    setLocale(nextLocale);
    if (switcherRef.current) {
      switcherRef.current.open = false;
    }
  };

  return (
    <details
      className={`language-switcher${floating ? " language-switcher--floating" : ""}`}
      ref={switcherRef}
    >
      <summary aria-label={locale === "km" ? "ប្ដូរភាសា" : "Change language"}>
        <Image className="language-switcher__flag" src={current.flag} alt="" aria-hidden="true" />
        <span className="language-switcher__chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="language-switcher__menu" role="group" aria-label={locale === "km" ? "ជ្រើសរើសភាសា" : "Choose language"}>
        {LANGUAGE_OPTIONS.map((option) => (
          <button
            aria-current={option.locale === locale ? "true" : undefined}
            className="language-switcher__option"
            key={option.locale}
            lang={option.locale}
            onClick={() => chooseLanguage(option.locale)}
            type="button"
          >
            <Image className="language-switcher__flag" src={option.flag} alt="" aria-hidden="true" />
            <span>{option.label}</span>
            {option.locale === locale ? <span className="language-switcher__check" aria-hidden="true">✓</span> : null}
          </button>
        ))}
      </div>
    </details>
  );
}
