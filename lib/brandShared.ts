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
  /**
   * Which named set is active. "" = a site set before sets existed, or a hand-picked pair.
   * ⚠️ Additive and blank by default — BrandStyle never reads it, so an existing site is unmoved.
   */
  fontSet?: string;
  /**
   * THE PAIR THE DESIGN ARRIVED WITH, kept so "As designed" survives someone trying the others.
   *
   * ⛔ WITHOUT THIS, "As designed" IS A ONE-WAY DOOR. font/headingFont are overwritten the moment
   * a customer tries Editorial, so the pairing they actually bought would be gone with no way back
   * — the single most likely click on this control, and it would be the destructive one.
   */
  designFont?: BrandFont | "";
  designHeadingFont?: BrandFont | "";
  /**
   * THE DESIGN'S REAL TYPEFACE — the actual family name, copied onto our own storage at import.
   *
   * ⛔ THIS IS WHAT "AS DESIGNED" IS SUPPOSED TO MEAN. designFont/designHeadingFont above are the
   * NEAREST of our eight, which is a rounding: a design built in Outfit came out as Space Grotesk,
   * close enough to look deliberate and wrong enough that Steven spotted it on his own hero. These
   * three fields carry the genuine article — the family names plus the @font-face rules that serve
   * the files from our Blob storage rather than from Google.
   *
   * ⚠️ ALL THREE BLANK IS THE NORMAL, WORKING STATE. Capture is best-effort and must never fail an
   * import, so a design whose font isn't hosted anywhere simply keeps the rounded pair. Blank here
   * means "we didn't get it", never "something broke".
   */
  designFamilyHeading?: string;
  designFamilyBody?: string;
  /** @font-face rules pointing at our own copies. Emitted by BrandStyle when a family is set. */
  designFontCss?: string;
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
  /**
   * The sticky header's own band. A THIRD dark tone, because a site has three.
   *
   * ⚠️ THIS EXISTS BECAUSE TWO WASN'T ENOUGH, and the shortage showed up as taste rather than as
   * a missing feature. On 2026-08-05 the header, the dark page sections and the footer each
   * wanted a slightly different dark. With two roles, two of them had to share — so every attempt
   * to tune one dragged the other, and it read as "the picker can't do this" instead of "the
   * picker is missing a control."
   *
   * Blank = follow `bandDarker`, exactly what the header did before this field existed. That
   * keeps it a do-nothing default, so no brand already saved moves.
   */
  bandHeader?: string;
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
  fontSet: "",
  designFont: "",
  designHeadingFont: "",
  designFamilyHeading: "",
  designFamilyBody: "",
  designFontCss: "",
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
  // Blank = the header follows bandDarker, which is what it did before this field existed.
  bandHeader: "",
  cta: "#22c55e",
  ctaHover: "#16a34a",
};

// The curated set. next/font is BUILD-time, so the list must be fixed — arbitrary runtime
// font loading isn't worth the layout shift or the third-party request on every page.

/**
 * Which next/font CSS variable each family is registered under in app/layout.
 *
 * ⚠️ LIVES HERE SO NOBODY DERIVES IT TWICE. The settings picker needs the same mapping BrandStyle
 * uses, and deriving it from the key (`spaceGrotesk` -> `--font-space-grotesk`) happens to work
 * for all eight today — which is the problem. The ninth family whose key does not transform
 * cleanly would render the picker's sample in the wrong face while saving the right value, and a
 * control that lies about what it is showing is worse than no preview at all.
 */

/**
 * The colours a site owns, in the order a person thinks about them.
 *
 * ⛔ LIVES HERE SO THERE IS ONE LIST. `app/edit/brand/page.tsx:11-18` already records that three
 * colours shipped unreachable because adding a role means touching SEVEN places and two were
 * missed. A second screen with its own copy of this array would guarantee the same bug again — the
 * two would drift, and the one a customer happened to open would decide what they could change.
 */
