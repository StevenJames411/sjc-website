// DESIGN-MODE import: bring a bought design in with its look intact.
//
// The original importer (lib/importHtml.ts) maps a generated page onto our block vocabulary. That
// is the right move for a plain page and the wrong one for a design worth paying for: it reads ~6
// style signals, snaps each onto a fixed ladder, turns every colour into a brand role, and drops
// the stylesheet — so gradients, glass, coloured shadows, the custom type scale and the floating
// cards all disappear. It keeps the words and throws away the thing you bought.
//
// This path keeps the markup verbatim and makes only the CONTENT editable:
//
//   split into sections -> tokenise words + photos -> compile the Tailwind -> one DesignSection
//   block per section, plus a scoped stylesheet stored beside the page.
//
// What it gives up is sub-layout editing inside a section. That was a deliberate trade: a
// different layout costs another $2.50 from the design tool, which is faster than rearranging one
// by hand.

import type { Data } from "@measured/puck";
import {
  splitSections,
  tokenizeSection,
  inlineLucideIcons,
  paddingOf,
  modernizeOpacityUtilities,
} from "./designHtml";
import { compileDesignCss } from "./designCss";
import { sheetScope, DESIGN_PIPELINE_REV } from "./designShared";
import { inlineFontAwesomeIcons } from "./faIcons";
import { nearestFont, type BrandFont } from "./brandShared";
import { createHash } from "node:crypto";

export type DesignImport = {
  data: Data;
  css: string;
  /** The sheet's content-addressed id, stamped on every block as `props.sheet`. */
  sheetId: string;
  fonts: { headingFont: BrandFont; bodyFont: BrandFont };
  accent: string;
  report: string[];
};

/**
 * A design's identity: a hash of the markup its stylesheet was compiled from.
 *
 * This id is what makes the sheet travel. It lives in `DesignSection.props.sheet`, so every path
 * that copies block props — which is all of them — carries the stylesheet reference for free, and
 * none of them has to know a stylesheet exists.
 *
 * ⚠️ THE TAILWIND VERSION IS PART OF THE HASH, DELIBERATELY. The same markup compiled by a
 * different Tailwind is different CSS, so it is a different sheet and must not quietly reuse the
 * old id. Include it and a compiler upgrade re-imports cleanly; leave it out and pages keep
 * pointing at a sheet built by a compiler that no longer exists.
 *
 * 16 hex chars: far past any practical collision concern, short enough to read in a key and in the
 * block's props.
 */
export function sheetIdFor(html: string, tailwindVersion = TW_VERSION): string {
  return createHash("sha256")
    .update(`${tailwindVersion}\n${DESIGN_PIPELINE_REV}\n${html}`)
    .digest("hex")
    .slice(0, 16);
}

// Read once at module load. Failing to resolve it is not fatal — "unknown" still hashes
// consistently within a deployment, which is all the id has to do.
const TW_VERSION: string = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return String(require("tailwindcss/package.json").version || "unknown");
  } catch {
    return "unknown";
  }
})();

/**
 * The stylesheet for a design, from its raw HTML.
 *
 * ⚠️ ONE DEFINITION, TWO CALLERS. The importer runs this at import; admin/recompile-css runs it
 * again later when a compiler bug has to be undone on a site already in the database. Those two
 * must never drift — a repair that compiles even slightly differently from the importer produces a
 * site that nobody can reproduce.
 *
 * Icons first: a generated page ships empty `<i data-lucide>` tags filled in by a CDN script we
 * strip, and the CSS must be built from exactly what will render or a class that only exists
 * post-transform compiles to nothing.
 */
export async function compileCssForDesign(html: string): Promise<string> {
  const icons = await inlineLucideIcons(html);
  const fa = await inlineFontAwesomeIcons(icons.html);
  const withIcons = modernizeOpacityUtilities(fa.html);
  // Scoped to THIS design's own class, so two designs on one page don't overwrite each other's
  // identically-named utilities. The id is derived from the same `html` the caller hashes, so the
  // scope here and the `props.sheet` stamped on the blocks always agree.
  return compileDesignCss(withIcons, inlineStyles(html), sheetScope(sheetIdFor(html)));
}

