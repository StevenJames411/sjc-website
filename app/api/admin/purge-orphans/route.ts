// Clear out content belonging to websites that no longer exist.
//
//   POST { dryRun? } -> { ok, orphans: [{ id, keys, bytes }], purged, failed }
//
// ── WHY THERE ARE ORPHANS AT ALL ──────────────────────────────────────────────────────────────
// Until 2026-08-01, `deleteSite` never deleted content — its purge writes were refused by the
// write guard, the boolean was discarded, and it reported success anyway (see the note there).
// So every website ever deleted left its full set of keys behind: pages, draft and published
// content, the compiled design stylesheet, brand, and intake. Thirteen of them had piled up,
// two still holding a real business's onboarding answers.
//
// deleteSite is fixed, so nothing new strands. This clears what already did. One-time in
// practice, but safe to leave in place — with no orphans it finds nothing and does nothing.
//
// ⚠️ DRY RUN IS THE DEFAULT. Pass dryRun:false to actually purge. The report is printed first so
// the list can be read before anything is touched, same posture as the importer and tokenize.
//
// ⚠️ This empties live documents; `state_rev` keeps every prior revision. Not erasure in the
// data-retention sense — see the note on deleteSite.
import { readSitesRaw } from "@/lib/sites";
import { allSlugsEver } from "@/lib/pageRegistry";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { allKeysFor, SJC } from "@/lib/siteKeys";
import pg from "pg";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Which site does a storage key belong to? — for GROUPING THE REPORT ONLY.
 *
 * ⚠️ THIS NO LONGER DECIDES WHAT IS AN ORPHAN, AND THAT IS THE FIX (2026-08-12). The old parser
 * matched `pages|brand|intake|puck-.+|designcss-.+` and returned null for everything else, and
 * null meant SKIP. So `site-<id>-leads` (the client's own customers — names, phones, emails),
 * `site-<id>-designsrc-<page>`, and — unnoticed — `site-<id>-brand-pub` were passed over in
 * silence: the `brand` alternative was anchored to the end of the string and could never absorb
 * the `-pub` suffix. The sweeper built to find what deletion left behind was itself blind to three
 * of the eight key shapes, and reported a clean sweep.
 *
 * Orphan-ness is now decided by MEMBERSHIP: `allKeysFor` enumerates every key a known site owns,
 * and anything under `site-…` outside that set is an orphan by definition — no parsing involved,
 * so a key shape this file has never heard of cannot hide. This function only labels the finding,
 * and anything it cannot label is reported under `(unrecognised)` rather than dropped.
 */
function siteIdFromKey(key: string): string | null {
  if (!key.startsWith("site-")) return null;
  const rest = key.slice("site-".length);
  const m = rest.match(
    /^(.+?)-(pages|brand|intake|leads|puck-.+|designcss-.+|designsrc-.+)(?:-pub)?$/
  );
  return m ? m[1] : null;
}

export async function POST(req: Request) {
  let body: { dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const dryRun = body?.dryRun !== false;

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return Response.json({ ok: false, error: "no database configured" }, { status: 503 });

  // Read the key list straight from Postgres: the store adapter is key/value only and has no way
  // to enumerate, which is exactly why orphans were invisible from inside the app.
  const pool = new pg.Pool({ connectionString: url, max: 2 });
  let rows: { key: string; bytes: number }[];
  try {
    const res = await pool.query(
      "select key, pg_column_size(value) as bytes from state where key like 'site-%' order by key"
    );
    rows = res.rows as { key: string; bytes: number }[];
  } finally {
    await pool.end();
  }

  // Raw: a binned site is NOT an orphan — its content is meant to still be there.
  const live = new Set((await readSitesRaw()).map((s) => s.id));
  live.add(SJC); // implicit, and its keys aren't namespaced anyway

  // ⚠️ THE OWNED SET IS WHAT DECIDES, NOT THE PARSER. Every key a known site owns, derived from
  // `allKeysFor` — the same function deletion and rename use, so all three agree by construction.
  // Anything under `site-…` that is not in here belongs to no website that exists.
  //
  // Slugs come from each site's registry AND from the keys themselves: a page key names its own
  // slug, so a page deleted from the registry (whose stylesheet outlived it) is still recognised as
  // owned rather than being swept out from under a live site.
  const owned = new Set<string>();
  for (const id of live) {
    if (id === SJC) continue; // legacy keys aren't namespaced; the `site-%` query never sees them
    const slugs = new Set<string>(await allSlugsEver(id));
    const claims = new RegExp(`^site-${id}-(?:puck|designcss|designsrc)-(.+?)(?:-pub)?$`);
    for (const { key } of rows) {
      const m = key.match(claims);
      if (m) slugs.add(m[1]);
    }
    for (const k of allKeysFor(id, [...slugs])) owned.add(k);
  }

  const byId = new Map<string, { keys: string[]; bytes: number }>();
  for (const { key, bytes } of rows) {
    if (owned.has(key)) continue;
    // Labelled for the report; an unparseable key is still an orphan and still gets purged.
    const id = siteIdFromKey(key) || "(unrecognised)";
    const e = byId.get(id) || { keys: [], bytes: 0 };
    e.keys.push(key);
    e.bytes += Number(bytes) || 0;
    byId.set(id, e);
  }

  const orphans = [...byId.entries()]
    .map(([id, v]) => ({ id, keys: v.keys.length, bytes: v.bytes }))
    .sort((a, b) => b.bytes - a.bytes);

  if (dryRun) {
    return Response.json({
      ok: true,
      dryRun: true,
      live: [...live],
      orphans,
      totalBytes: orphans.reduce((n, o) => n + o.bytes, 0),
    });
  }

  const client = getClient();
  const failed: string[] = [];
  let purged = 0;
  for (const [, v] of byId) {
    for (const key of v.keys) {
      const res = await createKvStore(client, key).purge();
      if (res.ok) purged++;
      else failed.push(`${key}: ${res.reason}`);
    }
  }

  return Response.json({ ok: failed.length === 0, orphans, purged, failed });
}
