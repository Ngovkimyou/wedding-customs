"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import logo from "../assets/logo.avif";
import { prefetchRoute } from "../lib/client-navigation.js";

export default function SiteBrand() {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (event) => {
    if (pathname !== "/") {
      return;
    }

    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const prefetchHome = () => prefetchRoute(router, "/");

  return (
    <Link
      className="site-brand"
      href="/"
      prefetch={true}
      onPointerEnter={prefetchHome}
      onPointerDown={prefetchHome}
      onFocus={prefetchHome}
      onTouchStart={prefetchHome}
      aria-label="Khmer Wedding Tradition Archive home"
      onClick={handleClick}
    >
      <img className="site-brand__logo" src={logo.src} alt="" aria-hidden="true" />
      <span className="site-brand__title">Khmer Wedding Tradition Archive</span>
    </Link>
  );
}
