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

export type DesignText = { key: string; label: string; value: string };
export type DesignImage = { key: string; alt: string; src: string };

export type DesignSectionProps = {
  /** The section's markup, with {{t:…}} / {{i:…}} where the editable bits were. */
  html?: string;
  text?: DesignText[];
  images?: DesignImage[];
};

export const DESIGNSECTION_DEFAULTS: DesignSectionProps = {
  html: "",
  text: [],
  images: [],
};

const TOKEN = /\{\{([ti]):([a-z0-9_-]+)\}\}/gi;

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
  images: DesignImage[] = []
): string {
  const t = new Map(text.map((r) => [String(r?.key || "").toLowerCase(), r?.value ?? ""]));
  const i = new Map(images.map((r) => [String(r?.key || "").toLowerCase(), r?.src ?? ""]));
  return String(html || "").replace(TOKEN, (_m, kind: string, key: string) => {
    const map = kind.toLowerCase() === "t" ? t : i;
    // Unknown key -> empty. Never render the token itself onto a live page.
    return esc(map.get(String(key).toLowerCase()) ?? "");
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

export default function DesignSection(props: DesignSectionProps) {
  const { html = "", text = [], images = [] } = props;
  if (!html.trim()) return null;
  const filled = stripDangerous(fillTokens(html, text, images));
  return <div dangerouslySetInnerHTML={{ __html: filled }} />;
}
