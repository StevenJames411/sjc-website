import { notFound } from "next/navigation";
import SiteSettings from "@/components/edit/SiteSettings";
import { findSite } from "@/lib/sites";
import { readPages } from "@/lib/pageRegistry";
import { readBrand } from "@/lib/brand";
import { readPuckDraft, sheetsFor } from "@/lib/puckContent";
import { sizesIn, sampleFor, roleFor } from "@/lib/typeScale";

// Everything global to one website. Static segment, so it wins over /edit/[site]/[page] — which
// is why "settings" is a reserved page slug (see lib/pageRegistry).
export const dynamic = "force-dynamic";

export default async function SiteSettingsPage({ params }: { params: Promise<{ site: string }> }) {
  const { site: id } = await params;
  const site = await findSite(id);
  if (!site) notFound();
  const pages = await readPages(id);
  // ⚠️ THE PUBLISHED BRAND, NOT THE DRAFT. This screen's fonts apply on click, so the value it
  // shows has to be the one the public site is actually using — reading the draft would show a
  // face nobody outside the studio can see. That exact gap is what put sjc-2026 on Lexend while
  // its draft held Space Grotesk: set once, never published, invisible either way.
  const brand = await readBrand(true, id);

  // ⛔ EVERY SIZE THE WHOLE WEBSITE USES, NOT JUST THIS PAGE'S. The complaint this screen answers is
  // "ten pages, six sections each, every one a different size" — so a list built from one page
  // would send him back to the same hunt with a nicer UI on it. Read every page's sheets, dedupe,
  // and show the union.
  //
  // ⚠️ DRAFTS, because that is what the builder edits and what he is looking at while he decides.
  const chromeDocs = await Promise.all(["nav", "footer"].map((sl) => readPuckDraft(sl, id)));
  const pageDocs = await Promise.all(pages.map((pg) => readPuckDraft(pg.slug, id)));
  const allDocs = [...pageDocs, ...chromeDocs].filter(Boolean);
  // Every imported block on the whole website, so a size can be shown with the words it sets.
  const blocks: { html?: string; text?: { key: string; value: string }[] }[] = [];
  const collect = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(collect);
    if (!n || typeof n !== "object") return;
    const o = n as Record<string, unknown> & { props?: Record<string, unknown>; type?: string };
    if (o.type === "DesignSection" && o.props) {
      blocks.push(o.props as { html?: string; text?: { key: string; value: string }[] });
    }
    for (const k of ["content", "zones", "props"]) if (o[k as keyof typeof o]) collect(o[k as keyof typeof o]);
  };
  allDocs.forEach(collect);
  // ⛔ GROUPED BY WHAT THE SIZE IS NOW, NOT BY WHAT THE DESIGN DECLARED.
  //
  // The list is built from the RAW stylesheets, so every original value is a row — and after a
  // collapse that means `h3 · 29px` showing 28 in its box, sitting directly above `h3 · 28px`
  // showing 28 in its box. Two rows doing the identical thing, and no sign anywhere that anything
  // had been collapsed. Steven: *"I don't know why some are highlighted and some aren't."*
  //
  // Grouping by the EFFECTIVE value makes the screen say what actually happened: one row per size
  // the website really uses, carrying the originals it absorbed. 36 rows become 21, which is the
  // change itself finally being visible.
  const raw = sizesIn(await sheetsFor(allDocs));
  const scale = brand?.typeScale || {};
  const groups = new Map<string, { effective: string; members: string[]; rules: number; selectors: string[] }>();
  for (const z of raw) {
    const eff = scale[z.value] || z.value;
    const g = groups.get(eff) || { effective: eff, members: [], rules: 0, selectors: [] };
    g.members.push(z.value);
    g.rules += z.rules;
    g.selectors = [...new Set([...g.selectors, ...z.selectors])];
    groups.set(eff, g);
  }
  const sizes = [...groups.values()]
    .map((g) => ({
      ...g,
      // What it absorbed, for the row to show. Empty when nothing was collapsed into it.
      absorbed: g.members.filter((m) => m !== g.effective),
      changed: g.members.some((m) => !!scale[m]),
      sample: sampleFor(g.selectors, blocks),
      role: roleFor(g.selectors),
    }))
    .sort((a, b) => {
      const px = (v: string) => {
        const n = [...v.matchAll(/(-?[\d.]+)px/g)].map((m) => Number(m[1]));
        return n.length ? Math.max(...n) : -1;
      };
      return px(b.effective) - px(a.effective) || a.effective.localeCompare(b.effective);
    });
  return (
    <SiteSettings
      site={site}
      pageCount={pages.length}
      pages={pages.map((p) => ({ slug: p.slug, title: p.title }))}
      brand={brand}
      sizes={sizes}
    />
  );
}
