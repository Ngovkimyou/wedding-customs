"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import addContributionIcon from "../assets/add-contribution.avif";
import chanFlowerBackdrop from "../assets/chan-flower-backdrop.avif";
import { prefetchRoute } from "../lib/client-navigation.js";

export default function ContributionControl() {
  const router = useRouter();
  const prefetchContribution = () => prefetchRoute(router, "/contribute");

  return (
    <Link
      className="site-contribute"
      href="/contribute"
      prefetch={true}
      onPointerEnter={prefetchContribution}
      onPointerDown={prefetchContribution}
      onFocus={prefetchContribution}
      onTouchStart={prefetchContribution}
      aria-label="Contribute a story"
    >
      <span className="site-contribute__control" aria-hidden="true">
        <img className="site-contribute__backdrop" src={chanFlowerBackdrop.src} alt="" />
        <img className="site-contribute__icon" src={addContributionIcon.src} alt="" />
      </span>
    </Link>
  );
}
