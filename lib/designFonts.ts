// KEEP THE TYPEFACE THE DESIGN CAME WITH — by taking a copy of it and hosting it ourselves.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// We ship eight families because next/font compiles fonts into the BUILD, so a bought design could
// never bring its own: `nearestFont()` rounded whatever it used to the closest of the eight. That
// is a reasonable trade for a site we design and a bad one for a business that RESELLS designs.
//
// Steven, looking at his own hero in a font that was close but not his: *"Since I'm paying for a
// design to be brought in, we need to be able to keep it. Everybody I build for, AI is going to
// throw a different font at me. If the customer wants it, we need to keep it."*
//
// He is right, and the rounding gets worse as the business scales — every generated design picks
// its own face, so every customer would be handed something adjacent to what they bought.
//
// ── WHY NOT JUST LINK GOOGLE FONTS ────────────────────────────────────────────────────────────
// Because the reason for the eight was never arbitrary. A <link> to fonts.googleapis.com puts a
// third-party request on the critical path of every customer's page, and it is exactly the kind of
// dependency that turns into someone else's outage on someone else's website.
//
// So the font is COPIED at import: fetch the stylesheet, download the actual files, store them on
// our own Blob storage, and emit @font-face pointing at us. One-time cost at import, and after
// that the design's real typeface is served from the same origin as everything else.
//
// ⛔ NEVER FAILS THE IMPORT. Same law as nearestFont: *"a design in the wrong typeface is one
// dropdown from right; a design that refuses to import is not."* Every failure here returns null
// and the caller keeps the mapped-to-nearest behaviour that shipped before this file existed.

import { put } from "@vercel/blob";

/** The real family names a design asks for, before any rounding. */
export type DesignFamilies = { heading: string; body: string };

/**
 * The family names as WRITTEN, not mapped onto our eight.
 *
 * Deliberately close to detectFonts() in lib/importDesign, which reads the same three places and
 * then rounds. This returns the raw string so the rounding becomes optional rather than automatic.
 */
export function detectFontFamilies(html: string): DesignFamilies {
  const s = String(html || "");

  const headingRule =
    s.match(/h[1-6][^{}]*\{[^{}]*font-family\s*:\s*([^;}]+)/i) ||
    s.match(/<h[1-6][^>]*style=["'][^"']*font-family\s*:\s*([^;"']+)/i);
  const bodyRule =
    s.match(/(?:^|[{;\s])body\s*\{[^{}]*font-family\s*:\s*([^;}]+)/i) ||
    s.match(/<p[^>]*style=["'][^"']*font-family\s*:\s*([^;"']+)/i);

  // The Google Fonts link is the most reliable source when it exists: a generated design lists
  // exactly the families it loaded, display face first.
  const linked = [...s.matchAll(/family=([A-Za-z0-9+%]+)/g)].map((m) =>
    decodeURIComponent(m[1].replace(/\+/g, " ")).trim()
  );

  return {
    heading: firstFamily(headingRule?.[1]) || linked[0] || "",
    body: firstFamily(bodyRule?.[1]) || linked[1] || linked[0] || "",
  };
}

/**
 * `'Space Grotesk', ui-sans-serif, sans-serif` -> `Space Grotesk`.
 *
 * ⚠️ THE FIRST NAME IS THE ONLY ONE WORTH HAVING. The rest of a font stack is fallbacks — generic
 * families and system faces that are already on the machine. Copying `ui-sans-serif` from Google
 * would fetch nothing and store an empty file.
 */
