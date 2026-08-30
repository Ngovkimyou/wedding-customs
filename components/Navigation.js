import Link from "next/link";

const NAVIGATION_ITEMS = [
  { href: "/", label: "Collection" },
  { href: "/about", label: "About" },
];

function NavigationLinks() {
  return NAVIGATION_ITEMS.map(({ href, label }) => (
    <Link href={href} key={href}>
      {label}
    </Link>
  ));
}

export default function Navigation() {
  return (
    <nav className="site-navigation" aria-label="Primary navigation">
      <div className="site-navigation__links">
        <NavigationLinks />
      </div>
      <details className="site-navigation__more">
        <summary aria-label="Open navigation menu">
          <span aria-hidden="true">⋮</span>
        </summary>
        <div className="site-navigation__menu">
          <NavigationLinks />
        </div>
      </details>
    </nav>
  );
}
