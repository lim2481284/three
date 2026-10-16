/* ══════════════════════════════════════════════════════════════════════════
   $THREE — CENTRAL CONTENT FILE
   ──────────────────────────────────────────────────────────────────────────
   Everything editable lives here: copy, navigation, quotes, media, archive
   records, gallery items and social links.

   MEDIA QUICK GUIDE
   • Drop files into /public/media and point `src` at them, e.g.
       src: "/media/alex-interview.mp4"
   • `src: null` renders an art-directed placeholder labelled with `id` + `label`.
   • `clip: [start, end]` (seconds) plays only that segment of a video.
     Several slots use clips from the supplied films
     (/media/three-film.mp4, /media/three-film-vertical.mp4) — replace anytime.
   • `aspect` is a CSS aspect-ratio string: "16/9", "9/16", "1/1", "4/5"…

   FACT POLICY
   • Nothing here is invented. Items marked `verified: false` were transcribed
     from the supplied film and still need an original source link before
     launch. Set `verified: true` and fill `url` once confirmed.
   ════════════════════════════════════════════════════════════════════════ */

export type MediaKind = "image" | "video";

export interface MediaAsset {
  /** Slot identifier shown on placeholders, e.g. "VIDEO_001". */
  id: string;
  /** Human label, e.g. "ALEX INTERVIEW". */
  label: string;
  kind: MediaKind;
  /** File URL. `null` → procedural placeholder. */
  src: string | null;
  poster?: string | null;
  /** Optional [start, end] seconds for video segments. */
  clip?: [number, number];
  /** For kind "image" with a video `src`: show the still frame at this second. */
  frameAt?: number;
  aspect?: string;
  /** Accessible description. */
  alt: string;
}

export interface SourceRef {
  label: string;
  url: string | null;
  verified: boolean;
}

/* ─────────────────────────────── FILM ─────────────────────────────── */

/** Main 37s film (16:9). */
const FILM = "/media/three-film.mp4";
/** Original 42s vertical cut — still used for the longer per-quote segments. */
const FILM_VERTICAL = "/media/three-film-vertical.mp4";

export const film = {
  id: "VIDEO_000",
  title: "IT WAS ALWAYS THREE",
  src: FILM as string | null,
  poster: null as string | null,
  duration: 37.4,
  aspect: "16/9",
  markers: [
    { at: 0, label: "INCIDENT DESK" },
    { at: 5.9, label: "ON THE RECORD" },
    { at: 10.3, label: "THE ARCHIVE" },
    { at: 17, label: "LIVE · THE ROLLUP" },
    { at: 24, label: "THREE DIGITS MINIMUM" },
    { at: 26.4, label: "EVERYTHING IS THREE" },
    { at: 33, label: "THE SIGN" },
  ],
};

/* ─────────────────────────────── BRAND ─────────────────────────────── */

export const brand = {
  name: "THREE",
  symbol: "$THREE",
  tagline: "THREE DIGITS MINIMUM",
  narrative: "IT WAS ALWAYS THREE.",
  phrases: [
    "THE SIGNAL IS THREE.",
    "EVERYTHING LEADS TO THREE.",
    "THE NUMBER WAS ALWAYS THERE.",
    "THIS IS NOT A COINCIDENCE.",
    "COINCIDENCE? WE DON'T THINK SO.",
  ],
  ecosystem: "NEAR ECOSYSTEM",
  disclaimer:
    "$THREE is an unofficial community meme inspired by the NEAR ecosystem. Not affiliated with, endorsed by, or connected to NEAR Foundation or NEAR Protocol. Nothing on this site is financial advice, a price prediction, or a promise of any return.",
};

export const seo = {
  title: "$THREE — IT WAS ALWAYS THREE.",
  description:
    "Three people. Three blockchains. Three to six months. $3.33. Three digits minimum. Coincidence? We don't think so. An interactive meme transmission from the NEAR ecosystem.",
  url: "https://threeisnear.pages.dev",
  ogAlt: "$THREE — a giant voxel number 3 over a dark alien landscape. IT WAS ALWAYS THREE.",
};

/* ───────────────────────────── SOCIAL LINKS ───────────────────────────── */

export const social = {
  x: { label: "FOLLOW ON X", url: "https://x.com/ThreeisNEAR", handle: "@ThreeisNEAR" },
};

/* ───────────────────────────── NAVIGATION ───────────────────────────── */

