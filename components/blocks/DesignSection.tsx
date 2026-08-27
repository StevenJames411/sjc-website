// One section of a BOUGHT design, kept exactly as the design tool drew it.
//
// ── THE TRADE THIS BLOCK EXISTS TO MAKE ───────────────────────────────────────────────────────
// A generated design (SiteDrop, $2.50) is carried by gradients, blurs, glass surfaces, floating
// absolutely-positioned cards and a custom type scale. The block system has primitives for none
// of that, so the old importer flattened every design it touched — it kept the words and threw
// away the thing that was worth paying for.
//
// So this block does the opposite: it keeps the markup verbatim, classes and all, and makes only
// the CONTENT editable. Steven edits words and photos; the layout is whatever he bought. Changing
// the layout means generating another design, which costs $2.50 and is faster than rearranging
// one by hand.
//
// ── HOW EDITING WORKS ─────────────────────────────────────────────────────────────────────────
// At import, every text node and image src is replaced with a token — `{{t:k3}}` / `{{i:k1}}` —
// and its original value is lifted out into a list of fields. The editor shows that list; the
// renderer substitutes the values back in.
//
// Tokens are resolved by string replacement rather than by re-parsing the HTML on every render:
// the markup is fixed at import time, so there is nothing to re-discover, and a page can hold a
// dozen of these.
//
// ⚠️ A MISSING TOKEN RENDERS AS EMPTY, NOT AS `{{t:k3}}`. A field someone deleted must leave a
// gap in the design, never leak the machinery onto a customer's live website.

import { DESIGN_SCOPE, sheetScope } from "@/lib/designShared";
import { resolveColor } from "@/lib/brandColor";
import { surfaceCss, wantsPulse, PULSE_KEYFRAMES, type Surface } from "@/lib/surfaceStyle";
import type { DesignBoxGroup } from "@/lib/designHtml";
import DesignFormMount from "./DesignFormMount";
import DesignCalMount from "./DesignCalMount";
import DesignMenu from "./DesignMenu";
import type { LeadFormField } from "./LeadForm";

/**
 * One editable line in an imported section.
 *
 * `value` is the words. The rest are OVERRIDES — blank/0/null means "leave the design alone",
 * which is what every field starts as, so an untouched import renders exactly as bought.
 *
 * ⚠️ WHY THESE EXIST. The design bakes size, colour and weight into its classes, so a sealed
 * section let you change every word and none of how it looked — you could fix a typo but not
 * shrink a headline that ran onto three lines with a longer business name. An inline style beats
 * a class, so an override needs no change to the markup and clearing it restores the design.
 */
export type DesignText = {
  key: string;
  label: string;
  value: string;
  /** px. 0/blank = the design's own size. */
  size?: number;
  /** blank = the design's own colour. */
  color?: string;
  /** null/undefined = the design's own weight. */
  bold?: boolean | null;
};
export type DesignImage = {
  key: string;
  alt: string;
  src: string;
  /**
   * THE GLASS — the framed panel the photo sits in — as opposed to the photo inside it.
   *
   * ⚠️ THESE OVERRIDE THE RULE DIRECTLY BELOW, DELIBERATELY (2026-08-11, Steven's call). That rule
   * says the slot is the design's decision and only the framing inside it is yours. True for
   * swapping a photo; false for the case that actually came up. The hero is two columns — text
   * left, glass right — and the glass takes its height from the PHOTO'S proportions, so it is
   * always shorter than the text beside it and no amount of reframing can fix that. The glass
   * itself has to be resizable.
   *
   * Blank = the design's own size. Height in px, width as a % of the column it sits in; over 100%
   * it spills out of that column on purpose, which is sometimes exactly the look.
   */
  /**
   * THE FRAME'S SHAPE — and the control that should be reached for first.
   *
   * A ratio is RELATIVE, so it is correct at every width with no breakpoint and nothing to check
   * on a phone: a wide column gives a big frame, a narrow one gives a small frame, same
   * proportions. That is the whole mechanic behind builders that "just know" what to do on mobile
   * — not cleverness, just never naming a fixed number.
   *
   * frameHeight below is the escape hatch for "I want exactly this", and it costs a breakpoint.
   */
  frameShape?: string;
  frameHeight?: number | null;
  frameWidth?: number | null;
  /**
   * THE BAND — the visible margin of frame showing around the photo, and the glow under it.
   *
   * This is what reads as depth and makes a photo look like it is sitting IN something rather than
   * being a rectangle pasted on the page. The Designs site has it; the ten-pager lost it, because
   * the design draws its photo edge-to-edge inside the frame.
   *
   * Width is padding on the frame, colour is the frame's own background showing through it, and
   * the glow is a coloured shadow underneath. Blank on all three = the design's own look.
   */
  bandWidth?: number | null;
  bandColor?: string;
  glowColor?: string;
  /**
   * ── SAME THREE CONTROLS AS THE IMAGE BLOCK: shape, zoom, keep-in-view. ────────────────────
   *
   * ⚠️ NOT max-width. In an imported design the SLOT is fixed — the design decided how big that
   * photo is and where it sits. What actually goes wrong is that the replacement photo is a
   * different shape from the one it replaces, so a head gets cut off. The fix is reframing
   * inside the slot, not resizing the slot.
   *
   * Non-destructive: the upload is never altered, and setting shape back to "" restores the
   * design exactly.
   */
  /** Aspect ratio to crop to — "4/3", "1/1", "16/9". "" = the design's own framing, no crop. */
  shape?: string;
  /** 100 = fit, higher = closer. */
  zoom?: number;
  /** What the crop keeps in view: "center", "top", "left top"… */
  focus?: string;
};
/** One link in an imported section: what it says, and where it goes. */
/**
 * A link, plus how its BOX looks. Every button and pill on a page is a link, and the importer
 * already stamps `data-sjc-link` on each one — so the list of things you can restyle already
 * exists and needed no new detection at all.
 */
export type DesignLink = { key: string; label: string; href: string } & Surface;

