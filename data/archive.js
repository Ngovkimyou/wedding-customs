import archive001Image from "../assets/images/archive-001.avif";
import archive002Image from "../assets/images/archive-002.avif";
import archive003Image from "../assets/images/archive-003.avif";
import archive004Image from "../assets/images/archive-004.avif";
import archive005Image from "../assets/images/archive-005.avif";

export const archiveDetails = {
  name: "Khmer Wedding Tradition Archive",
  curator: "Kimyoo",
  instructor: "Jesse Orndorff",
  lecture: "Vibe Coding Class - Section 001",
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
    summary: "How the Couple Met",
    images: [
      {
        src: archive001Image,
        alt: "Photograph for Archive 001",
      },
    ],
  },
  {
    id: "ARCHIVE 002",
    slug: "courtship-and-family-involvement",
    category: "Family & Courtship",
    title: "Courtship and Family Involvement",
    summary: "The Tradition of Partners Introduction - After the First Meeting",
    images: [
      {
        src: archive002Image,
        alt: "Photograph for Archive 002",
      },
    ],
  },
  {
    id: "ARCHIVE 003",
    slug: "engagement-traditions",
    category: "Engagement",
    title: "Engagement Traditions",
    summary: "On Pre-Wedding Family Meeting",
    images: [
      {
        src: archive003Image,
        alt: "Photograph for Archive 003",
      },
    ],
  },
  {
    id: "ARCHIVE 004",
    slug: "wedding-preparation",
    category: "Preparation",
    title: "Wedding Preparation",
    summary: "About Wedding Preparations - About the Gold Received From the Boy's Family - Before the Wedding Day",
    images: [
      {
        src: archive004Image,
        alt: "Photograph for Archive 004",
      },
    ],
  },
  {
    id: "ARCHIVE 005",
    slug: "traditional-khmer-wedding-ceremonies",
    category: "Ceremony",
    title: "Traditional Khmer Wedding Ceremonies",
    summary: "On Wedding Day",
    images: [
      {
        src: archive005Image,
        alt: "Photograph for Archive 005",
      },
    ],
  },
  {
    id: "ARCHIVE 006",
    slug: "clothing-and-accessories",
    category: "Dress & Adornment",
    title: "Clothing and Accessories",
    summary: "",
  },
  {
    id: "ARCHIVE 007",
    slug: "ceremonial-objects",
    category: "Objects",
    title: "Ceremonial Objects",
    summary: "",
  },
  {
    id: "ARCHIVE 008",
    slug: "food",
    category: "Food",
    title: "Food",
    summary: "",
  },
  {
    id: "ARCHIVE 009",
    slug: "music",
    category: "Music",
    title: "Music",
    summary: "",
  },
  {
    id: "ARCHIVE 010",
    slug: "family-roles",
    category: "Family",
    title: "Family Roles",
    summary: "",
  },
  {
    id: "ARCHIVE 011",
    slug: "changes-in-khmer-wedding-traditions",
    category: "Change Over Time",
    title: "Changes in Khmer Wedding Traditions Over Time",
    summary: "",
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
