// May THIS caller touch THAT website? — the one place the question is asked.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// Authentication answers "is this the owner?" and nothing else. Not one route asked "may this
// caller touch this site". Every site-scoped route takes the target as a free string from a query
// or a body — /api/puck, /api/brand, /api/versions, /api/pages, /api/site-content, /api/sites and
// all eighteen /api/admin/* routes — and then builds that site's storage keys from it.
//
// While Steven is the only login that is invisible. The moment a customer gets one to edit their
// own site, they have everyone's: `PUT /api/puck {"site":"someone-else"}` overwrites a stranger's
// home page, and `GET /api/admin/leads?site=…` reads their stored customers.
//
// ⚠️ BUILT BEFORE IT IS NEEDED, DELIBERATELY. This is the single most expensive thing on the list
// to retrofit — it touches ~30 routes, and every one of them works fine without it, so there is no
// failing test to guide the work later. Putting the seam in now means adding real per-user scoping
// is one function's implementation rather than thirty call sites.
//
// It also closes a live hole today: `siteKeys()` throws on a malformed id rather than silently
// returning the FLAGSHIP site's legacy keys, and an unhandled throw is a 500. Routing every caller
// through here turns "unknown or malformed site" into a clean 404/400 instead.
import { findSite } from "./sites";
import type { Site } from "./sitesShared";

export type SiteAccess =
  | { ok: true; site: Site }
  | { ok: false; status: 400 | 403 | 404; error: string };

/**
 * Resolve a caller-supplied site id to a real website, and decide whether this caller may touch it.
 *
 * ⚠️ ALWAYS RESOLVE THROUGH THE REGISTRY. Passing a request string straight into `siteKeys()` is
 * the bug this replaces: an id that is not a real site must 404, never fall through to whatever
 * keys that string happens to build.
 */
export async function assertSiteAccess(
  siteId: unknown,
  _req?: Request
): Promise<SiteAccess> {
  const raw = String(siteId ?? "").trim();
  if (!raw) return { ok: false, status: 400, error: "Which website?" };
  if (!/^[a-z0-9-]+$/i.test(raw)) {
    return { ok: false, status: 400, error: `'${raw}' is not a valid website id.` };
  }

  const site = await findSite(raw);
  if (!site) return { ok: false, status: 404, error: `No website with id '${raw}'.` };

  // ── THE AUTHORIZATION DECISION ──────────────────────────────────────────────────────────────
  // Today there is exactly one identity — the owner — and middleware has already proved it before
  // any protected route runs, so reaching this line means the caller may touch any site.
  //
  // ⚠️ WHEN CUSTOMER LOGINS ARRIVE, THE CHECK GOES HERE AND ONLY HERE. An identity carrying a set
  // of site ids, compared against `site.id`, returning 403. Every site-scoped route already calls
  // this, so nothing else has to change — which is the entire reason it exists this early.
  return { ok: true, site };
}

/** The same check, shaped for a route: returns a Response to return, or the resolved site. */
export async function siteOr(
  siteId: unknown,
  req?: Request
): Promise<{ site: Site; deny?: never } | { site?: never; deny: Response }> {
  const res = await assertSiteAccess(siteId, req);
  if (res.ok) return { site: res.site };
  return {
    deny: Response.json({ ok: false, error: res.error }, { status: res.status }),
  };
}
