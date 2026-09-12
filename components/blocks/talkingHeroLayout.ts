// THE HERO LAYOUT — one shape, two screens (ruled 2026-09-12: "one system, not clumsy, easy to use").
//
// Every placeable thing on the hero is an element with a position in % of the canvas and a size
// in px. Two layouts, laptop and phone, each placed by hand in the design studio — never derived
// from one another, because on a phone the headline lands on the ceiling ring and the question on
// the podium base when you scale the laptop numbers (Steven, 09-11 23:46).
//
// ⛔ px, never vw. The artifact that preceded this stored sizes as a fraction of the screen width
// (1.6, 2.16) and Steven read them as nonsense: "what the fuck is that?" A size is a number he
// recognises from the studio's other size boxes, and it is the same number on Publish.

export type HeroAlign = "left" | "center" | "right";
export type HeroColor = "white" | "gold";

export type HeroText = {
  x: number;            // % of the canvas width — the element's centre line
  y: number;            // % of the canvas height — the element's top
  size: number;         // px
  w: number | null;     // wrap width in % of the canvas, null = one line, as wide as the words
  color: HeroColor;
  bold: boolean;
  align: HeroAlign;
};

export type HeroOrb = { x: number; y: number; size: number }; // centre point, diameter px

export type HeroLayout = {
  headline: HeroText;
  byline: HeroText;     // the question under (or wherever he puts it)
  opener: HeroText;     // the first line he reads; the captions land here once they talk
  orb: HeroOrb;         // the one control on the page — never small (09-11)
};

export type HeroLayouts = { laptop: HeroLayout; phone: HeroLayout };

export const HERO_ELEMENTS = ["headline", "byline", "opener", "orb"] as const;
export type HeroElement = (typeof HERO_ELEMENTS)[number];

export const HERO_ELEMENT_LABEL: Record<HeroElement, string> = {
  headline: "Headline",
  byline: "Question",
  opener: "First line",
  orb: "The orb",
};

// Steven's own laptop placement from the layout page (2026-09-12, artifact layout/home v73),
// converted from screen-fractions to px at a 1440 laptop: 1.99 → 29px headline, 2.16 → 31px.
export const HERO_LAYOUT_DEFAULTS: HeroLayouts = {
  laptop: {
    headline: { x: 50, y: 12, size: 40, w: null, color: "white", bold: true, align: "center" },
    byline:   { x: 35, y: 80, size: 30, w: null, color: "white", bold: true, align: "center" },
    opener:   { x: 27, y: 56, size: 19, w: 40, color: "white", bold: false, align: "left" },
    orb:      { x: 48.8, y: 34, size: 120 },
  },
  phone: {
    headline: { x: 50, y: 9, size: 22, w: 90, color: "white", bold: true, align: "center" },
    byline:   { x: 50, y: 78, size: 20, w: 90, color: "white", bold: true, align: "center" },
    opener:   { x: 50, y: 60, size: 16, w: 90, color: "white", bold: false, align: "center" },
    orb:      { x: 50, y: 34, size: 96 },
  },
};

export function cloneLayouts(l: HeroLayouts): HeroLayouts {
  return JSON.parse(JSON.stringify(l));
}

// Anything stored before a key existed gets the default for that key — a layout saved this week
// must still open next month after an element is added.
export function withLayoutDefaults(l: Partial<HeroLayouts> | null | undefined): HeroLayouts {
  const d = HERO_LAYOUT_DEFAULTS;
  const fill = (screen: "laptop" | "phone"): HeroLayout => {
    const s = (l?.[screen] || {}) as Partial<HeroLayout>;
    return {
      headline: { ...d[screen].headline, ...(s.headline || {}) },
      byline: { ...d[screen].byline, ...(s.byline || {}) },
      opener: { ...d[screen].opener, ...(s.opener || {}) },
      orb: { ...d[screen].orb, ...(s.orb || {}) },
    };
  };
  return { laptop: fill("laptop"), phone: fill("phone") };
}

// The headline's gold half: everything after a "|" in the words is gold. Same convention as the
// layout page, so what he typed there pastes straight in.
export function splitGold(text: string): { plain: string; gold: string | null } {
  const i = text.indexOf("|");
  if (i < 0) return { plain: text, gold: null };
  return { plain: text.slice(0, i), gold: text.slice(i + 1) };
}
