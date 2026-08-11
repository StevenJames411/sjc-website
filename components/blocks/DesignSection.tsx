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

import { DESIGN_SCOPE } from "@/lib/designShared";
import { resolveColor } from "@/lib/brandColor";
import { surfaceCss, wantsPulse, PULSE_KEYFRAMES, type Surface } from "@/lib/surfaceStyle";
import type { DesignBoxGroup } from "@/lib/designHtml";
import DesignFormMount from "./DesignFormMount";
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
  html: "",
  text: [],
  images: [],
  links: [],
  sticky: false,
  paddingTop: null,
  paddingBottom: null,
  background: "",
  foreground: "",
  hasForm: false,
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
    const h = typeof img?.frameHeight === "number" && img.frameHeight > 0 ? img.frameHeight : null;
    const w = typeof img?.frameWidth === "number" && img.frameWidth > 0 ? img.frameWidth : null;
    const band = typeof img?.bandWidth === "number" && img.bandWidth > 0 ? img.bandWidth : null;
    const bandCol = resolveColor(img?.bandColor);
    const glow = resolveColor(img?.glowColor);
    const z = typeof img?.zoom === "number" && img.zoom > 100 ? img.zoom : 100;
    if (!h && !w && !band && !bandCol && !glow) continue;

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
    const always = [
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
    const fillSized = h || w ? `@media (min-width:961px){${sel} > img[data-sjc-img="${key}"]{width:100%;height:100%;object-fit:cover}}` : "";
    const fill = [
      `object-position:${pos}`,
      // Rounded to match whatever radius the design gave the frame, so a banded photo doesn't sit
      // as a square inside a rounded panel.
      band ? "border-radius:inherit" : "",
      z > 100 ? `transform:scale(${z / 100});transform-origin:${pos}` : "",
    ].filter(Boolean).join(";");
    if (fill) out.push(`${sel} > img[data-sjc-img="${key}"]{${fill}}`);
    if (fillSized) out.push(fillSized);
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
    html = "",
    text = [],
    images = [],
    links = [],
    sticky,
    boxes,
    paddingTop,
    paddingBottom,
    background,
    foreground,
    hasForm,
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
      className={DESIGN_SCOPE}
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
