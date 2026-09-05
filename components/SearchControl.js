import Link from "next/link";
import chanFlowerBackdrop from "../assets/chan-flower-backdrop.avif";
import searchIcon from "../assets/icons/search-icon.avif";

export default function SearchControl() {
  return (
    <Link className="site-search" href="/search" aria-label="Search archive">
      <span className="site-search__control" aria-hidden="true">
        <img className="site-search__backdrop" src={chanFlowerBackdrop.src} alt="" />
        <img className="site-search__icon" src={searchIcon.src} alt="" />
      </span>
    </Link>
  );
}
