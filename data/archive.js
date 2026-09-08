import archive001Image from "../assets/images/archive-001.avif";
import archive002Image from "../assets/images/archive-002.avif";
import archive003Image from "../assets/images/archive-003.avif";
import archive004Image from "../assets/images/archive-004.avif";
import archive005Image from "../assets/images/archive-005.avif";
import aside02Artwork from "../assets/aside-02.avif";

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
  period: "2003",
  summary: "[Short archive description will be added here.]",
  descriptionSections: [],
  content: "[Full archive story or tradition description will be added here.]",
  aside: "[Additional context or note to be added.]",
  showAside: true,
  oralHistory: "[Interview excerpt will be added here.]",
  interviewee: "[Interviewee name]",
  interviewDate: "15 August 2026",
  people: "[People involved]",
  location: "Phnom Penh",
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
    aside:
      "In my grandparents’ generation, choosing a partner independently was generally not permitted. " +
      "Parents held complete authority over their children’s future decisions, and the children did not " +
      "dare to oppose them.",
    descriptionSections: [
      {
        title: "How the Couple Met",
        paragraphs: [
          "Up until the early 2000s, when family rules were strict and highly respected, partners were often introduced to one another by parents. People still can choose a partner on their own, but the final decision is still under parent’s approval. A person could reject an introduced partner if they don’t like them, in which case parents would continue searching for a suitable partner through neighbors, friends, and other connections.",
        ],
      },
    ],
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
    showAside: false,
    descriptionSections: [
      {
        title: "The Tradition of Partners Introduction",
        paragraphs: [
          [
            "After the parents found a suitable partner, a date for the first meeting would be arranged between the parents of both families. The boy and his parents would visit the girl’s house with gifts as a token of gratitude. The meeting was simple and casual, much like visiting a friend’s house. The girl’s family would prepare tea and num (snacks or ",
            { text: "Num Ansom", archiveSlug: "food" },
            ") to serve the visiting guests.",
          ],
          "During the meeting, the parents on both sides would encourage conversation between the boy and the girl. This was an opportunity for them to get to know each other through their attitudes, manners, and ways of speaking rather than simply judging each other by appearance. At the time, good manners and coming from a respectable family were highly valued in society.",
        ],
      },
      {
        title: "Did You Know?",
        artwork: aside02Artwork,
        paragraphs: [
          "Before the late 1980s, traditional Khmer weddings often lasted three days. However, many families could not afford a full three-day celebration because wedding costs were high. Instead, they held a more casual celebration, much like a party.",
        ],
      },
      {
        title: "After the First Meeting",
        paragraphs: [
          "The parents of both families would give their children some time to consider whether they liked each other. Giving an answer right away during the first meeting would be considered very rude. Once they had made their decisions, they could inform their parents, but the boy’s family must pass the answer on to the other family first. If both sides were satisfied with each other’s answers, the two families would then decide on a date for a pre-wedding family meeting.",
        ],
      },
    ],
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
    descriptionSections: [
      {
        title: "On Pre-Wedding Family Meeting",
        paragraphs: [
          [
            "Just like the first meeting, the pre-wedding family meeting was simple and casual, with tea being served and ",
            { text: "num", archiveSlug: "food", emphasis: true },
            " being prepared. The quantity and quality of the ",
            { text: "num", emphasis: true },
            " depended on the family’s wealth. The two families and their relatives would join this important discussion about the ",
            { text: "wedding preparations", archiveSlug: "wedding-preparation" },
            ". At the time, wedding rings were usually offered during this meeting, unlike in modern times, when they are typically exchanged on the wedding day.",
          ],
          [
            "On the day of the pre-wedding family meeting, the discussion involved both families and their relatives getting to know one another. The boy and girl were often not allowed to join this meeting of the elders. The discussion would then proceed to the amount of ",
            { text: "money offered by the boy’s family", archiveSlug: "wedding-preparation" },
            ". This tradition is quite similar to modern times; however, the amount offered by the boy’s family was not considered particularly important, as the money was regarded as a token of gratitude from the boy’s family.",
          ],
        ],
      },
    ],
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

export const archiveSlugs = archiveCatalog.map(({ slug }) => slug);

export function getArchiveEntry(slug) {
  return archiveEntries.find((entry) => entry.slug === slug);
}

export function getAdjacentEntries(slug) {
  const currentIndex = archiveEntries.findIndex((entry) => entry.slug === slug);

  if (currentIndex === -1) {
    return { previous: null, next: null, position: null, total: archiveEntries.length };
  }

  return {
    previous: currentIndex > 0 ? archiveEntries[currentIndex - 1] : null,
    next: currentIndex < archiveEntries.length - 1 ? archiveEntries[currentIndex + 1] : null,
    position: currentIndex + 1,
    total: archiveEntries.length,
  };
}

export function getRelatedEntries(slug, limit = 3) {
  const currentIndex = archiveEntries.findIndex((entry) => entry.slug === slug);
  const relatedCount = Math.min(Math.max(limit, 0), Math.max(archiveEntries.length - 1, 0));

  if (relatedCount === 0) {
    return [];
  }

  if (currentIndex === -1) {
    return archiveEntries.slice(0, relatedCount);
  }

  return Array.from({ length: relatedCount }, (_, offset) => (
    archiveEntries[(currentIndex + offset + 1) % archiveEntries.length]
  ));
}
