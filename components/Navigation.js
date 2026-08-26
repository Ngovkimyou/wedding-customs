import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="site-navigation" aria-label="Primary navigation">
      <Link href="/">Collection</Link>
      <Link href="/about">About</Link>
    </nav>
  );
}
