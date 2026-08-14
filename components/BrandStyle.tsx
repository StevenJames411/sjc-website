// Applies the site's brand by OVERRIDING the CSS variables the whole site already uses.
//
// This is why the swap is cheap: every block already paints from --color-sjc-* and
// --font-sans. Re-point those and the entire site re-skins — no block has to change.
//
// Rendered server-side in the root layout, so there's no flash of the old palette.
import { BRAND_DEFAULTS, type Brand, type BrandFont, FONT_VAR } from "@/lib/brandShared";

// Font var names must match what layout.tsx registers with next/font.

const FALLBACK_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default function BrandStyle({ brand, id = "sjc-brand" }: { brand: Brand; id?: string }) {
  // Nothing customised yet → emit nothing at all, so the stylesheet stays exactly as shipped.
  //
  // ⚠️ This comparison is why every new Brand field must have a do-nothing default and why
  // lib/brand.ts `normalize()` merges over BRAND_DEFAULTS: a brand saved before the field existed
  // reads back with the default, stays "default", and its site keeps rendering byte-identical.
  const isDefault = (Object.keys(BRAND_DEFAULTS) as (keyof Brand)[])
    .every((k) => brand[k] === BRAND_DEFAULTS[k]);
  if (isDefault) return null;

  const bodyVar = FONT_VAR[brand.font] || FONT_VAR.lexend;
  // Blank heading font = headings share the body font, which is how this behaved before pairing.
  const headVar = (brand.headingFont && FONT_VAR[brand.headingFont]) || bodyVar;

  /**
   * ⛔ ONLY WHAT WAS ACTUALLY CHANGED. THIS FILE USED TO EMIT ALL SIXTEEN, ALWAYS.
   *
   * The all-or-nothing test above is right at the extremes and wrong everywhere between them: a
   * brand that differs by ONE field emitted the entire block, so thirteen SHIPPED-DEFAULT colours
   * were pushed onto a site that had never chosen any of them.
   *
   * ⚠️ HOW IT SURFACED, AND WHY IT WOULD HAVE HIT EVERY CUSTOMER. Steven picked a FONT on sjc-2026.
   * The brand stopped being default, so this emitted `--color-sjc-green:#22c55e` — the shipped CTA
   * default — and the glow behind his hero image turned GREEN on a design built in blue. Nothing
   * errored, nothing said a colour had been set, and the only thing he had touched was typography:
   * *"changing the font family changed the glow behind the hero section image container for some
   * reason."*
   *
   * On an imported design the damage is worse than a wrong colour, because the design's own CSS is
   * scoped to its section while this is `:root` — so a default leaks into every band that reads a
   * variable, and the further a customer's palette is from ours the more of their design it eats.
   *
   * A field left at its default now emits NOTHING, so it keeps inheriting whatever the design
   * shipped with. One control changes one thing.
   */
  const decl: string[] = [];
  const put = (k: keyof Brand, cssVar: string, value?: string) => {
    if (brand[k] === BRAND_DEFAULTS[k]) return;
    decl.push(`${cssVar}:${value ?? brand[k]};`);
  };

  put("accent", "--color-sjc-blue");
  put("accentHover", "--color-sjc-blue-hover");
  put("ink", "--color-sjc-ink");
  put("mute", "--color-sjc-mute");
  put("line", "--color-sjc-line");
  put("bandSoft", "--color-sjc-bg-soft");
  put("bandDark", "--color-sjc-navy");
  put("cta", "--color-sjc-green");
  put("ctaHover", "--color-sjc-green-hover");
  put("bandDarker", "--color-sjc-navy-deep");

  // ⛔ THE ONE FIELD THAT CANNOT USE put(), AND I BROKE IT BY MAKING IT (2026-08-13).
  //
  // `bandHeader` is documented in three places as "blank = follow the deeper dark band" — the type
  // (lib/brandShared), the brand screen's help text, and NavView, which paints the header with
  // `background || "bandHeader"`. Its default IS blank, so put()'s "skip anything at its default"
  // test returned before emitting and the fallback never fired: change Dark band (deeper) and the
  // header bar sat there, contradicting all three.
  //
  // The test has to run on the RESOLVED value, not the raw field. Blank is not "unset" here; it is
  // an instruction to inherit, and inheriting from a customised value is itself a customisation.
  const headerBand = brand.bandHeader || brand.bandDarker;
  const headerBandDefault = BRAND_DEFAULTS.bandHeader || BRAND_DEFAULTS.bandDarker;
  if (headerBand !== headerBandDefault) decl.push(`--color-sjc-band-header:${headerBand};`);
  put("secondary", "--color-sjc-secondary");
  put("highlight", "--color-sjc-highlight");

  // ⚠️ THE FONTS ARE NOT SUBJECT TO THE SAME TEST, and the asymmetry is deliberate. A colour left
  // at its default means "the design's colour"; a FONT left at its default means Lexend, which is
  // a real choice this file has to state — stripFontFamily removed the design's own family from
  // its sheet precisely so the brand would be the one place typography is decided.
  /**
   * ⛔ THE DESIGN'S REAL TYPEFACE, WHEN WE HAVE A COPY OF IT.
   *
   * `nearestFont()` rounds a bought design's font to the closest of the eight we ship, because
   * next/font was build-time and a design could never bring its own file. Steven caught the
   * rounding on his own hero and named the cost: *"since I'm paying for a design to be brought in,
   * we need to be able to keep it. Everybody I build for, AI is going to throw a different font at
   * me."*
   *
   * lib/designFonts copies the actual font files onto our own Blob storage at import and stores
   * @font-face rules pointing at them. If those exist, they win — the family named in them is the
   * genuine article rather than the nearest match.
   *
   * ⚠️ ONLY WHILE THE SITE IS ON "AS DESIGNED". The moment somebody picks Editorial or Friendly
   * they have chosen one of ours, and quietly serving the design's font underneath that choice
   * would make the picker a liar.
   */
  const asDesigned = (brand.fontSet || "asDesigned") === "asDesigned";
  const realBody = asDesigned ? String(brand.designFamilyBody || "").trim() : "";
  const realHead = asDesigned ? String(brand.designFamilyHeading || "").trim() : "";
  const q = (f: string) => `"${f.replace(/"/g, "")}"`;

  const fontDecl =
    `--font-sans:${realBody ? `${q(realBody)}, ` : ""}var(${bodyVar}), ${FALLBACK_STACK};` +
    `--font-body:${realBody ? `${q(realBody)}, ` : ""}var(${bodyVar}), ${FALLBACK_STACK};` +
    `--font-heading:${realHead ? `${q(realHead)}, ` : ""}var(${headVar}), ${FALLBACK_STACK};`;

  // The @font-face rules come FIRST — a family referenced before it is defined is a family the
  // browser silently skips over to the next in the stack, which would look exactly like the
  // rounding this exists to remove.
  const faces = (realBody || realHead) && brand.designFontCss ? String(brand.designFontCss) : "";

  // Per-element typefaces. Emitted AFTER :root so they beat the inherited body/heading face, and
  // unscoped because these selectors are the design's own class names — they exist nowhere else.
  const perElement = Object.entries(brand.faceFor || {})
    .map(([sel, key]) => {
      if (!sel || !key) return "";
      // ⚠️ TWO KINDS OF VALUE, AND BOTH HAVE TO WORK.
      //
      // A value the OPERATOR picked from the dropdown is one of our eight, so it resolves to the
      // self-hosted variable. A value SEEDED AT IMPORT is the design's own family name — which may
      // be a font we have never shipped, because that is the entire point: the design gets to keep
      // a face we do not stock. Its @font-face rules are emitted above from designFontCss, so the
      // literal name resolves; without this branch a fourth face would land in the same hole the
      // wordmark fell into, one layer deeper.
      const v = FONT_VAR[key as BrandFont];
      const family = v ? `var(${v})` : `"${String(key).replace(/"/g, "")}"`;
      return `${sel}{font-family:${family}, ${FALLBACK_STACK};}`;
    })
    .filter(Boolean)
    .join("");
  const css =
    faces +
    `:root{${decl.join("")}${fontDecl}}h1,h2,h3,h4{font-family:var(--font-heading);}` +
    perElement;

  return <style id={id} dangerouslySetInnerHTML={{ __html: css }} />;
}
