// Put a WORKING COPY of a page's questions into the form library. OWNER ONLY (/api/admin).
//
//   GET  ?scan=1                        -> every page whose questions aren't in the library yet
//   GET  ?site=<id>&page=<slug>         -> exactly what would be copied, changes nothing
//   POST { site, page, name }           -> create the library copy
//
// ── IT DOES NOT TOUCH THE PAGE ───────────────────────────────────────────────────────────────
// /apply, /websites and the Designs contact box already work. Steven, 2026-08-06: *"we have a
// working copy on the websites, so put a working copy in the library. Do you really have to
// migrate them?"* No. Nothing here writes page data, repoints a block, or needs a republish —
// the live pages keep collecting exactly as they do now. The only thing that changes is that his
// own forms are finally IN his own library, where he went looking for them.
//
// ⚠️ THE KEYS ARE COPIED, NOT INVENTED. Each question carries the spreadsheet column its answers
// are already filed under, read off the page rather than retyped, so the library copy is a true
// copy — and a form cloned from it later starts with the same columns.
import { readPuckDraft } from "@/lib/puckContent";
import { SJC } from "@/lib/siteKeys";
import { createForm, findForm, readForms } from "@/lib/forms";
import { findQuestions } from "@/lib/formAdopt";

export const dynamic = "force-dynamic";
// The scan reads every page of every website — same budget as /api/forms/usage, which walks the
// same ground for the same reason.
export const maxDuration = 120;

const arg = (url: URL, k: string, dflt = "") => (url.searchParams.get(k) || dflt).trim();

/** The set of question keys a form holds, as one comparable string. */
const shapeOf = (keys: string[]) => keys.slice().sort().join("|");

async function look(site: string, page: string) {
  const data = await readPuckDraft(page, site);
  if (!data) return { data: null, found: [] };
  return { data, found: findQuestions(data) };
}

/**
 * EVERY PAGE WHOSE QUESTIONS AREN'T IN THE LIBRARY YET.
 *
 * This is the screen version of "there are four form engines". Steven shouldn't have to know
 * which pages those are or go looking — the machine already knows, so it says so.
 *
 * "Already in the library" is decided by the QUESTION KEYS matching a form that's in there, not
 * by a pointer: these pages are never repointed, so a pointer would stay empty forever and the
 * list would keep nagging about work that's done.
 */
async function scan() {
  const { readSites } = await import("@/lib/sites");
  const { readPages } = await import("@/lib/pageRegistry");

  // shape -> which library form has it. A Set only answered "is it in there"; the library screen
  // also needs to know WHICH form, so a copied form can say where its questions came from instead
  // of claiming it isn't used anywhere.
  const byShape = new Map(
    (await readForms()).map((f) => [shapeOf(f.fields.map((x) => x.fieldId)), f.id])
  );

  const rows: {
    siteId: string;
    siteName: string;
    page: string;
    title: string;
    questions: number;
    from: string[];
    inLibrary: boolean;
    /** The library form holding a copy of these questions, when there is one. */
    matchedFormId: string | null;
  }[] = [];

  for (const s of await readSites()) {
    for (const p of await readPages(s.id)) {
      const data = await readPuckDraft(p.slug, s.id);
      if (!data) continue;
      const found = findQuestions(data);
      if (!found.length) continue;
      const keys = found.flatMap((f) => f.fields.map((x) => x.fieldId));
      const matchedFormId = byShape.get(shapeOf(keys)) || null;
      rows.push({
        siteId: s.id,
        siteName: s.name,
        page: p.slug,
        title: p.title,
        questions: keys.length,
        from: [...new Set(found.map((f) => f.from))],
        inLibrary: Boolean(matchedFormId),
        matchedFormId,
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
      // Split rather than one mixed list: "not in the library" is a to-do and "already there" is
      // reassurance, and together they read as neither.
      notInTheLibrary: rows.filter((r) => !r.inLibrary),
      alreadyInTheLibrary: rows.filter((r) => r.inLibrary),
    });
  }

  const site = arg(url, "site", SJC) || SJC;
  const page = arg(url, "page");
  if (!page) return Response.json({ ok: false, error: "page required" }, { status: 400 });

  const { data, found } = await look(site, page);
  if (!data) return Response.json({ ok: false, error: `no page '${page}' on '${site}'` }, { status: 404 });

  return Response.json({
    ok: true,
    site,
    page,
    found: found.map((f) => ({
      from: f.from,
      where: f.where,
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
  if (!data) return Response.json({ ok: false, error: `no page '${page}' on '${site}'` }, { status: 404 });

  // Every question on the page, in the order it appears. Flattened deliberately: a page with a
  // lead form and a design contact box is still one form's worth of questions for that page.
  const fields = found.flatMap((f) => f.fields);
  if (!fields.length) {
    return Response.json({ ok: false, error: `no questions found on '${page}'` }, { status: 404 });
  }

  // ⚠️ A DUPLICATE KEY WOULD BE RE-MINTED by normalizeFields, and the copy would stop being a
  // copy. Refuse instead — two questions filing into one column is something to look at.
  const keys = fields.map((f) => f.fieldId);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length) {
    return Response.json(
      { ok: false, error: `two questions on that page share the key '${dupes[0]}'` },
      { status: 409 }
    );
  }

  if ((await readForms()).some((f) => shapeOf(f.fields.map((x) => x.fieldId)) === shapeOf(keys))) {
    return Response.json(
      { ok: false, error: `those questions are already in the library — nothing to copy.` },
      { status: 409 }
    );
  }

  const made = await createForm({ name, fields });
  if (!made.ok || !made.id) {
    return Response.json({ ok: false, error: made.error || "couldn't create the form" }, { status: 400 });
  }

  // Read it back rather than trusting the write. A key that got re-minted means the library copy
  // has different columns from the page it was copied from — which makes it a lookalike, not a
  // copy, and that has to be said out loud rather than discovered later.
  const saved = await findForm(made.id);
  const moved = (saved?.fields || [])
    .map((f, i) => (f.fieldId === keys[i] ? null : `${keys[i]} -> ${f.fieldId}`))
    .filter(Boolean);

  return Response.json({
    ok: true,
    formId: made.id,
    page,
    site,
    questions: keys,
    /** Empty is the only good value. */
    keysThatDiffer: moved,
    note: "The page is untouched and still collecting exactly as before — this is a copy in your library.",
  });
}
