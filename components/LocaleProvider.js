"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../lib/locale.js";

const LocaleContext = createContext({ locale: DEFAULT_LOCALE, setLocale: () => {} });
const STORAGE_KEY = "wedding-archive-locale";

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const savedLocale = window.localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED_LOCALES.includes(savedLocale)) {
        setLocale(savedLocale);
      }
    } catch {
      // Keep Khmer as the default when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // The language switch still works for this page view without storage.
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
