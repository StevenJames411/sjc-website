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
  | "merriweather" | "playfair" | "sourceSans" | "spaceGrotesk";

export type Brand = {
  /**
   * The body font, and the whole-site font when no heading font is set.
   *
   * ⚠️ KEEP THIS NAME. Every brand already saved has `font` and no `headingFont`, and a rename
   * would silently reset those sites to Lexend. `headingFont` is additive: blank = headings use
   * this one, which is exactly how the site behaved before pairing existed.
   */
  font: BrandFont;
  /**
   * Optional second family for h1–h4. Bought designs routinely pair two — SiteDrop's uses Space
   * Grotesk for headings over Inter for body — and collapsing them to one visibly cheapens the
   * page. Blank keeps the old single-font behaviour.
   */
  headingFont?: BrandFont | "";
  accent: string;      // links, badges, eyebrows — the "brand" color
  accentHover: string;
  secondary: string;   // second accent — confirmations, "open now", the softer of two buttons
  highlight: string;   // warm third accent — star ratings, underline swipes, small emphasis
  ink: string;         // headings / body-dark
  mute: string;        // supporting text
  line: string;        // hairlines + borders
  bandSoft: string;    // light section band
  bandDark: string;    // dark section band
  bandDarker: string;  // the DEEPER dark band — a design routinely has two dark tones, and
                       // collapsing them into one visibly flattens the page
  cta: string;         // button fill
  ctaHover: string;
};

// Today's live palette (app/globals.css @theme). Changing nothing changes nothing.
export const BRAND_DEFAULTS: Brand = {
  font: "lexend",
  // Blank on purpose — headings share `font`, which is what the site did before pairing existed.
  // BrandStyle only emits when the brand differs from these defaults, so this must stay the
  // do-nothing value.
  headingFont: "",
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
  bandDarker: "#0f1f3d",
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
  { value: "spaceGrotesk", label: "Space Grotesk",    note: "Techy, confident — good for headings" },
];

/**
 * Map a font family NAME found in a bought design onto the nearest family we actually have.
 *
 * next/font is build-time, so an imported design can never bring its own file — it gets the
 * closest match from the fixed set above. Unknown names fall back to Inter rather than failing
 * the import: a design that arrives in the wrong typeface is fixable in one dropdown, a design
 * that refuses to import is not.
 */
export function nearestFont(name: string): BrandFont {
  const n = String(name || "").toLowerCase().replace(/["']/g, "").trim();
  if (!n) return "inter";
  const exact: Record<string, BrandFont> = {
    "space grotesk": "spaceGrotesk",
    lexend: "lexend",
    inter: "inter",
    poppins: "poppins",
    montserrat: "montserrat",
    merriweather: "merriweather",
    "playfair display": "playfair",
    playfair: "playfair",
    "source sans 3": "sourceSans",
    "source sans pro": "sourceSans",
  };
  // The first family in a CSS stack is the one that was actually chosen.
  const first = n.split(",")[0].trim();
  if (exact[first]) return exact[first];

  // Not one of ours — match on shape so the page at least keeps its character.
  const serif = /(serif|georgia|times|garamond|merriweather|playfair|lora|roboto slab)/.test(first);
  if (serif) return /(playfair|didot|bodoni|display)/.test(first) ? "playfair" : "merriweather";
  const geometric = /(grotesk|space|futura|jost|outfit|sora|manrope|dm sans)/.test(first);
  if (geometric) return "spaceGrotesk";
  const rounded = /(poppins|nunito|quicksand|rubik|circular)/.test(first);
  if (rounded) return "poppins";
  return "inter";
}
