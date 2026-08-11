// SJC's own hand-written pages must only ever answer on SJC's own domain.
//
// ── THE ARCHITECTURAL FLAW THIS CLOSES ────────────────────────────────────────────────────────
// This deployment serves EVERY site: SJC's, the studio's, every demo, every customer domain. Most
// pages come from the database through app/[slug], keyed by host. A handful of SJC's own pages are
// hand-written React because they carry forms or custom layout.
//
// Next.js picks a static folder over the dynamic route BEFORE any host logic runs. So a file at
// app/apply/page.tsx answered for /apply on EVERY hostname — SJC's, a demo's, a customer's. The
// name was gone for all of them, and what they got instead was SJC's page. Measured on 2026-08-11:
// every client demo served "Steven James Consulting — Your AI Growth Partner" at its own /about.
//
// Deleting the page is the fix where the page is redundant (about/faqs/podcast were pure
// duplicates of the catch-all and were deleted). Where the page is real, THIS is the fix: the
// route still exists, but it answers for SJC only. Every other host falls through to exactly what
// app/[slug] would have done, so the name behaves like any other name for every tenant.
//
// ⛔ NO NEW HAND-WRITTEN PAGE MAY SKIP THIS. A route folder without it silently takes its name away
// from every site on the platform, and nothing reports it — the page just works, for the wrong
// people. scripts/check-route-folders.mjs fails the build on any folder that isn't wired here.
import { notFound } from "next/navigation";
import { resolveHost, publicUrlFor } from "@/lib/host";
import { resolvePage, metadataFor, SitePageBody } from "@/lib/publicSitePage";

/** Resolve this slug the way app/[slug] would, for a host that isn't SJC. Null on SJC's own host. */
async function forTenant(slug: string) {
  const h = await resolveHost();
  if (h.kind === "sjc") return null;
  // Same two readings as the catch-all: on the studio a segment is a SITE, on a customer's own
  // domain it is a PAGE of theirs.
  const r =
    h.kind === "studio" ? await resolvePage(slug, "home", true) : await resolvePage(h.site.id, slug);
  return { h, r };
}

/**
 * Render the tenant's page for this slug, or null when the caller should render SJC's own page.
 *
 * A tenant with no page of that name gets notFound() — correct, and the whole point: it is THEIR
 * 404, not SJC's page wearing their domain.
 */
export async function tenantPage(slug: string) {
  const found = await forTenant(slug);
  if (!found) return null;
  if (!found.r) notFound();
  return <SitePageBody data={found.r.data} siteId={found.r.site.id} page={found.r.slug} />;
}

/** The matching metadata. Null when the caller should use SJC's own. */
export async function tenantPageMetadata(slug: string) {
  const found = await forTenant(slug);
  if (!found) return null;
  const { h, r } = found;
  if (!r) return {};
  const canonical =
    h.kind === "studio" ? publicUrlFor(r.site) : publicUrlFor(r.site, slug, false);
  return metadataFor(r, `/${slug}`, canonical);
}
