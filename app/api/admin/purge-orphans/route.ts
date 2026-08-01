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
import { readSites } from "@/lib/sites";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { SJC } from "@/lib/siteKeys";
import pg from "pg";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Which site does a storage key belong to?
 *
 * Keys are `site-<id>-<what>`, where `<what>` is `pages` | `brand[-pub]` | `intake` |
 * `puck-<page>[-pub]` | `designcss-<page>[-pub]`. Strip the suffix to recover the id. A site id
 * can itself contain hyphens, so the suffixes are matched from the END, never by splitting.
 */
function siteIdFromKey(key: string): string | null {
  if (!key.startsWith("site-")) return null;
  const rest = key.slice("site-".length);
  const m = rest.match(/^(.+?)-(pages|brand|intake|puck-.+|designcss-.+)$/);
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

  const live = new Set((await readSites()).map((s) => s.id));
  live.add(SJC); // implicit, and its keys aren't namespaced anyway

  const byId = new Map<string, { keys: string[]; bytes: number }>();
  for (const { key, bytes } of rows) {
    const id = siteIdFromKey(key);
    if (!id || live.has(id)) continue;
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
