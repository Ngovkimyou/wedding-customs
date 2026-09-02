"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteBrand() {
  const pathname = usePathname();

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

  return (
    <Link
      className="site-brand"
      href="/"
      aria-label="Khmer Wedding Tradition Archive home"
      onClick={handleClick}
    >
      <span className="site-brand__mark" aria-hidden="true">✦</span>
      <span className="site-brand__title">Khmer Wedding Tradition Archive</span>
    </Link>
  );
}
