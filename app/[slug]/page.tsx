import { notFound, permanentRedirect } from "next/navigation";
import { resolvePage, metadataFor, SitePageBody, SJC } from "@/lib/publicSitePage";
import { resolveHost, publicUrlFor } from "@/lib/host";
import { findSite } from "@/lib/sites";

// ONE PUBLIC SEGMENT. What it means now depends entirely on which domain was asked for:
//
//   stevenjamesdesigns.com/bellas-grooming   a demo — that site's home page
//   bellasgrooming.com/services              a page on that customer's own site
//   stevenjamesconsulting.com/about          one of SJC's own pages
//
// ── WHY THIS USED TO BE AMBIGUOUS, AND ISN'T NOW ──────────────────────────────────────────────
// On SJC's domain this segment meant TWO things — a client website or an SJC page — resolved by
// trying one and falling back to the other. Two hand-maintained lists of forbidden words
// (RESERVED_SITE_IDS, ROUTE_FOLDERS) existed only to stop the two namespaces colliding, and they
// were enforced at creation time, so a collision introduced any other way went unnoticed.
//
// Client sites now live on their own domain or on the studio's, so on SJC's domain this segment
// means exactly one thing: an SJC page. The ambiguity is gone, not managed.
export const dynamic = "force-dynamic";

async function find(slug: string) {
  const h = await resolveHost();

  // The studio's domain: one segment is a SITE, and it serves whatever its first page is called.
  if (h.kind === "studio") return resolvePage(slug, "home", true);

  // A customer's own domain: one segment is a PAGE on their site.
  if (h.kind === "client") return resolvePage(h.site.id, slug);

  return resolvePage(SJC, slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = await resolveHost();
  const r = await find(slug);
  if (!r) return {};
  // On the studio this segment is a whole SITE, so its canonical is that site's bare address. On
  // a customer's domain it's a PAGE of theirs, so it hangs off their root.
  const canonical =
    h.kind === "studio"
      ? publicUrlFor(r.site)
      : h.kind === "client"
        ? publicUrlFor(r.site, slug, false)
        : undefined;
  return metadataFor(r, `/${slug}`, canonical);
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = await resolveHost();

  // OLD DEMO LINKS STILL LAND. Before the studio had its own domain, a demo was texted to a
  // prospect as stevenjamesconsulting.com/<site>. Those links are out in the world, so on SJC's
  // domain a slug that names a real site redirects to wherever that site lives now, rather than
  // 404ing at an address someone was told to visit.
  if (h.kind === "sjc") {
    const site = await findSite(slug);
    if (site && site.id !== SJC) permanentRedirect(publicUrlFor(site));
  }

  const r = await find(slug);
  if (!r) notFound();
  return <SitePageBody data={r.data} siteId={r.site.id} page={r.slug} />;
}
