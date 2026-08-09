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
// ⛔ THE STYLESHEET IS THE WHOLE POINT, AND IT IS NOT IN THE PAGE DATA. A design page keeps its
// compiled CSS under a SEPARATE key (`siteKeys(site).designCss(page, pub)`). Copying only the
// content is the exact failure the publish route already documents: the page goes live with no
// stylesheet, and the result is not "a bit plain" — inline styles survive, layout doesn't, and
// the grid overlay loses `absolute inset-0` and paints the whole page in lines. So this copies
// BOTH, or it copies nothing.
//
// ⚠️ It writes the DRAFT by default. Publishing is a separate, deliberate act — and the publish
// route is what carries the stylesheet across to the -pub key.
import { readPuckDraft, readPuckPublished, readDesignCss, readDesignCssDraft, writeDesignCss, puckKey } from "@/lib/puckContent";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { readPages, createPage } from "@/lib/pageRegistry";

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

  const css = (await readDesignCss(fromPage, fromSite)) || (await readDesignCssDraft(fromPage, fromSite));

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
  const clean = { ...(data as Record<string, unknown>) };
  delete clean._pub;

  const store = createKvStore(getClient(), puckKey(slug, false, toSite));
  const wrote = await store.writeResult(clean);
  if (!wrote.ok) {
    return Response.json({ ok: false, error: wrote.reason || "content write refused" }, { status: 409 });
  }

  // ⛔ Both, or neither. A design page without its stylesheet is wreckage, not a plain page.
  let cssWritten = false;
  if (css) {
    cssWritten = await writeDesignCss(slug, css, false, toSite);
    if (!cssWritten) {
      return Response.json(
        { ok: false, error: "content copied but the stylesheet write failed — publish would render wreckage", slug },
        { status: 502 }
      );
    }
  }

  return Response.json({
    ok: true,
    slug,
    blocks: ((clean as { content?: unknown[] }).content || []).length,
    cssBytes: css.length,
    cssWritten,
    // Say it plainly: nothing is live yet.
    note: "Draft only. Publish it when you're happy — publishing is what carries the stylesheet live.",
  });
}
