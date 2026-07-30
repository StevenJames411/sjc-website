import { notFound } from "next/navigation";
import SiteSettings from "@/components/edit/SiteSettings";
import { findSite } from "@/lib/sites";
import { readPages } from "@/lib/pageRegistry";

// Everything global to one website. Static segment, so it wins over /edit/[site]/[page] — which
// is why "settings" is a reserved page slug (see lib/pageRegistry).
export const dynamic = "force-dynamic";

export default async function SiteSettingsPage({ params }: { params: Promise<{ site: string }> }) {
  const { site: id } = await params;
  const site = await findSite(id);
  if (!site) notFound();
  const pages = await readPages(id);
  return <SiteSettings site={site} pageCount={pages.length} />;
}
