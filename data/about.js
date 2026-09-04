import { MUSIC_PLAYLISTS } from "./music.js";

/**
 * Editable credits and contact details for the About page.
 */
export const archiveSources = [
  {
    label: "Images & design assets",
    detail: "The assets used in this project are free to download in the link below.",
    href: "https://github.com/Ngovkimyou/Dora-assets",
  },
];

// Keep this list synchronized with the titles shown in the music panel.
// Paste each public music/source URL beside its matching track ID.
const MUSIC_CREDIT_LINKS = {
  "traditional-khmer-instruments": [
    "https://youtu.be/jPE2tlKUviQ?si=rMDw0hrZPbJNsDiq",
    "https://youtu.be/zMiz8yoiCQ0?si=xvPJBjOXUIMCWbQw",
  ],
  "jompei-siem-reap": "https://youtu.be/0BIxr-0sp1k?si=S7cw66ufE1uPVMEC",
  "flute-solo": "https://youtu.be/njSbIQ3NJL4?si=dpFBpNNZ3VMuv5sb",
  "about-page": "https://youtu.be/UXaOmwTHXA0?si=wYJk-XVdITNfBPjT",
  "khmer-relaxing": [
    "https://youtu.be/Aw5dF6o6AWs?si=m7e_wmqM77fQ6mLe",
    "https://youtu.be/blj6t2KR-mk?si=aK1jndG0H4LvhEBs",
  ],
  "hybrid-chinese-khmer": "https://youtu.be/0rONd0jZzak?si=-RGQnoTjMoyKPEPC",
};

export const musicCredits = Array.from(
  new Map(
    Object.values(MUSIC_PLAYLISTS)
      .flat()
      .map((track) => [track.id, track]),
  ).values(),
).map(({ id, label, variant }) => {
  const links = MUSIC_CREDIT_LINKS[id];
  return {
    id,
    label,
    variant,
    links: Array.isArray(links) ? links.filter(Boolean) : links ? [links] : [],
  };
});

export const archiveContact = {
  note: "For corrections, additional family stories, or collaboration, please get in touch.",
  links: [
    { label: "GitHub", icon: "github", href: "https://github.com/Ngovkimyou" },
    { label: "Gmail", icon: "mail", href: "mailto:kimyou8881@gmail.com" },
    { label: "Telegram", icon: "telegram", href: "https://t.me/Dorayaki515" },
  ],
};
