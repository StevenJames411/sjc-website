// Durable store for the website's content. Same engine and same two tables the cockpit uses
// (state + append-only state_rev), so both products sit on ONE backend.
//
// WHY: the published copy of this site lived in Upstash — a cache. No history, whole-document
// overwrite, and every Publish silently replaced the previous version with no way back. The
// content was being backed up after the 2026-07-28 migration, but the SAVES still had no undo.
//
// Shape is deliberately identical to lib/kvRedis.ts — { get, set } — so createKvStore() and
// every route above it are untouched by the swap.
import pg from "pg";

type KvClient = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
};

let _pool: pg.Pool | null = null;
let _client: KvClient | null = null;

function pool(): pg.Pool | null {
  if (_pool) return _pool;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  _pool = new pg.Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000 });
  _pool.on("error", (e) => console.error("[pgClient] idle client error", e.message));
  return _pool;
}

// The write guard, same rules as the cockpit's. A published page losing most of its content
// is the failure that matters here — a bad Publish would otherwise be permanent.
export function guardReason(prev: unknown, next: unknown): string | null {
  if (prev === null || prev === undefined) return null;
  if (next === null || next === undefined) return "refusing to overwrite an existing document with null";

  const pArr = Array.isArray(prev), nArr = Array.isArray(next);
  const pObj = prev && typeof prev === "object", nObj = next && typeof next === "object";
  if (Boolean(pObj) !== Boolean(nObj) || pArr !== nArr) return "type changed";
  if (!pObj) return null;

  if (pArr && nArr) {
    const a = prev as unknown[], b = next as unknown[];
    if (a.length - b.length > 3 && b.length < a.length * 0.5) return `array shrank ${a.length} -> ${b.length}`;
    return null;
  }
  const p = prev as Record<string, unknown>, n = next as Record<string, unknown>;
  // An EMPTY container going missing is not data loss (fix 2026-07-30).
  //
  // This rule exists to stop a section full of content silently vanishing. But it counted any
  // absent key, including ones that held nothing. Puck used to write `zones: {}` and current
  // versions don't send it at all — so every stored page carrying that leftover key refused
  // EVERY save from the editor, forever, on any edit. Combined with a save indicator that never
  // read the response (see PuckEditor), it looked exactly like the editor working fine while the
  // page never changed. Steven lost an afternoon to it.
  //
  // Losing `{}` or `[]` costs nothing and can always be re-created. Losing populated content is
  // still refused, which is the case the guard was written for.
  const isEmpty = (v: unknown) =>
    v === null ||
    v === undefined ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" && Object.keys(v as object).length === 0);
  const lost = Object.keys(p).filter((k) => !(k in n) && !isEmpty(p[k]));
  if (lost.length) return `top-level keys disappeared: ${lost.join(", ")}`;
  for (const k of Object.keys(p)) {
    const a = p[k], b = n[k];
    if (Array.isArray(a) && Array.isArray(b) && a.length - b.length > 3 && b.length < a.length * 0.5) {
      return `'${k}' shrank ${a.length} -> ${b.length}`;
    }
  }
  const pl = JSON.stringify(prev).length, nl = JSON.stringify(next).length;
  if (pl > 500 && nl < pl * 0.4) return `document shrank ${pl} -> ${nl} bytes`;
  return null;
}

export class GuardRefusal extends Error {
  reason: string;
  constructor(key: string, reason: string) {
    super(`[write guard] refused write to '${key}': ${reason}`);
    this.name = "GuardRefusal";
    this.reason = reason;
  }
}

export function getClient(): KvClient | null {
  const p = pool();
  if (!p) return null;
  if (_client) return _client;

  _client = {
    async get(key: string) {
      const { rows } = await p.query("select value from state where key = $1", [key]);
      return rows.length ? rows[0].value : null;
    },
    // Upsert + revision in ONE statement so they can never drift apart.
    async set(key: string, value: unknown) {
      const { rows } = await p.query("select value from state where key = $1", [key]);
      const prev = rows.length ? rows[0].value : null;
      const reason = guardReason(prev, value);
      if (reason) {
        console.error(`[pgClient] REFUSED write to '${key}': ${reason}`);
        throw new GuardRefusal(key, reason);
      }
      await p.query(
        `with up as (
           insert into state (key, value, updated_at) values ($1, $2::jsonb, now())
           on conflict (key) do update set value = excluded.value, updated_at = now()
           returning key
         )
         insert into state_rev (key, value, note) select $1, $2::jsonb, $3`,
        [key, JSON.stringify(value), "website"]
      );
    },
  };
  return _client;
}
