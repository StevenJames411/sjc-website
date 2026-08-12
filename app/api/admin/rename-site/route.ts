// Change a website's ID — the string every one of its storage keys is built from.
//
//   POST { from, to, dryRun? } -> { ok, id, moved: {key: bytes}, skipped }
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// A site's id is chosen from whatever it was called the day it was created, and it then shows up
// in every editor URL forever. "Rename" in Website settings only changes the label; the id — and
// so the address Steven reads a hundred times a week — was stuck. That is not a good enough
// reason to live with a name from a throwaway test.
//
// ⚠️ WHY NOT createSite({from}) — THE TRAP THIS AVOIDS.
// copySiteContent() copies the page registry, each page's draft + published Puck blob, and the
// brand. It does NOT copy `designCss`, which for a bought design holds the compiled stylesheet.
// Clone an imported site that way and you get every word in the right place with no styling at
// all — the "imported designs can't become templates" bug. This enumerates the keys from
// lib/siteKeys instead of hand-listing them, so a key added there later comes along by default.
//
// SAFETY: copy-then-verify-then-clear. Nothing is deleted until the new keys have been read back
// and compared, so a failure halfway leaves the ORIGINAL site fully intact and the worst outcome
// is a duplicate. dryRun is the default posture for anything destructive in this codebase.
import { readSitesRaw, findSite } from "@/lib/sites";
import { allSlugsEver } from "@/lib/pageRegistry";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { allKeysFor, SITES_KEY, SJC } from "@/lib/siteKeys";
import { RESERVED_SITE_IDS, type Site } from "@/lib/sitesShared";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const slugify = (s: string) =>
  String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function POST(req: Request) {
  let body: { from?: string; to?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const from = String(body?.from || "").trim();
  const to = slugify(body?.to || "");
  const dryRun = body?.dryRun !== false; // destructive: opt IN to the real run

  if (!from || !to) return Response.json({ ok: false, error: "from and to are required" }, { status: 400 });
  if (from === SJC) {
    return Response.json({ ok: false, error: "SJC's id is load-bearing — its keys are legacy and unnamespaced." }, { status: 400 });
  }
  if (from === to) return Response.json({ ok: false, error: "Those are the same id." }, { status: 400 });

  const site = await findSite(from);
  if (!site) return Response.json({ ok: false, error: `No website with id '${from}'.` }, { status: 404 });

  const all = await readSitesRaw();
  if (RESERVED_SITE_IDS.includes(to) || all.some((s) => s.id === to)) {
    return Response.json({ ok: false, error: `'${to}' is taken or reserved.` }, { status: 400 });
  }

  // ⚠️ NOW ACTUALLY DERIVED — WHICH IS WHAT THE HEADER ABOVE ALREADY CLAIMED (fixed 2026-08-12).
  // This block used to hand-list the key shapes, and the list predated `leads` and `designSrc`. So
  // renaming a site silently stranded the client's ENTIRE LEAD HISTORY and the archived design
  // source under an id that no longer existed in the registry: unreachable from the app, and
  // invisible to the orphan sweeper, whose parser could not match those key shapes either.
  //
  // `allKeysFor` returns the same shape in the same order for any id, so zipping old→new is exact —
  // and it THROWS if a key is added to siteKeys and left unaccounted for. Slugs come from
  // `allSlugsEver`, not `readPages`: a deleted page's stylesheet outlives its content and has to
  // move too, or it is orphaned by the rename.
  const slugs = await allSlugsEver(from);
  const oldKeys = allKeysFor(from, slugs);
  const newKeys = allKeysFor(to, slugs);
  const pairs: [string, string][] = oldKeys.map((k, i) => [k, newKeys[i]]);

  const client = getClient();
  const moved: Record<string, number> = {};
  const skipped: string[] = [];

  // ── 1. COPY ────────────────────────────────────────────────────────────────────────────────
  for (const [src, dst] of pairs) {
    const value = await createKvStore(client, src).read<unknown>();
    if (value === null || value === undefined) {
      skipped.push(src);
      continue;
    }
    if (!dryRun) {
      const res = await createKvStore(client, dst).writeResult(value);
      if (!res.ok) {
        return Response.json(
          { ok: false, error: `copy failed at ${dst}: ${res.reason}. Nothing was deleted — '${from}' is untouched.` },
          { status: 500 }
        );
      }
    }
    moved[dst] = JSON.stringify(value).length;
  }

  if (dryRun) {
    return Response.json({ ok: true, dryRun: true, id: to, moved, skipped });
  }

  // ── 2. VERIFY before anything is destroyed ─────────────────────────────────────────────────
  for (const [src, dst] of pairs) {
    const a = await createKvStore(client, src).read<unknown>();
    if (a === null || a === undefined) continue;
    const b = await createKvStore(client, dst).read<unknown>();
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      return Response.json(
        { ok: false, error: `verify failed at ${dst}. Nothing was deleted — '${from}' is untouched.` },
        { status: 500 }
      );
    }
  }

  // ── 3. POINT THE REGISTRY AT THE NEW ID ────────────────────────────────────────────────────
  const registry = createKvStore(client, SITES_KEY);
  const blob = (await registry.read<{ sites?: Site[] }>()) || {};
  const rows = (blob.sites || []).map((s) => (s.id === from ? { ...s, id: to } : s));
  if (!rows.some((s) => s.id === to)) rows.push({ ...site, id: to });
  const wrote = await registry.writeResult({ sites: rows });
  if (!wrote.ok) {
    return Response.json(
      { ok: false, error: `registry write refused: ${wrote.reason}. Content was copied but '${from}' still owns it.` },
      { status: 500 }
    );
  }

  // ── 4. CLEAR THE OLD KEYS. Last, and only now. ─────────────────────────────────────────────
  for (const [src] of pairs) {
    await createKvStore(client, src).write(null);
  }

  return Response.json({ ok: true, id: to, moved, skipped });
}
