// Turn a bought design's markup into a real stylesheet, server-side, at import time.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// A generated design (SiteDrop and everything like it) ships its styling as TAILWIND UTILITY
// CLASSES pulled from cdn.tailwindcss.com — `bg-[#00D9FF]`, `blur-[120px]`, `bg-[#0A0E27]/80`.
// There is no stylesheet to copy: the CDN compiles those classes in the visitor's browser.
//
// Our own Tailwind compiles by scanning SOURCE FILES. Imported markup lives in the database, so
// Tailwind never sees those classes and they come out as nothing. That is why the old importer
// (lib/importHtml.ts) quantised colours into brand roles and dropped every gradient, blur and
// shadow on the floor — it had no way to keep them.
//
// A safelist can't fix it either: arbitrary values like `#00D9FF` can't be enumerated in advance.
//
// The fix is that Tailwind v4 exports a runtime `compile()`. Hand it the class names and it hands
// back real CSS with the arbitrary values already resolved. Measured against the actual SiteDrop
// page: 335 classes -> 50.4KB in 7ms. No browser, no capture step, no build tooling.
//
// ⚠️ Version-coupled. `compile()` is a real export of tailwindcss 4.x but it is not covered by
// semver the way the CLI is. compileDesignCss() throws a readable error rather than silently
// producing an unstyled page — an import that fails loudly is recoverable, one that quietly
// returns a naked design is not.

import path from "node:path";
import { readFile } from "node:fs/promises";

export { DESIGN_SCOPE } from "./designShared";
import { DESIGN_SCOPE } from "./designShared";

/**
 * Every class name used anywhere in a chunk of markup.
 *
 * Deliberately dumb: Tailwind ignores candidates it doesn't recognise, so over-collecting costs
 * nothing while missing one silently breaks a piece of the layout.
 */
export function classNamesIn(html: string): string[] {
  const out = new Set<string>();
  for (const m of String(html || "").matchAll(/class(?:Name)?=["']([^"']+)["']/g)) {
    for (const c of m[1].split(/\s+/)) if (c) out.add(c);
  }
  return [...out];
}

/**
 * Prefix every rule with the scope class so an imported design can never restyle the rest of the
 * site.
 *
 * `:root` is rewritten rather than scoped — a design's custom properties have to land somewhere
 * that its own descendants inherit from, and that's the wrapper. At-rules that carry their own
 * blocks (@media, @supports) are recursed into; @keyframes, @font-face and @property are left
 * alone because their inner "selectors" are keyframe stops and descriptors, not elements.
 */
