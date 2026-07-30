import { notFound } from "next/navigation";
import { resolvePage, metadataFor, SitePageBody } from "@/lib/publicSitePage";

// A deeper page of a client's website: /lucky-dog-wash-house/services.
//
// This is what makes the 3–5 page product possible — before it, a client site could only ever be
// a single page, because a page was the biggest thing the builder knew about.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const r = await resolvePage(slug, page);
  return r ? metadataFor(r, `/${slug}/${page}`) : {};
}

export default async function ClientSubPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const r = await resolvePage(slug, page);
  if (!r) notFound();
  return <SitePageBody data={r.data} />;
}
