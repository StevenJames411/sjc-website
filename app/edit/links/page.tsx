// Smart Links — the short, trackable links a website hands out (/go/<name>), per site.
//
// A static segment under /edit, so it wins precedence over app/edit/[site] the same way /edit/forms
// does. "links" is in RESERVED_SITE_IDS for that reason.
//
// Owner-only for free: middleware.ts protects everything under /edit/.
import { readSites } from "@/lib/sites";
import { publicBaseFor, SJC_HOST } from "@/lib/hostShared";
import { navLabel } from "@/lib/editNav";
import { SJC } from "@/lib/siteKeys";
import LinksManager from "@/components/edit/LinksManager";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: await navLabel("links") };
}

export default async function LinksPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const [{ site: wanted }, sites, title] = await Promise.all([searchParams, readSites(), navLabel("links")]);
  const live = sites.filter((s) => s.kind !== "template");
  const site = live.find((s) => s.id === wanted) || live.find((s) => s.id === SJC) || live[0];
  const origin = !site || site.id === SJC ? `https://${SJC_HOST}` : publicBaseFor(site).origin;
  return (
    <LinksManager
      title={title}
      siteId={site?.id || SJC}
      origin={origin}
      sites={live.map((s) => ({ id: s.id, name: s.business?.name?.trim() || s.name }))}
    />
  );
}
