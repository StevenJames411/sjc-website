import { redirect, notFound } from "next/navigation";
import { readPages } from "@/lib/pageRegistry";
import { findSite } from "@/lib/sites";
import { SJC } from "@/lib/siteKeys";

// One segment under /edit is ambiguous, and deliberately so — it has to serve two eras:
//
//   /edit/lucky-dog-wash-house  → a WEBSITE (open its first page)
//   /edit/home                  → an old single-site link, from back when a page was the biggest
//                                 thing that existed. Every bookmark, and the "✎ Edit this page"
//                                 button on the live site, still points at these.
//
// Next.js won't allow two different dynamic names at the same position, so this one route
// disambiguates instead of there being a separate legacy folder.
export const dynamic = "force-dynamic";

export default async function EditSiteRoot({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;

  const known = await findSite(site);
  if (known) {
    const pages = await readPages(site);
    redirect(`/edit/${site}/${pages[0]?.slug || "home"}`);
  }

  // Not a website — treat it as an SJC page slug, which is what it used to mean.
  const sjcPages = await readPages(SJC);
  if (sjcPages.some((p) => p.slug === site)) redirect(`/edit/${SJC}/${site}`);

  notFound();
}
