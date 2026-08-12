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
import { headers } from "next/headers";
import { findSite } from "./sites";
import { IDENTITY_HEADER, verifyIdentity } from "./identity";
import type { Identity } from "./identity";
import type { Site } from "./sitesShared";

/**
 * The caller, as proved by middleware. Read from the stamped header rather than the cookie, so
 * there is exactly one authenticator and routes cannot accidentally accept an unverified session.
 *
 * ⚠️ VERIFIED AGAIN HERE, not merely parsed. The header is stripped inbound and re-signed by
 * middleware, so checking the signature costs one HMAC and removes the entire class of bug where
 * some future code path forwards a request without going through middleware.
 */
export async function currentIdentity(): Promise<Identity | null> {
  try {
    return await verifyIdentity((await headers()).get(IDENTITY_HEADER));
  } catch {
    // headers() throws outside a request scope — a cron or a script. No request, no identity.
    return null;
  }
}

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
  // The comment that used to sit here said "when customer logins arrive, the check goes HERE and
  // ONLY HERE." 2026-08-12: they arrived, and it did. Every site-scoped route already called this
  // function, so per-user scoping cost one implementation instead of thirty call sites — which was
  // the entire point of building the seam before it was needed.
  //
  // ⛔ DENY BY DEFAULT. No identity means no access, even though middleware has already let the
  // request through: middleware decides you may be HERE, this decides you may touch THIS. The two
  // are not the same question, and collapsing them is how a signed-in client reaches a stranger's
  // site by changing one string in a request body.
  // ⛔ CHECKED AGAINST THE SITE RECORD, NOT THE LIST BAKED INTO THE SESSION — and this is a
  // correction to how it was written an hour earlier.
  //
  // A session is signed for 30 days and carries its own list of site ids. That made revocation a
  // LIE: taking a client off a website, or offboarding them entirely, changed nothing until their
  // cookie expired a month later. "I removed their access" would have been true on the screen and
  // false in the system, which is the worst shape a security control can have.
  //
  // Now the session proves WHO you are and the site record decides WHAT you may open. Removing an
  // address from ownerEmails locks them out on their very next request. It costs nothing: findSite
  // has already run three lines above, so the answer is in hand.
  //
  // The baked list survives only for `"*"` — the owner and machine credentials, which are not
  // per-site and have no record to check against.
  const id = await currentIdentity();
  const owns =
    id?.sites === "*" ||
    (!!id?.email &&
      (site.ownerEmails || []).some((o) => (o || "").trim().toLowerCase() === id.email));
  if (!owns) {
    return {
      ok: false,
      // 404, NOT 403. A client probing site ids must not be able to map who else exists on the
      // platform by watching "forbidden" and "no such website" come back differently. The owner
      // never sees this branch, so the softer message costs nothing.
      status: 404,
      error: `No website with id '${raw}'.`,
    };
  }

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

/**
 * FOR SURFACES THAT ARE NOT ABOUT ONE WEBSITE — refuse anyone who is not the owner.
 *
 * `assertSiteAccess` answers "may you touch THIS site", which is the wrong question for a handful
 * of routes that are inherently cross-site:
 *
 *   • /api/sections and the page library — ONE shared library, deliberately. A band proven on one
 *     build is available on the next, which also means a client saving or deleting an entry
 *     changes what every other client's builder offers.
 *   • /api/forms/usage — answers "which websites point at this form", so its whole output is a
 *     list of other people's site names and page titles.
 *
 * Scoping these per-site is not possible because they have no site. The honest guard is ownership.
 *
 * ⛔ 404, NOT 403 — same reason as above: never confirm a surface exists to someone who may not
 * use it.
 */
export async function ownerOnly(): Promise<Response | null> {
  const id = await currentIdentity();
  if (id?.sites === "*") return null;
  return Response.json({ ok: false, error: "not found" }, { status: 404 });
}