export type DesignSectionProps = {
  /**
   * WHICH COMPILED STYLESHEET THIS SECTION NEEDS — a content-addressed id (lib/siteKeys:designSheet).
   *
   * ⚠️ THIS PROP IS WHY THE STYLESHEET TRAVELS. The sheet used to be keyed `(site, page, published)`,
   * so every code path that copied a page had to ALSO remember to copy a value nothing in the
   * content referenced. Several didn't — silently, reporting success: templates shipped unstyled,
   * `copySiteContent` dropped it so no template could ever be used, `split-page` lost it and then
   * deleted the source, the section library stranded it.
   *
   * As a prop it is carried by all of those paths for free, because copying props is all any of
   * them do. Nothing downstream has to know a stylesheet exists.
   *
   * Absent on a block imported before 2026-08-12, until admin/backfill-sheets stamps it.
   */
  sheet?: string;
  /**
   * This block's own id — set by the importer as `design-1`, `design-2`, … and by Puck for a
   * dragged one. It was always on the props and simply never declared here.
   *
   * ⚠️ LOAD-BEARING FOR ANY PER-BLOCK RULE. `sheetScope()` is shared by every section from the
   * same design, so a rule scoped that way hits every band on the page at once. Puck also treats
   * two blocks with the same id as one node and renders the last one's content in all of them
   * (lib/importDesign.ts) — so this is the only value that identifies one section.
   */
  id?: string;
  /** The section's markup, with {{t:…}} / {{i:…}} where the editable bits were. */
  html?: string;
  text?: DesignText[];
  images?: DesignImage[];
  boxes?: DesignBoxGroup[];
  /** Every link's destination — phone, email, page or #section. */
  links?: DesignLink[];
  /**
   * Top/bottom padding in px, overriding whatever the design baked in.
   *
   * A generated section hard-codes its own vertical rhythm as utility classes
   * (`py-20 md:py-28 lg:py-32`) — which reads as generous on the design tool's demo content and
   * as far too much once real copy is in. Those classes can't be edited from the builder, so
   * without this the whole page's spacing is frozen at whatever the generator chose.
   *
   * ⚠️ NO MARKUP SURGERY. An inline style beats a class at every breakpoint, so the override is
   * injected on render and the imported HTML is never rewritten. That also makes it reversible:
   * clear the field and the design's own spacing comes straight back.
   *
   * null/undefined = leave the design alone.
   */
  /**
   * Pin this section to the top of the window while the visitor scrolls.
   *
   * Bought designs ship a static header, but a sticky nav is what a small business's site is
   * expected to have — the phone number and the Get-a-quote button stay reachable at the point
   * someone has scrolled far enough to want them. Left off by default so no imported design's
   * layout changes on its own.
   */
  sticky?: boolean;
  paddingTop?: number | null;
  paddingBottom?: number | null;
  /**
   * Lay this section's content out in 2 or 3 columns. `null` = leave the design alone.
   *
   * ⛔ THE ONE THING A SEALED SECTION COULD NEVER DO — AND THE REASON THIS EXISTS.
   * `project_sealed_design_full_editing` locked the trade on 2026-07-31: every word, photo, link,
   * colour and space is editable, and *"the only thing you cannot do in a sealed section is MOVE
   * elements"* — a different layout meant buying another design. That was the right call for
   * arbitrary rearrangement and the wrong one for the case that actually keeps coming up: a
   * single-column band that should read as two.
   *
   * Steven, on being offered a hand-edit per customer: *"I certainly don't want to go to you for
   * hard-coded solutions per customer."* So it is a control, once, for every site — not markup
   * surgery on his.
   */
  columns?: number | null;
  /**
   * WHICH CHILD THE COLUMN BREAK FALLS AFTER. Blank = the design's own flow.
   *
   * ⛔ THE CONTROL THAT MAKES `columns` MEAN ANYTHING. Two columns with auto-flow puts one child per
   * cell, so a band's eyebrow landed left and its headline right. Nobody has ever wanted that. What
   * "two columns" means to a person is text on one side and the picture on the other — a split, at
   * a point only they can pick, because only they know which child the picture is.
   */
  splitAfter?: number | null;
  /** Swap the columns left-to-right. For when the picture is the FIRST child, not the last. */
  flip?: boolean;
  /**
   * Band colours for an IMPORTED section. Blank = keep whatever the design shipped with.
   *
   * ⚠️ THE IMPORTED SECTIONS WERE THE ONLY ONES YOU COULDN'T RECOLOUR. The native Section block
   * has had a background picker all along, so a hand-built page could be re-banded and a bought
   * one could not — the same click did nothing on half the site.
   *
   * ⚠️ FOREGROUND EXISTS BECAUSE BACKGROUND ALONE IS A TRAP. A design's dark band sets its own
   * light text in its own CSS. Flipping that band to White without touching the text gives white
   * on white — the copy is still there, still selectable, and completely invisible.
   */
  background?: string;
  foreground?: string;

  // ── THE FORM ────────────────────────────────────────────────────────────────────────────────
  /** True when the imported section contained a form shell (set at import). */
  hasForm?: boolean;
  /** A Cal.com booking link captured at import — mounts the real calendar into the design's box. */
  calLink?: string;
  /**
   * Put OUR working form where the design drew its fake one.
   *
   * ⚠️ DEFAULT ON, and deliberately. The design's form is a picture: real-looking boxes that
   * accept typing and deliver nowhere. Shipping that to a client means a customer fills it in,
   * presses send, believes she has made contact, and nothing happens — the worst failure on the
   * page. Off is available for showing a prospect the untouched design.
   */
  useRealForm?: boolean;
  /** The questions the DESIGN asked, so the swap keeps its intent rather than imposing ours. */
  formFields?: LeadFormField[];
  /**
   * A LIVE link to a library form. Set = the library owns these questions and editing it there
   * updates this section; blank = the section keeps whatever it was imported with.
   *
   * ⚠️ NOTHING IN THIS FILE READS IT. lib/formPointer resolves it server-side and fills
   * `formFields` in before the section is drawn — and it has to fill `formFields`, not `fields`,
   * which is the exact reason linking a design section was a silent no-op until 2026-08-06: the
   * pointer was set, the block read the questions it always had, and the page rendered
   * identically. Nothing looked broken because nothing changed.
   */
  formId?: string;
  formButton?: string;
  /**
   * WHAT THE CUSTOMER READS AFTER PRESSING SEND.
   *
   * ⚠️ These were hardcoded literals in this file until 2026-08-05, and that made them the only
   * words on an imported design nobody could change — on a product sold as "every word is
   * editable". Steven hit it on his own site: he wanted different wording and there was no field
   * to type it in. The same literal is what leaked a raw {{business.phone}} to a real visitor,
   * because a literal in JSX is never in the saved page data the token resolver walks.
   *
   * Blank falls back to the wording below, so nothing changes for a site that never touches them.
   * Tokens work here — the form fills them at render (LeadForm), not the data walk.
   */
  successHeading?: string;
  successBody?: string;
  /** Editor only — see fillTokens's `mark`. Never set on a published page. */
  editing?: boolean;
};

