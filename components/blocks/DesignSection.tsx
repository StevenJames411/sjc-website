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
import DesignFormMount from "./DesignFormMount";
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
export type DesignLink = { key: string; label: string; href: string };

export type DesignSectionProps = {
  /** The section's markup, with {{t:…}} / {{i:…}} where the editable bits were. */
  html?: string;
  text?: DesignText[];
  images?: DesignImage[];
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
  paddingTop?: number | null;
  paddingBottom?: number | null;

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
  formButton?: string;
};

export const DESIGNSECTION_DEFAULTS: DesignSectionProps = {
  html: "",
  text: [],
  images: [],
  links: [],
  paddingTop: null,
  paddingBottom: null,
  hasForm: false,
  useRealForm: true,
  formFields: [],
  formButton: "",
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
  links: DesignLink[] = []
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
      if (css) return `<span style="${css}">${raw}</span>`;
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
function stripDangerous(html: string): string {
  return String(html || "")
    .replace(/<\s*(script|iframe|object|embed|base)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|base)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(["'])[\s\S]*?\1/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src|srcset|action)\s*=\s*(["'])\s*(javascript|vbscript):[\s\S]*?\2/gi, "$1=$2#$2");
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
 * Apply per-photo overrides by adding a style to the marked <img>.
 *
 * Targeted rather than global: `data-sjc-img="i2"` identifies one image, so resizing the founder
 * photo can't touch the phone mockup. Images with nothing set are not rewritten at all.
 */
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
    paddingTop,
    paddingBottom,
    hasForm,
    useRealForm = true,
    formFields,
    formButton,
  } = props;
  if (!html.trim()) return null;

  // Only emit what was actually set, so an untouched section keeps the design's own rhythm.
  const decls = [
    typeof paddingTop === "number" ? `padding-top:${paddingTop}px` : "",
    typeof paddingBottom === "number" ? `padding-bottom:${paddingBottom}px` : "",
  ]
    .filter(Boolean)
    .join(";");

  const filled = injectStyle(
    styleImages(stripDangerous(fillTokens(html, text, images, links)), images),
    decls
  );
  // The scope class rides on the block so the design styles identically in the builder canvas,
  // in preview and on the live page — see lib/designShared.
  const swapForm = !!hasForm && useRealForm !== false;

  // The markup is rendered WHOLE either way — the real form is mounted into the design's own
  // box afterwards, so nothing about the surrounding layout moves. See DesignFormMount.
  return (
    <div className={DESIGN_SCOPE}>
      <div dangerouslySetInnerHTML={{ __html: filled }} />
      {swapForm ? (
        <DesignFormMount
          inColumn
          theme="dark"
          fields={formFields?.length ? formFields : undefined}
          buttonLabel={formButton || undefined}
          source="imported design — contact section"
        />
      ) : null}
    </div>
  );
}
