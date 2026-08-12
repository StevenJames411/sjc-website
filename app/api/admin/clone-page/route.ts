// CLONE A PAGE FROM ONE SITE TO ANOTHER — content AND its compiled stylesheet.
//
//   POST /api/admin/clone-page { fromSite, fromPage, toSite, toPage, publish? }
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// Steven, looking at a page I had composed out of generic blocks: *"this is the ugliest video
// sales letter page I've ever put together, everything's flat… why can't we clone Steven James'
// design in our own library and then change all the shit we want?"*
//
// He is right, and it is cheaper than buying another design. A bought design already lives in his
// library as `DesignSection` blocks; the look he wants is a page he already owns. Composed blocks
// give you clean; an imported design gives you gravitas, and no amount of section-background
// tuning closes that gap.
//
// ⛔ THE STYLESHEET USED TO BE THE WHOLE POINT OF THIS ROUTE. As of 2026-08-12 it is not its
// problem at all. A design's CSS used to live under a per-page key (`designCss(page, pub)`), so
// copying content alone put the page live with no stylesheet — not "a bit plain" but wreckage, with
// inline styles surviving and layout gone. This route existed to copy BOTH or copy nothing.
//
// Sheets are now global, immutable and content-addressed, and the BLOCKS carry the id, so a clone
// references the same sheet the moment its content lands. What remains here is the page-registry
// trap below, which is still real.
//
// ⚠️ It writes the DRAFT by default. Publishing is a separate, deliberate act — and the publish
// route is what carries the stylesheet across to the -pub key.
import { readPuckDraft, readPuckPublished, sheetIdsIn, puckKey } from "@/lib/puckContent";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { readPages, createPage } from "@/lib/pageRegistry";
import { findSite } from "@/lib/sites";
import { scrubForTransfer, sameBusiness } from "@/lib/transferScrub";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const str = (k: string) => String(body[k] ?? "").trim();
  const fromSite = str("fromSite");
  const fromPage = str("fromPage") || "home";
  const toSite = str("toSite");
  const toPage = str("toPage") || fromPage;

  if (!fromSite || !toSite) {
    return Response.json({ ok: false, error: "fromSite and toSite are required" }, { status: 400 });
  }
  if (fromSite === toSite && fromPage === toPage) {
    return Response.json({ ok: false, error: "source and destination are the same page" }, { status: 400 });
  }

  // Prefer the PUBLISHED source: that is the version he is looking at and asking for. Fall back to
  // the draft so a page that was never published can still be used as a starting point.
  const data = (await readPuckPublished(fromPage, fromSite)) || (await readPuckDraft(fromPage, fromSite));
  if (!data || !Array.isArray((data as { content?: unknown[] }).content)) {
    return Response.json({ ok: false, error: `no content at ${fromSite}/${fromPage}` }, { status: 404 });
  }

  // ⚠️ THE STYLESHEET IS NO LONGER COPIED, BECAUSE IT NO LONGER HAS TO BE (2026-08-12). It used to
  // live in a per-page key that this route existed to carry — "or it copies nothing". Sheets are
  // now global and immutable, and the blocks name theirs, so a clone references the same sheet the
  // source did the instant its content lands. Reported so a clone that came out unstyled says which
  // sheet it wanted rather than looking like a rendering bug.
  const sheets = sheetIdsIn(data);

  // ⚠️ THE PAGE HAS TO EXIST IN THE REGISTRY OR THE SITE 404s. Writing content for an unregistered
  // slug returns ok, publishes ok, and serves nothing — the trap this route was written right
  // after hitting.
  const pages = await readPages(toSite);
  let slug = toPage;
  if (!pages.some((p) => p.slug === toPage)) {
    // ⚠️ createPage(title, siteId) — TITLE FIRST. Both are strings, so getting this backwards
    // typechecks cleanly and creates a page named after the site, in a site named after the page.
    const title = toPage.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const made = await createPage(title, toSite);
    if (!made.ok || !made.slug) {
      return Response.json({ ok: false, error: made.error || "could not create the destination page" }, { status: 400 });
    }
    slug = made.slug;
  }

  // Strip the published marker: this is a DRAFT until somebody publishes it on purpose.
  const stripped = { ...(data as Record<string, unknown>) };
  delete stripped._pub;

  // ⛔ AND TAKE THE SOURCE BUSINESS OUT OF IT — WHEN THE BUSINESS ACTUALLY CHANGES. This route
  // scrubbed NOTHING: it wrote the source page verbatim into the destination, so the previous
  // owner's phone number, address, business name and photos all landed on another site, and the
  // response said `ok` with a block count. The worst of it is `links[].href` — a `tel:` carried
  // across means a visitor taps Call Now on one site and rings a different company.
  //
  // ⚠️ SKIPPED BETWEEN A BUSINESS'S OWN SITES. Steven runs several (sjc, sjc-2026,
  // steven-james-designs); blanking his own number while he moves a page between them would break
  // the page he is building and read as a bug in the clone. See sameBusiness().
  const src = await findSite(fromSite);
  const dst = await findSite(toSite);
  const crossBusiness = !!src && !!dst && !sameBusiness(src, dst);
  const { value: clean, report: scrubbed } =
    src && crossBusiness ? scrubForTransfer(stripped, src) : { value: stripped, report: null };

  const store = createKvStore(getClient(), puckKey(slug, false, toSite));
  const wrote = await store.writeResult(clean as Record<string, unknown>);
  if (!wrote.ok) {
    return Response.json({ ok: false, error: wrote.reason || "content write refused" }, { status: 409 });
  }

  return Response.json({
    ok: true,
    slug,
    blocks: ((clean as { content?: unknown[] }).content || []).length,
    scrubbed,
    // Which sheets this page now references. Global and immutable, so nothing was copied — but a
    // page that renders unstyled should be able to say WHICH sheet it was looking for.
    sheets,
    // Say it plainly: nothing is live yet.
    note: "Draft only. Publish it when you're happy.",
  });
}
