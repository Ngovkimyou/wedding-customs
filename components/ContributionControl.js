"use client";

import Link from "next/link";
import addContributionIcon from "../assets/add-contribution.avif";
import chanFlowerBackdrop from "../assets/chan-flower-backdrop.avif";
import { translate } from "../lib/locale.js";
import { useLocale } from "./LocaleProvider.js";

export default function ContributionControl() {
  const { locale } = useLocale();

  return (
    <Link
      className="site-contribute"
      href="/contribute"
      prefetch={false}
      aria-label={translate(locale, "Contribute a story")}
    >
      <span className="site-contribute__control" aria-hidden="true">
        <img className="site-contribute__backdrop" src={chanFlowerBackdrop.src} alt="" />
        <img className="site-contribute__icon" src={addContributionIcon.src} alt="" />
      </span>
    </Link>
  );
}
