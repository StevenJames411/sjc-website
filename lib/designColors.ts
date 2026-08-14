// EVERY COLOUR ON A WEBSITE, IN ONE LIST, SET ONCE.
//
// ── THE PROBLEM ───────────────────────────────────────────────────────────────────────────────
// Same failure lib/typeScale.ts already fixed for size, measured for colour instead: a bought
// design's own compiled stylesheet, scoped to that section's wrapper, was checked on the live
// site and came back with **31 literal hex colours across 26 distinct values, and ZERO
// references to the brand's `var(--color-sjc-*)` variables** (see lib/brandColor.ts). The site's
// colour controls are those variables. An imported section never reads them, so the palette
// picker changes the brand and the imported band just sits there in whatever the design shipped
// with — the exact gap typeScale closed for `font-size`, now for `color`/`background`/etc.
//
// ── WHY IT IS KEYED BY THE VALUE, NOT BY A ROLE ───────────────────────────────────────────────
// Same reasoning as sizesIn: a design does not label `#0f172a` "ink" or "navy" — it just writes
// the hex everywhere that colour was the decision. The list IS the set of distinct values the
// sheet actually declares, and remapping one value remaps every rule that used it. No vocabulary
// to guess, no role to misassign — it degrades honestly on a design nobody has seen.
//
// ── HOW IT IS APPLIED ─────────────────────────────────────────────────────────────────────────
// By REWRITING THE VALUE IN THE SHEET as it is served — same as applyTypeScale, and for the same
// reason: an override has to win a specificity fight against selectors nobody wrote, and would
// lose silently on some of them. Rewriting the declaration cannot lose.
//
// ⚠️ THE STORED SHEET IS NEVER TOUCHED. It is content-addressed and immutable (siteKeys.designSheet)
// and shared by every page that references it. This transforms the string on its way out, so
// clearing the map restores the design byte-for-byte and nothing has to be recompiled.

/**
 * Which CSS property a colour was declared on — `color`, `background`, `background-color`,
 * `border-color`, `box-shadow`, `fill`, and friends.
 *
 * ⛔ THIS IS THE COLOUR LIST'S VERSION OF `sampleFor`'s sample text. Type had words on the page to
 * point at ("that's the headline"); colour has no text to sample — a hex value alone tells nobody
 * whether it is text, a background, or a border. The property name is the only cheap thing that
 * turns "#0f172a · 9 places" into "this one is text, that one is a background", so every match
 * records it instead of just counting occurrences.
 */
const COLOR_PROP = /(color|background|background-color|border(?:-top|-right|-bottom|-left)?-color|border|outline-color|box-shadow|fill|stroke|text-decoration-color|caret-color)\s*:\s*([^;}]+)/gi;

/** `#fff`, `#ffffff`, `#ffffffcc` (with or without alpha), matched inside a declaration's value. */
const HEX = /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi;

/** `rgb(0,0,0)`, `rgba(0 0 0 / .5)`, `rgb(0 0 0 / 50%)` — space or comma syntax, both legal CSS. */
const RGB = /rgba?\([^)]*\)/gi;

/**
 * `#fff` -> `#ffffff`. `#FFFFFF` -> `#ffffff`. `rgb(255,0,0)` -> `#ff0000`. Alpha is dropped from
 * the canonical form (`#ffffffcc` -> `#ffffff`) so a value that only differs by opacity still
 * groups with its own colour — the design decision was the colour; the alpha is a property of one
 * particular use of it, same as it would be for two rules at the same font-size but different
 * line-height.
 *
 * ⚠️ Returns "" for anything that doesn't resolve to a colour (a bad rgb(), `rgba(0 0 0 / var(--x))`
 * with a variable alpha) rather than guessing — same law as `firstFamily` in lib/designFonts.ts.
 */