export const nav = {
  links: [
    { code: "3.1", label: "THE SIGNAL", href: "#incident" },
    { code: "3.2", label: "ARCHIVE", href: "#archive" },
    { code: "3.3", label: "MEDIA", href: "#transmission" },
  ],
  cta: { label: "ENTER THREE", href: "#final" },
};

export const chapters = [
  { id: "signal", code: "000", title: "THE SIGNAL" },
  { id: "incident", code: "001", title: "THE INCIDENT DESK" },
  { id: "pattern", code: "002", title: "THE NUMBER KEEPS APPEARING" },
  { id: "archive", code: "003", title: "THE ARCHIVE" },
  { id: "three-digits-minimum", code: "004", title: "THREE DIGITS MINIMUM" },
  { id: "transmission", code: "005", title: "THE TRANSMISSION" },
  { id: "final", code: "006", title: "THE FINAL SIGNAL" },
] as const;

/* ───────────────────────────── INTRO / HERO ───────────────────────────── */

export const intro = {
  boot: "INITIALIZING SIGNAL",
  lines: ["SIGNAL DETECTED", "ORIGIN: NEAR", "SUBJECT: 3"],
};

export const hero = {
  title: "{$}THREE",
  tagline: ["THREE DIGITS ", "MINIMUM"],
  caption: "IT WAS ALWAYS THREE.",
  primary: { label: "GET $THREE", href: "https://justhoot.fun/p/three-de86d6.launchpad.justhoot.near" },
  secondary: { label: "WATCH THE FILM" },
  hint: "DRAG TO ROTATE · CLICK TO DISRUPT",
};

/* ─────────────────────── CHAPTER 001 — INCIDENT DESK ─────────────────────── */

export const incident = {
  heading: "THE SYSTEM WAS COMPROMISED.",
  subheading: "AND THEN SOMETHING HAPPENED.",
  /** Date as displayed in the supplied film's opening frame. */
  dateline: "01.10.2026",
  counter: { prefix: "$", to: 3.8, decimals: 1, suffix: "M" },
  resolved: "RECOVERED.",
  /** Headlines as they appear in the supplied film. Add URLs to verify. */
  headlines: [
    { outlet: "DECRYPT", date: "OCT 2026", text: "NEAR Intents hacked for $3.8M", url: null, verified: false },
    { outlet: "GROUND NEWS", date: "OCT 2026", text: "NEAR Intents hit by $3.8M exploit in latest crypto platform hack", url: null, verified: false },
    { outlet: "DECRYPT", date: "OCT 2026", text: "NEAR Intents hacked days after denying Bitget hacker", url: null, verified: false },
    { outlet: "NEWS", date: "OCT 2026", text: "NEAR Intents recovers $3.8 million after 48-hour ultimatum", url: null, verified: false },
    { outlet: "NEWS", date: "OCT 2026", text: "NEAR Intents recovers entire $3.8M after ultimatum to exploiter", url: null, verified: false },
  ] as { outlet: string; date: string; text: string; url: string | null; verified: boolean }[],
  /** Timeline beats — each mirrors a frame of the supplied film. */
  timeline: [
    { code: "T-01", label: "EXPLOIT DETECTED", detail: "NEAR Intents drained", date: "01.10.2026" },
    { code: "T-02", label: "SYSTEMS PAUSED", detail: "11 networks halted", date: "OCT 2026" },
    { code: "T-03", label: "ULTIMATUM ISSUED", detail: "48-hour window", date: "OCT 2026" },
    { code: "T-04", label: "FUNDS RETURNED", detail: "≈ $3.8M recovered", date: "OCT 2026" },
  ],
  media: {
    screenshot: {
      id: "IMAGE_002",
      label: "HEADLINE WALL",
      kind: "image",
      src: FILM,
      frameAt: 3.6,
      aspect: "16/9",
      alt: "Headline wall from the $THREE film covering the NEAR Intents incident.",
    } as MediaAsset,
    video: {
      id: "VIDEO_004",
      label: "NEWS FOOTAGE",
      kind: "video",
      src: FILM,
      clip: [0, 5.8],
      aspect: "16/9",
      alt: "Incident desk sequence from the $THREE film: balances, headlines and halted networks.",
    } as MediaAsset,
  },
  caption:
    "In October 2026 an exploit hit NEAR Intents. Within days, roughly $3.8M was reported recovered. Of all the numbers it could have been…",
  article: { label: "READ THE ARTICLE", url: null as string | null },
  source: { label: "AS SHOWN IN THE $THREE FILM", url: null, verified: false } as SourceRef,
};

