import { notFound, redirect } from "next/navigation";
import PuckEditor from "@/components/puck/PuckEditor";
import { readPages, findPageMeta } from "@/lib/pageRegistry";
import { findSite } from "@/lib/sites";
import { readDesignCssDraft, readDesignCss } from "@/lib/puckContent";
import { SiteProvider } from "@/components/blocks/SiteContext";

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
  //
  // ⚠️ AND A SIBLING'S SHEET IF THIS PAGE HAS NONE. A page ADDED to an imported design was never
  // itself imported, so it has no compiled stylesheet — and the header and footer are sections of
  // that design. Without this the editor rendered the chrome completely unstyled (a footer whose
  // columns collapsed to one word per line) while the live page, which already falls back, looked
  // correct. The editor and the public page disagreeing is exactly what the note above is about.
  //
  // Deliberately at the CALL SITE, not inside readDesignCssDraft: the publish route uses that
  // function to snapshot the draft sheet, and giving IT a fallback would bake a sibling's CSS into
  // this page's own published key, where it would then go stale the next time the design changed.
  const designCss =
    (await readDesignCssDraft(entry.slug, siteId)) || (await readDesignCss(entry.slug, siteId));

  return (
    <>
      {designCss ? (
        <style id="design-css" dangerouslySetInnerHTML={{ __html: designCss }} />
      ) : null}
      {/* ⚠️ THE BUILDER GETS THE SAME BUSINESS FACTS THE PUBLIC PAGE DOES.
          Without this the canvas rendered a literal `{{business.phone}}` in the nav — the public
          page wraps in SiteProvider and resolves it, the builder never did. Harmless on the live
          site and alarming in the one place Steven actually looks at the page, which is the worst
          combination: it reads as a leak that isn't there, and it hides a real one if it ever is.
          Same provider, same props as lib/publicSitePage, so the two can't drift. */}
      <SiteProvider siteId={siteId} business={site.business}>
        <PuckEditor
          siteId={siteId}
          siteName={site.name}
          page={entry.slug}
          title={entry.title}
          pages={pages}
          // Decides whether the toolbar's live link points at the studio's demo address or at the
          // client's own domain. Same input the server uses to decide what to serve.
          siteDomain={site.domain}
        />
      </SiteProvider>
    </>
  );
}
