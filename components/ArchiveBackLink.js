"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import goBackIcon from "../assets/icons/go-back-icon.avif";

function BackLinkContent({ children }) {
  return (
    <>
      <img className="back-link__icon" src={goBackIcon.src} alt="" aria-hidden="true" />
      <span className="back-link__label">{children}</span>
    </>
  );
}

export function CollectionBackLink() {
  return (
    <Link className="back-link" href="/">
      <BackLinkContent>Back to archive collection</BackLinkContent>
    </Link>
  );
}

export default function ArchiveBackLink() {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "search") return <CollectionBackLink />;

  return (
    <Link className="back-link" href="/search">
      <BackLinkContent>Back to search results</BackLinkContent>
    </Link>
  );
}
