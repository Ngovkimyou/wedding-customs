import Link from "next/link";
import Navigation from "./Navigation.js";
import headerFrame from "../assets/header-frame.png";
import mediumHeaderFrame from "../assets/medium-header-frame.png";
import smallHeaderFrame from "../assets/small-header-frame.png";

export default function Header() {
  return (
    <header className="site-header" data-site-header>
      <div className="site-header__frame">
        <picture className="site-header__art" aria-hidden="true">
          <source media="(max-width: 640px)" srcSet={smallHeaderFrame.src} />
          <source media="(max-width: 960px)" srcSet={mediumHeaderFrame.src} />
          <img src={headerFrame.src} alt="" />
        </picture>
        <div className="site-frame site-header__inner">
          <Link className="site-brand" href="/" aria-label="Khmer Wedding Tradition Archive home">
            <span className="site-brand__mark" aria-hidden="true">✦</span>
            <span className="site-brand__title">Khmer Wedding Tradition Archive</span>
          </Link>
          <Navigation />
        </div>
      </div>
    </header>
  );
}
