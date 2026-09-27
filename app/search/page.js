import ArchiveSearch from "../../components/ArchiveSearch.js";
import { getArchiveEntries } from "../../lib/supabase/entries.js";

export const metadata = {
  title: "Search",
  description: "Search the Khmer Wedding Tradition Archive by record title or description.",
};

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const { entries: archiveEntries, status } = await getArchiveEntries();

  // Keep full stories and image metadata out of the interactive search payload.
  // Only the flattened text needed for matching/snippets crosses into the
  // client component; gallery images and decorative artwork stay server-side.
  const entries = archiveEntries.map((entry) => ({
    id: entry.id,
    dbId: entry.dbId,
    slug: entry.slug,
    title: entry.title,
    khmerTitle: entry.khmerTitle,
    summary: entry.summary,
    descriptionBlocks: entry.descriptionBlocks,
  }));
  return <ArchiveSearch entries={entries} dataStatus={status} />;
}
