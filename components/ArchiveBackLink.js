"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import goBackIcon from "../assets/icons/go-back-icon.avif";
import { translate } from "../lib/locale.js";
import { useLocale } from "./LocaleProvider.js";

function BackLinkContent({ children, locale }) {
  return (
    <>
      <img className="back-link__icon" src={goBackIcon.src} alt="" aria-hidden="true" />
      <span className="back-link__label">{translate(locale, children)}</span>
    </>
  );
}

export function CollectionBackLink() {
  const { locale } = useLocale();
  return (
    <Link className="back-link" href="/">
      <BackLinkContent locale={locale}>Back to archive collection</BackLinkContent>
    </Link>
  );
}

export default function ArchiveBackLink() {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "search") return <CollectionBackLink />;

  return (
    <Link className="back-link" href="/search">
      <BackLinkContent locale={locale}>Back to search results</BackLinkContent>
    </Link>
  );
}
