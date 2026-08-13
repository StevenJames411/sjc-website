import { notFound } from "next/navigation";
import SiteSettings from "@/components/edit/SiteSettings";
import { findSite } from "@/lib/sites";
import { readPages } from "@/lib/pageRegistry";
import { readBrand } from "@/lib/brand";
import { readPuckDraft, sheetsFor } from "@/lib/puckContent";
import { sizesIn } from "@/lib/typeScale";

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
  const sizes = sizesIn(await sheetsFor([...pageDocs, ...chromeDocs].filter(Boolean)));
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
