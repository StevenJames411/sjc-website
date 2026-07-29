// Which store is actually serving this site.
//
// lib/store.ts falls back to the Upstash cache when the database is unreachable — which is
// the right behaviour (the site stays up) but a dangerous silence: you'd be running with no
// history and no guard and never know. This says so out loud.
//
// Public on purpose: it reports NO content and NO credentials, only which engine answered and
// whether a round-trip works. Being able to check it without signing in is the point.
import { backend } from "@/lib/store";
import { getClient as getPg } from "@/lib/pgClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const engine = backend();
  const durable = engine === "postgres";

  let readOk = false;
  let error: string | null = null;
  try {
    const pg = getPg();
    if (pg) {
      // a key that always exists once migrated; we only care THAT it reads, not what's in it
      await pg.get("sjc-puck-home-pub");
      readOk = true;
    }
  } catch (e) {
    error = String((e as Error)?.message || e);
  }

  return Response.json(
    {
      ok: durable && readOk,
      store: engine,
      durable,
      readOk,
      error,
      warning: durable
        ? undefined
        : "RUNNING ON THE CACHE FALLBACK — no save history and no write guard. Check DATABASE_URL.",
    },
    { status: durable && readOk ? 200 : 503 }
  );
}
