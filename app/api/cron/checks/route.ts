// Run every check and fold the results into the board.
//
// Two doors, on purpose:
//   · Vercel's cron (hourly, see vercel.json) — the routine sweep.
//   · Steven pressing "Check now" on /edit/board — because a board you cannot force is a board you
//     do not trust after you have just fixed something.
//
// ⚠️ THE BOARD CANNOT BE THE ONLY WITNESS. If this cron silently stops firing, nothing here will
// ever say so — but that is handled by arithmetic rather than by another alarm: every check has a
// staleSeconds, and colourFor turns a check with no recent PASS red on its own. A dead runner takes
// the whole board red instead of freezing it green. See the colour rule in lib/checksShared.ts.
//
// ⚠️ Not in isProtected(), so Vercel's cron can reach it. That means anyone can trigger a sweep.
// Acceptable: it writes only check results, reads no client content, and the worst a stranger
// achieves is making the tiles fresher than they would otherwise be.
import { runAllChecks, recordRuns } from "@/lib/checks";

export const dynamic = "force-dynamic";
// Fanning out across every client site plus RDAP is slower than the default allowance.
export const maxDuration = 60;

export async function GET() {
  const started = Date.now();
  const runs = await runAllChecks();
  await recordRuns(runs);

  const counts = runs.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  // Logged as one greppable line so a sweep is visible in Vercel's logs even when nobody opens
  // the board — `[checks]` is the string to search for.
  console.log(`[checks] ${runs.length} run in ${Date.now() - started}ms :: ${JSON.stringify(counts)}`);

  return Response.json({ ok: true, ran: runs.length, counts, ms: Date.now() - started });
}
