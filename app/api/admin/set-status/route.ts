// Give every website an explicit state, and move one between states. ONE-TIME + ONGOING.
//
//   POST { migrate: true, dryRun? }        -> stamp a status on every site that has none
//   POST { site, status, dryRun? }         -> set one site's state
//
// ── WHY THE MIGRATION EXISTS ──────────────────────────────────────────────────────────────────
// `statusOf()` falls back for a record written before 2026-08-12 — domain set means published,
// otherwise draft. A fallback is the right thing for reading, and the wrong thing to LIVE on: an
// absent value is a fourth state whose meaning is decided by whoever reads it next, and this
// codebase has already had that exact bug with `domain`.
//
// So every site gets the value written down once, and from then on the field is the truth.
//
// ⚠️ EVERYTHING BECOMES DRAFT EXCEPT A SITE ON ITS OWN DOMAIN. Steven, looking at his library
// where every card read "Demo": *"all of this should be in draft mode. Everything."* Nothing has
// been sent to anybody, so nothing needs to stay reachable — and draft is the tighter of the two,
// so this narrows what the world can see rather than widening it.
import { readSitesRaw, updateSite } from "@/lib/sites";
import { statusOf, type SiteStatus } from "@/lib/sitesShared";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID: SiteStatus[] = ["draft", "demo", "published", "archived"];

export async function POST(req: Request) {
  let body: { migrate?: boolean; site?: string; status?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const dryRun = body?.dryRun !== false;

  // ── ONE SITE ────────────────────────────────────────────────────────────────────────────────
  if (!body?.migrate) {
    const id = String(body?.site || "").trim();
    const status = String(body?.status || "").trim() as SiteStatus;
    if (!id) return Response.json({ ok: false, error: "which website?" }, { status: 400 });
    if (!VALID.includes(status)) {
      return Response.json(
        { ok: false, error: `status must be one of ${VALID.join(", ")}` },
        { status: 400 }
      );
    }
    if (dryRun) return Response.json({ ok: true, dryRun: true, site: id, status });

    // Archiving stamps a date the way deleting does, so "when did we retire this" survives.
    // Leaving archived clears it, or the site would read as archived forever by its timestamp.
    const patch =
      status === "archived"
        ? { status, archivedAt: new Date().toISOString() }
        : { status, archivedAt: undefined };
    const res = await updateSite(id, patch);
    return Response.json({ ...res, site: id, status }, { status: res.ok ? 200 : 400 });
  }

  // ── THE MIGRATION ───────────────────────────────────────────────────────────────────────────
  // Raw: a site in the 30-day bin still needs a state for when it is put back.
  const all = await readSitesRaw();
  const plan = all
    .filter((s) => !s.status)
    .map((s) => ({ id: s.id, name: s.name, from: "(unset)", to: statusOf(s) }));

  if (dryRun) {
    return Response.json({
      ok: true,
      dryRun: true,
      plan,
      unchanged: all.filter((s) => s.status).map((s) => `${s.id}=${s.status}`),
      note: "Derived from statusOf(): a site with its own domain is published, everything else is draft.",
    });
  }

  const failed: string[] = [];
  for (const row of plan) {
    const res = await updateSite(row.id, { status: row.to as SiteStatus });
    if (!res.ok) failed.push(`${row.id}: ${res.error}`);
  }
  return Response.json({ ok: failed.length === 0, migrated: plan, failed });
}
