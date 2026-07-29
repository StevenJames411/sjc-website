// Brand TYPES + CONSTANTS only — no storage, no imports, safe in the browser.
// Split out because the editor is a client component: importing the storage module pulled
// ioredis into the browser bundle and broke the build.
//
// The GLOBAL brand for one site: font family + colors, set ONCE, inherited everywhere.
//
// Steven's law (2026-07-28): fonts and colors are per-SITE decisions, never per-section.
// Bolting a color picker onto 20 blocks would mean setting colors by hand on every block of
// every page for every client — homework, not controls. This is the one knob instead.
//
// The DEFAULTS below are today's live values exactly. With nothing saved, the site renders
// byte-identical to before this existed — the brand layer is inert until it's used.

export type BrandFont =
  | "lexend" | "inter" | "poppins" | "montserrat"
  | "merriweather" | "playfair" | "sourceSans";

export type Brand = {
  font: BrandFont;
  accent: string;      // links, badges, eyebrows — the "brand" color
  accentHover: string;
  secondary: string;   // second accent — confirmations, "open now", the softer of two buttons
  highlight: string;   // warm third accent — star ratings, underline swipes, small emphasis
  ink: string;         // headings / body-dark
  mute: string;        // supporting text
  line: string;        // hairlines + borders
  bandSoft: string;    // light section band
  bandDark: string;    // dark section band
  cta: string;         // button fill
  ctaHover: string;
};

// Today's live palette (app/globals.css @theme). Changing nothing changes nothing.
export const BRAND_DEFAULTS: Brand = {
  font: "lexend",
  accent: "#2563eb",
  accentHover: "#1d4fd7",
  // Nothing on the live site uses these yet, so any value is safe; these are sane starting
  // points a client build overrides.
  secondary: "#22c55e",
  highlight: "#f59e0b",
  ink: "#111827",
  mute: "#4b5563",
  line: "#e5e7eb",
  bandSoft: "#f3f4f6",
  bandDark: "#1e3a6e",
  cta: "#22c55e",
  ctaHover: "#16a34a",
};

// The curated set. next/font is BUILD-time, so the list must be fixed — arbitrary runtime
// font loading isn't worth the layout shift or the third-party request on every page.
export const FONTS: { value: BrandFont; label: string; note: string }[] = [
  { value: "lexend",       label: "Lexend",           note: "Current — clean, highly readable" },
  { value: "inter",        label: "Inter",            note: "Neutral, modern, very safe" },
  { value: "poppins",      label: "Poppins",          note: "Rounded, friendly" },
  { value: "montserrat",   label: "Montserrat",       note: "Geometric, a bit more corporate" },
  { value: "merriweather", label: "Merriweather",     note: "Serif — traditional, trustworthy" },
  { value: "playfair",     label: "Playfair Display", note: "Serif — high-end, editorial" },
  { value: "sourceSans",   label: "Source Sans 3",    note: "Plain and workmanlike" },
];
