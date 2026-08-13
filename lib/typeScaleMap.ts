// WHICH SIZE ACTUALLY GOVERNS ONE PIECE OF TEXT — the missing link between the size legend in
// typeScale.ts and a single text row on the settings panel.
//
// ── WHY THIS IS SEPARATE FROM sampleFor ──────────────────────────────────────────────────────
// sampleFor walks FORWARD from a selector to find a sample of words — "which text uses this
// size". This walks the other direction, from a known text row to the size that governs it —
// "which size applies to THIS text". A settings row for `t3` needs to preview at the size it will
// actually render at, and later, editing one row's size needs to know exactly which declared value
// to rewrite. Reusing sampleFor's class-matching logic here would search the whole section for the
// FIRST element wearing a matching class; that is wrong for a token that is itself nested inside
// several classed ancestors — it has to match on ITS OWN enclosing chain, innermost first.
//
// ⛔ NEVER GUESS. A token with no confident match returns "" — not the nearest size, not the
// biggest, not the first rule in the sheet. Silently resizing the wrong row is worse than a blank
// legend, exactly per typeScale.ts's own rule for `roleFor`/`sampleFor`.
//
// ── WHY STRING SCANNING, NOT node-html-parser ────────────────────────────────────────────────
// designHtml.ts parses with node-html-parser, but that only runs server-side. This can be called
// from a settings panel in the browser, so the enclosing-tag chain is built by walking open/close
// tags with regex up to the token's position — the same trade lib/typeScale.ts already made for
// matching classes against markup rather than resolving the real CSS cascade.

export type SizeIndex = { value: string; selectors: string[] }[];

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

type Candidate = { tag: string; classes: string[] };

/**
 * A selector this codebase's own stylesheets actually write — `h1.big`, `.eyebrow`, `p` — parsed
 * into a tag (optional) and a class list (possibly empty). Anything more exotic (`#id`, `[attr]`,
 * `a:hover`, `*`) returns null rather than being matched loosely; `sizesIn` already reduces
 * descendant selectors to their last simple selector, so this is the shape that survives.
 */
function parseSelector(sel: string): { tag?: string; classes: string[] } | null {
  const m = /^([a-zA-Z][a-zA-Z0-9]*)?((?:\.[A-Za-z0-9_-]+)*)$/.exec(sel.trim());
  if (!m) return null;
  const tag = m[1] ? m[1].toLowerCase() : undefined;
  const classes = m[2] ? m[2].split(".").filter(Boolean) : [];
  if (!tag && !classes.length) return null;
  return { tag, classes };
}

/**
 * The chain of elements enclosing `tokenIndex`, innermost first — built by walking every open/close
 * tag from the start of the string up to that point and keeping a stack, same as a browser would,
 * without pulling in a full parser.
 */
function enclosingChain(html: string, tokenIndex: number): Candidate[] {
  const stack: Candidate[] = [];
  const TAG = /<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^>]*)?>/g;
  TAG.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG.exec(html)) && m.index < tokenIndex) {
    const whole = m[0];
    if (whole.startsWith("<!--")) continue;
    if (whole[1] === "/") {
      const nm = /^<\/([a-zA-Z][a-zA-Z0-9-]*)/.exec(whole);
      const name = nm ? nm[1].toLowerCase() : "";
      // Unwind to (and including) the last open tag of this name, the way a real parser recovers
      // from mismatched nesting, rather than assuming the markup is perfectly balanced.
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === name) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const nm = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(whole);
    if (!nm) continue;
    const tag = nm[1].toLowerCase();
    const selfClosing = /\/\s*>$/.test(whole);
    const classAttr = /\sclass="([^"]*)"/i.exec(whole);
    const classes = classAttr ? classAttr[1].split(/\s+/).filter(Boolean) : [];
    if (!selfClosing && !VOID_ELEMENTS.has(tag)) stack.push({ tag, classes });
  }
  return [...stack].reverse();
}

/** Does this selector, already parsed, apply to this element? */
function selectorMatches(sel: { tag?: string; classes: string[] }, el: Candidate): boolean {
  if (sel.tag && sel.tag !== el.tag) return false;
  return sel.classes.every((c) => el.classes.includes(c));
}

/**
 * The declared size that governs ONE element — a class-bearing selector wins over a bare tag on
 * the same element, per typeScale.ts's own ordering (a class is the design naming its own thing; a
 * tag is only a category). Two passes rather than one sorted pass, so a bare `p` earlier in `index`
 * never beats a `.lede` match discovered later.
 */
function sizeForElement(el: Candidate, index: SizeIndex): string {
  for (const entry of index) {
    for (const sel of entry.selectors) {
      const parsed = parseSelector(sel);
      if (!parsed || !parsed.classes.length) continue;
      if (selectorMatches(parsed, el)) return entry.value;
    }
  }
  for (const entry of index) {
    for (const sel of entry.selectors) {
      const parsed = parseSelector(sel);
      if (!parsed || parsed.classes.length) continue;
      if (selectorMatches(parsed, el)) return entry.value;
    }
  }
  return "";
}

/**
 * Which declared size governs the text row `key` inside this section's markup.
 * Returns the DECLARED value (e.g. "clamp(40px,6vw,68px)" or "15px") or "" if it cannot be
 * determined confidently.
 */
export function governingSize(html: string, key: string, index: SizeIndex): string {
  const str = String(html || "");
  const token = new RegExp(`\\{\\{t:${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\}\\}`).exec(str);
  if (!token) return "";
  const chain = enclosingChain(str, token.index);
  for (const el of chain) {
    const size = sizeForElement(el, index);
    if (size) return size;
  }
  return "";
}
