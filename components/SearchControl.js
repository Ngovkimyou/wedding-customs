"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import chanFlowerBackdrop from "../assets/chan-flower-backdrop.avif";
import searchIcon from "../assets/icons/search-icon.avif";
import { prefetchRoute } from "../lib/client-navigation.js";

export default function SearchControl() {
  const router = useRouter();
  const prefetchSearch = () => prefetchRoute(router, "/search");

  return (
    <Link
      className="site-search"
      href="/search"
      prefetch={true}
      onPointerEnter={prefetchSearch}
      onPointerDown={prefetchSearch}
      onFocus={prefetchSearch}
      onTouchStart={prefetchSearch}
      aria-label="Search archive"
    >
      <span className="site-search__control" aria-hidden="true">
        <img className="site-search__backdrop" src={chanFlowerBackdrop.src} alt="" />
        <img className="site-search__icon" src={searchIcon.src} alt="" />
      </span>
    </Link>
  );
}
