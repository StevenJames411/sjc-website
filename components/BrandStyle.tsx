// Applies the site's brand by OVERRIDING the CSS variables the whole site already uses.
//
// This is why the swap is cheap: every block already paints from --color-sjc-* and
// --font-sans. Re-point those and the entire site re-skins — no block has to change.
//
// Rendered server-side in the root layout, so there's no flash of the old palette.
import { BRAND_DEFAULTS, type Brand, type BrandFont } from "@/lib/brandShared";

// Font var names must match what layout.tsx registers with next/font.
const FONT_VAR: Record<BrandFont, string> = {
  lexend: "--font-lexend",
  inter: "--font-inter",
  poppins: "--font-poppins",
  montserrat: "--font-montserrat",
  merriweather: "--font-merriweather",
  playfair: "--font-playfair",
  sourceSans: "--font-source-sans",
  spaceGrotesk: "--font-space-grotesk",
};

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

  const css = `:root{
--color-sjc-blue:${brand.accent};
--color-sjc-blue-hover:${brand.accentHover};
--color-sjc-ink:${brand.ink};
--color-sjc-mute:${brand.mute};
--color-sjc-line:${brand.line};
--color-sjc-bg-soft:${brand.bandSoft};
--color-sjc-navy:${brand.bandDark};
--color-sjc-green:${brand.cta};
--color-sjc-green-hover:${brand.ctaHover};
--color-sjc-navy-deep:${brand.bandDarker};
--color-sjc-secondary:${brand.secondary};
--color-sjc-highlight:${brand.highlight};
--font-sans:var(${bodyVar}), ${FALLBACK_STACK};
--font-body:var(${bodyVar}), ${FALLBACK_STACK};
--font-heading:var(${headVar}), ${FALLBACK_STACK};
}
h1,h2,h3,h4{font-family:var(--font-heading);}`;

  return <style id={id} dangerouslySetInnerHTML={{ __html: css }} />;
}
