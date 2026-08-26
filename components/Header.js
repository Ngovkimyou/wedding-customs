import Link from "next/link";
import Navigation from "./Navigation.js";

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-frame site-header__inner">
        <Link className="site-brand" href="/" aria-label="Khmer Wedding Tradition Archive home">
          <span className="site-brand__mark" aria-hidden="true">
            ✦
          </span>
          <span>
            <span className="site-brand__title">Khmer Wedding Tradition Archive</span>
          </span>
        </Link>
        <Navigation />
      </div>
    </header>
  );
}
