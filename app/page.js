import ArchiveGrid from "../components/ArchiveGrid.js";
import Hero from "../components/Hero.js";
import { archiveDetails } from "../data/archive.js";
import { getArchiveEntries } from "../lib/supabase/entries.js";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { entries, status } = await getArchiveEntries();

  return (
    <div className="archive-home">
      <div className="opening-screen">
        <Hero details={archiveDetails} />
      </div>
      <ArchiveGrid entries={entries} status={status} />
    </div>
  );
}
