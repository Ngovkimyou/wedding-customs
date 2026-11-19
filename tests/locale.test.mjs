import assert from "node:assert/strict";
import test from "node:test";
import { getLocalizedTitles, translate } from "../lib/locale.js";
import {
  translateArchiveContent,
  translateArchiveSearchSnippet,
  translateArchiveSearchText,
} from "../lib/archive-content-km.js";
import { getArchiveDescriptionSnippets, normalizeSearchText } from "../lib/archive-search.mjs";

test("archive titles follow the selected language and retain the alternate title", () => {
  const titles = {
    english: "How My Parents First Met",
    khmer: "ជំនួបគ្នាលើកដំបូង",
  };

  assert.deepEqual(getLocalizedTitles("km", titles.english, titles.khmer), {
    primaryTitle: titles.khmer,
    alternateTitle: titles.english,
    primaryLocale: "km",
    alternateLocale: "en",
    showKhmerAsPrimary: true,
  });
  assert.deepEqual(getLocalizedTitles("en", titles.english, titles.khmer), {
    primaryTitle: titles.english,
    alternateTitle: titles.khmer,
    primaryLocale: "en",
    alternateLocale: "km",
    showKhmerAsPrimary: false,
  });
});

test("curated archive card labels, summaries, and captions have Khmer translations", () => {
  const curatedCardCopy = [
    "Archive",
    "How the Couple Met",
    "Partner introductions, first meetings, and family decisions",
    "Pre-wedding family meeting",
    "Wedding preparations, gold contributions, and family customs",
    "Morning wedding ceremonies and family offerings",
    "Afternoon customs and the Wat Phnom visit",
    "Rongka",
    "Pka Sla exchange ceremony",
    "Luy Terk Dos Offering",
    "Wedding Ring Offering",
    "Gifts from Relatives",
    "Praying to the Household Altar",
    "Praying to the Deities",
    "The Groom’s Family Home",
    "Wat Phnom",
    "Duan Penh",
  ];

  for (const text of curatedCardCopy) {
    assert.match(translate("km", text), /[\u1780-\u17ff]/u, `${text} should have Khmer copy`);
    assert.equal(translate("en", text), text, `${text} should remain English in English mode`);
  }
});

