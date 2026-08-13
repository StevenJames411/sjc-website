// THE PAGE LIBRARY — keep a whole page, drop it onto any other website.
//
//   GET                                  -> { ok, pages: [{ id, name, from, savedAt, blocks }] }
//   GET  ?id=&full=1                     -> { ok, entry }            one entry's content
//   POST { name, site, page }            -> { ok, id, scrubbed }     save the page you're on
//   POST { id, toSite, toPage, name }    -> { ok, slug }             drop it onto a website
//   DELETE ?id=                          -> { ok }
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// Steven, 2026-08-12, looking at a page in one of his sites and wanting it in another: *"can I take
// the body from the Steven James design drafted website and use it in the Steven James Consulting
// studio… instead of manually copying everything over."*
//
// The section library already does this for one BAND. A page was the missing grain: the answer was
// `admin/clone-page`, which is API-only with no UI, so moving a page meant asking me to run a curl.
//
// ⚠️ SHARED ACROSS EVERY SITE, deliberately — same as the section library. A page proven on one
// build is available on the next. Which is exactly why the scrub below is not optional.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { readPuckDraft, readPuckPublished, sheetIdsIn } from "@/lib/puckContent";
import { scrubForTransfer, transferLeftovers } from "@/lib/transferScrub";
import { placePage } from "@/lib/placePage";
import { pageLibraryEntry, PAGE_LIBRARY_INDEX } from "@/lib/siteKeys";
import { siteOr, ownerOnly } from "@/lib/siteAccess";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type IndexRow = {
  id: string;
  name: string;
  /** Where it came from, for the picker: "Steven James Designs · home". */
  from: string;
  savedAt: string;
  blocks: number;
};

const index = () => createKvStore(getClient(), PAGE_LIBRARY_INDEX);
const readIndex = async (): Promise<IndexRow[]> =>
  ((await index().read<{ pages?: IndexRow[] }>()) || {}).pages || [];

/**
 * Two blocks sharing an id are ONE node to Puck, and the page renders the last one's content in
 * every slot. Dropped on save so the insert side is forced to mint fresh ones rather than inherit
 * a stale one — the same rule, and the same reason, as /api/sections.
 */
function dropBlockIds(node: unknown): void {
  if (Array.isArray(node)) return node.forEach(dropBlockIds);
  if (!node || typeof node !== "object") return;
  const n = node as { props?: Record<string, unknown>; content?: unknown; zones?: unknown };
  if (n.props && typeof n.props.id === "string") delete n.props.id;
  if (n.props) Object.values(n.props).forEach(dropBlockIds);
  if (n.content) dropBlockIds(n.content);
  if (n.zones) dropBlockIds(n.zones);
}

export async function GET(req: Request) {
  // ⛔ OWNER ONLY — one library shared by every website, so it has no site to scope to and its
  // listing names pages from other people's builds. Same call as /api/sections.
  const denied = await ownerOnly();
  if (denied) return denied;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  // One entry's full contents, asked for only at the moment it is being inserted. The list itself
  // deliberately carries none of it — see PAGE_LIBRARY_INDEX.
  if (id && url.searchParams.get("full")) {
    const entry = await createKvStore(getClient(), pageLibraryEntry(id)).read<unknown>();
    if (!entry) return Response.json({ ok: false, error: "no such page" }, { status: 404 });
    return Response.json({ ok: true, entry });
  }

  return Response.json({ ok: true, pages: await readIndex() });
}

