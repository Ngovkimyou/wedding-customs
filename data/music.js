import aboutPageMusic from "../assets/audios/about-page-music.mp3";
import fluteSoloMusic from "../assets/audios/flute-solo-music.mp3";
import hybridChineseKhmerMusic from "../assets/audios/hybrid-chinese-khmer-traditional-music.mp3";
import jompeiSiemReapMusic from "../assets/audios/jompei-siem-reap-music.mp3";
import khmerRelaxingMusic from "../assets/audios/khmer-relaxing-music.mp3";
import traditionalKhmerInstrumentsMusic from "../assets/audios/traditional-khmer-instruments-music.mp3";

const toSource = (asset) => (typeof asset === "string" ? asset : asset.src);

export const DEFAULT_MUSIC_MODE = "default";

export const MUSIC_PLAYLISTS = {
  home: [
    {
      id: "traditional-khmer-instruments",
      label: "Traditional Khmer Instrument Music",
      source: toSource(traditionalKhmerInstrumentsMusic),
    },
    {
      id: "jompei-siem-reap",
      label: "Jompei Siem Reap",
      variant: "[ Variant ]",
      source: toSource(jompeiSiemReapMusic),
    },
    {
      id: "flute-solo",
      label: "Flute Solo",
      source: toSource(fluteSoloMusic),
    },
  ],
  about: [
    {
      id: "about-page",
      label: "About Page Music",
      source: toSource(aboutPageMusic),
    },
  ],
  reading: [
    {
      id: "khmer-relaxing",
      label: "Khmer Relaxing Music",
      source: toSource(khmerRelaxingMusic),
    },
    {
      id: "hybrid-chinese-khmer",
      label: "Hybrid Chinese-Khmer Traditional Music",
      source: toSource(hybridChineseKhmerMusic),
    },
  ],
};

export const INITIAL_PLAYLIST_INDEXES = Object.fromEntries(
  Object.keys(MUSIC_PLAYLISTS).map((mode) => [mode, 0]),
);

export const INITIAL_MANUAL_SELECTION = {
  mode: "home",
  trackIndex: 0,
};

export function getPageMusicMode(pathname) {
  if (pathname === "/") {
    return "home";
  }

  if (pathname === "/about") {
    return "about";
  }

  return "reading";
}

export function getMusicChoiceId(mode, trackIndex = 0) {
  return `${mode}-${trackIndex}`;
}

export const MUSIC_CHOICES = [
  {
    id: getMusicChoiceId(DEFAULT_MUSIC_MODE),
    mode: DEFAULT_MUSIC_MODE,
    trackIndex: 0,
  },
  ...Object.entries(MUSIC_PLAYLISTS).flatMap(([mode, playlist]) =>
    playlist.map((_, trackIndex) => ({
      id: getMusicChoiceId(mode, trackIndex),
      mode,
      trackIndex,
    })),
  ),
];