export function scopeCss(css: string, scope = DESIGN_SCOPE): string {
  const sel = `.${scope}`;
  const out: string[] = [];
  let i = 0;

  // ⚠️ COMMENTS COME OUT FIRST, ONCE, BEFORE ANY PARSING — AND THIS IS LOAD-BEARING.
  //
  // This walker reads everything between the last `}` and the next `{` as a selector. A stylesheet
  // that documents itself writes `/* responsive */` on the line above its @media block, so that
  // comment lands in the prelude, the `@media` test fails (the string starts with `/*`), and the
  // whole block is treated as a SELECTOR LIST:
  //
  //     .sjc-design /* responsive */
  //     @media (max-width:960px){ .split{grid-template-columns:1fr} }
  //
  // A selector followed by an at-rule is not valid CSS, so the browser DISCARDS THE ENTIRE MEDIA
  // BLOCK. On sjc-2026 the parsed stylesheet contained exactly one `.split` rule — the desktop one
  // — so nothing stacked on a phone: every three-column grid, the hero split, the footer columns.
  // The mobile CSS was present in the file and had never been parsed.
  //
  // Handling comments per-prelude was tried first and did not hold on a real sheet. Removing them
  // up front does, and this is a COMPILED ARTIFACT — nobody reads it, and the design's own source
  // keeps its comments.
  css = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");

  const NO_SCOPE = /^@(keyframes|-\w+-keyframes|font-face|property|import|charset|namespace)/;
  const NESTED = /^@(media|supports|container|layer|scope)\b/;

  while (i < css.length) {
    // Find the next block or statement.
    const brace = css.indexOf("{", i);
    if (brace === -1) break;

    let prelude = css.slice(i, brace).trim();

    // ⚠️ A COMMENT BEFORE A RULE IS NOT PART OF ITS SELECTOR — AND LEAVING IT THERE DISABLED EVERY
    // MOBILE RULE ON AN IMPORTED SITE.
    //
    // A well-commented stylesheet writes `/* mobile */` on the line above its @media block. That
    // comment lands in this prelude, so the `@media` test below fails (the string starts with `/*`),
    // the block is treated as a SELECTOR LIST, and the scope class is glued onto the comment:
    //
    //     .sjc-design /* mobile */
    //     @media (max-width:960px){ .split{grid-template-columns:1fr} }
    //
    // The browser then applies that media block with its selectors UNSCOPED — one class — while the
    // desktop rule outside it got scoped to two. A media query adds no specificity, so on a phone
    // the desktop rule wins and NOTHING STACKS. Measured on sjc-2026: every three-column grid, the
    // hero split and the footer columns all stayed side by side on a phone, with the correct CSS
    // present and simply out-ranked.
    //
    // Comments are pulled out here and re-emitted ahead of the rule, so they can never hide an
    // at-rule or be mistaken for part of a selector.


    // ⚠️ STATEMENT AT-RULES ARE NOT SELECTORS. `@layer theme, base, components, utilities;`
    // declares layer ORDER — commas separate layer NAMES, not selectors. Splitting it on commas
    // and prefixing each part produced `@layer theme,.sjc-design base,…`, which is invalid, so
    // the browser dropped the ordering entirely and Tailwind's preflight could out-rank the
    // utilities. Anything ending in `;` before the next `{` is a statement: emit it untouched.
    const stmtEnd = prelude.lastIndexOf(";");
    if (stmtEnd !== -1) {
      out.push(prelude.slice(0, stmtEnd + 1));
      prelude = prelude.slice(stmtEnd + 1).trim();
    }

    // Walk to the matching close brace, counting depth.
    let depth = 0;
    let j = brace;
    for (; j < css.length; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    const body = css.slice(brace + 1, j);

    if (NO_SCOPE.test(prelude)) {
      out.push(`${prelude}{${body}}`);
    } else if (NESTED.test(prelude)) {
      out.push(`${prelude}{${scopeCss(body, scope)}}`);
    } else {
      const scoped = prelude
        .split(",")
        .map((s) => {
          const t = s.trim();
          if (!t) return "";
          // The design's variables have to live on the wrapper so its children inherit them.
          if (t === ":root" || t === "html" || t === ":host") return sel;
          if (t === "body") return sel;
          // Already scoped (recursion, or a design that namespaced itself).
          if (t.startsWith(sel)) return t;
          return `${sel} ${t}`;
        })
        .filter(Boolean)
        .join(",");
      if (scoped) out.push(`${scoped}{${body}}`);
    }
    i = j + 1;
  }

  return out.join("\n");
}

/**
 * Scope the rules inside a media query that an earlier compile left bare.
 *
 * ⚠️ NEEDED BECAUSE THE STYLESHEET IS COMPILED ONCE, AT IMPORT, AND STORED — same reason
 * repairOverlayHides exists. Fixing scopeCss fixes the next import and nothing already in the
 * database, and re-importing would discard every page built out since.
 *
 * The damage is one-sided and that is what makes it safe to repair: rules OUTSIDE media queries
 * were scoped correctly, only the ones inside were left bare. So any selector in a media block
 * that doesn't already start with the scope gets it — which is exactly what scopeCss would have
 * produced had the comment not hidden the at-rule from it.
 */
/**
 * ⚠️ DELETED ON PURPOSE — DO NOT REINTRODUCE A COMPILED-CSS PATCHER.
 *
 * A first attempt repaired the media-query damage by editing the STORED, ALREADY-COMPILED sheet:
 * strip the stray scope before the at-rule, then re-scope the bare selectors inside it. It
 * produced correct CSS on the first run and then would not converge — one more rewrite on every
 * subsequent run, forever, because a hand-rolled walk over a large compiled stylesheet keeps
 * shifting its own block boundaries. Two other shapes were tried (a regex terminator, and simply
 * re-running scopeCss over the whole sheet) and each failed differently.
 *
 * The right repair is to RECOMPILE from the archived source, which the importer stores for exactly
 * this case — see siteKeys.designSrc and app/api/admin/recompile-css. Patching a compiled artifact
 * to imitate what a fixed compiler would have produced is guesswork; running the fixed compiler is
 * not.
 */

/**
 * TAKE THE TYPEFACE OUT OF THE SHEET SO THE SITE CAN OWN IT.
 *
 * ⛔ THE PROBLEM THIS EXISTS FOR. Steven folded three bought designs into one site and got three
 * typefaces on one page, with nothing in the product able to fix it. Every explanation of the
 * brand layer says the site "re-skins — not one block changed", and that is true of OUR blocks and
 * false of an imported one:
 *
 *   - scopeCss rewrites a design's `:root`/`html`/`body` rules onto that section's own wrapper, so
 *     Tailwind's preflight `html,:host{font-family:…}` compiles to `.sjc-design-<hash>{…}` —
 *     specificity (0,1,0) against BrandStyle's `:root` (0,0,0) and `h1,h2,h3,h4` (0,0,1);
 *   - the design sheet is emitted AFTER BrandStyle, so it also wins every tie on document order.
 *
 * The brand screen therefore had no reach inside an imported section, and no setting anywhere
 * could have. Removing the declaration is what hands control back — the section then inherits
 * `--font-sans` for body copy and takes BrandStyle's rule for headings.
 *
 * ⚠️ THE DESIGN'S OWN TYPEFACE IS NOT LOST. `detectFonts()` already reads it at import and writes
 * it into the site's brand via `nearestFont()`. This moves the face from a place nobody can edit
 * to the one screen built to edit it, which is Steven's standing law: *fonts and colours are
 * per-SITE decisions, never per-section.*
 *
 * ⛔ FOUR THINGS THIS MUST NOT BREAK, each learned the hard way elsewhere in this file:
 *
 * 1. **@font-face keeps its font-family.** There the declaration NAMES the face rather than
 *    applying it; stripping it destroys the definition and the face silently never loads.
 * 2. **Font custom properties go too.** A design that shipped `:root{--font-sans:…}` or
 *    `--default-font-family` gets those scoped onto its wrapper, where they SHADOW BrandStyle's
 *    values for everything inside the section — the same override wearing a different hat. Left
 *    behind, the visible bug survives with the obvious declaration gone, which is worse than not
 *    fixing it.
 * 3. **The `font:` SHORTHAND is left alone on purpose.** It carries size, weight and line-height
 *    in the same declaration, so removing it to win the family would silently collapse the type
 *    scale — the one thing a bought design is bought for. Tailwind never emits it.
 * 4. **font-size, weight, spacing and the whole scale are untouched.** Only which typeface paints
 *    the words changes; every gradient, glass, shadow and measurement compiles byte-identical.
 *
 * Applied inside compileDesignCss, so it reaches existing sites the sanctioned way — bump
 * DESIGN_PIPELINE_REV and run app/api/admin/recompile-css, never by patching a stored sheet (see
 * the tombstone above).
 */
export function stripFontFamily(css: string): string {
  if (!css) return "";

  // Declarations to remove wherever they appear OUTSIDE an @font-face block. The custom-property
  // arm is not optional — see note 2 above.
  // ⛔ THE NEGATIVE LOOKAHEAD IS THE WHOLE SAFETY OF THIS. `--font-[\w-]*` also matches
  // `--font-weight-bold: 700`, which Tailwind v4 emits as a theme token and every `.font-bold`
  // rule then reads through `var(--font-weight-bold)`. Measured on real compiled output: 2 of 6
  // weight tokens destroyed, so every bold headline on the site renders at normal weight — and
  // the page still looks finished, which is how it would have shipped. Only FAMILY tokens go.
  const DROP =
    /(^|[;{])([^;{}]*?)(font-family|--default-font-family|--font-(?!weight|size|style|feature|variation|stretch|smoothing|synthesis)[\w-]*)\s*:[^;{}]*(;|(?=\s*}))/gi;

  // ⚠️ RUN TO A FIXED POINT, because the pattern CONSUMES the `;` that separates it from the next
  // declaration. `{font-family:a;font-family:b}` matched once, ate the separator, and left the
  // second one with no delimiter in front of it to match against — so a rule that set the family
  // twice kept the second, which is the one that was winning anyway.
  const dropAll = (s: string) => {
    for (let pass = 0; pass < 8; pass++) {
      const next = s.replace(DROP, (m, pre, mid) => ((mid || "").trim() ? m : pre));
      if (next === s) return s;
      s = next;
    }
    return s;
  };

  // @font-face is passed through verbatim. Walking to the matching brace rather than regexing the
  // block keeps a nested-looking value from ending it early.
  let out = "";
  let i = 0;
  while (i < css.length) {
    const at = css.toLowerCase().indexOf("@font-face", i);
    if (at === -1) {
      out += dropAll(css.slice(i));
      break;
    }
    out += dropAll(css.slice(i, at));
    const open = css.indexOf("{", at);
    if (open === -1) {
      out += css.slice(at);
      break;
    }
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    out += css.slice(at, j); // the whole @font-face, untouched
    i = j;
  }

  // A rule whose only declaration was the font is now empty. Left in, thousands of `.x{}` husks
  // accumulate in a 55KB sheet for no reason.
  return out.replace(/[^{}]+\{\s*\}/g, "").replace(/\n{3,}/g, "\n\n");
}

/**
 * The one kind of "hidden" that must STAY hidden.
 *
 * ⚠️ THIS EXACT RULE BURIED A LIVE SITE. revealHiddenStates() (below) un-hides anything parked at
 * zero opacity, because a scroll-reveal that never gets un-hidden renders the page blank. A mobile
 * MENU hides itself the identical way:
 *
 *   .ovl { position:fixed; inset:0; z-index:100; background:var(--navy); opacity:0; visibility:hidden }
 *   .ovl[data-open="true"] { opacity:1; visibility:visible }
 *
 * Strip those two declarations and the menu can never close. On sjc-2026 that put a full-viewport
 * navy panel over every page — header, hero and footer all still there, all underneath it — in the
 * studio AND on the published site. It reads as "the header and footer are missing".
 *
 * `position: fixed` is the line between the two cases, and it holds in both directions: an element
 * pinned to the viewport is a menu, modal, drawer or cookie bar — never a scroll reveal, which by
 * definition has to scroll. So a fixed element at zero opacity keeps its hide state.
 */
const OVERLAY = /(?:^|;|\s)position\s*:\s*fixed\b/i;

/**
 * Put back a hide state that an earlier import already stripped.
 *
 * ⚠️ NEEDED BECAUSE THE STYLESHEET IS COMPILED ONCE, AT IMPORT, AND STORED. Fixing the compiler
 * fixes the next import and nothing else — a site imported before the fix keeps serving the broken
 * sheet forever. Re-importing would heal it and throw away every page built out since, so the
 * stored CSS gets repaired in place instead.
 *
 * Only touches a rule that is all four of: fixed-position, carrying no opacity or visibility of its
 * own, and shadowed by a companion rule that turns the SAME selector visible in some state
 * (`.ovl[data-open="true"]`). That companion is the proof the base rule was meant to be hidden —
 * without it, a fixed element with no opacity is just a normal sticky bar, and hiding it would be
 * the same bug pointing the other way.
 *
 * Idempotent: a repaired rule declares opacity, so a second run skips it.
 */
export function repairOverlayHides(css: string): { css: string; repaired: number } {
  const src = String(css || "");
  const RULE = /(@keyframes[\s\S]*?\{[\s\S]*?\}\s*\})|([^{}]+)\{([^{}]*)\}/g;

  // ⚠️ SELECTORS ARRIVE WITH COMMENTS INSIDE THEM. scopeCss() prefixes the scope onto whatever text
  // sits before the `{`, and a design that comments its sections leaves that comment in the middle:
  //
  //   .sjc-design /* ── full-screen menu overlay ── */
  //   .ovl{position:fixed;…}
  //
  // Comparing that raw against `.sjc-design .ovl[data-open="true"]` matches nothing, which is why
  // the first run of this repair reported 0 on a sheet that visibly needed it.
  const normSel = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\s+/g, " ").trim();

  // Pass 1 — every selector some rule turns visible. These are the state rules.
  const shown: string[] = [];
  for (const m of src.matchAll(RULE)) {
    const [, keyframes, selector, body] = m;
    if (keyframes || !selector) continue;
    if (!/visibility\s*:\s*visible|opacity\s*:\s*(?:1|0?\.\d*[1-9])/i.test(body)) continue;
    for (const s of selector.split(",")) shown.push(normSel(s));
  }

  // A companion is the base selector plus a STATE qualifier — an attribute, class, id or
  // pseudo-class glued directly onto it. `.ovl` -> `.ovl[data-open="true"]`. The glue matters:
  // `.ovl .thing` is a descendant, a different element entirely, and proves nothing.
  const hasCompanion = (base: string) =>
    shown.some((s) => s.length > base.length && s.startsWith(base) && /[[.:#]/.test(s[base.length]));

  let repaired = 0;
  const out = src.replace(RULE, (whole, keyframes: string | undefined, selector: string, body: string) => {
    if (keyframes || !selector) return whole;
    if (!OVERLAY.test(body)) return whole;
    if (/(?:^|;|\s)(opacity|visibility)\s*:/i.test(body)) return whole;
    if (!selector.split(",").some((s) => hasCompanion(normSel(s)))) return whole;
    repaired++;
    return `${selector}{${body.replace(/;\s*$/, "")};opacity:0;visibility:hidden}`;
  });

  return { css: out, repaired };
}

/**
 * Undo "hidden until JavaScript says otherwise" states.
 *
 * ⚠️ THE FAILURE THIS PREVENTS IS SILENT AND TOTAL. Generated pages ship a scroll-reveal: a class
 * that sets `opacity: 0`, plus a script that adds `.visible` when the element scrolls into view.
 * We strip every script (nothing executable reaches a customer's site), so that class never gets
 * un-hidden and EVERY SECTION BELOW THE FOLD RENDERS BLANK. Nothing errors. The HTML is all
 * there, the stylesheet is all there, the page is just empty — which is exactly what it did on
 * the first pass of this import.
 *
 * So any rule that parks content at zero opacity gets that declaration removed, along with the
 * transform that goes with it (the "slide up from" half of the same effect). @keyframes are left
 * alone: an opacity: 0 keyframe is a real animation step, not a hidden state.
 *
 * Limit worth knowing: this handles a design's OWN css. A design that hid things with Tailwind's
 * `opacity-0` utility plus a script would need the class stripped from the markup instead.
 */
export function revealHiddenStates(css: string): string {
  return String(css || "").replace(
    /(@keyframes[\s\S]*?\{[\s\S]*?\}\s*\})|([^{}]+)\{([^{}]*)\}/g,
    (whole, keyframes: string | undefined, selector: string, body: string) => {
      if (keyframes) return keyframes;
      if (!/opacity\s*:\s*0(\.0+)?\s*(;|$)/i.test(body)) return whole;
      if (OVERLAY.test(body)) return whole;
      const cleaned = body
        .split(";")
        .filter((d) => !/^\s*(opacity\s*:\s*0(\.0+)?|visibility\s*:\s*hidden|transform\s*:)/i.test(d))
        .join(";");
      return `${selector}{${cleaned}}`;
    }
  );
}

/**
 * Compile the Tailwind utilities a design uses into a scoped stylesheet.
 *
 * `extraCss` is the design's own inline <style> — the handful of rules that aren't utilities
 * (SiteDrop's `.animate-on-scroll` is the whole of it on this page). It gets scoped too.
 *
 * `scope` is the class every rule is prefixed with. It defaults to the shared `DESIGN_SCOPE` so
 * existing callers are unchanged; the importer passes `sheetScope(id)` so two designs can sit on
 * one page without their identically-named utilities overwriting each other — see the note on
 * `sheetScope` in lib/designShared.ts for why the shared class alone could not do that.
 */
export async function compileDesignCss(
  html: string,
  extraCss = "",
  scope: string = DESIGN_SCOPE
): Promise<string> {
  const candidates = classNamesIn(html);
  if (!candidates.length && !extraCss.trim()) return "";

  let build: (c: string[]) => string;
  try {
    const { compile } = await import("tailwindcss");
    const root = path.join(process.cwd(), "node_modules", "tailwindcss");
    const compiler = await compile(`@import "tailwindcss";`, {
      base: process.cwd(),
      async loadStylesheet(id: string, base: string) {
        const file = id === "tailwindcss" ? path.join(root, "index.css") : path.resolve(base, id);
        return { path: file, base: path.dirname(file), content: await readFile(file, "utf8") };
      },
      async loadModule() {
        // A bought design never brings a JS plugin. If one ever does, fail loudly.
        throw new Error("design CSS: JS modules are not supported in an imported design");
      },
    });
    build = (c) => compiler.build(c);
  } catch (e) {
    throw new Error(
      `design CSS: could not start the Tailwind compiler (${(e as Error).message}). ` +
        `Importing would produce an unstyled page, so the import is being refused instead.`
    );
  }

  const utilities = build(candidates);
  return stripFontFamily(scopeCss(`${utilities}\n${revealHiddenStates(extraCss)}`, scope));
}
