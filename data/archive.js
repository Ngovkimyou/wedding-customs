import archive001Image from "../assets/images/archive-001.avif";
import archive002Image from "../assets/images/archive-002.avif";
import archive003Image from "../assets/images/archive-003.avif";
import archive004Image from "../assets/images/archive-004.avif";
import archive005Image from "../assets/images/archive-005.avif";
import wp05Image from "../assets/images/wp-05.avif";
import wp01Image from "../assets/images/wp-01.avif";
import wp02Image from "../assets/images/wp-02.avif";
import wp03Image from "../assets/images/wp-03.avif";
import wp04Image from "../assets/images/wp-04.avif";
import wp06Image from "../assets/images/wp-06.avif";
import wp07Image from "../assets/images/wp-07.avif";
import groomHouseImage from "../assets/images/groom-house.avif";
import duanPenhImage from "../assets/images/duan-penh.avif";
import lerkJumnuun01Image from "../assets/images/lerk-jumnuun-01.avif";
import lerkJumnuun02Image from "../assets/images/lerk-jumnuun-02.avif";
import rongkaImage from "../assets/images/rongka.avif";
import pkaSlaExchangeImage from "../assets/images/pka-sla-exchange.avif";
import luyTerkDosOfferingImage from "../assets/images/luy-terk-dos-offering.avif";
import weddingRingOfferingImage from "../assets/images/wedding-ring-offering.avif";
import giftsFromRelativesImage from "../assets/images/gifts-from-relatives.avif";
import prayToAltarImage from "../assets/images/pray-to-altar.avif";
import prayToDeitiesImage from "../assets/images/pray-to-deities.avif";
import archive04TopArtwork from "../assets/archive-04-top.avif";
import aside04BottomArtwork from "../assets/aside-04-bottom.avif";
import goldArtwork from "../assets/images/gold.avif";
import aside02Artwork from "../assets/aside-02.avif";
import aside03Artwork from "../assets/aside-03.avif";
import { assertValidArchiveEntries } from "../lib/archive-validation.mjs";

export const archiveDetails = {
  name: "Khmer Wedding Tradition Archive",
  curator: "Kimyoo",
  instructor: "Jesse Orndorff",
  lecture: "Vibe Coding Class - Section 001",
  description:
    "An oral-history collection preserving family memories, traditions, ceremonies, and " +
    "stories surrounding Khmer marriage and weddings.",
};

const archiveEntryDefaults = {
  khmerTitle: "[Khmer title to be added]",
  period: "2003",
  summary: "[Short archive description will be added here.]",
  descriptionSections: [],
  descriptionArtworkTopLeft: null,
  content: "[Full archive story or tradition description will be added here.]",
  aside: "[Additional context or note to be added.]",
  asideAccentArtwork: null,
  showAsideArtwork: true,
  showAside: true,
  interviewDate: "15 August 2026",
  location: "Phnom Penh",
};

