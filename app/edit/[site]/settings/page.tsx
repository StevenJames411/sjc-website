import { notFound } from "next/navigation";
import SiteSettings from "@/components/edit/SiteSettings";
import { findSite } from "@/lib/sites";
import { readPages } from "@/lib/pageRegistry";
import { readBrand } from "@/lib/brand";

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
  return (
    <SiteSettings
      site={site}
      pageCount={pages.length}
      pages={pages.map((p) => ({ slug: p.slug, title: p.title }))}
      brand={brand}
    />
  );
}