/* ─────────────────── CHAPTER 002 — THE NUMBER KEEPS APPEARING ─────────────────── */

export type PhraseEffect = "voxel" | "glitch" | "particles" | "wall" | "zoom";

export interface Phrase {
  id: string;
  text: string;
  effect: PhraseEffect;
  quote: {
    speaker: string;
    role: string;
    context: string;
    /** Exact quote — leave null until transcribed from the original source. */
    quote: string | null;
    date: string | null;
    source: SourceRef;
    media: MediaAsset;
  };
}

export const pattern = {
  intro: ["ONCE IS RANDOM.", "TWICE IS STRANGE.", "THREE TIMES?"],
  outro: "COINCIDENCE? WE DON'T THINK SO.",
  phrases: [
    {
      id: "people",
      text: "THREE PEOPLE.",
      effect: "voxel",
      quote: {
        speaker: "ALEX SKIDANOV",
        role: "NEAR CO-FOUNDER",
        context: "NIGHTSHADE TALK",
        quote: null,
        date: null,
        source: { label: "NIGHTSHADE TALK", url: null, verified: false },
        media: { id: "VIDEO_001", label: "ALEX INTERVIEW", kind: "video", src: FILM_VERTICAL, clip: [7.85, 9.05], aspect: "480/848", alt: "Alex Skidanov on stage: three people." },
      },
    },
    {
      id: "blockchains",
      text: "THREE BLOCKCHAINS.",
      effect: "glitch",
      quote: {
        speaker: "ALEX SKIDANOV",
        role: "NEAR CO-FOUNDER",
        context: "NIGHTSHADE TALK",
        quote: null,
        date: null,
        source: { label: "NIGHTSHADE TALK", url: null, verified: false },
        media: { id: "VIDEO_001B", label: "ALEX INTERVIEW", kind: "video", src: FILM_VERTICAL, clip: [10.5, 11.8], aspect: "480/848", alt: "Alex Skidanov: three blockchains." },
      },
    },
    {
      id: "projects",
      text: "THREE TO FIVE PROJECTS.",
      effect: "particles",
      quote: {
        speaker: "ILLIA POLOSUKHIN",
        role: "NEAR CO-FOUNDER",
        context: "CHAIN ABSTRACTION TALK",
        quote: null,
        date: null,
        source: { label: "CHAIN ABSTRACTION TALK", url: null, verified: false },
        media: { id: "VIDEO_002A", label: "ILLIA INTERVIEW", kind: "video", src: FILM_VERTICAL, clip: [12.0, 13.3], aspect: "480/848", alt: "Illia Polosukhin at a chain abstraction talk: three to five projects." },
      },
    },
    {
      id: "months",
      text: "THREE TO SIX MONTHS.",
      effect: "wall",
      quote: {
        speaker: "ILLIA POLOSUKHIN",
        role: "NEAR CO-FOUNDER",
        context: "TWIML AI PODCAST #749",
        quote: null,
        date: null,
        source: { label: "TWIML #749", url: null, verified: false },
        media: { id: "VIDEO_002B", label: "ILLIA INTERVIEW", kind: "video", src: FILM_VERTICAL, clip: [13.5, 14.8], aspect: "480/848", alt: "Illia Polosukhin on a podcast: three to six months." },
      },
    },
    {
      id: "things",
      text: "THREE THINGS.",
      effect: "zoom",
      quote: {
        speaker: "ILLIA POLOSUKHIN",
        role: "NEAR CO-FOUNDER",
        context: "PRAGMA WATERLOO 2023",
        quote: null,
        date: "2023",
        source: { label: "PRAGMA WATERLOO 2023", url: null, verified: false },
        media: { id: "VIDEO_002C", label: "ILLIA INTERVIEW", kind: "video", src: FILM_VERTICAL, clip: [15.0, 16.6], aspect: "480/848", alt: "Illia Polosukhin at Pragma Waterloo 2023: three things." },
      },
    },
  ] as Phrase[],
  note: "Clips are excerpts of past talks and interviews. None of them were about $THREE — the number just keeps showing up.",
};

/* ─────────────────────────── CHAPTER 003 — ARCHIVE ─────────────────────────── */