/** Used when the section leaves them blank. One place, so the fallback can't drift. */
export const DESIGN_SUCCESS_HEADING = "Got it — thank you.";
export const DESIGN_SUCCESS_BODY =
  "We'll be in touch shortly. Rather talk now? Call {{business.phone}}.";

export const DESIGNSECTION_DEFAULTS: DesignSectionProps = {
  // Empty for a section dragged in by hand — there is no design behind it, so no stylesheet to
  // reference. The importer stamps the real id; the backfill stamped it on everything imported
  // before that existed.
  sheet: "",
  html: "",
  text: [],
  images: [],
  links: [],
  // ⚠️ WAS MISSING. `boxes` is on the props and editable in the panel, but had no default — so a
  // freshly dragged section started with it undefined while every sibling array started empty.
  // Every consumer had to guard, and the first one that forgot would throw on a block nobody had
  // even touched.
  boxes: [],
  sticky: false,
  paddingTop: null,
  paddingBottom: null,
  // ⚠️ NULL, and it has to be. Any new field must default to the DO-NOTHING value or every
  // untouched section on every site starts emitting layout it never had.
  columns: null,
  splitAfter: null,
  flip: false,
  background: "",
  foreground: "",
  hasForm: false,
  calLink: "",
  useRealForm: true,
  formFields: [],
  formId: "",
  formButton: "",
  successHeading: "",
  successBody: "",
};

const TOKEN = /\{\{([tih]):([a-z0-9_-]+)\}\}/gi;

/** Build an inline style string from whatever overrides were actually set. */
function styleFor(parts: Array<[string, string | undefined | null]>): string {
  return parts
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/** HTML-escape a value going into markup. The values are Steven's, but they still can't break it. */
function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Substitute the editable values back into the design's markup. */
export function fillTokens(
  html: string,
  text: DesignText[] = [],
  images: DesignImage[] = [],
  links: DesignLink[] = [],
  /**
   * Editor only. Wraps every filled word in a marked span so a click on the canvas can say WHICH
   * of forty-odd text rows it was.
   *
   * ⚠️ OFF on the published page, deliberately. Wrapping live output would add a span around
   * every word on every customer's site to serve a control only Steven ever sees — and inline
   * elements are only *usually* harmless. This way the published markup stays byte-identical to
   * the import, which is the promise the whole sealed-design approach rests on.
   */
  mark = false
): string {
  const t = new Map(text.map((r) => [String(r?.key || "").toLowerCase(), r?.value ?? ""]));
  const i = new Map(images.map((r) => [String(r?.key || "").toLowerCase(), r?.src ?? ""]));
  const h = new Map(links.map((r) => [String(r?.key || "").toLowerCase(), r?.href ?? ""]));
  // Text rows are needed by key for their style overrides, not just their value.
  const tRow = new Map(text.map((r) => [String(r?.key || "").toLowerCase(), r]));

  return String(html || "").replace(TOKEN, (_m, kind: string, key: string) => {
    const k = kind.toLowerCase();
    const id = String(key).toLowerCase();
    const map = k === "t" ? t : k === "i" ? i : h;
    // Unknown key -> empty. Never render the token itself onto a live page.
    const raw = esc(map.get(id) ?? "");

    // A style override wraps the words in a span. Inline beats the design's class, and with no
    // overrides set nothing is wrapped at all — the markup stays byte-identical to the import.
    if (k === "t") {
      const row = tRow.get(id);
      const css = styleFor([
        ["font-size", row?.size ? `${row.size}px` : ""],
        ["color", row?.color || ""],
        ["font-weight", row?.bold === true ? "700" : row?.bold === false ? "400" : ""],
      ]);
      const attr = mark ? ` data-sjc-text="${id}"` : "";
      if (css || attr) return `<span${attr}${css ? ` style="${css}"` : ""}>${raw}</span>`;
    }
    return raw;
  });
}

/**
 * Second line of defence, deliberately regex-based and dependency-free.
 *
 * The thorough sanitiser is lib/designHtml.ts `sanitizeDesignHtml()`, which parses the markup — it
 * runs once, at import. It can't be used HERE because this component also renders inside the
 * client editor, and importing it would pull node-html-parser into the browser bundle (and create
 * a circular import, since it takes its types from this file).
 *
 * So this catches the case that one is for: a record edited by hand in the Markup box, or written
 * before the import-time sanitiser existed. Cheap, no dependencies, runs on every render.
 */
// A recognised video embed is the one iframe allowed through — see EMBED_HOSTS in
// lib/designHtml.ts, which this deliberately mirrors. Kept as a literal list rather than an
// import: this file must not pull node-html-parser into the browser bundle (see above), and the
// two lists disagreeing is a smaller risk than the circular import.
//
// ⚠️ ANCHORED. The host must come straight after `src="https://` and be followed by `/` or the
// closing quote, so `youtube.com.evil.tld` and `evil.tld/?x=youtube.com` both still get stripped.
const EMBED_SRC =
  /src\s*=\s*"https:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)(?:\/|")/i;

