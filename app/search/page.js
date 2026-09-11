import ArchiveSearch from "../../components/ArchiveSearch.js";
import { archiveEntries } from "../../data/archive.js";
import { getArchiveDescriptionBlocks } from "../../lib/archive-search.mjs";

export const metadata = {
  title: "Search",
  description: "Search the Khmer Wedding Tradition Archive by record title or description.",
};

export default function SearchPage() {
  // Keep full stories and image metadata out of the interactive search payload.
  // Only the flattened text needed for matching/snippets crosses into the
  // client component; gallery images and decorative artwork stay server-side.
  const entries = archiveEntries.map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    khmerTitle: entry.khmerTitle,
    summary: entry.summary,
    descriptionBlocks: getArchiveDescriptionBlocks(entry),
  }));
  return <ArchiveSearch entries={entries} />;
}