test("curated archive detail copy has Khmer translations and preserves English mode", () => {
  const detailCopy = [
    "[Full archive story or tradition description will be added here.]",
    "[Additional context or note to be added.]",
    "[Khmer title to be added]",
    "[Short archive description will be added here.]",
    "ARCHIVE 001",
    "ARCHIVE 002",
    "ARCHIVE 003",
    "ARCHIVE 004",
    "ARCHIVE 005",
    "ARCHIVE 006",
    "ARCHIVE 007",
    "ARCHIVE 008",
    "15 August 2026",
    "Phnom Penh",
    "In my grandparents’ generation, choosing a partner independently was generally not permitted. Parents held complete authority over their children’s future decisions, and the children did not dare to oppose them.",
    "Up until the early 2000s, when family rules were strict and highly respected, parents often introduced partners to one another. People could still choose a partner on their own, but the final decision remained subject to parental approval.",
    "A person could reject an introduced partner if they did not like them. In that case, the parents would continue searching for a suitable partner through neighbors, friends, and other connections.",
    "The Tradition of Partners Introduction",
    "After the parents found a suitable partner, a date for the first meeting would be arranged between the parents of both families. The boy and his parents would visit the girl’s house with gifts as a token of gratitude. The meeting was simple and casual, much like visiting a friend’s house. The girl’s family would prepare tea and num (snacks or ",
    "Num Ansom",
    ") to serve the visiting guests.",
    "During the meeting, the parents on both sides would encourage conversation between the boy and the girl. This was an opportunity for them to get to know each other through their attitudes, manners, and ways of speaking rather than simply judging each other by appearance. At the time, good manners and coming from a respectable family were highly valued in society.",
    "Did You Know?",
    "Before the late 1980s, traditional Khmer weddings often lasted three days. However, many families could not afford a full three-day celebration because wedding costs were high. Instead, they held a more casual celebration, much like a party.",
    "After the First Meeting",
    "The parents of both families would give their children some time to consider whether they liked each other. Giving an answer right away during the first meeting would be considered very rude. Once they had made their decisions, they could inform their parents, but the boy’s family must pass the answer on to the other family first. If both sides were satisfied with each other’s answers, the two families would then decide on a date for a pre-wedding family meeting.",
    "A Change in Engagement Tradition",
    "My mother noted that the money offered by the boy’s family is often viewed differently today than it was in her generation. If the amount falls short of the girl’s family’s expectations, it can become a serious point of disagreement, potentially bringing wedding preparations to a halt on the engagement day.",
    "On Pre-Wedding Family Meeting",
    "Just like the first meeting, the pre-wedding family meeting was simple and casual, with tea being served and ",
    "num",
    " being prepared. The quantity and quality of the ",
    " depended on the family’s wealth. The two families and their relatives would join this important discussion about the ",
    "wedding preparations",
    ". At the time, wedding rings were usually offered during this meeting, unlike in modern times, when they are typically exchanged on the wedding day.",
    "On the day of the pre-wedding family meeting, the discussion involved both families and their relatives getting to know one another. The boy and girl were often not allowed to join this meeting of the elders. The discussion would then proceed to the amount of ",
    "money offered by the boy’s family",
    ". This tradition is quite similar to modern times; however, the amount offered by the boy’s family was not considered particularly important, as the money was regarded as a token of gratitude from the boy’s family.",
    "About Wedding Preparations",
    "Although wedding preparations are decided by both families, the bride’s family usually arranges the wedding and pays the expenses first. On the wedding day, the groom’s family gives money to the bride’s family to help cover the wedding costs as a token of gratitude.",
    "Traditionally, this contribution from the groom’s family was given in gold. At that time, one of the units used to measure gold was the Khmer “",
    "Taleong",
    ",” which would be worth around $5,000–$6,000 in modern currency. Another unit, “Chi,” would be worth around $500–$600 today.",
    "Wealthy families could contribute more than one ",
    " of gold, while poorer families might contribute only one Chi. Some families could afford only around $100–$200, but it was still possible to prepare and hold a wedding with that amount.",
    "Note About Taleong",
    "Gold ingots representing traditional wedding contributions",
    "Although people generally used cash or coins as currency, gold was specifically offered by the groom’s family to help with wedding preparations. This tradition was passed down through generations.",
    "1 Taleong = 10 Chi = 37.5g",
    "About the Gold Received From the Boy’s Family",
    "The gold received from the groom’s family was usually used to craft jewelry for the couple, symbolizing that they were married. It could also be kept as savings to provide financial support for the family in the future.",
    "The Period Before the Wedding Day",
    "Gold and white botanical ornament",
    "During this period, wedding invitations were made from thin sheets of paper, similar to flyers. Even at that time, weddings could have more than 40 tables of guests, with around 8–10 people seated at each table.",
    "Before the wedding ceremony, the couple was not allowed to meet or go on dates. The bride was usually advised to stay at home and avoid attracting attention from other men.",
    "On Wedding Day",
    "In the Morning",
    "Lerk Jumnuun ceremony",
    "Groom’s Processional Parade",
    "In the morning, the wedding begins with the ",
    ", or ",
    ". This refers to the procession in which the groom’s family brings gifts and offerings to the bride’s family. These may include fruit, sweets, drinks, ",
    "Num Ansom (នំអន្សម)",
    ", ",
    "Num Ansom Chek (នំអន្សមចេក)",
    ", and ",
    "Num Ansom Chrouk (នំអន្សមជ្រូក)",
    ".",
    "The procession takes place around the area surrounding the house where the wedding is being held before returning to the entrance of the ",
    "Rongka",
    ", or wedding pavilion. There, the bride waits for the groom’s arrival before the ",
    "Pka Sla exchange ceremony",
    " begins.",
    "The couple then enters the house for the next rituals: the ",
    "Luy Terk Dos Offering",
    " and the ",
    "Wedding Ring Offering",
    ". Before these rituals begin, members and relatives from both families gather and sit together on the floor. They share and taste some of the fruit and sweets that were carried during the procession.",
    "The ",
    " is the ritual in which the groom’s family presents money to the bride’s family to help cover the wedding expenses. The ",
    " is often performed during the engagement ceremony, although some families still choose to perform it on the wedding day.",
    "Afterward, relatives from both families take turns presenting gifts to the newly married couple as a form of blessing and support. These gifts may include valuable items such as jewelry or envelopes containing money. Families of Chinese ancestry may also give money in ",
    "angpao",
    ", or red envelopes.",
    "The next ritual is a ",
    "Chinese-influenced ceremony",
    " performed by families who follow Chinese traditions. The couple pays respect to the household altar inside the home and to deities worshipped outside the house by burning incense and presenting food offerings.",
    "During the Afternoon",
    "At that time, Chinese-influenced wedding traditions generally involved fewer ceremonial stages than traditional Khmer weddings. During the afternoon, the newly married couple would often take a short break from the ceremonies. They might go out for a meal, spend some time together, or visit a photography studio to have their wedding portraits taken.",
    "In my parents’ case, the bride first visited the groom’s family home to pay respect at his household altar. Afterward, the couple went to ",
    "Hangneak Studio and Video Production (ហង្សនាគ)",
    " to have their wedding photographs taken.",
    "The groom also visited ",
    "Wat Phnom",
    " to pay respect as part of the wedding traditions remembered by my family. According to Khmer belief, only the groom was supposed to make this visit, while the bride remained away from Wat Phnom.",
    "The story is connected to a woman associated with the area of present-day Wat Phnom. According to a radio story heard by my parents, she had experienced an unhappy marriage after being betrayed by her husband. Because of this heartbreak, she swore never to fall in love again and was said to have cursed loving couples to experience the same tragic fate that she had endured. Because of her suffering, people feared that couples who appeared together before her might encounter misfortune in their own relationships. For this reason, newly married couples were traditionally discouraged from visiting the site together, while the groom could go alone to pay respect.",
    "The woman, whose name is ",
    "Duan Penh",
    ", is traditionally associated with the founding of Wat Phnom and the origin of ",
    "Phnom Penh",
    "’s name, the capital city of Cambodia. ",
    "“Penh’s Hill,”",
    " refers to the hill associated with Daun Penh. Wat Phnom is also remembered as a sanctuary connected to her, where her presence and status have remained deeply respected and firmly rooted in local belief to this day.",
    "Pray to Lok Ta Pres Jav",
    "Photograph for Archive 001",
    "Photograph for Archive 002",
    "Photograph for Archive 003",
    "Photograph for Archive 004",
    "Photograph for Archive 005",
    "Photograph for Archive 006",
    "Photograph for Archive 007",
    "Photograph for Archive 008",
    "The groom’s family home",
  ];

  for (const text of detailCopy) {
    assert.match(
      translate("km", translateArchiveContent("km", text)),
      /[\u1780-\u17ff]/u,
      `${text} should have Khmer copy`,
    );
    assert.equal(translateArchiveContent("en", text), text, `${text} should remain English in English mode`);
  }
});