/** Every inline <style> in the document — the non-utility rules a design brings with it. */
function inlineStyles(html: string): string {
  return [...String(html).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
}

/**
 * Which two families the design uses.
 *
 * Generated pages state this twice — once in the Google Fonts <link>, once in inline
 * `font-family` declarations — and the inline ones tell us which is for headings. next/font is
 * build-time, so whatever is found gets mapped onto the nearest family we actually ship
 * (lib/brandShared.ts `nearestFont`).
 */
export function detectFonts(html: string): { headingFont: BrandFont; bodyFont: BrandFont } {
  const s = String(html || "");

  // A heading's own font-family wins: `<h1 style="font-family: 'Space Grotesk', …">`, or a
  // stylesheet rule like `h1,h2,h3 { font-family: … }`.
  const headingRule =
    s.match(/h[1-6][^{}]*\{[^{}]*font-family\s*:\s*([^;}]+)/i) ||
    s.match(/<h[1-6][^>]*style=["'][^"']*font-family\s*:\s*([^;"']+)/i);

  const bodyRule =
    s.match(/(?:^|[{;\s])body\s*\{[^{}]*font-family\s*:\s*([^;}]+)/i) ||
    s.match(/<p[^>]*style=["'][^"']*font-family\s*:\s*([^;"']+)/i);

  // Fall back to the Google Fonts link, whose first family is conventionally the display face.
  const linked = [...s.matchAll(/family=([A-Za-z0-9+%]+)/g)].map((m) =>
    decodeURIComponent(m[1].replace(/\+/g, " "))
  );

  const heading = headingRule?.[1] || linked[0] || "";
  const body = bodyRule?.[1] || linked[1] || linked[0] || "";

  const headingFont = nearestFont(heading);
  const bodyFont = nearestFont(body);
  return { headingFont, bodyFont };
}

const NEUTRAL = /^#(fff(fff)?|000(000)?|[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * The design's accent colour — the one a NEW section Steven adds should pick up, so a hand-added
 * band doesn't announce itself next to the imported ones.
 *
 * Taken as the most-repeated saturated colour in the markup. Greys, near-blacks and near-whites
 * are skipped: those are the bands, not the accent.
 */