function firstFamily(decl?: string): string {
  const first = String(decl || "").split(",")[0]?.trim() || "";
  const name = first.replace(/^['"]|['"]$/g, "").trim();
  if (!name) return "";
  if (/^(ui-|system-ui|sans-serif|serif|monospace|cursive|fantasy|inherit|initial|unset|var\()/i.test(name)) return "";
  return name;
}

/** A weight set worth having: regular, medium, semibold, bold. Headlines and body both covered. */
const WEIGHTS = "400;500;600;700";

/**
 * ⚠️ A REAL BROWSER UA IS REQUIRED, and this is not a trick — it is the documented behaviour.
 * Google serves a DIFFERENT stylesheet per user agent: without a modern UA it returns TTF, which is
 * several times the size of woff2 for identical glyphs. The fetch would appear to work.
 */
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/**
 * Copy one family onto our own storage and return @font-face CSS pointing at it.
 *
 * Returns null for anything that doesn't work out — not a Google family, network down, a name that
 * is really a fallback. The caller falls back to the nearest of our eight.
 */
export async function captureFamily(family: string): Promise<string | null> {
  const name = firstFamily(family);
  if (!name) return null;

  try {
    const url =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}` +
      `:wght@${WEIGHTS}&display=swap`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    // A family Google doesn't have answers 400. That is a normal outcome, not an error worth
    // throwing: plenty of designs name a font nobody hosts.
    if (!res.ok) return null;
    let css = await res.text();
    if (!/@font-face/i.test(css)) return null;

    // ⛔ LATIN ONLY, ON PURPOSE. Google splits a family into a dozen unicode-range subsets —
    // cyrillic, greek, vietnamese — and a browser downloads only what a page uses. We are storing
    // files, not linking them, so every subset kept is a file copied and paid for forever to serve
    // glyphs no customer's website will render. Keeping latin + latin-ext is the whole alphabet
    // these businesses write in.
    css = dropForeignSubsets(css);

    const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]);
    if (!urls.length) return null;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    for (const remote of [...new Set(urls)]) {
      const file = await fetch(remote, { headers: { "User-Agent": UA } });
      if (!file.ok) return null; // a partial family renders some weights and not others
      const bytes = Buffer.from(await file.arrayBuffer());
      const ext = remote.split(".").pop()?.split(/[?#]/)[0] || "woff2";
      // Content-addressed by the remote path so re-importing the same family reuses the same
      // object instead of stacking copies in storage.
      const id = remote.split("/").slice(-2).join("-").replace(/[^a-z0-9.-]/gi, "");
      const blob = await put(`fonts/${slug}/${id}`, bytes, {
        access: "public",
        contentType: ext === "woff2" ? "font/woff2" : "font/woff",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      css = css.split(remote).join(blob.url);
    }

    // Nothing may still point at Google, or the third-party request this exists to remove is
    // still there and nobody would notice until it was down.
    if (/fonts\.gstatic\.com|fonts\.googleapis\.com/.test(css)) return null;
    return css;
  } catch {
    return null;
  }
}

/** Keep only the @font-face blocks whose unicode-range is latin or latin-ext (or unstated). */
function dropForeignSubsets(css: string): string {
  const blocks = css.split(/(?=@font-face)/);
  const keep = blocks.filter((b) => {
    if (!/@font-face/i.test(b)) return true; // leading comments etc.
    const before = b.slice(0, b.indexOf("@font-face"));
    const label = /\/\*\s*([a-z-]+)\s*\*\//i.exec(before)?.[1] || "";
    if (!label) return true;
    return label === "latin" || label === "latin-ext";
  });
  return keep.join("");
}

/**
 * Capture both faces of a design. Returns the CSS and the family names that actually made it.
 *
 * ⚠️ ONE STYLESHEET, DEDUPED. A design using one family for both would otherwise store it twice
 * and emit two identical @font-face sets.
 */
export async function captureDesignFonts(
  fams: DesignFamilies
): Promise<{ css: string; heading: string; body: string } | null> {
  const wanted = [...new Set([fams.heading, fams.body].map(firstFamily).filter(Boolean))];
  if (!wanted.length) return null;

  const parts: string[] = [];
  const got = new Set<string>();
  for (const f of wanted) {
    const css = await captureFamily(f);
    if (css) {
      parts.push(css);
      got.add(f);
    }
  }
  if (!parts.length) return null;

  return {
    css: parts.join("\n"),
    // A family that failed to copy reports back as blank, so the caller can round THAT ONE to the
    // nearest of the eight while the other keeps its real face.
    heading: got.has(firstFamily(fams.heading)) ? firstFamily(fams.heading) : "",
    body: got.has(firstFamily(fams.body)) ? firstFamily(fams.body) : "",
  };
}
