export const archiveDetails = {
  name: "Khmer Wedding Tradition Archive",
  curator: "Kimyoo",
  description:
    "An oral-history collection preserving family memories, traditions, ceremonies, and " +
    "stories surrounding Khmer marriage and weddings.",
  metadata: "Family Oral History · Cambodia · Early 2000s",
  introduction: "Source: Family oral history shared by my parents.",
};

const archiveEntryDefaults = {
  khmerTitle: "[Khmer title to be added]",
  period: "Early 2000s",
  summary: "[Short archive description will be added here.]",
  content: "[Full archive story or tradition description will be added here.]",
  oralHistory: "[Interview excerpt will be added here.]",
  interviewee: "[Interviewee name]",
  interviewDate: "[Interview date]",
  people: "[People involved]",
  location: "[Location]",
  tradition: "[Wedding custom or tradition description]",
  objects: "[Related ceremonial objects]",
  source: "[Source citation]",
  researchNotes: "[Research notes]",
};

const archiveCatalog = [
  {
    id: "ARCHIVE 001",
    slug: "how-my-parents-met",
    category: "Family Story",
    title: "How My Parents First Met",
  },
  {
    id: "ARCHIVE 002",
    slug: "courtship-and-family-involvement",
    category: "Family & Courtship",
    title: "Courtship and Family Involvement",
  },
  {
    id: "ARCHIVE 003",
    slug: "engagement-traditions",
    category: "Engagement",
    title: "Engagement Traditions",
  },
  {
    id: "ARCHIVE 004",
    slug: "wedding-preparation",
    category: "Preparation",
    title: "Wedding Preparation",
  },
  {
    id: "ARCHIVE 005",
    slug: "traditional-khmer-wedding-ceremonies",
    category: "Ceremony",
    title: "Traditional Khmer Wedding Ceremonies",
  },
  {
    id: "ARCHIVE 006",
    slug: "clothing-and-accessories",
    category: "Dress & Adornment",
    title: "Clothing and Accessories",
  },
  {
    id: "ARCHIVE 007",
    slug: "ceremonial-objects",
    category: "Objects",
    title: "Ceremonial Objects",
  },
  {
    id: "ARCHIVE 008",
    slug: "food",
    category: "Food",
    title: "Food",
  },
  {
    id: "ARCHIVE 009",
    slug: "music",
    category: "Music",
    title: "Music",
  },
  {
    id: "ARCHIVE 010",
    slug: "family-roles",
    category: "Family",
    title: "Family Roles",
  },
  {
    id: "ARCHIVE 011",
    slug: "changes-in-khmer-wedding-traditions",
    category: "Change Over Time",
    title: "Changes in Khmer Wedding Traditions Over Time",
  },
];

export const archiveEntries = archiveCatalog.map((entry) => ({
  ...archiveEntryDefaults,
  ...entry,
  images: entry.images ?? [],
}));

export function getArchiveEntry(slug) {
  return archiveEntries.find((entry) => entry.slug === slug);
}