export function detectAccent(html: string): string {
  const counts = new Map<string, number>();
  for (const m of String(html || "").matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    let hex = m[0].toLowerCase();
    if (hex.length === 4) hex = "#" + hex.slice(1).split("").map((c) => c + c).join("");
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    // Saturation and lightness filters — an accent is colourful and mid-toned.
    if (max - min < 40) continue;
    if (max < 60 || min > 220) continue;
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  let best = "";
  let n = 0;
  for (const [hex, c] of counts) if (c > n) ((best = hex), (n = c));
  return best && !NEUTRAL.test(best) ? best : best;
}

/**
 * Build the page data + stylesheet for a design import.
 *
 * ⚠️ Throws rather than degrading. If the Tailwind compiler can't start, the design would import
 * as unstyled markup — worse than a failed import, because it looks like it worked.
 */
export async function importDesign(html: string, businessName = ""): Promise<DesignImport> {
  const report: string[] = [];

  // Icons first. A generated page ships empty <i data-lucide="…"> tags that a CDN script fills in
  // at runtime; we strip that script, so without this every icon in the design just never appears.
  const icons = await inlineLucideIcons(html);
  // ⛔ FONT AWESOME TOO, AND AFTER LUCIDE, NOT INSTEAD OF IT. A page can carry both, so this runs
  // over Lucide's output rather than the original. → lib/faIcons.ts for why these are inlined as
  // SVG rather than linked to a CDN stylesheet.
  const fa = await inlineFontAwesomeIcons(icons.html);
  const withIcons = modernizeOpacityUtilities(fa.html);
  report.push(`${icons.inlined + fa.inlined} icons inlined`);
  if (fa.missing.length) report.push(`⚠️ Font Awesome icons not found: ${fa.missing.join(", ")}`);
  // Count what got rewritten so a design full of v3 opacity classes says so out loud rather than
  // shipping a page whose translucent panels are all solid. See modernizeOpacityUtilities().
  const deadOpacity = (icons.html.match(/-opacity-\d+/g) || []).length;
  if (deadOpacity) report.push(`${deadOpacity} Tailwind v3 opacity classes rewritten for v4`);
  // Named out loud: a page missing a few icons still looks finished, so silence here reads as
  // success. Brand marks (github, twitter…) are the usual cause — lucide dropped them.
  if (icons.missing.length) report.push(`⚠️ icons not found: ${icons.missing.join(", ")}`);

  // Minted from the RAW html — the same input `compileCssForDesign` hashes below — so the scope the
  // sheet is compiled under and the id stamped on the blocks are guaranteed to match.
  const sheetId = sheetIdFor(html);

  const sections = splitSections(withIcons);
  if (!sections.length) throw new Error("No top-level sections found in that page.");

  const content = sections.map((section, i) => {
    const { html: tokenized, text, images, links, boxes, hasForm, formFields, formButton, calLink } = tokenizeSection(section, `s${i + 1}`);
    // Seed the spacing control with what the design actually used, so the stepper opens at the
    // real number. The override is an inline style at render — the markup keeps its own classes,
    // so clearing the field restores the design's spacing exactly.
    const pad = paddingOf(section);
    // ⚠️ EVERY BLOCK NEEDS ITS OWN `id`. Puck identifies a component instance by props.id; give
    // several blocks the same one (or none) and it treats them as one node — the page renders the
    // LAST block's content in every slot. First import of this design came back as the footer,
    // seven times, with the styling perfectly intact, which is what made it look like a splitting
    // bug rather than a missing key. lib/importHtml.ts has always done this via nid().
    const id = `design-${i + 1}`;
    return {
      type: "DesignSection",
      props: {
        id,
        // ⚠️ THIS IS WHAT MAKES THE STYLESHEET TRAVEL. The sheet used to be keyed by (site, page),
        // so seven copy paths had to remember to carry it and several didn't — silently, with a
        // green receipt. Here it is a prop like any other, so cloning, duplicating, templating,
        // splitting and the libraries all carry it by construction. See lib/siteKeys.ts:designSheet.
        sheet: sheetId,
        html: tokenized,
        text,
        images,
        links,
        boxes,
        paddingTop: pad.top,
        paddingBottom: pad.bottom,
        // The real form goes in by default — see DesignSection's `useRealForm`.
        hasForm,
        useRealForm: hasForm,
        // Empty for every section that never embedded a calendar, which is nearly all of them.
        calLink,
        formFields,
        formButton,
      },
    };
  });

  const words = content.reduce((n, b) => n + b.props.text.length, 0);
  const photos = content.reduce((n, b) => n + b.props.images.length, 0);
  const linkCount = content.reduce((n, b) => n + (b.props.links?.length || 0), 0);
  report.push(
    `${sections.length} sections`,
    `${words} editable text fields`,
    `${photos} photos`,
    `${linkCount} editable links`
  );

  // The design's contact form is kept as a dead shell so the section doesn't look broken, but it
  // cannot submit. Say so out loud — a page that ships with only the placeholder has a contact
  // section that looks perfect and collects nothing, and that is not something to leave to memory.
  const placeholders = /<input|<textarea|<select/i.test(withIcons)
    ? content.filter((b) => /<input|<textarea|<select/i.test(b.props.html)).length
    : 0;
  if (placeholders) {
    report.push(
      `${placeholders} form${placeholders > 1 ? "s" : ""} found — the real lead form is mounted in ` +
        `its place, so the design's layout is kept and the enquiry actually reaches the owner. ` +
        `Turn "Use my real form" off on the section to show the design untouched.`
    );
  }

  // Compile from the icon-inlined markup, not the original — the CSS must be built from exactly
  // what will render, or a class that only exists post-transform compiles to nothing.
  const css = await compileCssForDesign(html);
  report.push(`${(css.length / 1024).toFixed(1)}KB of stylesheet compiled`);

  const fonts = detectFonts(html);
  const accent = detectAccent(html);
  report.push(`fonts: ${fonts.headingFont} / ${fonts.bodyFont}`, accent ? `accent: ${accent}` : "accent: not found");

  // ⚠️ SAME SHAPE AS lib/importHtml.ts, `zones: {}` included. The store's write guard refuses a
  // save whose top-level keys disappear — a page written with `zones` and later saved without it
  // is exactly the failure that made the editor silently refuse every save on 2026-07-30.
  const data = {
    root: { props: { title: businessName } },
    zones: {},
    content,
  } as unknown as Data;
  return { data, css, sheetId, fonts, accent, report };
}
