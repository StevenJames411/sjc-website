// Font Awesome icons, turned into inline SVG at import. SERVER ONLY.
//
// ── WHY (2026-08-26) ──────────────────────────────────────────────────────────────────────────
// The LandingSite build came in with all 87 of its `<i class="fa-solid fa-house">` tags intact and
// not one icon visible: LandingSite loads the Font Awesome stylesheet from a SCRIPT, not a
// `<link>`, so the importer had nothing to capture and every icon rendered as an empty tile.
// Steven, looking at the two pages side by side: *"we're still leaving behind two different layers
// of icons"* — the circles in "Companies We Serve" and the squares in "11 Features". Same tag,
// same cause, one fix.
//
// ⛔ INLINE SVG, NOT A STYLESHEET LINK — the same trade `inlineLucideIcons` already makes. A
// linked icon font is a live dependency on somebody else's CDN inside a site a client pays for,
// and it is exactly what adopting the images exists to prevent. An inlined path needs nothing at
// runtime and cannot rot.
//
// ⚠️ SIZED IN `em`, COLOURED BY `currentColor`. Font Awesome draws an icon as TEXT, so the design
// sizes it with `text-2xl` and colours it with `text-white`. An SVG with hardcoded width and fill
// ignores both and every icon comes out the same size in the wrong colour. `width:1em` and
// `fill:currentColor` keep those utility classes working exactly as the design intended, which is
// why the original classes are carried across rather than dropped.
import { parse } from "node-html-parser";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** `fa-solid`/`fas` -> the folder its SVGs live in. Free tier ships these three. */
const STYLE_DIR: Record<string, string> = {
  "fa-solid": "solid",
  fas: "solid",
  "fa-regular": "regular",
  far: "regular",
  "fa-brands": "brands",
  fab: "brands",
};

/**
 * Class names that begin with `fa-` and are NOT an icon name — sizing, spin, fixed width and the
 * style keywords themselves.
 *
 * ⚠️ THIS LIST IS THE WHOLE CORRECTNESS PROBLEM. `fa-solid fa-spin fa-2x fa-house` has four
 * `fa-` classes and exactly one names a file. Guess wrong and you read `solid/spin.svg`, get
 * nothing, and report the icon as missing while the real one sits there unused.
 */
const NOT_AN_ICON =
  /^fa-(solid|regular|brands|light|thin|duotone|sharp|fw|lg|sm|xs|xl|2xs|2xl|[0-9]+x|spin|spin-pulse|spin-reverse|pulse|beat|beat-fade|fade|bounce|shake|flip|flip-horizontal|flip-vertical|flip-both|rotate-(90|180|270|by)|border|inverse|stack|stack-1x|stack-2x|ul|li|pull-left|pull-right|layers|swap-opacity)$/;

/**
 * Pro-only icon names, mapped to the nearest FREE icon that reads the same at icon size.
 *
 * ⛔ STEVEN'S CALL, 2026-08-26: *"If the free one is good enough, I could live with a free version
 * of that icon."* The alternative is a blank tile where the design clearly wanted a shield, or
 * paying for a licence to draw one glyph.
 *
 * ⚠️ ONLY ADD A PAIR WHERE THE SUBSTITUTE CARRIES THE SAME MEANING. `shield-check` and
 * `shield-halved` both read as "protected" in a 16px tile. A map that starts swapping in whatever
 * is closest alphabetically produces a page of icons that are individually fine and collectively
 * say nothing.
 */
const FREE_EQUIVALENT: Record<string, string> = {
  "shield-check": "shield-halved",
  "shield-alt": "shield-halved",
  "circle-check-solid": "circle-check",
};

const iconCache = new Map<string, string | null>();

/** The `<path>`s and `viewBox` out of one Font Awesome SVG file, or null if there is no such icon. */
async function loadIcon(dir: string, name: string): Promise<string | null> {
  const key = `${dir}/${name}`;
  if (iconCache.has(key)) return iconCache.get(key)!;
  let svg: string | null = null;
  try {
    // Same shape as compileDesignCss reading tailwindcss's index.css out of node_modules — a path
    // Next's tracer follows, rather than a dynamic import of a data file.
    const file = path.join(
      process.cwd(),
      "node_modules",
      "@fortawesome",
      "fontawesome-free",
      "svgs",
      dir,
      `${name}.svg`
    );
    svg = await readFile(file, "utf8");
  } catch {
    svg = null; // unknown icon — leave the element exactly as it was
  }
  iconCache.set(key, svg);
  return svg;
}

export async function inlineFontAwesomeIcons(
  html: string
): Promise<{ html: string; inlined: number; missing: string[] }> {
  const root = parse(String(html || ""), { comment: false });
  const nodes = root.querySelectorAll("i, span");
  if (!nodes.length) return { html: root.toString(), inlined: 0, missing: [] };

  let inlined = 0;
  const missing = new Set<string>();

  for (const el of nodes) {
    const classes = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);
    const styleClass = classes.find((c) => STYLE_DIR[c]);
    if (!styleClass) continue;

    const nameClass = classes.find((c) => c.startsWith("fa-") && !NOT_AN_ICON.test(c));
    if (!nameClass) continue;
    const name = nameClass.slice(3);

    // ⚠️ FALL BACK TO `solid` WHEN THE REQUESTED WEIGHT DOES NOT EXIST. The free set does not carry
    // every icon in every weight — this page asks for `fa-regular fa-chevron-down`, which only
    // ships solid. Refusing it leaves a blank tile where the design clearly wanted a chevron, and
    // the solid cut of the same glyph is indistinguishable at icon size. A name that exists in NO
    // weight is a genuinely missing icon and gets reported.
    const dir = STYLE_DIR[styleClass];
    const file =
      (await loadIcon(dir, name)) ??
      (dir === "solid" ? null : await loadIcon("solid", name)) ??
      (FREE_EQUIVALENT[name] ? await loadIcon("solid", FREE_EQUIVALENT[name]) : null);
    if (!file) {
      missing.add(`${styleClass} ${nameClass}`);
      continue;
    }

    const viewBox = file.match(/viewBox="([^"]+)"/)?.[1] || "0 0 512 512";
    const inner = file.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

    // ⛔ KEEP EVERY NON-fa CLASS. `text-white text-2xl mr-2` is how the design sizes, colours and
    // spaces the icon; dropping them is how you get a page of correctly-shaped icons that are all
    // the wrong size and the wrong colour.
    const kept = classes.filter((c) => !c.startsWith("fa-") && !STYLE_DIR[c]).join(" ");
    const aria = el.getAttribute("aria-hidden") === "true" ? ' aria-hidden="true"' : "";

    el.replaceWith(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${kept ? ` class="${kept}"` : ""}` +
        ` style="width:1em;height:1em;display:inline-block;vertical-align:-0.125em;fill:currentColor"` +
        `${aria}>${inner}</svg>`
    );
    inlined++;
  }

  return { html: root.toString(), inlined, missing: [...missing] };
}
