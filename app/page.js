import ArchiveGrid from "../components/ArchiveGrid.js";
import Hero from "../components/Hero.js";
import { archiveDetails, archiveEntries } from "../data/archive.js";

export default function Home() {
  return (
    <div className="archive-home">
      <Hero details={archiveDetails} />
      <ArchiveGrid entries={archiveEntries} />
    </div>
  );
}
