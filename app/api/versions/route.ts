// The published history of one page, and the way back to any of it.
//
// ── WHAT THIS IS FOR ─────────────────────────────────────────────────────────────────────────
// "If you completely crash a page on Monday, you could go back to Sunday." The append-only
// revisions have been written on every save since the Postgres migration; nothing ever read them
// back, so the safety net existed and was unreachable.
//
// ⚠️ THE HISTORY IS THE PUBLISHED KEY'S, NOT THE DRAFT'S. Autosave writes a revision every time
// typing pauses, so a draft's history is thousands of near-identical rows and answers no
// question. Publish writes the `-pub` key exactly once — one row per time a page was declared
// ready, which is the list a person can actually read.
//
// ⚠️ RESTORE LANDS IN THE DRAFT, NOT ON THE LIVE SITE. Two reasons. You get to look at the old
// version in the builder before any visitor does — restoring is a recovery from a mistake, and
// doing it blind onto the public site is how you make a second one. And it keeps the rule the
// rest of the system already follows: the live site changes when someone presses Publish, never
// as a side effect of something else.
//
// Nothing is ever deleted or overwritten in history: a restore is a normal draft write, so it
// becomes its own new revision and the version you restored FROM is still there.
//
//   GET  ?page=&site=            -> { ok, versions: [{ id, at, bytes }] }
//   POST { page, site, id }      -> { ok, restoredTo: "draft" }
import { listRevisions, readRevision, revisionColumns } from "@/lib/pgClient";
import { siteOr } from "@/lib/siteAccess";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient, backend } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";

const pubKeyFor = (page: string, site: string) => puckKey(page, true, site);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = (url.searchParams.get("page") || "").trim();
  // ⛔ SCOPED. The `|| SJC` fallback meant an omitted or unknown site landed on the flagship.
  const { site: __s, deny } = await siteOr((url.searchParams.get("site") || SJC).trim() || SJC, req);
  if (deny) return deny;
  const site = __s.id;
  if (!page) return Response.json({ ok: false, error: "which page?" }, { status: 400 });

  // Said out loud rather than returned as an empty list: "no versions yet" and "history isn't
  // available on this backend" look identical to a person, and one of them is a missing safety
  // net. The Redis fallback keeps no history at all.
  if (backend() !== "postgres") {
    return Response.json({
      ok: true,
      versions: [],
      unavailable: `Version history needs the database. This site is running on ${backend()}, which keeps none.`,
    });
  }

  // Diagnostic: the revisions table belongs to another repository, so what it looks like can't be
  // read out of this codebase. ?columns=1 answers that without a database console.
  if (url.searchParams.get("columns")) {
    return Response.json({ ok: true, columns: await revisionColumns() });
  }

  // ⚠️ THE REASON COMES BACK, it doesn't just go to a log. The first version of this route threw a
  // bare 500 because it guessed at column names in a table another repository owns — and from the
  // browser that is indistinguishable from "the feature is broken", with nothing to act on.
  try {
    return Response.json({ ok: true, versions: await listRevisions(pubKeyFor(page, site)) });
  } catch (e) {
    return Response.json(
      { ok: false, error: `Couldn't read this page's history: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let body: { page?: string; site?: string; id?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const page = String(body?.page || "").trim();
  // ⛔ SCOPED. The `|| SJC` fallback meant an omitted or unknown site landed on the flagship.
  const { site: __s, deny } = await siteOr(String(body?.site || SJC).trim() || SJC, req);
  if (deny) return deny;
  const site = __s.id;
  const id = Number(body?.id);
  if (!page || !Number.isFinite(id)) {
    return Response.json({ ok: false, error: "which page, which version?" }, { status: 400 });
  }

  const value = await readRevision(pubKeyFor(page, site), id);
  if (!value) {
    return Response.json({ ok: false, error: "That version isn't available for this page." }, { status: 404 });
  }

  // `_pub` is the marker that says "this is the published copy". It must not ride back into the
  // draft, or the draft starts claiming to be something it isn't.
  const { _pub, ...draft } = value as Record<string, unknown>;
  void _pub;

  const ok = await createKvStore(getClient(), puckKey(page, false, site)).write(draft);
  if (!ok) {
    return Response.json({ ok: false, error: "Couldn't write that version into the draft." }, { status: 500 });
  }
  return Response.json({ ok: true, restoredTo: "draft" });
}