function stripDangerous(html: string): string {
  return String(html || "")
    // Pull recognised embeds aside, sanitise everything else, then put them back. Two passes over
    // one regex is far less fragile than trying to write "iframe, unless…" as a single pattern.
    .split(/(<iframe\b[^>]*>[\s\S]*?<\/\s*iframe\s*>|<iframe\b[^>]*\/?>)/gi)
    .map((chunk, i) => {
      const isIframe = i % 2 === 1;
      if (isIframe) {
        if (!EMBED_SRC.test(chunk)) return "";
        // Allowed: still scrub the attributes that would make it more than a player.
        return chunk
          .replace(/\ssrcdoc\s*=\s*(["'])[\s\S]*?\1/gi, "")
          .replace(/\son[a-z]+\s*=\s*(["'])[\s\S]*?\1/gi, "")
          .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");
      }
      return chunk
        .replace(/<\s*(script|object|embed|base)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
        .replace(/<\s*(script|object|embed|base)\b[^>]*\/?>/gi, "")
        .replace(/\son[a-z]+\s*=\s*(["'])[\s\S]*?\1/gi, "")
        .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
        .replace(/(href|src|srcset|action)\s*=\s*(["'])\s*(javascript|vbscript):[\s\S]*?\2/gi, "$1=$2#$2");
    })
    .join("");
}

/**
 * Merge a style declaration into the markup's FIRST element tag.
 *
 * Appends to an existing `style=""` rather than replacing it — a generated section routinely
 * carries an inline gradient background there, and overwriting it would drop the background to
 * change the padding.
 */
export function injectStyle(html: string, decls: string): string {
  if (!decls) return html;
  const tag = html.match(/<([a-z][a-z0-9]*)\b[^>]*>/i);
  if (!tag) return html;
  const open = tag[0];
  const existing = open.match(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i);
  const next = existing
    ? open.replace(existing[0], ` style="${existing[2].replace(/;\s*$/, "")};${decls}"`)
    : open.replace(/>$/, ` style="${decls}">`);
  return html.replace(open, next);
}

/**
 * Remove links whose row was deleted from the list.
 *
 * ⚠️ DELETE HAS TO MEAN DELETE. The list is "where the links go", so removing a row only dropped
 * the destination — the anchor stayed in the markup and rendered as a dead link. Deleting the
 * five social icons a design ships with left five icons on the page going nowhere.
 *
 * `<a>` cannot nest inside `<a>`, so the closing tag can be found by scanning forward and
 * counting opens and closes. That is exact, where a regex across nested markup is not: these
 * anchors wrap an inline <svg>, and a lazy `</a>` match would cut in the wrong place.
 */
function dropRemovedLinks(html: string, links: DesignLink[]): string {
  const keep = new Set(links.map((l) => String(l?.key || "").toLowerCase()));
  let out = html;
  for (const m of [...html.matchAll(/<a\b[^>]*data-sjc-link="([^"]+)"[^>]*>/gi)]) {
    if (keep.has(m[1].toLowerCase())) continue;
    const start = out.indexOf(m[0]);
    if (start === -1) continue;
    let depth = 0;
    let i = start;
    while (i < out.length) {
      const open = out.indexOf("<a", i);
      const close = out.indexOf("</a", i);
      if (close === -1) break;
      if (open !== -1 && open < close) {
        depth++;
        i = open + 2;
        continue;
      }
      depth--;
      if (depth === 0) {
        const end = out.indexOf(">", close);
        out = out.slice(0, start) + out.slice(end + 1);
        break;
      }
      i = close + 3;
    }
  }
  return out;
}

/**
 * Apply per-photo overrides by adding a style to the marked <img>.
 *
 * Targeted rather than global: `data-sjc-img="i2"` identifies one image, so resizing the founder
 * photo can't touch the phone mockup. Images with nothing set are not rewritten at all.
 */
/**
 * Lay a section's content out in N columns, without touching a byte of the design's markup.
 *
 * ── WHICH ELEMENT BECOMES THE GRID ────────────────────────────────────────────────────────────
 * This is the whole problem, and it cannot be answered by parsing: stripDangerous() deliberately
 * works by regex so node-html-parser never reaches the browser bundle, so there is no tree here to
 * walk. It has to be decided in CSS, from the shape of the markup.
 *
 * Generated sections come in two shapes, and the rules below cover both:
 *
 *   A  <section><div class="container">  h1, p, video  </div></section>   ← the common one
 *   B  <section>  h1, p, video  </section>
 *
 * ⛔ THE GRID GOES ON THE CONTAINER IN SHAPE A, NEVER ON THE SECTION. Putting it on the section
 * lays out the section's ONE child and nothing visibly happens — a control that appears to do
 * nothing. `display:contents` on that child would promote its children instead, and that was
 * rejected: it destroys the container's own box, so the design's max-width and centring go with
 * it and the content runs edge to edge. Keeping the container and gridding IT preserves both.
 *
 * `:only-child` is what distinguishes the two shapes, and it is honest about the failure case: a
 * section wrapping its content twice gets shape A's rule applied one level too high. That reads as
 * "columns did less than expected" rather than as a broken page.
 *
 * ── SCOPED PER BLOCK, NOT PER SHEET ───────────────────────────────────────────────────────────
 * ⚠️ `sheetScope()` is shared by every section imported from the SAME design, so scoping this the
 * usual way would column every band on the page at once. The selector keys off `data-sjc-cols`,
 * which carries this block's own id.
 *
 * ── MOBILE ────────────────────────────────────────────────────────────────────────────────────
 * Columns are a desktop decision. Two-canvas doctrine: the phone earns the click and the laptop
 * earns the money, and they are separate targets — so this stacks below 768px, always.
 * ⚠️ NO COMMENT ABOVE THE @media BLOCK. In a stored sheet a comment in the prelude hides the
 * at-rule from scopeCss and silently kills every rule inside it. This string is emitted at render
 * rather than compiled, but the habit is the thing that broke sjc-2026's entire mobile layout.
 */
function columnCss(
  id: string,
  columns?: number | null,
  splitAfter?: number | null,
  flip?: boolean
): string {
  const n = typeof columns === "number" && columns >= 2 && columns <= 3 ? columns : 0;
  if (!id || (!n && !flip)) return "";
  const at = `[data-sjc-cols="${id}"]`;

  // The container whose CHILDREN become the columns: the section's wrapper if it has one, else the
  // section itself. Verified against the live design — every band is
  // `<section class="band…"><div class="wrap">…children…</div></section>`.
  const box = `${at} > * > *:only-child, ${at} > *:not(:has(> *:only-child))`;
  const kid = (sel: string) => `${at} > * > *:only-child ${sel}, ${at} > *:not(:has(> *:only-child)) ${sel}`;

  const out: string[] = [];

  if (n) {
    out.push(`${box}{display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:clamp(24px,4vw,56px);align-items:center}`);

    // ⛔ WITHOUT A SPLIT POINT THIS COLUMNS THE WRONG THING, AND THAT IS WHAT SHIPPED FIRST.
    //
    // Auto-flow puts ONE CHILD PER CELL, and a band's children are its eyebrow, its headline, its
    // paragraph, its buttons and its photo. Asking for two columns therefore put the eyebrow on
    // the left and the headline on the right — mechanically alive, and not once what anybody meant
    // by "make this two columns".
    //
    // What a person means is "text on this side, the picture on that side" — a SPLIT, at a point
    // only they can choose, because only they know which child the picture is. So the stepper
    // names the break: everything up to it goes left, everything after goes right.
    if (n === 2 && typeof splitAfter === "number" && splitAfter >= 1) {
      out.push(`${kid(`> *:nth-child(-n+${splitAfter})`)}{grid-column:1}`);
      out.push(`${kid(`> *:nth-child(n+${splitAfter + 1})`)}{grid-column:2}`);
      // Each column packs its own items top-to-bottom instead of leaving holes opposite a tall one.
      out.push(`${box}{align-items:start;grid-auto-rows:min-content}`);
    }
  }

  // ⚠️ REVERSING WITHOUT KNOWING THE CHILD COUNT. `order` needs a number per child and nothing here
  // knows how many there are. `direction:rtl` on the container flips the visual column order at any
  // count; putting it back to ltr on the children keeps their text reading normally.
  if (flip) out.push(`${box}{direction:rtl}` + `${kid("> *")}{direction:ltr}`);

  // ⚠️ 960, NOT 768 — AND THE MISMATCH WAS A REAL BUG FOR ONE DAY.
  //
  // This rule now targets the SAME element the design's own grid targets, and ours is emitted in
  // the body while the design's sheet is in the head, so ours wins every tie. That means our
  // stacking breakpoint overrides theirs rather than sitting beside it. The design on the live site
  // stacks at 960; at 800px ours said two columns and theirs said one, and ours won. Stacking
  // EARLIER than the design is safe — a stacked band is never broken, an unstacked one is.
  if (n) {
    out.push(
      `@media (max-width:960px){${box}{grid-template-columns:minmax(0,1fr)}` +
        `${kid("> *")}{grid-column:auto}}`
    );
  }
  return out.join("");
}

/**
 * Size the GLASS, and make the photo fill it.
 *
 * ⚠️ THE GLASS IS THE IMG'S PARENT, AND WE NEVER PARSE THE TREE HERE — styleImages() rewrites the
 * <img> tag with a regex and cannot reach an ancestor. `:has(> img[...])` selects that parent
 * directly from CSS, which is why this is a stylesheet rather than another tag rewrite.
 *
 * Once the glass has a size of its own, the photo has to COVER it or it would letterbox inside its
 * own frame — and covering is what finally makes zoom and keep-in-view do something on a photo
 * with no Shape set.
 */
function frameCss(images: DesignImage[]): string {
  const out: string[] = [];
  for (const img of images || []) {
    const key = String(img?.key || "");
    if (!key) continue;
    const shape = String(img?.frameShape || "").trim();
    const h = typeof img?.frameHeight === "number" && img.frameHeight > 0 ? img.frameHeight : null;
    const w = typeof img?.frameWidth === "number" && img.frameWidth > 0 ? img.frameWidth : null;
    const band = typeof img?.bandWidth === "number" && img.bandWidth > 0 ? img.bandWidth : null;
    const bandCol = resolveColor(img?.bandColor);
    const glow = resolveColor(img?.glowColor);
    const z = typeof img?.zoom === "number" && img.zoom > 100 ? img.zoom : 100;
    if (!shape && !h && !w && !band && !bandCol && !glow) continue;

    const sel = `.${DESIGN_SCOPE} *:has(> img[data-sjc-img="${key}"])`;

    // ⚠️ A HAND-SET FRAME SIZE IS A DESKTOP DECISION, AND MUST NOT FOLLOW THE PAGE ONTO A PHONE.
    //
    // The size is chosen by eye against the text column beside it, so it is only meaningful while
    // there IS a column beside it. Emitted without a breakpoint, a 620px frame stays 620px tall
    // inside a 350px-wide stacked column: on sjc-2026's hero the photo swallowed the whole screen
    // and pushed the headline off it. Below the breakpoint the frame goes back to the shape the
    // photo actually is, which is what the design does on its own.
    //
    // 960px because that is where these designs stack — the same number this design's own media
    // queries use, and the common one across the generators we import from.
    const sized = [
      h ? `height:${h}px` : "",
      // max-width:none so a width over 100% can actually leave the column instead of being
      // clamped back to it by the design's own max-width.
      w ? `width:${w}%;max-width:none` : "",
    ].filter(Boolean).join(";");

    // The band and the glow are proportional and read correctly at any width, so they are NOT
    // behind the breakpoint — losing the glass look on a phone would be its own bug.
    // ── "MATCH" IS THE ONE THAT NEEDS NO NUMBER AT ALL ───────────────────────────────────────
    // The frame takes its height from the column BESIDE it, which is what "make the glass as big
    // as the text" actually means. It needs no breakpoint in either direction: when the design
    // stacks on a phone there is no column beside it, the row is one item tall, and the frame
    // falls back to the photo's own shape on its own.
    //
    // ⚠️ The stretch has to land on the frame's PARENT — the grid/flex ITEM — because that is what
    // the design centres (`align-items:center` on the row). Setting height on the frame alone does
    // nothing while its parent is only as tall as its contents.
    const matchCol = shape === "match";
    const always = [
      matchCol ? "height:100%" : "",
      // A ratio needs no breakpoint — it is already relative. `height:auto` so the design's own
      // height, if it had one, stops fighting the shape.
      shape && !matchCol ? `aspect-ratio:${shape};height:auto` : "",
      // The band is padding: the frame's own background showing around the photo. box-sizing so a
      // band never makes the frame taller than the height that was asked for.
      band ? `padding:${band}px;box-sizing:border-box` : "",
      bandCol ? `background:${bandCol}` : "",
      // Keep the depth shadow the design shipped with and add the glow on top of it — a glow with
      // no shadow under it reads as a sticker, not glass.
      glow ? `box-shadow:0 24px 60px rgba(0,0,0,.45),0 0 48px ${glow}` : "",
    ].filter(Boolean).join(";");

    if (always) out.push(`${sel}{${always}}`);
    if (sized) out.push(`@media (min-width:961px){${sel}{${sized}}}`);

    const pos = img?.focus || "center";
    // ⚠️ `height:100%` BELONGS WITH THE FRAME HEIGHT, NOT OUTSIDE IT. Left unconditional, a photo
    // on a phone stretches to fill a frame that no longer has a height of its own, which is how a
    // portrait photo ends up squashed into whatever box the stacked column happens to be.
    // With a shape the photo must cover the frame at EVERY width — the frame has a real size at
    // every width, so there is nothing to hold back for desktop.
    const stretchParent = matchCol
      ? `.${DESIGN_SCOPE} *:has(> * > img[data-sjc-img="${key}"]){align-self:stretch;display:flex}`
      : "";
    const fillSized = shape
      ? `${sel} > img[data-sjc-img="${key}"]{width:100%;height:100%;object-fit:cover}`
      : h || w
        ? `@media (min-width:961px){${sel} > img[data-sjc-img="${key}"]{width:100%;height:100%;object-fit:cover}}`
        : "";
    const fill = [
      `object-position:${pos}`,
      // Rounded to match whatever radius the design gave the frame, so a banded photo doesn't sit
      // as a square inside a rounded panel.
      band ? "border-radius:inherit" : "",
      z > 100 ? `transform:scale(${z / 100});transform-origin:${pos}` : "",
    ].filter(Boolean).join(";");
    if (fill) out.push(`${sel} > img[data-sjc-img="${key}"]{${fill}}`);
    if (fillSized) out.push(fillSized);
    if (stretchParent) out.push(stretchParent);
  }
  return out.join("");
}

/**
 * Make a whole feature card clickable.
 *
 * ⚠️ A REAL ANCHOR, NOT A CLICK HANDLER. A card that navigates on click but isn't a link cannot be
 * opened in a new tab, can't be copied, doesn't show its destination in the status bar, and is
 * invisible to Google — and these cards link to the pages this site most wants found.
 *
 * ⚠️ AND NOT A WRAPPER EITHER. Wrapping the card in an <a> would mean restructuring markup we
 * promised to leave alone, and `<a>` cannot legally contain another `<a>`. So the anchor is
 * INSERTED INSIDE the card and stretched over it — the pattern every CSS framework settled on.
 * Real links inside the card sit above it (see boxLinkCss) and keep working.
 */
function injectBoxLinks(html: string, boxes: DesignBoxGroup[]): string {
  let out = html;
  for (const b of boxes || []) {
    (b?.hrefs || []).forEach((href, i) => {
      const to = String(href || "").trim();
      if (!to) return;
      const re = new RegExp(
        `(<[a-z][a-z0-9]*\\b[^>]*data-sjc-box="${b.key}"[^>]*data-sjc-box-i="${i}"[^>]*>)`,
        "i"
      );
      const label = (b.captions?.[i] || "").replace(/"/g, "&quot;");
      out = out.replace(
        re,
        (open: string) =>
          `${open}<a class="sjc-box-link" href="${to.replace(/"/g, "&quot;")}" aria-label="${label}"></a>`
      );
    });
  }
  return out;
}

function styleImages(html: string, images: DesignImage[]): string {
  let out = html;
  for (const img of images) {
    // No shape = the design's own framing, untouched. A shape turns cropping on: the image
    // covers its slot at the chosen ratio, and zoom/focus pick which part shows. `transform`
    // scales from the same point the crop favours so zooming doesn't drift off the subject.
    const z = typeof img?.zoom === "number" && img.zoom > 100 ? img.zoom : 100;
    const pos = img?.focus || "center";
    const css = img?.shape
      ? styleFor([
          ["aspect-ratio", img.shape],
          ["width", "100%"],
          ["height", "auto"],
          ["object-fit", "cover"],
          ["object-position", pos],
          ["transform", z > 100 ? `scale(${z / 100})` : ""],
          ["transform-origin", z > 100 ? pos : ""],
        ])
      : "";
    if (!css || !img?.key) continue;
    const re = new RegExp(`(<img\\b[^>]*data-sjc-img="${img.key}"[^>]*)>`, "i");
    out = out.replace(re, (m, open: string) => {
      const existing = open.match(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i);
      return existing
        ? `${open.replace(existing[0], ` style="${existing[2].replace(/;\s*$/, "")};${css}"`)}>`
        : `${open} style="${css}">`;
    });
  }
  return out;
}

export default function DesignSection(props: DesignSectionProps) {
  const {
    sheet,
    html = "",
    text = [],
    images = [],
    links = [],
    sticky,
    boxes,
    paddingTop,
    paddingBottom,
    columns,
    splitAfter,
    flip,
    background,
    foreground,
    hasForm,
    calLink,
    useRealForm = true,
    formFields,
    formButton,
    successHeading,
    successBody,
    editing,
  } = props;
  if (!html.trim()) return null;

  // Only emit what was actually set, so an untouched section keeps the design's own rhythm.
  // Keyed BY THE ROLE, not per section: the same role always means the same colour, so every
  // section choosing it shares one rule and no unique id has to be invented.
  const fgRole = String(foreground || "").trim();
  const fgValue = resolveColor(fgRole);
  const framing = frameCss(images);
  // Keyed to this block's own id — see the note on columnCss for why the sheet scope won't do.
  const colStyling = columnCss(String(props.id || ""), columns, splitAfter, flip);
  // Buttons and pills. `data-sjc-link` is already on the element, so this reaches it without ever
  // guessing at the design's own class names.
  const linkStyling = (links || [])
    .map((l) => surfaceCss(`.${DESIGN_SCOPE} [data-sjc-link="${l?.key}"]`, l))
    .filter(Boolean)
    .join("");
  const anyPulse = (links || []).some(wantsPulse) || (boxes || []).some(wantsPulse);

  // Feature cards. ONE style for the whole set — that is what makes them a set — while each card
  // keeps its own destination below.
  const boxStyling = (boxes || [])
    .map((b) => surfaceCss(`.${DESIGN_SCOPE} [data-sjc-box="${b?.key}"]`, b as Surface))
    .filter(Boolean)
    .join("");
  // A card that links needs somewhere for the anchor to sit, and the anchor has to sit UNDER any
  // real link inside the card or it would swallow its clicks.
  const boxLinkCss = (boxes || []).some((b) => (b?.hrefs || []).some(Boolean))
    ? `.${DESIGN_SCOPE} [data-sjc-box]{position:relative}` +
      `.${DESIGN_SCOPE} .sjc-box-link{position:absolute;inset:0;z-index:1}` +
      `.${DESIGN_SCOPE} [data-sjc-box] a:not(.sjc-box-link){position:relative;z-index:2}`
    : "";

  const decls = [
    // ⚠️ STICKY IS NOT IN HERE — see the wrapper below. These declarations are injected into the
    // design's own outer tag, and `position: sticky` on that element does nothing: it can only
    // travel within its PARENT'S box, and the parent is a div exactly as tall as the header, so it
    // unsticks immediately. SiteDrop's markup already ships `class="sticky top-0"` on the header
    // and it fails for the same reason.
    typeof paddingTop === "number" ? `padding-top:${paddingTop}px` : "",
    typeof paddingBottom === "number" ? `padding-bottom:${paddingBottom}px` : "",
    // `background`, not `background-color`: a generated section routinely carries an inline
    // gradient, and picking a flat colour has to beat it rather than sit behind it.
    resolveColor(background) ? `background:${resolveColor(background)}` : "",
    resolveColor(foreground) ? `color:${resolveColor(foreground)}` : "",
  ]
    .filter(Boolean)
    .join(";");

  const filled = injectStyle(
    injectBoxLinks(
      styleImages(
        dropRemovedLinks(stripDangerous(fillTokens(html, text, images, links, editing)), links),
        images
      ),
      boxes || []
    ),
    decls
  );
  // The scope class rides on the block so the design styles identically in the builder canvas,
  // in preview and on the live page — see lib/designShared.
  const swapForm = !!hasForm && useRealForm !== false;

  // ⚠️ "SHOW THE DESIGN'S MOCK FORM" USED TO SHIP A TYPABLE FORM THAT WENT NOWHERE.
  //
  // Turning "Use my real form" off did two things at once: it stopped mounting the working form,
  // AND it stopped hiding the design's fake inputs — because both were gated on the same flag. The
  // result was precisely what sanitizeDesignHtml exists to prevent: real-looking boxes on a live
  // page, accepting typing, with a dead button and not even a failed POST to find in a log. One
  // checkbox, no warning, visible only in front of a customer.
  //
  // Hiding them outright isn't the answer either — that option exists so a prospect can be shown
  // the UNTOUCHED design, and an invisible hole where the contact box should be is not that.
  //
  // So the mock is kept LOOKING exactly as the designer drew it and made physically inert:
  // pointer-events off, nothing focusable, nothing typable. The demo still demos; the trap is
  // gone. `inert`-style CSS rather than a `disabled` attribute because the markup is the design's
  // and must not be rewritten.
  const mockOnly = !!hasForm && !swapForm;

  // The markup is rendered WHOLE either way — the real form is mounted into the design's own
  // box afterwards, so nothing about the surrounding layout moves. See DesignFormMount.
  //
  // ⚠️ THE DESIGN'S FAKE INPUTS MUST NOT BE VISIBLE BEFORE THE REAL FORM ARRIVES.
  //
  // sanitizeDesignHtml turns the design's <form> into a <div> but KEEPS its <input> elements, so
  // they ship in the server HTML. DesignFormMount deletes them, but only after hydration. On a
  // slow phone that leaves a window where a visitor sees real-looking boxes, types into them, taps
  // a dead button — and then hydration wipes what they typed. A lead lost with no error anywhere.
  //
  // So the box starts hidden and DesignFormMount reveals it by removing this attribute once the
  // working form is in place. With JavaScript off the box stays empty, which is honest: the real
  // form is a React component and could never have worked there anyway.
  return (
    <div
      // TWO classes, doing two different jobs. `DESIGN_SCOPE` is what the runtime rules generated
      // further up this file target, and what keeps a design's preflight off the builder's own UI.
      // `sheetScope(sheet)` is what THIS design's compiled stylesheet is scoped under, so two
      // designs on one page style their own blocks instead of overwriting each other's identically
      // named utilities. A block with no sheet id (pre-backfill) just gets the shared class.
      className={sheet ? `${DESIGN_SCOPE} ${sheetScope(sheet)}` : DESIGN_SCOPE}
      // Which stylesheet this section asked for, visible in the served HTML. Kept because the one
      // question you have when an imported page renders unstyled is "did the block get its sheet
      // id, or did the sheet fail to load" — and without this the two are indistinguishable from
      // the outside. `none` means the prop never arrived.
      data-sjc-sheet={sheet || "none"}
      // Only present when columns are actually set, so an untouched section's markup is unchanged.
      {...(colStyling ? { "data-sjc-cols": String(props.id || "") } : {})}
      {...(swapForm ? { "data-sjc-form-pending": "1" } : {})}
      {...(mockOnly ? { "data-sjc-form-mock": "1" } : {})}
      {...(fgRole ? { "data-sjc-fg": fgRole } : {})}
      // STICKY BELONGS ON THIS ELEMENT, not on the design's header inside it.
      //
      // `position: sticky` sticks within its parent's box and no further. The header's parent is
      // the inner div that holds only the header, so it has zero distance to travel. THIS div's
      // parent is <main>, which is the whole page — so the section pins to the top and stays
      // there for the length of the scroll, which is what "sticky nav" actually means.
      //
      // z-index 40 sits above page content and below the form portal.
      style={sticky ? { position: "sticky", top: 0, zIndex: 40 } : undefined}
    >
      {framing ? <style dangerouslySetInnerHTML={{ __html: framing }} /> : null}
      {colStyling ? <style dangerouslySetInnerHTML={{ __html: colStyling }} /> : null}
      {linkStyling || boxStyling || boxLinkCss ? (
        <style
          dangerouslySetInnerHTML={{
            __html: (anyPulse ? PULSE_KEYFRAMES : "") + linkStyling + boxStyling + boxLinkCss,
          }}
        />
      ) : null}
      {fgRole ? (
        // ⚠️ SETTING `color` ON THE SECTION IS NOT ENOUGH, AND THAT LOOKS LIKE THE FEATURE WORKING.
        //
        // Inheritance only reaches text that has no colour of its own. A design colours its
        // HEADINGS directly (`.band--deep h2{color:#fff}`), so flipping a dark band to White gave
        // a white heading on a white background — measured on sjc-2026: rgb(255,255,255) on
        // rgb(255,255,255). The body copy changed, the headline vanished, and nothing errored.
        //
        // So the role is also matched by a rule that reaches the text tags directly. Specificity
        // ties with the design's own `.band--deep h2`, and this <style> sits in the BODY while the
        // design's sheet is in the HEAD — later wins the tie.
        //
        // ⚠️ `span` IS DELIBERATELY ABSENT. The accent words inside a headline are spans with their
        // own class; sweeping them up here would flatten the design's own highlight colour, which
        // is the thing that makes the headline look designed.
        <style
          dangerouslySetInnerHTML={{
            __html:
              `[data-sjc-fg="${fgRole}"],[data-sjc-fg="${fgRole}"] :is(h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,figcaption,td,th)` +
              `{color:${fgValue}}`,
          }}
        />
      ) : null}
      {/* ⛔ THE CALENDAR MOUNTS INTO THE DESIGN'S OWN CARD, exactly like the form above it. The
          band, the heading and the white panel are the design's; only the empty box in the middle
          is replaced. → components/blocks/DesignCalMount.tsx */}
      {calLink ? <DesignCalMount calLink={calLink} /> : null}
      {swapForm ? (
        <style
          dangerouslySetInnerHTML={{
            __html: "[data-sjc-form-pending] [data-sjc-form]{visibility:hidden}",
          }}
        />
      ) : null}
      {mockOnly ? (
        <style
          dangerouslySetInnerHTML={{
            __html:
              "[data-sjc-form-mock] [data-sjc-form]{pointer-events:none}" +
              "[data-sjc-form-mock] [data-sjc-form] input," +
              "[data-sjc-form-mock] [data-sjc-form] textarea," +
              "[data-sjc-form-mock] [data-sjc-form] select," +
              "[data-sjc-form-mock] [data-sjc-form] button{pointer-events:none;user-select:none}",
          }}
        />
      ) : null}
      <div dangerouslySetInnerHTML={{ __html: filled }} />
      {/* The design's own <script> was stripped at import, so its hamburger has nothing wiring it
          to the panel. This does that one toggle in first-party code. Cheap and inert on a section
          with no menu — it looks for the pair, finds nothing, and stops. */}
      <DesignMenu />
      {swapForm ? (
        // ⚠️ THE SUCCESS COPY IS PASSED EXPLICITLY, AND MUST STAY THAT WAY.
        //
        // Leaving it off doesn't leave it blank — LeadForm falls back to LEADFORM_DEFAULTS, which
        // is SJC's own copy: "Got it. I'll call you today… call me straight out at (210)
        // 851-4906." That is Steven's phone number, on a client's website, in the message their
        // customer sees after asking that business to call them back.
        //
        // What changed on 2026-08-05 is that the words are now PROPS with a fallback, instead of
        // literals typed here. A literal could not be edited from the builder, which made this the
        // one piece of an imported design that was genuinely stuck — and it is the piece a
        // customer reads at the moment they've just handed over their details.
        //
        // Tokens are resolved by LeadForm from the site's business facts, not by the saved-data
        // walk, so {{business.phone}} works whether it arrives as a prop or as this fallback.
        <DesignFormMount
          inColumn
          theme="dark"
          fields={formFields?.length ? formFields : undefined}
          buttonLabel={formButton || undefined}
          source="imported design — contact section"
          note=""
          successHeading={successHeading?.trim() || DESIGN_SUCCESS_HEADING}
          successBody={successBody?.trim() || DESIGN_SUCCESS_BODY}
        />
      ) : null}
    </div>
  );
}
