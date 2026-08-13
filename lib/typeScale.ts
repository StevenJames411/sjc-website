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

/**
 * A line of the site's own words, rendered at each size, so the list can be read.
 *
 * ⛔ THE LIST WITHOUT THIS IS UNUSABLE, and Steven said so the moment he opened it: *"How in the
 * fuck do I know in the global panel what I'm adjusting."* Thirty-six rows reading
 * `clamp(40px,6vw,68px) · 10 places` and `30px · 20 places` name nothing a person can see. A number
 * is not a label.
 *
 * The selector is the bridge. The sheet says `h1.big{font-size:clamp(40px,6vw,68px)}`; the markup
 * says `<h1 class="big">{{t:t3}}</h1>`; the block's text rows say `t3` is "Grow Your Business". So
 * the row can show the actual headline, set at the actual size.
 *
 * ⚠️ MATCHED BY CLASS, NOT BY RESOLVING THE CASCADE. Working out which rule truly wins for a given
 * element means implementing CSS specificity over a 30KB sheet, server-side, on a settings page.
 * These designs write single-class selectors (`.eyebrow`, `.lede`, `.btn`, `h1.big`), so matching
 * the last class in the selector against `class="…"` in the markup finds the right text nearly
 * always — and when it misses it returns nothing rather than the WRONG words, which is the only
 * failure mode that would matter.
 */
export function sampleFor(
  selectors: string[],
  blocks: { html?: string; text?: { key: string; value: string }[] }[]
): string {
  // ⛔ CLASS SELECTORS ONLY, AND THAT IS A RETREAT MADE ON PURPOSE.
  //
  // Matching bare tags raised coverage from a third to three quarters and made the list WORSE: `p`
  // matches the first paragraph on the site whichever rule is really winning, so four different
  // sizes showed the same sentence. A row that shows words implies "change this and those words
  // move" — and for three of those four it was false. The same promise `roleFor` keeps by
  // returning "" instead of guessing.
  //
  // A class is the design naming its own thing (`.lede`, `.eyebrow`, `.btn`), so it identifies one
  // decision. A tag identifies a category. Rows with only a tag get a ROLE and no sample, which is
  // honest and still answers "what is this".
  const withClass = selectors.filter((x) => /\.[A-Za-z0-9_-]+$/.test(x));
  for (const sel of withClass) {
    const tag = (sel.match(/^([a-z][a-z0-9]*)/i) || [])[1] || "[a-z][a-z0-9]*";
    const cls = (sel.match(/\.([A-Za-z0-9_-]+)$/) || [])[1];
    if (!cls) continue;
    const open = new RegExp(`<(${tag})\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, "i");

    for (const b of blocks) {
      const html = String(b?.html || "");
      if (!html) continue;
      const m = open.exec(html);
      if (!m) continue;

      // ⚠️ STOP AT THE ELEMENT'S OWN CLOSING TAG. Taking a fixed window instead ran straight past
      // it and swept in the rest of the page — rows came back reading "Steven James Consulting
      // Menu <s" and "First name Last name <input id=". Counting depth on the real tag name costs
      // nothing and cannot overrun.
      const name = m[1].toLowerCase();
      let i = m.index + m[0].length;
      let depth = 1;
      const openRe = new RegExp(`<${name}\\b`, "gi");
      const closeRe = new RegExp(`</${name}\\s*>`, "gi");
      openRe.lastIndex = i;
      closeRe.lastIndex = i;
      let end = html.length;
      while (depth > 0) {
        const c = closeRe.exec(html);
        if (!c) break;
        openRe.lastIndex = i;
        let opens = 0;
        let o: RegExpExecArray | null;
        while ((o = openRe.exec(html)) && o.index < c.index) opens++;
        depth += opens - 1;
        i = c.index + c[0].length;
        if (depth <= 0) end = c.index;
      }
      const inner = html.slice(m.index + m[0].length, end);

      const token = /\{\{t:([a-z0-9]+)\}\}/i.exec(inner);
      let words = "";
      if (token) words = (b.text || []).find((r) => r.key === token[1])?.value || "";
      if (!words) words = inner.replace(/<[^>]*>/g, " ").replace(/\{\{[^}]+\}\}/g, " ");
      const clean = words.replace(/\s+/g, " ").trim();
      if (clean.length >= 2) return clean.slice(0, 60);
    }
  }
  return "";
}


/**
 * What this size IS, in words a person uses — the legend Steven asked for.
 *
 * *"I understand H1, H2, H3… but for this legend you're listing 40 different places here, and only
 * about a third of them have a proper legend."* The sample line says WHERE it is on the page; this
 * says WHAT IT IS, so the two together answer the question without knowing any HTML.
 *
 * ⚠️ Derived from the tag, which is the one thing that means the same in every design. A class
 * called `.lede` means nothing outside the design that named it; `<p>` is body copy everywhere.
 * Returns "" rather than guessing when the selector is only a class — the sample line carries it.
 */
export function roleFor(selectors: string[]): string {
  const ROLES: Record<string, string> = {
    h1: "Headline",
    h2: "Section heading",
    h3: "Sub-heading",
    h4: "Small heading",
    h5: "Small heading",
    h6: "Small heading",
    p: "Body text",
    li: "List item",
    a: "Link",
    button: "Button",
    small: "Fine print",
    label: "Form label",
    input: "Form field",
    blockquote: "Quote",
  };
  for (const sel of selectors) {
    const tag = (sel.match(/^([a-z][a-z0-9]*)/i) || [])[1];
    if (tag && ROLES[tag.toLowerCase()]) return ROLES[tag.toLowerCase()];
  }
  return "";
}

/** `font-size: 13.5px` — the declaration, wherever it appears, including inside @media. */
const FONT_SIZE = /font-size\s*:\s*([^;}]+)/gi;

/**
 * Every distinct size in a stylesheet, and how many rules use each.
 *
 * ⚠️ `inherit`, `1em`, `80%` and friends are RETURNED, not filtered. They are real decisions —
 * `small{font-size:80%}` is why fine print is fine print — and hiding them would leave a size the
 * list claims to cover but silently does not. They sort to the bottom; the UI can decide.
 */
export function sizesIn(css: string): { value: string; rules: number; selectors: string[] }[] {
  const counts = new Map<string, number>();
  const sels = new Map<string, Set<string>>();
  // Rule-by-rule, so a size can be traced back to the selectors that set it — which is what turns
  // "30px · 20 places" into something a person can identify.
  for (const rule of String(css || "").matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = rule[2];
    if (!/font-size/i.test(body)) continue;
    const m = /font-size\s*:\s*([^;}]+)/i.exec(body);
    if (!m) continue;
    const v = m[1].trim().replace(/\s+/g, " ");
    if (!v) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
    const set = sels.get(v) || new Set<string>();
    for (const one of rule[1].split(",")) {
      const t = one.trim().split(/\s+/).pop() || "";
      if (t && !t.startsWith("@")) set.add(t);
    }
    sels.set(v, set);
  }
  return [...counts.entries()]
    .map(([value, rules]) => ({ value, rules, selectors: [...(sels.get(value) || [])].slice(0, 6) }))
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
