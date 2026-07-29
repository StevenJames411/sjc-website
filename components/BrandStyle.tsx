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
};

const FALLBACK_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default function BrandStyle({ brand }: { brand: Brand }) {
  // Nothing customised yet → emit nothing at all, so the stylesheet stays exactly as shipped.
  const isDefault = (Object.keys(BRAND_DEFAULTS) as (keyof Brand)[])
    .every((k) => brand[k] === BRAND_DEFAULTS[k]);
  if (isDefault) return null;

  const fontVar = FONT_VAR[brand.font] || FONT_VAR.lexend;

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
--color-sjc-secondary:${brand.secondary};
--color-sjc-highlight:${brand.highlight};
--font-sans:var(${fontVar}), ${FALLBACK_STACK};
}`;

  return <style id="sjc-brand" dangerouslySetInnerHTML={{ __html: css }} />;
}