export async function POST(req: Request) {
  let body: {
    name?: string;
    site?: string;
    page?: string;
    id?: string;
    toSite?: string;
    toPage?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // ── INSERT: drop a saved page onto a website ────────────────────────────────────────────────
  if (body?.id) {
    const toPage = String(body.toPage || "").trim();
    if (!body.toSite || !toPage) {
      return Response.json({ ok: false, error: "toSite and toPage are required" }, { status: 400 });
    }
    // ⛔ SCOPED — this drops a whole page onto the named website.
    const { site: __to, deny: __d } = await siteOr(String(body.toSite).trim(), req);
    if (__d) return __d;
    const toSite = __to.id;

    const stored = await createKvStore(getClient(), pageLibraryEntry(body.id)).read<{
      data?: Record<string, unknown>;
    }>();
    if (!stored?.data) return Response.json({ ok: false, error: "no such page" }, { status: 404 });

    // `fromSite: null` — a library entry was scrubbed on the way IN and has no source site to
    // compare against, so it passes through placePage untouched.
    //
    // ⛔ `onExisting: "refuse"`. A picker that silently overwrites the page you are standing on is
    // how you lose an afternoon; the caller renames instead.
    const res = await placePage({
      data: stored.data,
      fromSite: null,
      toSite,
      toPage,
      name: undefined,
      onExisting: "refuse",
    } as Parameters<typeof placePage>[0]);

    return res.ok
      ? Response.json({ ok: true, slug: res.slug, blocks: res.blocks, sheets: res.sheets })
      : Response.json({ ok: false, error: res.error }, { status: res.status });
  }

  // ── SAVE: keep the page you are on ──────────────────────────────────────────────────────────
  const name = String(body?.name || "").trim();
  const siteId = String(body?.site || "").trim();
  const page = String(body?.page || "").trim();
  if (!name) return Response.json({ ok: false, error: "Give it a name." }, { status: 400 });
  if (!siteId || !page) {
    return Response.json({ ok: false, error: "site and page are required" }, { status: 400 });
  }

  // ⛔ SCOPED — reading a page out of a site, and the entry then becomes visible to every build.
  const { site, deny: denySrc } = await siteOr(siteId, req);
  if (denySrc) return denySrc;

  // The published copy is what was signed off; fall back to the draft so a page never published can
  // still be saved.
  const data = (await readPuckPublished(page, siteId)) || (await readPuckDraft(page, siteId));
  if (!data) return Response.json({ ok: false, error: "That page has no saved content." }, { status: 404 });

  const copy = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
  delete copy._pub;

  // ⛔ THE STRICTEST FLOOR, WITH NO "SAME BUSINESS" EXEMPTION. clone-page can skip the scrub when
  // both sites belong to one business, because it knows the destination. A library entry has no
  // destination yet — it is saved once and may land anywhere — so the business it came from comes
  // out now, while there is still something to take it out of.
  const { value, report } = scrubForTransfer(copy, site);
  const clean = value as Record<string, unknown>;
  dropBlockIds(clean);

  // Refuse to store something still carrying a phone number or a click-to-call link. A library is
  // the single most likely place for one business's details to reach another's page, so this is
  // the one moment worth being loud about.
  const leftovers = transferLeftovers(clean);
  if (leftovers.length) {
    // ⚠️ SAY WHY IT COULD NOT SCRUB, NOT JUST THAT IT DIDN'T. The patterns are DERIVED from the
    // source site's own Website settings — that is what makes them work for the next business
    // without a code change. The flip side is that a site with an empty settings record gives the
    // scrub nothing to match, so a page full of literal phone numbers passes through untouched and
    // trips this check.
    //
    // "Not saved — it still contains a phone number" is true and useless. The fix is two steps and
    // they belong in the message, because the person reading it is standing in the editor.
    const b = site.business || ({} as typeof site.business);
    const blank = [
      !b.phone?.trim() && !b.phoneDisplay?.trim() ? "phone" : "",
      !b.email?.trim() ? "email" : "",
      !b.address?.trim() ? "address" : "",
    ].filter(Boolean);

    return Response.json(
      {
        ok: false,
        error:
          `Not saved — this page still has ${leftovers.join(" and ")} written into it, and a saved ` +
          `page can land on anyone's website.` +
          (blank.length
            ? ` I can't tell which are ${site.name}'s: its Website settings have no ${blank.join(", ")}. ` +
              `Fill those in, then run Tokenize on this page — that swaps the literals for ` +
              `{{business.*}} references, and the page becomes portable by construction.`
            : ` Run Tokenize on this page to swap the literals for {{business.*}} references.`),
        leftovers,
        settingsMissing: blank,
      },
      { status: 422 }
    );
  }

  // ⚠️ A MINTED ID, NOT A COUNTER. /api/sections uses `sec-${length + 1}-${slug}`, which collides
  // after any delete: save three, delete the middle, save a fourth with the same name and two
  // entries share an id — one fetch grabs the wrong one and one delete removes both.
  const id = crypto.randomUUID();
  const row: IndexRow = {
    id,
    name,
    from: `${site.business?.name || site.name} · ${page}`,
    savedAt: new Date().toISOString(),
    blocks: Array.isArray(clean.content) ? (clean.content as unknown[]).length : 0,
  };

  if (!(await createKvStore(getClient(), pageLibraryEntry(id)).write({ ...row, data: clean }))) {
    return Response.json({ ok: false, error: "Couldn't save that page." }, { status: 500 });
  }
  if (!(await index().write({ pages: [row, ...(await readIndex())] }))) {
    return Response.json({ ok: false, error: "Saved the page but not the list." }, { status: 500 });
  }

  return Response.json({ ok: true, id, scrubbed: report, sheets: sheetIdsIn(clean) });
}

export async function DELETE(req: Request) {
  // Removing a shared entry changes what every other build can reach.
  const denied = await ownerOnly();
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "which page?" }, { status: 400 });

  const all = await readIndex();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) {
    return Response.json({ ok: false, error: "no such page" }, { status: 404 });
  }
  if (!(await index().write({ pages: next }))) {
    return Response.json({ ok: false, error: "Couldn't remove it." }, { status: 500 });
  }
  // The entry itself is purged after the index, so a failure here leaves an orphan rather than a
  // list pointing at something that is gone.
  await createKvStore(getClient(), pageLibraryEntry(id)).purge();
  return Response.json({ ok: true });
}
