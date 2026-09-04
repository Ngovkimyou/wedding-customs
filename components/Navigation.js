"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import aboutIcon from "../assets/icons/about-icon.avif";
import chanFlowerBackdrop from "../assets/chan-flower-backdrop.avif";

const NAVIGATION_ITEMS = [
  { href: "/about", label: "About" },
];

function NavigationLinks() {
  return NAVIGATION_ITEMS.map(({ href, label }) => (
    <Link className="site-navigation__link" href={href} key={href}>
      <span className="site-navigation__link-label">{label}</span>
      <span className="site-navigation__link-control" aria-hidden="true">
        <img className="site-navigation__link-backdrop" src={chanFlowerBackdrop.src} alt="" />
        <img className="site-navigation__link-icon" src={aboutIcon.src} alt="" />
      </span>
    </Link>
  ));
}

export default function Navigation() {
  const moreRef = useRef(null);

  useEffect(() => {
    const handleOutsidePointer = (event) => {
      const more = moreRef.current;
      if (more?.open && !more.contains(event.target)) {
        more.removeAttribute("open");
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer);
  }, []);

  return (
    <nav className="site-navigation" aria-label="Primary navigation">
      <div className="site-navigation__links">
        <NavigationLinks />
      </div>
      <details ref={moreRef} className="site-navigation__more">
        <summary aria-label="Open navigation menu">
          <img
            className="music-control__backdrop site-navigation__more-backdrop"
            src={chanFlowerBackdrop.src}
            alt=""
            aria-hidden="true"
          />
          <span className="site-navigation__more-dots" aria-hidden="true">
            &#8226;&#8226;&#8226;
          </span>
        </summary>
        <div className="site-navigation__menu">
          <NavigationLinks />
        </div>
      </details>
    </nav>
  );
}
