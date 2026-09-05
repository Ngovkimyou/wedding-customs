"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function CollectionBackLink() {
  return (
    <Link className="back-link" href="/">
      <span aria-hidden="true">←</span> Back to archive collection
    </Link>
  );
}

export default function ArchiveBackLink() {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "search") return <CollectionBackLink />;

  return (
    <Link className="back-link" href="/search">
      <span aria-hidden="true">←</span> Back to search results
    </Link>
  );
}
