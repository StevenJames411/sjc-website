// The stored leads for one website. OWNER ONLY (middleware guards /api/admin).
//
//   GET /api/admin/leads?site=<id>          -> every stored lead for that site, newest first
//   GET /api/admin/leads?site=<id>&failed=1 -> only the ones that didn't reach everywhere
//
// ── THIS IS THE ONE PERMITTED READER ─────────────────────────────────────────────────────────
// lib/leadStore.ts writes a lead before anyone tries to deliver it, so a delivery failure is
// "undelivered" instead of "lost". That is only worth anything if the lead can be got back out —
// otherwise it's a black box that makes everyone feel better and helps nobody.
//
// ⚠️ AND IT IS THE EDGE OF THE never-a-CRM LINE. Steven, looking for an enquiry he already knows
// failed, is the entire permitted use. Not a client-facing inbox, not a list anyone logs into,
// not a status, not a "mark as contacted", and nothing that drives a drip or a workflow. GHL and
// the client's own sheet stay the truth. If a second reader ever appears, that is the crossing —
// and it should be a decision somebody makes on purpose, not a route that quietly grew users.
import { readLeads } from "@/lib/leadStore";
import { findSite } from "@/lib/sites";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const site = (url.searchParams.get("site") || "").trim();
  if (!site) return Response.json({ ok: false, error: "site required" }, { status: 400 });

  const leads = await readLeads(site);
  const failedOnly = url.searchParams.get("failed") === "1";

  // "Didn't reach everywhere" is the useful filter, not "errored". A lead that reached the sheet
  // and missed the owner's inbox is the exact half-failure that used to go unnoticed.
  const rows = failedOnly ? leads.filter((l) => (l.delivery?.problems?.length || 0) > 0) : leads;

  return Response.json({
    ok: true,
    site,
    // Named, so a response about the wrong site is obvious rather than plausible.
    siteName: (await findSite(site))?.name || null,
    total: leads.length,
    withProblems: leads.filter((l) => (l.delivery?.problems?.length || 0) > 0).length,
    leads: rows.map((l) => ({
      id: l.id,
      submittedAt: l.submittedAt,
      answers: l.answers.map((a) => ({ label: a.label, value: a.value })),
      delivery: l.delivery ?? null,
    })),
  });
}
