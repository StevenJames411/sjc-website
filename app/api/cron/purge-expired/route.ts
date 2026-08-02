// The 30-day sweep. Erases websites whose retention window has run out.
//
//   GET /api/cron/purge-expired            (Vercel Cron, daily — see vercel.json)
//   GET /api/cron/purge-expired?dryRun=1   what it WOULD erase
//
// ── WHY A CRON AND NOT A CHECK ON PAGE LOAD ───────────────────────────────────────────────────
// Sweeping whenever the gallery happens to be opened would be less machinery, and it would make
// the retention promise depend on Steven visiting a screen. "We delete your data after 30 days"
// has to be true on day 31 whether or not anyone logged in that week — that is the entire value
// of saying it. So it runs on a clock.
//
// ⚠️ THIS IS THE ONLY UNATTENDED DESTRUCTIVE JOB IN THE APP. Two guards on it:
//   1. It can only ever touch rows already stamped `deletedAt`. A live site is not a candidate no
//      matter how old it is — the sweep cannot reach one.
//   2. Vercel's cron header, or CRON_SECRET, or an owner token. It refuses anonymous callers even
//      though /api/cron isn't in the middleware's protected list.
import { expiredSites, purgeSiteForever } from "@/lib/sites";
import { daysLeft } from "@/lib/sitesShared";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  // Vercel signs its own cron invocations with this header.
  if (req.headers.get("x-vercel-cron")) return true;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = process.env.CRON_SECRET || "";
  const owner = process.env.SITE_EDIT_TOKEN || "";
  // Length-checked so an empty env var can never authorise an empty header.
  if (secret && secret.length >= 16 && token === secret) return true;
  if (owner && owner.length >= 32 && token === owner) return true;
  return false;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";

  const due = await expiredSites();
  const report = due.map((s) => ({
    id: s.id,
    name: s.name,
    deletedAt: s.deletedAt,
    daysOverdue: -(daysLeft(s) ?? 0),
  }));

  if (dryRun) return Response.json({ ok: true, dryRun: true, due: report });

  const erased: string[] = [];
  const failed: { id: string; error?: string }[] = [];
  for (const s of due) {
    const res = await purgeSiteForever(s.id);
    if (res.ok) erased.push(s.id);
    else failed.push({ id: s.id, error: res.error });
  }

  // Logged whatever happens: this runs with nobody watching, and an erasure that silently failed
  // is exactly the shape of the bug that let thirteen dead sites pile up unnoticed.
  console.log(`[purge-expired] due=${due.length} erased=${erased.length} failed=${failed.length}`);
  if (failed.length) console.error(`[purge-expired] failures: ${JSON.stringify(failed)}`);

  return Response.json({ ok: failed.length === 0, due: report, erased, failed });
}
