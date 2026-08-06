// Move one page's questions into the form library. OWNER ONLY (middleware guards /api/admin).
//
//   GET  /api/admin/forms/adopt?site=<id>&page=<slug>            -> what's there, changes nothing
//   POST /api/admin/forms/adopt  { site, page, name }            -> create the form + point at it
//
// ── READ IT FIRST, THEN RUN IT ───────────────────────────────────────────────────────────────
// GET is a dry run and exists so the keys can be READ before anything is written. These are live
// spreadsheet columns; the whole reason this is a tool rather than a hand-written list is that a
// key must never be retyped. Look at the GET, then POST.
//
// ⚠️ IT WRITES THE DRAFT ONLY. The live page keeps serving what it serves until Steven presses
// Publish in the builder — so the receipt below is a "look at it in the editor", never a "it's
// live". A script must not change a live funnel on its own.
import { readPuckDraft, puckKey } from "@/lib/puckContent";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { SJC } from "@/lib/siteKeys";
import { createForm, findForm } from "@/lib/forms";
import { findQuestions, pointAtForm } from "@/lib/formAdopt";

export const dynamic = "force-dynamic";
// The scan reads every page of every website. Same budget as /api/forms/usage, which walks the
// same ground for the same reason.
export const maxDuration = 120;

const arg = (url: URL, k: string, dflt = "") => (url.searchParams.get(k) || dflt).trim();

async function look(site: string, page: string) {
  const data = await readPuckDraft(page, site);
  if (!data) return { data: null, found: [] };
  return { data, found: findQuestions(data) };
}

const pointerOf = (data: unknown) =>
  String((data as { root?: { props?: { formId?: string } } })?.root?.props?.formId || "").trim();

/**
 * EVERY PAGE STILL HOLDING ITS OWN QUESTIONS — the consolidation list, in one call.
 *
 * This is the screen version of "there are four form engines". Steven should not have to know
 * which pages those are, or go looking; the machine already knows, so it says so.
 */
async function scan() {
  const { readSites } = await import("@/lib/sites");
  const { readPages } = await import("@/lib/pageRegistry");

  const rows: {
    siteId: string;
    siteName: string;
    page: string;
    title: string;
    questions: number;
    from: string[];
    pointsAt: string | null;
  }[] = [];

  for (const s of await readSites()) {
    for (const p of await readPages(s.id)) {
      const data = await readPuckDraft(p.slug, s.id);
      if (!data) continue;
      const found = findQuestions(data);
      if (!found.length) continue;
      const pointsAt = pointerOf(data) || found.find((f) => f.existingFormId)?.existingFormId || null;
      rows.push({
        siteId: s.id,
        siteName: s.name,
        page: p.slug,
        title: p.title,
        questions: found.reduce((n, f) => n + f.fields.length, 0),
        from: [...new Set(found.map((f) => f.from))],
        pointsAt,
      });
    }
  }
  return rows;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  if (url.searchParams.get("scan") === "1") {
    const rows = await scan();
    return Response.json({
      ok: true,
      // Split rather than returned as one list: "still on its own" is a to-do, "already in the
      // library" is reassurance, and one mixed list of both reads as neither.
      onTheirOwn: rows.filter((r) => !r.pointsAt),
      alreadyInTheLibrary: rows.filter((r) => r.pointsAt),
    });
  }

  const site = arg(url, "site", SJC) || SJC;
  const page = arg(url, "page");
  if (!page) return Response.json({ ok: false, error: "page required" }, { status: 400 });

  const { data, found } = await look(site, page);
  if (!data) return Response.json({ ok: false, error: `no draft for '${page}' on '${site}'` }, { status: 404 });

  return Response.json({
    ok: true,
    site,
    page,
    // Already pointing somewhere? Then this page is done and adopting again would mint a
    // duplicate form nobody asked for.
    alreadyPointsAt: String((data as { root?: { props?: { formId?: string } } })?.root?.props?.formId || "") || null,
    found: found.map((f) => ({
      from: f.from,
      where: f.where,
      pointsAt: f.existingFormId || null,
      questions: f.fields.map((x) => ({ key: x.fieldId, label: x.label, type: x.type, step: x.step || null })),
    })),
  });
}

export async function POST(req: Request) {
  let body: { site?: string; page?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  const page = String(body?.page || "").trim();
  const name = String(body?.name || "").trim();
  if (!page) return Response.json({ ok: false, error: "page required" }, { status: 400 });
  if (!name) return Response.json({ ok: false, error: "a form name is required" }, { status: 400 });

  const { data, found } = await look(site, page);
  if (!data) return Response.json({ ok: false, error: `no draft for '${page}' on '${site}'` }, { status: 404 });

  const alreadyRoot = String((data as { root?: { props?: { formId?: string } } })?.root?.props?.formId || "");
  const alreadyBlock = found.find((f) => f.existingFormId)?.existingFormId || "";
  const already = alreadyRoot || alreadyBlock;
  if (already) {
    // Not an error worth a 500, but definitely not a silent second copy either.
    return Response.json(
      { ok: false, error: `'${page}' already points at the form '${already}'. Nothing to adopt.` },
      { status: 409 }
    );
  }

  // Every question found on the page, in the order it appears. Flattened deliberately: a page
  // with one lead form and a design contact box is still ONE form for that page.
  const fields = found.flatMap((f) => f.fields);
  if (!fields.length) {
    return Response.json({ ok: false, error: `no questions found on '${page}'` }, { status: 404 });
  }

  // ⚠️ A DUPLICATE KEY WOULD BE RE-MINTED BY normalizeFields, which is exactly the silent column
  // move this whole tool exists to prevent. Refuse instead — a page with two questions filing
  // into one column is a problem to look at, not to paper over.
  const keys = fields.map((f) => f.fieldId);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length) {
    return Response.json(
      { ok: false, error: `two questions share the key '${dupes[0]}' — fix that on the page first` },
      { status: 409 }
    );
  }

  const made = await createForm({ name, fields });
  if (!made.ok || !made.id) {
    return Response.json({ ok: false, error: made.error || "couldn't create the form" }, { status: 400 });
  }

  // Read it back rather than trusting the write: if a key WAS re-minted despite the check above,
  // the receipt has to say so loudly, before anyone publishes a page whose columns just moved.
  const saved = await findForm(made.id);
  const moved = (saved?.fields || [])
    .map((f, i) => (f.fieldId === keys[i] ? null : `${keys[i]} -> ${f.fieldId}`))
    .filter(Boolean);

  const { data: next, pointed } = pointAtForm(data, made.id);
  const store = createKvStore(getClient(), puckKey(page, false, site));
  const write = await store.writeResult(next);
  if (!write.ok) {
    return Response.json(
      { ok: false, error: `form '${made.id}' was created but the page could not be pointed at it: ${write.reason}` },
      { status: 409 }
    );
  }

  return Response.json({
    ok: true,
    formId: made.id,
    page,
    site,
    pointed,
    questions: keys,
    // Empty is the only acceptable value. Anything here means a live column moved.
    keysThatMoved: moved,
    next: `Open /edit/${site === SJC ? "" : `${site}/`}${page} and press Publish when it looks right — the live page is unchanged until you do.`,
  });
}