export const SWATCHES: { key: keyof Brand; label: string; help: string }[] = [
  { key: "accent",     label: "Accent",             help: "Links, small labels, number badges — the brand colour" },
  { key: "accentHover",label: "Accent (hover)",     help: "Slightly darker version of the accent" },
  { key: "secondary",  label: "Second accent",      help: "The other brand colour — confirmations, 'open now', the softer button" },
  { key: "highlight",  label: "Highlight",          help: "Warm third accent — star ratings, underline swipes, small emphasis" },
  { key: "ink",        label: "Headline text",      help: "Headings and dark body text" },
  { key: "mute",       label: "Body text",          help: "Paragraphs and supporting copy" },
  { key: "line",       label: "Lines & borders",    help: "Hairlines, card edges, dividers" },
  { key: "bandSoft",   label: "Light band",         help: "Background of the pale sections" },
  { key: "bandDark",   label: "Dark band",          help: "Background of the dark sections" },
  { key: "bandDarker", label: "Dark band (deeper)", help: "The second, darker tone — collapsing them flattens the page" },
  { key: "bandHeader", label: "Header bar",         help: "The bar across the top. Blank means it follows the deeper dark band." },
  { key: "cta",        label: "Button",             help: "The main call-to-action button" },
  { key: "ctaHover",   label: "Button (hover)",     help: "Button colour on hover" },
];

export const FONT_VAR: Record<BrandFont, string> = {
  lexend: "--font-lexend",
  inter: "--font-inter",
  poppins: "--font-poppins",
  montserrat: "--font-montserrat",
  merriweather: "--font-merriweather",
  playfair: "--font-playfair",
  sourceSans: "--font-source-sans",
  spaceGrotesk: "--font-space-grotesk",
};


/**
 * FONT SETS — one button, not three fields.
 *
 * ⛔ WHY THIS REPLACED THE SEPARATE PICKERS, in Steven's words (2026-08-13): *"I just want one
 * button. I like the design, let's keep it everywhere. Instead of everything getting separated,
 * too many choices are not what people want. If that trio goes together nicely, great — you pick
 * it."*
 *
 * He is right about who the control is for. A contractor is not going to audition a headline face
 * against a body face; handed two lists he will either pick the same font twice or pair two that
 * fight. Pairing is a design decision, so it gets made HERE, once, by someone who can make it —
 * and the customer makes the only choice that is really theirs: which of these feels like them.
 *
 * ⚠️ "AS DESIGNED" IS FIRST AND IT IS NOT DECORATION. Every bought design arrives with a real
 * pairing already in its stylesheet, and detectFonts() reads it at import. That pairing is what
 * the customer actually paid for and looked at before buying. Anything else on this list is an
 * alternative to it, never the starting point.
 *
 * Each set is a REAL PAIR someone would ship, not every combination the eight families allow —
 * that would be 64 and is exactly the menu this exists to avoid.
 */
export type FontSet = {
  key: string;
  label: string;
  note: string;
  /** Blank on `asDesigned` only — it resolves per site, from what the import detected. */
  heading?: BrandFont;
  body?: BrandFont;
};

export const FONT_SETS: FontSet[] = [
  { key: "asDesigned",  label: "As designed",  note: "The pairing this website's design came with" },
  { key: "modern",      label: "Modern",       note: "Techy and confident",        heading: "spaceGrotesk", body: "inter" },
  { key: "editorial",   label: "Editorial",    note: "High-end, magazine",         heading: "playfair",     body: "sourceSans" },
  { key: "friendly",    label: "Friendly",     note: "Warm and approachable",      heading: "poppins",      body: "inter" },
  { key: "corporate",   label: "Corporate",    note: "Established and solid",      heading: "montserrat",   body: "sourceSans" },
  { key: "classic",     label: "Classic",      note: "Traditional, trustworthy",   heading: "merriweather", body: "inter" },
];

/**
 * The two faces a set actually applies to a given site.
 *
 * `asDesigned` is the only one that needs the site: it reads the pair recorded at import. A site
 * imported before that was recorded falls back to whatever it is wearing now, which is the honest
 * answer — there is nothing else to know about it.
 */
export function fontsForSet(key: string, brand: Brand): { font: BrandFont; headingFont: BrandFont | "" } {
  const set = FONT_SETS.find((f) => f.key === key);
  if (!set || set.key === "asDesigned") {
    return {
      font: brand.designFont || brand.font,
      headingFont: brand.designHeadingFont ?? brand.headingFont ?? "",
    };
  }
  return { font: set.body as BrandFont, headingFont: (set.heading as BrandFont) || "" };
}

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
