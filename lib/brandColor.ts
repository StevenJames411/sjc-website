// Turns what a block SAVED into what the browser should PAINT.
//
// THE PROBLEM THIS SOLVES. Every colour swatch in the builder used to save a literal hex into
// the page: pick blue, the page stores "#2563eb" forever. So a site built today has its palette
// frozen into its content, and changing a client's brand means opening every block on every page
// and re-picking every colour by hand. The brand panel existed but couldn't reach any of it.
//
// Now a block saves a ROLE — "accent", "ink", "highlight" — and this resolves it to the CSS
// variable the brand panel drives. Change the brand once, every page repaints.
//
// THREE THINGS CAN COME IN, and all three must keep working:
//   "accent"          a role      → var(--color-sjc-blue)      ← what new content saves
//   "#2563eb"         a raw hex   → itself, untouched          ← what EVERY existing page holds
//   "custom:#ff8800"  an escape   → #ff8800                    ← a deliberate one-off
//
// The raw-hex passthrough is not a nicety, it's the whole migration strategy: this ships without
// touching a single saved page, everything renders exactly as before, and the normaliser converts
// pages to roles afterwards as a separate, reversible step.

export type BrandRole =
  | "accent" | "secondary" | "highlight" | "ink" | "mute"
  | "line" | "bandSoft" | "bandDark" | "bandDarker" | "bandHeader" | "cta" | "white";

// Role → the CSS variable it paints from. These variables already exist in globals.css and are
// overridden per-site by BrandStyle, which is why re-pointing them re-skins everything.
const ROLE_VAR: Record<BrandRole, string> = {
  accent: "--color-sjc-blue",
  secondary: "--color-sjc-secondary",
  highlight: "--color-sjc-highlight",
  ink: "--color-sjc-ink",
  mute: "--color-sjc-mute",
  line: "--color-sjc-line",
  bandSoft: "--color-sjc-bg-soft",
  bandDark: "--color-sjc-navy",
  bandDarker: "--color-sjc-navy-deep",
  bandHeader: "--color-sjc-band-header",
  cta: "--color-sjc-green",
  white: "--color-sjc-white",
};

export const ROLES = Object.keys(ROLE_VAR) as BrandRole[];

// Human labels for the builder's swatch row.
export const ROLE_LABELS: Record<BrandRole, string> = {
  accent: "Accent",
  secondary: "Secondary",
  highlight: "Highlight",
  ink: "Ink (headings)",
  mute: "Muted text",
  line: "Hairline",
  bandSoft: "Soft band",
  bandDark: "Dark band",
  bandDarker: "Darker band",
  bandHeader: "Header band",
  cta: "Button",
  white: "White",
};

export const isRole = (v?: string): v is BrandRole => !!v && (v as BrandRole) in ROLE_VAR;

/**
 * Resolve a saved colour to a CSS value.
 * Returns undefined for blank, so a caller can leave the property off entirely and inherit.
 */
export function resolveColor(value?: string): string | undefined {
  const v = (value || "").trim();
  if (!v) return undefined;
  if (isRole(v)) return `var(${ROLE_VAR[v]})`;
  if (v.startsWith("custom:")) return v.slice(7) || undefined;
  return v; // raw hex, rgb(), or anything else already valid — pass straight through
}

/**
 * Same, but for places that must have a concrete value and can't take undefined.
 */
export function resolveColorOr(value: string | undefined, fallback: string): string {
  return resolveColor(value) ?? fallback;
}

// Which hex maps to which role, used ONLY by the one-time normaliser. Kept here so the mapping
// lives next to the definitions it mirrors rather than buried in a script.
export const HEX_TO_ROLE: Record<string, BrandRole> = {
  "#2563eb": "accent",
  "#111827": "ink",
  "#4b5563": "mute",
  "#6b7280": "mute",
  "#e5e7eb": "line",
  "#f3f4f6": "bandSoft",
  "#1e3a6e": "bandDark",
  "#0f1f3d": "bandDarker",
  // ⚠️ SECONDARY, NOT CTA. This green was SJC's headline/dot colour; the button was blue. Filing
  // it under "cta" would tie every green dot to the button, so re-skinning the button would drag
  // the dots along and the two could never be separated again. (Corrected 2026-08-05, when the
  // palette moved to cyan and the greens had to be told apart.)
  "#22c55e": "secondary",
  "#ffffff": "white",
};

/**
 * A translucent version of a colour, for the soft tinted squares behind icons.
 *
 * The old code did `${hex}1f` — appending hex alpha to the string. That works for "#2563eb"
 * and produces garbage for "var(--color-sjc-blue)1f". color-mix handles both, and every browser
 * we care about has supported it since 2023.
 *
 * @param pct how much of the colour survives, 0-100 (the rest is transparent)
 */
export function tint(value: string | undefined, pct: number, fallback = "#2563eb"): string {
  const c = resolveColor(value) ?? fallback;
  return `color-mix(in srgb, ${c} ${pct}%, transparent)`;
}