export type ArchiveCategory = "interviews" | "posts" | "numbers" | "community";

export interface ArchiveRecord {
  id: string;
  category: ArchiveCategory;
  title: string;
  author: string;
  handle?: string;
  date: string | null;
  excerpt: string;
  body: string;
  source: SourceRef;
  media: MediaAsset | null;
  /** "transcribed" = read from the supplied film; "placeholder" = slot awaiting content. */
  status: "transcribed" | "placeholder" | "verified";
}

export const archive = {
  heading: "THE EVIDENCE WAS ALWAYS THERE.",
  query: '"3" OR "THREE"',
  filter: "NEAR ECOSYSTEM",
  filters: [
    { id: "all", label: "ALL" },
    { id: "interviews", label: "INTERVIEWS" },
    { id: "posts", label: "POSTS" },
    { id: "numbers", label: "NUMBERS" },
    { id: "community", label: "COMMUNITY" },
  ] as { id: "all" | ArchiveCategory; label: string }[],
  records: [
    {
      id: "REC-001",
      category: "posts",
      title: "THE \"3\" STREAK",
      author: "NEAR Intents",
      handle: "@near_intents",
      date: "SEP 18, 2026",
      excerpt: "Guess we're on a \"3\" streak now.",
      body: "NEAR Intents did $300M+ volume yesterday.\n\nNew daily volume record.\n\nGuess we're on a \"3\" streak now.",
      source: { label: "x.com/near_intents", url: null, verified: false },
      media: null,
      status: "transcribed",
    },
    {
      id: "REC-002",
      category: "numbers",
      title: "THERE WILL BE SIGNS",
      author: "NEAR Protocol",
      handle: "@NEARProtocol",
      date: "SEP 19, 2026",
      excerpt: "Check your NEAR@3.33 allocation on near.com",
      body: "There will be signs.\n\nCheck your NEAR@3.33 allocation on near.com",
      source: { label: "x.com/NEARProtocol", url: null, verified: false },
      media: null,
      status: "transcribed",
    },
    {
      id: "REC-003",
      category: "interviews",
      title: "THREE DIGITS MINIMUM",
      author: "Illia Polosukhin",
      handle: "NEAR CO-FOUNDER",
      date: "OCT 2026",
      excerpt: "“Are you rich?” — “Three digits minimum.”",
      body: "Clip via The Rollup (@andyyy on X). Asked “Are you rich?”, the answer became a meme: THREE DIGITS MINIMUM.",
      source: { label: "THE ROLLUP / @andyyy ON X", url: null, verified: false },
      media: { id: "VIDEO_003", label: "THREE DIGITS MINIMUM", kind: "video", src: FILM, clip: [17, 26.3], aspect: "16/9", alt: "The Rollup clip: Illia Polosukhin answers 'three digits minimum'." },
      status: "transcribed",
    },
    {
      id: "REC-004",
      category: "posts",
      title: "BEEN LIVE FOR 3+ YEARS",
      author: "Illia (root.near)",
      handle: "@ilblackdragon",
      date: "FEB 18, 2024",
      excerpt: "Been live for 3+ years.",
      body: "Been live for 3+ years.",
      source: { label: "x.com/ilblackdragon", url: null, verified: false },
      media: null,
      status: "transcribed",
    },
    {
      id: "REC-005",
      category: "interviews",
      title: "THREE LEGS",
      author: "George Zeng",
      handle: "NEAR LEGION",
      date: null,
      excerpt: "Three legs.",
      body: "On stage at a NEAR Legion session, the slide reads “legs” — and there are three of them.",
      source: { label: "NEAR LEGION", url: null, verified: false },
      media: { id: "VIDEO_005", label: "GEORGE ZENG", kind: "video", src: FILM_VERTICAL, clip: [9.25, 10.3], aspect: "480/848", alt: "George Zeng at NEAR Legion: three legs." },
      status: "transcribed",
    },
    {
      id: "REC-006",
      category: "community",
      title: "ALL THREE, ONE ECOSYSTEM",
      author: "Rhea Finance",
      handle: "@rhea_finance",
      date: "OCT 12, 2026",
      excerpt: "All three, one ecosystem.",
      body: "All three, one ecosystem.",
      source: { label: "x.com/rhea_finance", url: null, verified: false },
      media: null,
      status: "transcribed",
    },
    {
      id: "REC-007",
      category: "interviews",
      title: "THREE STEPS",
      author: "NEAR",
      handle: "NEAR LEGION",
      date: null,
      excerpt: "Three steps.",
      body: "A NEAR Legion presentation, a green checkmark, and — of course — three steps.",
      source: { label: "NEAR LEGION", url: null, verified: false },
      media: { id: "VIDEO_006", label: "THREE STEPS", kind: "video", src: FILM_VERTICAL, clip: [6.6, 7.6], aspect: "480/848", alt: "NEAR Legion clip: three steps." },
      status: "transcribed",
    },
    {
      id: "REC-008",
      category: "numbers",
      title: "NEAR@3.33 IS COMPLETE",
      author: "NEAR Intents",
      handle: "@near_intents",
      date: "SEP 21, 2026",
      excerpt: "NEAR@3.33 is complete. 333,333 $NEAR has been distributed to everyone who qualified.",
      body: "NEAR@3.33 is complete.\n\n333,333 $NEAR has been distributed to everyone who qualified.",
      source: { label: "x.com/near_intents", url: null, verified: false },
      media: { id: "IMAGE_003", label: "NEAR@3.33", kind: "image", src: FILM, frameAt: 14.3, aspect: "16/9", alt: "NEAR Intents post: NEAR@3.33 is complete, 333,333 $NEAR distributed." },
      status: "transcribed",
    },
    {
      id: "REC-009",
      category: "posts",
      title: "ONE IN THREE",
      author: "Illia (root.near)",
      handle: "@ilblackdragon",
      date: "JUN 1, 2021",
      excerpt: ".@NEARProtocol accounts are one in three: a wallet, a contract and an asset.",
      body: ".@NEARProtocol accounts are one in three: a wallet, a contract and an asset.",
      source: { label: "x.com/ilblackdragon", url: null, verified: false },
      media: { id: "IMAGE_001", label: "2021 POST", kind: "image", src: FILM, frameAt: 10.6, aspect: "16/9", alt: "Illia's 2021 post: NEAR accounts are one in three." },
      status: "transcribed",
    },
    {
      id: "REC-010",
      category: "community",
      title: "3 DIGIT MINIMUM",
      author: "NEAR Legion",
      handle: "@NEARLegion",
      date: "OCT 10, 2026",
      excerpt: "3 digit minimum on $NEAR",
      body: "3 digit minimum on $NEAR",
      source: { label: "x.com/NEARLegion", url: null, verified: false },
      media: { id: "IMAGE_004", label: "NEAR LEGION", kind: "image", src: FILM, frameAt: 16.4, aspect: "16/9", alt: "NEAR Legion post: 3 digit minimum on $NEAR." },
      status: "transcribed",
    },
  ] as ArchiveRecord[],
};

