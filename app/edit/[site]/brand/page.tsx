// One CLIENT website's fonts and colours.
//
// ⚠️ THIS ROUTE IS THE WHOLE FIX. Per-site brands were already stored (siteKeys(siteId).brand) and
// already rendered (lib/publicSitePage reads the brand of the site it serves). Only the screen was
// missing — so a client's palette could be kept and could be painted, and there was no way to set
// it. Every native client build inherited SJC's colours permanently, and opening /edit/brand from
// a client's address silently edited Steven's own site instead.
//
// Same component as /edit/brand, handed a site id. Nothing about the SJC screen changes.
import { notFound } from "next/navigation";
import { findSite } from "@/lib/sites";
import BrandEditor from "@/app/edit/brand/page";

export const dynamic = "force-dynamic";

export default async function SiteBrandPage({ params }: { params: Promise<{ site: string }> }) {
  const { site: siteId } = await params;
  const site = await findSite(siteId);
  if (!site) notFound();
  // The name is passed through so the screen can say WHOSE colours are about to change. Every
  // brand screen looks identical, and the address bar is a poor place to keep that fact.
  return <BrandEditor siteId={siteId} siteLabel={site.name} />;
}
