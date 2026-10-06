// Welcome-video counters: one row per (video, event, day), incremented in the same Postgres the
// site already uses for content. No cookies, no ids, no personal data is stored.
import pg from "pg";

export const VIDEO_EVENTS = ["view", "play", "p25", "p50", "p75", "done"] as const;
export type VideoEvent = (typeof VIDEO_EVENTS)[number];

const BOT = /bot|crawl|spider|headless|preview|lighthouse/i;

export function validateVideoEvent(body: unknown, userAgent: string): { video: string; event: VideoEvent } | null {
  if (BOT.test(userAgent || "")) return null;
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const video = typeof b.video === "string" ? b.video : "";
  const event = typeof b.event === "string" ? b.event : "";
  const page = typeof b.page === "string" ? b.page : "";
  if (!/^[A-Za-z0-9._-]{1,80}$/.test(video)) return null;
  if (!(VIDEO_EVENTS as readonly string[]).includes(event)) return null;
  if (!/^\/[A-Za-z0-9/_.\-]{0,119}$/.test(page)) return null;
  return { video, event: event as VideoEvent };
}

let _pool: pg.Pool | null = null;
let _ready: Promise<void> | null = null;

async function pool(): Promise<pg.Pool | null> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  if (!_pool) {
    _pool = new pg.Pool({ connectionString: url, max: 2, idleTimeoutMillis: 10_000 });
    _pool.on("error", (e) => console.error("[videoStats] idle client error", e.message));
  }
  _ready ??= _pool
    .query(
      `create table if not exists video_events (
         video text not null, event text not null, day date not null, n integer not null default 0,
         primary key (video, event, day))`
    )
    .then(() => {})
    .catch((e) => {
      _ready = null;
      throw e;
    });
  await _ready;
  return _pool;
}

export async function recordVideoEvent(video: string, event: VideoEvent): Promise<void> {
  const p = await pool();
  if (!p) return;
  await p.query(
    `insert into video_events (video, event, day, n)
     values ($1, $2, (now() at time zone 'America/Chicago')::date, 1)
     on conflict (video, event, day) do update set n = video_events.n + 1`,
    [video, event]
  );
}

export type VideoStats = {
  video: string;
  totals: Record<VideoEvent, number>;
  days: { day: string; plays: number; views: number }[];
};

export async function readVideoStats(): Promise<VideoStats[]> {
  const p = await pool();
  if (!p) return [];
  const { rows } = await p.query(
    `select video, event, to_char(day, 'YYYY-MM-DD') as day, n from video_events order by day desc`
  );
  const cutoff = new Date(Date.now() - 14 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const out = new Map<string, VideoStats>();
  for (const r of rows) {
    const v = String(r.video);
    let s = out.get(v);
    if (!s) {
      s = { video: v, totals: { view: 0, play: 0, p25: 0, p50: 0, p75: 0, done: 0 }, days: [] };
      out.set(v, s);
    }
    const ev = r.event as VideoEvent;
    if (!(ev in s.totals)) continue;
    s.totals[ev] += Number(r.n);
    if (r.day >= cutoff && (ev === "play" || ev === "view")) {
      let d = s.days.find((x) => x.day === r.day);
      if (!d) s.days.push((d = { day: r.day, plays: 0, views: 0 }));
      if (ev === "play") d.plays += Number(r.n);
      else d.views += Number(r.n);
    }
  }
  for (const s of out.values()) s.days.sort((a, b) => (a.day < b.day ? 1 : -1));
  return [...out.values()];
}
