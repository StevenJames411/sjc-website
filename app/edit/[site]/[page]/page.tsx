import { notFound, redirect } from "next/navigation";
import PuckEditor from "@/components/puck/PuckEditor";
import { readPages, findPageMeta } from "@/lib/pageRegistry";
import { findSite } from "@/lib/sites";

// The builder for one page of one website: /edit/<site>/<page>.
//
// The page list handed to the editor is scoped to THIS site, which is what stops one client's
// pages from appearing while another's is open.
export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ site: string; page: string }>;
}) {
  const { site: siteId, page } = await params;

  const site = await findSite(siteId);
  if (!site) notFound();

  const pages = await readPages(siteId);
  const entry = await findPageMeta(page, siteId);

  // A brand-new website has no pages until its template lands or its first page is made. Rather
  // than 404 on the link the gallery just sent you to, fall through to whatever it does have.
  if (!entry) {
    if (pages.length) redirect(`/edit/${siteId}/${pages[0].slug}`);
    notFound();
  }

  return (
    <PuckEditor
      siteId={siteId}
      siteName={site.name}
      page={entry.slug}
      title={entry.title}
      pages={pages}
    />
  );
}
