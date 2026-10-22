// Scope a site-wide stylesheet to one container (2026-10-22).
//
// SJC's copper look lives in a <style data-sjc-site-copper> block INSIDE the nav document, so the public
// site always wears it and the builder canvas never did: the canvas renders one page without the nav, and
// Steven opened the editor to a blue page with the tiger logo while the live site was copper. The canvas
// is not an iframe (PuckEditor: iframe disabled), so the block cannot simply be emitted — its `body` and
// `:root` rules would repaint the editor's own panels. Every selector is moved under `scope` instead;
// `:root`, `html` and `body` become the scope itself. @media is entered, @keyframes and @font-face pass
// through untouched.

const ROOTISH = /^(:root|html|body)(?=$|[\s.:#[>+~])/;

function scopeSelector(sel: string, scope: string): string {
  const s = sel.trim();
  if (!s) return s;
  if (ROOTISH.test(s)) return s.replace(ROOTISH, scope);
  return `${scope} ${s}`;
}

/** Find the `}` that closes the block opened at `open` (the index of its `{`). */
function closeOf(css: string, open: number): number {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return i;
  }
  return css.length - 1;
}

export function scopeCss(css: string, scope: string): string {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let out = "";
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf("{", i);
    if (open < 0) break;
    const head = src.slice(i, open).trim();
    const close = closeOf(src, open);
    const body = src.slice(open + 1, close);
    if (head.startsWith("@media") || head.startsWith("@supports")) {
      out += `${head}{${scopeCss(body, scope)}}`;
    } else if (head.startsWith("@")) {
      out += `${head}{${body}}`;
    } else {
      out += `${head.split(",").map((s) => scopeSelector(s, scope)).join(",")}{${body}}`;
    }
    i = close + 1;
  }
  return out;
}

/** Every `<style data-sjc-site-…>` block in a Puck document: CSS meant for the whole site, not one section. */
export function siteWideStyles(doc: unknown): string {
  let css = "";
  (function walk(x: unknown) {
    if (typeof x === "string") {
      for (const m of x.matchAll(/<style\s+data-sjc-site-[^>]*>([\s\S]*?)<\/style>/g)) css += m[1];
    } else if (x && typeof x === "object") Object.values(x).forEach(walk);
  })(doc);
  return css;
}
