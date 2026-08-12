import { notFound, redirect } from "next/navigation";
import PuckEditor from "@/components/puck/PuckEditor";
import { readPages, findPageMeta } from "@/lib/pageRegistry";
import { findSite } from "@/lib/sites";
import { reachability } from "@/lib/sitesShared";
import { readPuckDraft, sheetsFor } from "@/lib/puckContent";
import { SiteProvider } from "@/components/blocks/SiteContext";
import { isChrome } from "@/lib/puckPages";
import { defaultChrome } from "@/lib/siteChrome";
import { SJC } from "@/lib/siteKeys";

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
  // ⚠️ THE CHROME'S SHEETS TOO, AND NOW FOR AN HONEST REASON. A page ADDED to an imported design
  // was never itself imported, so it has no design blocks of its own — but the canvas still renders
  // the header and footer, which are sections of that design. This used to be solved by falling
  // back to ANY sibling page's stylesheet, which happened to work while a site held one design and
  // silently served the wrong one as soon as it held two.
  //
  // Now each document names its own sheets, so the canvas simply emits the union of what the page
  // and the two chrome documents reference. Nothing is guessed, and a page with no design blocks
  // and plain chrome emits nothing.
  const chrome = await Promise.all(
    ["nav", "footer"].map((slug) => readPuckDraft(slug, siteId))
  );
  const designCss = await sheetsFor([await readPuckDraft(entry.slug, siteId), ...chrome]);

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
          businessName={site.business?.name || ""}
          // Who can reach this site — so the editor can stop calling a page "live" on a site
          // nobody can open. Derived server-side from the one helper every surface uses.
          reach={reachability(site)}
          page={entry.slug}
          title={entry.title}
          pages={pages}
          // ⛔ WHAT AN EMPTY HEADER OPENS TO, AND WHY IT CAN'T BE `seedFor`. The editor's own
          // fallback is SJC's seed, built from NAV_DEFAULTS — brandName "Steven James Consulting",
          // SJC's phone, SJC's logo. A client's untouched nav would open in the builder wearing
          // Steven's brand while the live page correctly showed theirs, and the builder disagreeing
          // with the visitor is the worst of the two failures: it reads as a leak that isn't there
          // and hides a real one if it ever is.
          //
          // Same lib/siteChrome the public render uses, so "default" means one thing. Non-chrome
          // pages pass null and keep the normal starter seed.
          fallbackData={
            siteId !== SJC && isChrome(entry.slug)
              ? defaultChrome(site, pages)[entry.slug === "nav" ? "nav" : "footer"]
              : null
          }
          // Decides whether the toolbar's live link points at the studio's demo address or at the
          // client's own domain. Same input the server uses to decide what to serve.
          siteDomain={site.domain}
        />
      </SiteProvider>
    </>
  );
}
