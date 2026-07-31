import { notFound } from "next/navigation";
import { resolvePage, metadataFor, SitePageBody, SJC } from "@/lib/publicSitePage";

// A single public segment now means one of two things, checked in this order:
//
//   1. a WEBSITE          /lucky-dog-wash-house  -> that site's home page
//   2. an SJC page        /some-page             -> a page made in SJC's own builder
//
// Website wins, because a client's site is the thing whose URL gets texted to a customer.
// Every hardcoded route (app/about, app/websites, …) still takes precedence over both.
export const dynamic = "force-dynamic";

// homeFallback: a website serves its FIRST page at its own address, whatever that page is called.
async function find(slug: string) {
  return (await resolvePage(slug, "home", true)) || (await resolvePage(SJC, slug));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await find(slug);
  return r ? metadataFor(r, `/${slug}`) : {};
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await find(slug);
  if (!r) notFound();
  return <SitePageBody data={r.data} siteId={r.site.id} page={r.slug} />;
}
