import ArchiveEntry from "../../../components/ArchiveEntry.js";
import { archiveDetails, archiveEntries, getArchiveEntry } from "../../../data/archive.js";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return archiveEntries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = getArchiveEntry(slug);

  return {
    title: entry ? `${entry.title} | ${archiveDetails.name}` : "Archive record not found",
  };
}

export default async function ArchiveRecordPage({ params }) {
  const { slug } = await params;
  const entry = getArchiveEntry(slug);

  if (!entry) {
    notFound();
  }

  return <ArchiveEntry entry={entry} />;
}
