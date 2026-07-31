import { notFound, redirect } from "next/navigation";
import PuckEditor from "@/components/puck/PuckEditor";
import { readPages, findPageMeta } from "@/lib/pageRegistry";
import { findSite } from "@/lib/sites";
import { readDesignCssDraft } from "@/lib/puckContent";

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

  // ⚠️ THE CANVAS NEEDS THE DESIGN'S STYLESHEET TOO.
  //
  // A page imported from a bought design keeps its compiled CSS in its own key, and only the
  // PUBLIC render (lib/publicSitePage) was emitting it. The builder canvas renders Puck directly
  // and never went near that file — so an imported design appeared destroyed in the one place
  // you actually work on it, while `?preview=1` looked perfect. Two views of the same page
  // disagreeing is worse than either being wrong.
  //
  // The DRAFT copy, because the editor edits the draft. Every rule is scoped under .sjc-design,
  // which now rides on the DesignSection block itself — so this can style the imported content
  // and can never reach Puck's own buttons and panels.
  const designCss = await readDesignCssDraft(entry.slug, siteId);

  return (
    <>
      {designCss ? (
        <style id="design-css" dangerouslySetInnerHTML={{ __html: designCss }} />
      ) : null}
    <PuckEditor
      siteId={siteId}
      siteName={site.name}
      page={entry.slug}
      title={entry.title}
      pages={pages}
    />
    </>
  );
}
