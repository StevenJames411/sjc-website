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
import { readPuckDraft, readPuckPublished } from "@/lib/puckContent";
import { placePage } from "@/lib/placePage";

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
  // source did the instant its content lands. placePage reports which, so a clone that came out
  // unstyled can say what it was looking for rather than looking like a rendering bug.

  // ⚠️ ONE IMPLEMENTATION, SHARED WITH THE PAGE LIBRARY. Registering the page before writing its
  // content, stripping `_pub`, scrubbing when the business changes, and refusing to overwrite by
  // accident are four things every caller has to get right — so they live in lib/placePage rather
  // than being got right twice.
  //
  // `overwrite` is passed EXPLICITLY: this route's long-standing behaviour is to write over the
  // destination, and the helper has no default, so the destructive path is something a caller types.
  const res = await placePage({
    data: data as Record<string, unknown>,
    fromSite,
    toSite,
    toPage,
    onExisting: "overwrite",
  });
  if (!res.ok) return Response.json({ ok: false, error: res.error }, { status: res.status });

  return Response.json({
    ok: true,
    slug: res.slug,
    blocks: res.blocks,
    scrubbed: res.scrubbed,
    // Which sheets this page now references. Global and immutable, so nothing was copied — but a
    // page that renders unstyled should be able to say WHICH sheet it was looking for.
    sheets: res.sheets,
    // Say it plainly: nothing is live yet.
    note: "Draft only. Publish it when you're happy.",
  });
}