function canonical(raw: string): string {
  const v = raw.trim();
  const hex = /^#([0-9a-f]{3,8})$/i.exec(v);
  if (hex) {
    let h = hex[1].toLowerCase();
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    if (h.length === 8) h = h.slice(0, 6); // drop alpha
    if (h.length === 6) return `#${h}`;
    return "";
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(v);
  if (rgb) {
    // Both `rgb(0,0,0)` and `rgb(0 0 0 / .5)` split on comma-or-slash-or-whitespace the same way.
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
    const nums = parts.slice(0, 3).map((p) => Number(p.replace("%", "")));
    if (nums.length === 3 && nums.every((n) => !Number.isNaN(n))) {
      const [r, g, b] = nums;
      return `#${[r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("")}`;
    }
    return "";
  }
  return "";
}

/**
 * Every distinct colour a stylesheet declares, most-used first — mirrors `sizesIn` in
 * lib/typeScale.ts, keyed on colour instead of size.
 *
 * ⚠️ Rule-by-rule, so a colour can be traced back to both the SELECTORS and the PROPERTIES that
 * set it. `roleFor`/`sampleFor` answer "what is this" for a size using the words on the page —
 * colour has no words, so the property list (`color` vs `background` vs `border-color`) is the
 * only thing that lets a person tell two swatches apart in a settings panel.
 *
 * ⚠️ Does NOT walk `@font-face` blocks or `url(...)` — a data-URI SVG/image can carry hex bytes
 * that are pixels inside a picture, not a CSS colour decision, and `@font-face` never carries a
 * colour a person would want to repaint. Both are stripped from the sheet before scanning.
 *
 * ⚠️ Normalised for grouping: `#FFF`, `#ffffff` and `#FFFFFF` collapse to one entry (`#ffffff`),
 * and `rgb(255,255,255)` collapses onto the same entry as the hex spelling of the same colour.
 */
export function colorsIn(
  css: string
): { value: string; rules: number; selectors: string[]; props: string[] }[] {
  const cleaned = stripNonDeclarations(String(css || ""));

  const counts = new Map<string, number>();
  const sels = new Map<string, Set<string>>();
  const props = new Map<string, Set<string>>();

  for (const rule of cleaned.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1];
    const body = rule[2];
    if (selector.trim().startsWith("@")) continue; // @media/@keyframes headers, not real selectors
    if (!body || !/color|background|border|outline|shadow|fill|stroke|caret/i.test(body)) continue;

    for (const decl of body.matchAll(COLOR_PROP)) {
      const prop = decl[1].toLowerCase();
      const value = decl[2];
      for (const found of colorTokensIn(value)) {
        const canon = canonical(found);
        if (!canon) continue;
        counts.set(canon, (counts.get(canon) || 0) + 1);
        const sset = sels.get(canon) || new Set<string>();
        for (const one of selector.split(",")) {
          const t = one.trim().split(/\s+/).pop() || "";
          if (t && !t.startsWith("@")) sset.add(t);
        }
        sels.set(canon, sset);
        const pset = props.get(canon) || new Set<string>();
        pset.add(prop);
        props.set(canon, pset);
      }
    }
  }

  return [...counts.entries()]
    .map(([value, rules]) => ({
      value,
      rules,
      selectors: [...(sels.get(value) || [])].slice(0, 6),
      props: [...(props.get(value) || [])].sort(),
    }))
    // Most-used first, same as sizesIn — the colour carrying the most rules is the one somebody
    // looking for "the main brand colour" will find first.
    .sort((a, b) => b.rules - a.rules || a.value.localeCompare(b.value));
}

/** Every hex/rgb token inside one declaration's value — a box-shadow can carry more than one. */
function colorTokensIn(value: string): string[] {
  return [...value.matchAll(HEX), ...value.matchAll(RGB)].map((m) => m[0]);
}

/**
 * Remove `@font-face` blocks and `url(...)` contents before scanning for colour — a data-URI SVG
 * (`url("data:image/svg+xml,...%23ff0000...")` or a `url(data:image/png;base64,...)`) can contain
 * hex-looking bytes that are pixels or an encoded fragment, never a CSS colour declaration, and an
 * `@font-face` block only ever carries `src: url(...)` + `font-*` properties — no colour a person
 * would want to repaint.
 */
function stripNonDeclarations(css: string): string {
  let out = css.replace(/@font-face\s*\{[^{}]*\}/gi, "");
  out = out.replace(/url\([^)]*\)/gi, "url()");
  return out;
}

/**
 * Apply the site's colour overrides to a stylesheet on its way out — same contract as
 * `applyTypeScale` in lib/typeScale.ts.
 *
 * `map` is keyed by the design's ORIGINAL canonical value — `{"#0f172a": "#1e3a6e"}` means
 * "everything the design set at #0f172a (however it spelled it — `#0F172A`, `rgb(15,23,42)`) is
 * now #1e3a6e". A key with no entry, or an entry equal to the original, is left exactly as it
 * was: an empty map or a self-map is an EXACT no-op, byte for byte.
 *
 * ⚠️ Runs on the raw string, not rule-by-rule, so it reaches inside `@media` blocks — a rule-based
 * walk like `colorsIn`'s would have to reconstruct nesting to get back there; a direct token
 * replace does not care what wraps it.
 *
 * ⚠️ Rewrites EVERY hex/rgb token in a declaration independently — `box-shadow: 0 2px 4px #000,
 * inset 0 0 2px #fff` has two colours, and each is matched and looked up on its own so mapping
 * `#000` never touches the `#fff` two commas later.
 */
export function applyColorMap(css: string, map?: Record<string, string> | null): string {
  if (!css || !map) return css;
  const keys = Object.keys(map).filter((k) => {
    const next = map[k];
    if (!next) return false;
    const from = canonical(k) || k.trim().toLowerCase();
    const to = canonical(next) || next.trim().toLowerCase();
    return from !== to;
  });
  if (!keys.length) return css;

  // Canonical value -> replacement, so every spelling of the same colour looks up the same entry.
  const byCanon = new Map<string, string>();
  for (const k of keys) {
    const canon = canonical(k);
    if (canon) byCanon.set(canon, map[k]);
  }
  if (!byCanon.size) return css;

  return css.replace(new RegExp(`${HEX.source}|${RGB.source}`, "gi"), (token) => {
    const canon = canonical(token);
    if (!canon) return token;
    const next = byCanon.get(canon);
    return next || token;
  });
}

/**
 * Whether a colour reads as dark — so the settings panel can pick white or black text on a
 * swatch without hardcoding a list. Standard relative-luminance threshold (WCAG's own formula,
 * simplified to the sRGB coefficients most swatch-pickers use), not colour science precision:
 * this only has to decide "put light text on it or dark text on it", not pass an accessibility
 * audit.
 */
export function isDark(value: string): boolean {
  const canon = canonical(value) || value;
  const hex = /^#([0-9a-f]{6})$/i.exec(canon.trim());
  if (!hex) return false; // an unresolved value defaults to "treat as light" (dark text), the safer common case
  const h = hex[1];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}
