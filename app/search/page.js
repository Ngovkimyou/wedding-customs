import ArchiveSearch from "../../components/ArchiveSearch.js";
import { archiveEntries } from "../../data/archive.js";

export const metadata = {
  title: "Search",
  description: "Search the Khmer Wedding Tradition Archive by record title.",
};

export default function SearchPage() {
  // Keep full stories and image metadata out of the interactive search payload.
  const entries = archiveEntries.map(({ id, slug, title, summary }) => ({ id, slug, title, summary }));
  return <ArchiveSearch entries={entries} />;
}