/* ─────────────────────── CHAPTER 004 — THREE DIGITS MINIMUM ─────────────────────── */

export const digits = {
  question: "ARE YOU RICH?",
  questioner: "THE ROLLUP",
  words: ["THREE...", "DIGITS...", "MINIMUM."],
  speaker: "ILLIA POLOSUKHIN · NEAR CO-FOUNDER",
  reveal: ["THREE", "DIGITS", "MINIMUM."],
  media: {
    id: "VIDEO_002",
    label: "ILLIA INTERVIEW",
    kind: "video",
    src: FILM,
    clip: [17, 26.3],
    aspect: "16/9",
    alt: "Excerpt: Illia Polosukhin says 'three digits minimum' in a clip by The Rollup.",
  } as MediaAsset,
  disclaimer:
    "“THREE DIGITS MINIMUM” IS A MEME — NOT A PRICE TARGET, NOT A PREDICTION, NOT FINANCIAL ADVICE.",
};

/* ─────────────────────── CHAPTER 005 — TRANSMISSION ─────────────────────── */

export type GalleryType = "IMAGE" | "VIDEO" | "MEME";

export interface GalleryItem {
  type: GalleryType;
  title: string;
  meta: string;
  size: "xl" | "tall" | "wide" | "square";
  media: MediaAsset;
}