const archiveCatalog = [
  {
    id: "ARCHIVE 001",
    slug: "how-my-parents-met",
    title: "How My Parents First Met",
    khmerTitle: "ជំនួបគ្នាលើកដំបូង",
    summary: "How the Couple Met",
    aside:
      "In my grandparents’ generation, choosing a partner independently was generally not permitted. " +
      "Parents held complete authority over their children’s future decisions, and the children did not " +
      "dare to oppose them.",
    descriptionSections: [
      {
        title: "How the Couple Met",
        paragraphs: [
          "Up until the early 2000s, when family rules were strict and highly respected, parents often introduced partners to one another. People could still choose a partner on their own, but the final decision remained subject to parental approval.",
          "A person could reject an introduced partner if they did not like them. In that case, the parents would continue searching for a suitable partner through neighbors, friends, and other connections.",
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
    title: "Courtship and Family Involvement",
    khmerTitle: "ការចែចង់ និងស្វែងយល់គ្នា",
    summary: "Partner introductions, first meetings, and family decisions",
    showAside: false,
    descriptionSections: [
      {
        title: "The Tradition of Partners Introduction",
        paragraphs: [
          [
            "After the parents found a suitable partner, a date for the first meeting would be arranged between the parents of both families. The boy and his parents would visit the girl’s house with gifts as a token of gratitude. The meeting was simple and casual, much like visiting a friend’s house. The girl’s family would prepare tea and num (snacks or ",
            { text: "Num Ansom" },
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
    title: "Engagement Traditions",
    khmerTitle: "ប្រពៃណីនៃពិធីភ្ជាប់ពាក្យ",
    summary: "Pre-wedding family meeting",
    asideAccentArtwork: aside03Artwork,
    showAsideArtwork: false,
    asideTitle: "A Change in Engagement Tradition",
    aside:
      "My mother noted that the money offered by the boy’s family is often viewed differently today than it was in her generation. " +
      "If the amount falls short of the girl’s family’s expectations, it can become a serious point of disagreement, " +
      "potentially bringing wedding preparations to a halt on the engagement day.",
    descriptionSections: [
      {
        title: "On Pre-Wedding Family Meeting",
        paragraphs: [
          [
            "Just like the first meeting, the pre-wedding family meeting was simple and casual, with tea being served and ",
            { text: "num", emphasis: true },
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
    title: "Wedding Preparation",
    khmerTitle: "ការរៀបចំពិធីមង្គលការ",
    summary: "Wedding preparations, gold contributions, and family customs",
    descriptionArtworkTopLeft: archive04TopArtwork,
    showAside: false,
    descriptionSections: [
      {
        title: "About Wedding Preparations",
        paragraphs: [
          [
            "Although wedding preparations are decided by both families, the bride’s family usually arranges the wedding and pays the expenses first. On the wedding day, the groom’s family gives money to the bride’s family to help cover the wedding costs as a token of gratitude.",
          ],
          [
            "Traditionally, this contribution from the groom’s family was given in gold. At that time, one of the units used to measure gold was the Khmer “",
            { text: "Taleong", anchorId: "taleong-note" },
            ",” which would be worth around $5,000–$6,000 in modern currency. Another unit, “Chi,” would be worth around $500–$600 today.",
          ],
          [
            "Wealthy families could contribute more than one ",
            { text: "Taleong", anchorId: "taleong-note" },
            " of gold, while poorer families might contribute only one Chi. Some families could afford only around $100–$200, but it was still possible to prepare and hold a wedding with that amount.",
          ],
        ],
      },
      {
        id: "taleong-note",
        title: "Note About Taleong",
        artwork: goldArtwork,
        artworkAlt: "Gold ingots representing traditional wedding contributions",
        artworkPosition: "right",
        paragraphs: [
          "Although people generally used cash or coins as currency, gold was specifically offered by the groom’s family to help with wedding preparations. This tradition was passed down through generations.",
          "1 Taleong = 10 Chi = 37.5g",
        ],
      },
      {
        title: "About the Gold Received From the Boy’s Family",
        paragraphs: [
          "The gold received from the groom’s family was usually used to craft jewelry for the couple, symbolizing that they were married. It could also be kept as savings to provide financial support for the family in the future.",
        ],
      },
      {
        title: "The Period Before the Wedding Day",
        artwork: aside04BottomArtwork,
        artworkAlt: "Gold and white botanical ornament",
        artworkPlacement: "bottom-right",
        paragraphs: [
          "During this period, wedding invitations were made from thin sheets of paper, similar to flyers. Even at that time, weddings could have more than 40 tables of guests, with around 8–10 people seated at each table.",
          "Before the wedding ceremony, the couple was not allowed to meet or go on dates. The bride was usually advised to stay at home and avoid attracting attention from other men.",
        ],
      },
    ],
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
    title: "Wedding Ceremonies",
    khmerTitle: "ពិធីរៀបអាពាហ៍ពិពាហ៍",
    summary: "Morning wedding ceremonies and family offerings",
    showAside: false,
    descriptionSections: [
      {
        title: "On Wedding Day",
        subsections: [
          {
            title: "In the Morning",
            images: [
              {
                src: lerkJumnuun01Image,
                alt: "Groom’s processional parade with family members carrying offerings",
              },
              {
                src: lerkJumnuun02Image,
                alt: "Family procession carrying wedding offerings",
              },
            ],
            galleryCaption: "Lerk Jumnuun ceremony",
            imagesAfterParagraph: {
              1: [
                {
                  src: rongkaImage,
                  alt: "Rongka wedding pavilion",
                  caption: "Rongka",
                },
                {
                  src: pkaSlaExchangeImage,
                  alt: "Pka Sla exchange ceremony",
                  caption: "Pka Sla exchange ceremony",
                },
              ],
              2: [
                {
                  src: luyTerkDosOfferingImage,
                  alt: "Luy Terk Dos offering ceremony",
                  caption: "Luy Terk Dos Offering",
                },
                {
                  src: weddingRingOfferingImage,
                  alt: "Wedding ring offering ceremony",
                  caption: "Wedding Ring Offering",
                },
              ],
              4: {
                placement: "right",
                images: [
                  {
                    src: giftsFromRelativesImage,
                    alt: "Relatives presenting gifts to a newly married couple",
                    caption: "Gifts from Relatives",
                  },
                ],
              },
              5: [
                {
                  src: prayToAltarImage,
                  alt: "Couple praying to the household altar",
                  caption: "Praying to the Household Altar",
                },
                {
                  src: prayToDeitiesImage,
                  alt: "Offering prayers to deities outside the home",
                  caption: "Praying to the Deities",
                },
              ],
            },
            paragraphs: [
              [
                "In the morning, the wedding begins with the ",
                { text: "Lerk Jumnuun ceremony", strong: true },
                ", or ",
                { text: "Groom’s Processional Parade", strong: true },
                ". This refers to the procession in which the groom’s family brings gifts and offerings to the bride’s family. These may include fruit, sweets, drinks, ",
                { text: "Num Ansom (នំអន្សម)", strong: true },
                ", ",
                { text: "Num Ansom Chek (នំអន្សមចេក)", strong: true },
                ", and ",
                { text: "Num Ansom Chrouk (នំអន្សមជ្រូក)", strong: true },
                ".",
              ],
              [
                "The procession takes place around the area surrounding the house where the wedding is being held before returning to the entrance of the ",
                { text: "Rongka", strong: true },
                ", or wedding pavilion. There, the bride waits for the groom’s arrival before the ",
                { text: "Pka Sla exchange ceremony", strong: true },
                " begins.",
              ],
              [
                "The couple then enters the house for the next rituals: the ",
                { text: "Luy Terk Dos Offering", strong: true },
                " and the ",
                { text: "Wedding Ring Offering", strong: true },
                ". Before these rituals begin, members and relatives from both families gather and sit together on the floor. They share and taste some of the fruit and sweets that were carried during the procession.",
              ],
              [
                "The ",
                { text: "Luy Terk Dos Offering", strong: true },
                " is the ritual in which the groom’s family presents money to the bride’s family to help cover the wedding expenses. The ",
                { text: "Wedding Ring Offering", strong: true },
                " is often performed during the engagement ceremony, although some families still choose to perform it on the wedding day.",
              ],
              [
                "Afterward, relatives from both families take turns presenting gifts to the newly married couple as a form of blessing and support. These gifts may include valuable items such as jewelry or envelopes containing money. Families of Chinese ancestry may also give money in ",
                { text: "angpao", strong: true },
                ", or red envelopes.",
              ],
              [
                "The next ritual is a ",
                { text: "Chinese-influenced ceremony", strong: true },
                " performed by families who follow Chinese traditions. The couple pays respect to the household altar inside the home and to deities worshipped outside the house by burning incense and presenting food offerings.",
              ],
            ],
          },
        ],
      },
    ],
    images: [
      {
        src: archive005Image,
        alt: "Photograph for Archive 005",
      },
    ],
  },
  {
    id: "ARCHIVE 006",
    slug: "wedding-ceremonies-afternoon",
    title: "During the Afternoon",
    khmerTitle: "អំឡុងពេលរសៀល",
    summary: "Afternoon customs and the Wat Phnom visit",
    showAside: false,
    descriptionSections: [
      {
        title: "During the Afternoon",
        imagesAfterParagraph: {
          1: {
            placement: "right",
            images: [
              {
                src: groomHouseImage,
                alt: "The groom’s family home",
                caption: "The Groom’s Family Home",
              },
            ],
          },
          2: {
            sharedCaption: "Pray to Lok Ta Pres Jav",
            galleries: [
              {
                caption: "Wat Phnom",
                images: [
                  {
                    src: wp01Image,
                    alt: "Wat Phnom in Phnom Penh",
                  },
                  {
                    src: wp02Image,
                    alt: "Wat Phnom grounds in Phnom Penh",
                  },
                ],
              },
              {
                layout: "full",
                images: [
                  {
                    src: wp03Image,
                    alt: "Lok Ta Pres Jav shrine at Wat Phnom",
                  },
                ],
              },
              {
                layout: "triple",
                images: [
                  {
                    src: wp04Image,
                    alt: "Praying to Lok Ta Pres Jav at Wat Phnom",
                  },
                  {
                    src: wp06Image,
                    alt: "Offering prayers to Lok Ta Pres Jav",
                  },
                  {
                    src: wp07Image,
                    alt: "Lok Ta Pres Jav prayer offering",
                  },
                ],
              },
            ],
          },
          4: {
            placement: "left",
            images: [
              {
                src: duanPenhImage,
                alt: "Duan Penh, associated with the founding of Wat Phnom",
                caption: "Duan Penh",
              },
            ],
          },
        },
        paragraphs: [
          "At that time, Chinese-influenced wedding traditions generally involved fewer ceremonial stages than traditional Khmer weddings. During the afternoon, the newly married couple would often take a short break from the ceremonies. They might go out for a meal, spend some time together, or visit a photography studio to have their wedding portraits taken.",
          [
            "In my parents’ case, the bride first visited the groom’s family home to pay respect at his household altar. Afterward, the couple went to ",
            { text: "Hangneak Studio and Video Production (ហង្សនាគ)", strong: true },
            " to have their wedding photographs taken.",
          ],
          [
            "The groom also visited ",
            { text: "Wat Phnom", strong: true },
            " to pay respect as part of the wedding traditions remembered by my family. According to Khmer belief, only the groom was supposed to make this visit, while the bride remained away from Wat Phnom.",
          ],
          "The story is connected to a woman associated with the area of present-day Wat Phnom. According to a radio story heard by my parents, she had experienced an unhappy marriage after being betrayed by her husband. Because of this heartbreak, she swore never to fall in love again and was said to have cursed loving couples to experience the same tragic fate that she had endured. Because of her suffering, people feared that couples who appeared together before her might encounter misfortune in their own relationships. For this reason, newly married couples were traditionally discouraged from visiting the site together, while the groom could go alone to pay respect.",
          [
            "The woman, whose name is ",
            { text: "Duan Penh", strong: true },
            ", is traditionally associated with the founding of Wat Phnom and the origin of ",
            { text: "Phnom Penh", strong: true },
            "’s name, the capital city of Cambodia. ",
            { text: "“Penh’s Hill,”", strong: true },
            " refers to the hill associated with Daun Penh. Wat Phnom is also remembered as a sanctuary connected to her, where her presence and status have remained deeply respected and firmly rooted in local belief to this day.",
          ],
        ],
      },
    ],
    images: [
      {
        src: wp05Image,
        alt: "Wedding ceremony during the afternoon",
      },
    ],
  },
  {
    id: "ARCHIVE 007",
    slug: "during-the-night",
    title: "During the Night",
    khmerTitle: "អំឡុងពេលយប់",
    summary: "",
  },
  {
    id: "ARCHIVE 008",
    slug: "ceremonial-objects",
    title: "Ceremonial Objects",
    khmerTitle: "វត្ថុប្រើប្រាស់ក្នុងពិធី",
    summary: "",
  },
];

export const archiveEntries = archiveCatalog.map((entry) => ({
  ...archiveEntryDefaults,
  ...entry,
  images: entry.images ?? [],
}));

assertValidArchiveEntries(archiveEntries);

export const archiveSlugs = archiveEntries.map(({ slug }) => slug);

export function getArchiveEntry(slug) {
  return archiveEntries.find((entry) => entry.slug === slug);
}

export function getAdjacentEntries(slug) {
  const currentIndex = archiveEntries.findIndex((entry) => entry.slug === slug);

  if (currentIndex === -1) {
    return { previous: null, next: null, position: null, total: archiveEntries.length };
  }

  const total = archiveEntries.length;

  // Keep archive navigation continuous. The collection behaves like a loop:
  // Previous from the first record reaches the last, and Next from the last
  // record returns to the first.
  return {
    previous: archiveEntries[(currentIndex - 1 + total) % total],
    next: archiveEntries[(currentIndex + 1) % total],
    position: currentIndex + 1,
    total,
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
