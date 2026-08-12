import { notFound, permanentRedirect } from "next/navigation";
import { resolvePage, metadataFor, SitePageBody, SJC } from "@/lib/publicSitePage";
import { resolveHost, publicUrlFor } from "@/lib/host";
import { findSite } from "@/lib/sites";

// A deeper page of a client's website.
//
//   stevenjamesdesigns.com/bellas-grooming/services   a demo's sub-page
//   stevenjamesconsulting.com/bellas-grooming/services  the old address — redirected
//
// This is what makes the 3–5 page product possible — before it, a client site could only ever be
// a single page, because a page was the biggest thing the builder knew about.
//
// On a CUSTOMER's own domain this depth doesn't exist: their site is served at their root, so
// /services is one segment and handled by app/[slug]. Two segments there is a genuine 404.
export const dynamic = "force-dynamic";

async function find(slug: string, page: string) {
  const h = await resolveHost();
  // A demo address for a site that has bought its own domain: dead, not forwarded.
  if (h.kind === "gone") notFound();
  if (h.kind === "client") return null;
  return resolvePage(slug, page);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const r = await find(slug, page);
  if (!r) return {};
  return metadataFor(r, `/${slug}/${page}`, publicUrlFor(r.site, page, false));
}

export default async function ClientSubPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const h = await resolveHost();
  // A demo address for a site that has bought its own domain: dead, not forwarded.
  if (h.kind === "gone") notFound();

  // Old sub-page links, same reasoning as app/[slug]: the address was texted to someone.
  if (h.kind === "sjc") {
    const site = await findSite(slug);
    // SJC is excluded: its own pages live one segment up, and redirecting /sjc/<page> to /<page>
    // would send anyone who typed it somewhere it never asked to go.
    if (site && site.id !== SJC) permanentRedirect(publicUrlFor(site, page, false));
  }

  const r = await find(slug, page);
  if (!r) notFound();
  return <SitePageBody data={r.data} siteId={r.site.id} page={r.slug} />;
}
