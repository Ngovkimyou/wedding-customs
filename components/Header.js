"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation.js";
import MusicControl from "./MusicControl.js";
import SearchControl from "./SearchControl.js";
import SiteBrand from "./SiteBrand.js";
import headerFrame from "../assets/header-frame.avif";
import mediumHeaderFrame from "../assets/medium-header-frame.avif";
import smallHeaderFrame from "../assets/small-header-frame.avif";

const AUTH_PATHS = new Set(["/login", "/signup"]);

export default function Header() {
  const pathname = usePathname();

  if (AUTH_PATHS.has(pathname)) {
    return null;
  }

  return (
    <header className="site-header" data-site-header>
      <div className="site-header__frame">
        <picture className="site-header__art" aria-hidden="true">
          <source media="(max-width: 640px)" srcSet={smallHeaderFrame.src} />
          <source media="(max-width: 960px)" srcSet={mediumHeaderFrame.src} />
          <img src={headerFrame.src} alt="" />
        </picture>
        <div className="site-frame site-header__inner">
          <SiteBrand />
          <div className="site-header__actions">
            <SearchControl />
            <MusicControl />
            <Navigation />
          </div>
        </div>
      </div>
    </header>
  );
}