test("search snippets reuse the Khmer translation of their full curated paragraph", () => {
  const snippet = "People could still choose a partner on their own, but the final decision remained subject to parental approval.";
  const translated = translateArchiveSearchSnippet("km", snippet);

  assert.notEqual(translated, snippet);
  assert.match(translated, /[\u1780-\u17ff]/u);
  assert.equal(translateArchiveSearchSnippet("en", snippet), snippet);
});

test("Khmer archive descriptions are translated and searchable by Khmer text", () => {
  const paragraph = "Up until the early 2000s, when family rules were strict and highly respected, parents often introduced partners to one another. People could still choose a partner on their own, but the final decision remained subject to parental approval.";
  const translatedParagraph = translateArchiveSearchText("km", paragraph);
  const query = Array.from(translatedParagraph).slice(0, 5).join("");

  assert.match(translatedParagraph, /[\u1780-\u17ff]/u);
  assert.notEqual(normalizeSearchText(translatedParagraph), normalizeSearchText(paragraph));
  assert.ok(getArchiveDescriptionSnippets({
    descriptionBlocks: [{ sectionTitle: "ទំនៀមទម្លាប់", text: translatedParagraph }],
  }, query).length > 0);
  assert.equal(translateArchiveSearchText("km", "This paragraph has no Khmer translation."), "");
});

