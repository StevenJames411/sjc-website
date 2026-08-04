// What an OUTSIDE watchdog reads. The board itself lives behind the owner login, so nothing
// external can see it — and a board only visible to someone already signed in cannot tell anyone
// that it has stopped running.
//
// ── DELIBERATELY PUBLIC, AND DELIBERATELY EMPTY ───────────────────────────────────────────────
// Numbers only: how many checks, how they're coloured, and how long since the oldest one was
// verified. No client names, no domains, no URLs, no detail strings, no evidence. A stranger
// reading this learns that some monitoring exists and nothing whatsoever about whose. That is the
// price of being readable from outside the login, and it is worth paying — see below.
//
// ── WHY IT HAS TO BE OUTSIDE-READABLE ─────────────────────────────────────────────────────────
// The board watches fifteen systems. Nothing watches the board. If the Vercel cron stops firing,
// or this deployment dies, or Neon suspends, every tile ages out to red — correctly — but on a
// page nobody can reach and nobody thinks to open. Silence and health look identical from a phone.
//
// So a watchdog at GitHub polls this every 30 minutes and fails its own run when the answer is
// stale OR when this endpoint doesn't answer at all. Both mean the same thing to Steven and both
// have to feel the same: nobody is watching. See .github/workflows/board-deadman.yml.
//
// ⚠️ The watchdog must NOT live on Vercel. That's the whole point — a watcher sharing a fate with
// the watched is decoration.
import { CHECKS, readBoard } from "@/lib/checks";
import { colourFor } from "@/lib/checksShared";
import { readSites } from "@/lib/sites";

export const dynamic = "force-dynamic";

export async function GET() {
  const [board, sites] = await Promise.all([readBoard(), readSites()]);
  const clients = sites.filter((s) => s.kind === "client" && !s.deletedAt);

  const rows = CHECKS.flatMap((def) => {
    const ids = def.scope === "global" ? [undefined] : clients.map((s) => s.id);
    return ids.map((siteId) => {
      const st = board.states.find(
        (s) => s.checkId === def.id && (s.siteId || "") === (siteId || "")
      );
      return { colour: colourFor(def, st), lastPassAt: st?.lastPassAt, lastRunAt: st?.lastRunAt };
    });
  });

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.colour] = (acc[r.colour] || 0) + 1;
    return acc;
  }, {});

  // The age of the LAST SWEEP is the liveness signal, not the age of the oldest pass — a check can
  // legitimately sit grey forever (nothing to verify) without meaning the runner is dead.
  const sweptAt = board.updatedAt;
  const sweepAgeSeconds = sweptAt
    ? Math.round((Date.now() - Date.parse(sweptAt)) / 1000)
    : null;

  return Response.json(
    {
      ok: true,
      checks: rows.length,
      counts,
      // null means it has never run at all, which a watchdog must treat as bad rather than unknown.
      sweepAgeSeconds,
      red: counts.red || 0,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