export const transmission = {
  heading: ["THIS IS NOT THE END.", "IT'S ONLY THREE."],
  marquee: [
    "IT WAS ALWAYS THREE",
    "THE SIGNAL IS THREE",
    "EVERYTHING LEADS TO THREE",
    "THREE DIGITS MINIMUM",
    "THIS IS NOT A COINCIDENCE",
    "THE NUMBER WAS ALWAYS THERE",
  ],
  items: [
    { type: "VIDEO", title: "IT WAS ALWAYS THREE", meta: "FILM · 00:37 · 16:9", size: "xl", media: { id: "VIDEO_007", label: "THE FILM", kind: "video", src: FILM, aspect: "16/9", alt: "The full 37-second $THREE film." } },
    { type: "IMAGE", title: "KEY ART", meta: "BANNER · 3:1", size: "xl", media: { id: "IMAGE_005", label: "KEY ART", kind: "image", src: "/media/banner.webp", aspect: "3/1", alt: "$THREE key art: THREE DIGITS MINIMUM banner with a giant signal voxel 3." } },
    { type: "MEME", title: "COINCIDENCE?", meta: "STILL · FROM THE FILM", size: "square", media: { id: "MEME_001", label: "THREE THREE THREE", kind: "image", src: FILM, frameAt: 32.35, aspect: "1/1", alt: "A wall of THREE around a giant 3." } },
    { type: "VIDEO", title: "THE SIGN", meta: "CLIP · 00:11", size: "wide", media: { id: "VIDEO_008", label: "THE SIGN", kind: "video", src: FILM, clip: [26.4, 37.4], aspect: "16/9", alt: "Closing sequence of the $THREE film: a giant 3." } },
    { type: "IMAGE", title: "THE MARK", meta: "LOGO · 1:1", size: "square", media: { id: "IMAGE_006", label: "THE MARK", kind: "image", src: "/media/logo-reference.jpg", aspect: "1/1", alt: "The pixel 3 logo mark." } },
    { type: "MEME", title: "THREE-PILLED", meta: "STILL · FROM THE FILM", size: "wide", media: { id: "MEME_002", label: "THE 3 MASK", kind: "image", src: FILM, frameAt: 30.05, aspect: "16/9", alt: "A speaker seen through a giant 3." } },
    { type: "VIDEO", title: "EVERYTHING IS THREE", meta: "CLIP · 00:07", size: "wide", media: { id: "VIDEO_009", label: "THE MONTAGE", kind: "video", src: FILM, clip: [26.4, 33], aspect: "16/9", alt: "Montage: every speaker framed inside a 3." } },
    { type: "MEME", title: "3 / 3", meta: "STILL · FROM THE FILM", size: "square", media: { id: "MEME_003", label: "THREE DIGITS MINIMUM", kind: "image", src: FILM, frameAt: 34.65, aspect: "1/1", alt: "End card: the pixel 3 and THREE DIGITS MINIMUM." } },
    { type: "IMAGE", title: "FIELD RECORDING", meta: "STILL · FROM THE FILM", size: "tall", media: { id: "IMAGE_007", label: "THROUGH THE 3", kind: "image", src: FILM, frameAt: 31.2, aspect: "4/5", alt: "A speaker on stage seen through a giant 3." } },
  ] as GalleryItem[],
};

/* ─────────────────────── CHAPTER 006 — FINAL SIGNAL ─────────────────────── */

export const finale = {
  line: "IT WAS ALWAYS THREE.",
  symbol: "$THREE",
  tagline: "THREE DIGITS MINIMUM.",
  outro: "END OF TRANSMISSION",
  replay: "REPLAY THE SIGNAL",
};

/* ─────────────────────── EASTER EGGS ─────────────────────── */

export const eggs = {
  confirmed: "THREE CONFIRMED.",
  terminalLog: [
    "> three.exe --signal",
    "[ok] subject: 3",
    "[ok] origin: NEAR",
    "[ok] digits: THREE (minimum)",
    "[!!] coincidence probability: 0.000",
    "> IT WAS ALWAYS THREE.",
  ],
  fragments: [
    { id: "incident", title: "FRAGMENT 1/3", text: "The ultimatum lasted 48 hours. 4 + 8 = 12. 1 + 2 = 3. Just saying." },
    { id: "archive", title: "FRAGMENT 2/3", text: "You are reading this on a screen with three colour channels. Think about it." },
    { id: "transmission", title: "FRAGMENT 3/3", text: "Three digits minimum. Three fragments found. You are now officially three-pilled." },
  ],
  allFound: "ALL THREE FRAGMENTS RECOVERED. YOU WERE ALWAYS THREE.",
};