test("English search matches use Khmer excerpts in Khmer locale", () => {
  const paragraph = "Up until the early 2000s, when family rules were strict and highly respected, parents often introduced partners to one another. People could still choose a partner on their own, but the final decision remained subject to parental approval.";
  const matches = getArchiveDescriptionSnippets({
    descriptionBlocks: [{ sectionTitle: "How My Parents First Met", text: paragraph }],
  }, "a");

  assert.ok(matches.length > 0);
  for (const match of matches) {
    assert.match(translateArchiveSearchSnippet("km", match.text), /[\u1780-\u17ff]/u);
  }
});

test("archive title falls back to English when a Khmer title is unavailable", () => {
  assert.deepEqual(getLocalizedTitles("km", "Wedding Ceremonies", ""), {
    primaryTitle: "Wedding Ceremonies",
    alternateTitle: "",
    primaryLocale: "en",
    alternateLocale: "km",
    showKhmerAsPrimary: false,
  });
});

test("search, photo-picker, and music-panel strings have Khmer translations", () => {
  for (const label of [
    "Search the archive",
    "Choose File",
    "No file chosen",
    "Traditional Khmer Instrument Music",
    "Jompei Siem Reap",
    "[ Variant ]",
    "Flute Solo",
    "About Page Music",
    "Khmer Relaxing Music",
    "Hybrid Chinese-Khmer Traditional Music",
    "For corrections, additional family stories, or collaboration, please get in touch.",
  ]) {
    assert.notEqual(translate("km", label), label, `${label} should be translated`);
  }
});

test("review access failures and denials have distinct Khmer messages", () => {
  for (const label of [
    "Reviewer access could not be checked. Please try again later.",
    "You don’t have permission to review entries.",
  ]) {
    assert.match(translate("km", label), /[\u1780-\u17ff]/u, `${label} should have Khmer copy`);
  }
});

test("return feedback form and contributor notes have Khmer translations", () => {
  for (const label of [
    "Explain what needs to change before this entry can be resubmitted.",
    "Write clear, specific feedback for the contributor.",
    "Please add a note for the contributor.",
    "Send Feedback",
    "Reviewer feedback",
    "Reviewer feedback could not be loaded. Please refresh the page.",
    "This requested change has no feedback.",
  ]) {
    assert.match(translate("km", label), /[\u1780-\u17ff]/u, `${label} should render Khmer`);
  }
});

test("description control-character validation has Khmer translation", () => {
  const message = "Remove unsupported control characters from the description.";
  assert.match(translate("km", message), /[\u1780-\u17ff]/u);
});

test("bilingual description controls and guidance have Khmer translations", () => {
  for (const label of [
    "Description language",
    "Description character counts",
    "English",
    "Khmer",
    "English version",
    "Khmer version",
    "Add a description in either language or both. Each version must contain 20 to 2,000 characters.",
    "Add a description in Khmer or English, or both.",
    "Use Latin letters in the English description.",
    "Use Khmer letters in the Khmer description.",
  ]) {
    assert.match(translate("km", label), /[\u1780-\u17ff]/u, `${label} should render Khmer`);
  }
});

test("description length errors include the measured count in Khmer", () => {
  assert.match(
    translate("km", "Description has 19 characters. Enter at least 20."),
    /[\u1780-\u17ff]/u,
  );
  assert.match(
    translate("km", "Description has 2001 characters. The maximum is 2000."),
    /[\u1780-\u17ff]/u,
  );
});

test("About-page image and design credits have Khmer translations", () => {
  for (const label of [
    "Images & design assets",
    "The assets used in this project are free to download in the link below.",
  ]) {
    assert.match(translate("km", label), /[\u1780-\u17ff]/u, `${label} should render Khmer`);
  }
});

test("reading mode uses the requested Khmer music-panel wording", () => {
  assert.equal(translate("km", "Reading Mode"), "បទប្រើពេលអានរឿង");
});

test("community ownership marker has a Khmer translation", () => {
  assert.equal(translate("km", "Your contribution"), "ការចូលរួមរបស់អ្នក");
});
