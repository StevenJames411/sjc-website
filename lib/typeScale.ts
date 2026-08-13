// EVERY TEXT SIZE ON A WEBSITE, IN ONE LIST, SET ONCE.
//
// ── THE PROBLEM ───────────────────────────────────────────────────────────────────────────────
// Steven merged three bought designs into one ten-page site and every band arrived with its own
// type scale. Measured across four pages: **36 distinct font sizes**, including 13px, 13.5px,
// 14.5px, 15px and 15.5px all doing the same job. Every one of them is editable today — one text
// row at a time, in one section at a time, on one page at a time:
//
//   *"I have to go back through this website, this 10-page website that has six sections per page,
//    and match everything. That'll take me all fucking day."*
//
// He is describing the same gap the brand layer already closed for COLOUR and TYPEFACE: a decision
// that is obviously per-SITE, implemented per-section. This is that fix for size.
//
// ── WHY IT IS KEYED BY THE VALUE, NOT BY A ROLE ───────────────────────────────────────────────
// The obvious design is a fixed vocabulary — Headline, Subhead, Body, Caption — and it cannot work
// here. A bought design names its own sizes in its own classes (`.mark__2`, `.eyebrow`, `.lede`,
// `.btn`, `h1.big`) and the next design will name different ones. Nothing maps them to roles
// without guessing, and a wrong guess silently resizes the wrong text.
//
// The design's own stylesheet already holds the answer: `13.5px` is a decision somebody made, and
// every rule using it is that same decision applied 42 times. So the list IS the set of distinct
// values, and changing one changes every place it is used — which is exactly how Steven described
// it: *"some of these sections share the font size."*
//
// It also degrades honestly on a design nobody has seen: no vocabulary to match, no roles to
// misassign, just the sizes that design actually uses.
//
// ── HOW IT IS APPLIED ─────────────────────────────────────────────────────────────────────────
// By REWRITING THE VALUE IN THE SHEET as it is served, not by emitting overrides after it. An
// override rule has to win a specificity fight against selectors nobody wrote (`h1.big` is (0,1,1),
// `.sjc-design-x .work__link` is (0,2,0)) and would lose silently on some of them. Rewriting the
// declaration cannot lose — there is nothing left to beat.
//
// ⚠️ THE STORED SHEET IS NEVER TOUCHED. It is content-addressed and immutable (siteKeys.designSheet)
// and shared by every page that references it. This transforms the string on its way out, so
// clearing the map restores the design byte-for-byte and nothing has to be recompiled.

/** `font-size: 13.5px` — the declaration, wherever it appears, including inside @media. */
const FONT_SIZE = /font-size\s*:\s*([^;}]+)/gi;

/**
 * Every distinct size in a stylesheet, and how many rules use each.
 *
 * ⚠️ `inherit`, `1em`, `80%` and friends are RETURNED, not filtered. They are real decisions —
 * `small{font-size:80%}` is why fine print is fine print — and hiding them would leave a size the
 * list claims to cover but silently does not. They sort to the bottom; the UI can decide.
 */
export function sizesIn(css: string): { value: string; rules: number }[] {
  const counts = new Map<string, number>();
  for (const m of String(css || "").matchAll(FONT_SIZE)) {
    const v = m[1].trim().replace(/\s+/g, " ");
    if (!v) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, rules]) => ({ value, rules }))
    // Biggest first, so the headline sizes are at the top where somebody looking for "the big one"
    // will start. Anything without a px number (inherit, 1em, 80%) sorts last.
    .sort((a, b) => (pxOf(b.value) - pxOf(a.value)) || a.value.localeCompare(b.value));
}

/**
 * The px number to sort by. `clamp(40px,6vw,68px)` sorts by its LARGEST px — that is the size the
 * headline actually renders at on the screen where the decision gets made (two-canvas doctrine:
 * the laptop earns the money), and sorting a hero headline below body copy because its first
 * argument is 40 would be nonsense.
 */
function pxOf(v: string): number {
  const all = [...v.matchAll(/(-?[\d.]+)px/g)].map((m) => Number(m[1])).filter((n) => !Number.isNaN(n));
  return all.length ? Math.max(...all) : -1;
}

/**
 * Apply the site's size overrides to a stylesheet on its way out.
 *
 * `map` is keyed by the design's ORIGINAL value — `{"13.5px": "15px"}` means "everything the design
 * set at 13.5px is now 15px". A key with no entry, or an entry equal to the original, is left
 * exactly as it was.
 */
export function applyTypeScale(css: string, map?: Record<string, string> | null): string {
  if (!css || !map) return css;
  const keys = Object.keys(map).filter((k) => map[k] && map[k] !== k);
  if (!keys.length) return css;
  return css.replace(FONT_SIZE, (whole, raw: string) => {
    const v = String(raw).trim().replace(/\s+/g, " ");
    const next = map[v];
    return next && next !== v ? `font-size:${next}` : whole;
  });
}
