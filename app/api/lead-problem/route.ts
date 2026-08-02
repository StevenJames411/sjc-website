// Where a PARTIALLY delivered lead gets reported.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// /api/apply answers 200 when ANY destination landed. That is correct for the visitor — she typed
// her name in good faith and the enquiry does exist somewhere, so she must never see a failure over
// our plumbing. But it meant a lead that reached SJC's intake and never reached the client's inbox
// or sheet was indistinguishable, from the outside, from one that reached all four. Both rendered a
// green thank-you. The client finds out when a customer asks why nobody called back, and per
// lib/sitesShared.ts that is the failure that ends the retainer.
//
// deliverLead has always returned per-leg truth and the apply route has always put it on the wire.
// Nothing read it. This is the reader.
//
// ── DELIBERATELY PUBLIC ───────────────────────────────────────────────────────────────────────
// It is not in isProtected() in middleware.ts, because the report comes from a visitor's browser on
// a public page. That makes it forgeable, which is fine: the worst a stranger can do is write a
// noisy line into a log. It grants no read access and touches no stored content, so there is
// nothing here worth authenticating and a wall would only break the reporting.
//
// ── WHAT IT WILL BECOME ───────────────────────────────────────────────────────────────────────
// A console line is visible in Vercel's logs against the originating request, which is enough to
// answer "did this lead reach everywhere" after the fact. It is NOT enough to make a tile go
// yellow. When the checks table lands (see ~/SJC/CEO/_ops/JOINT-MONITORING-DESIGN.md) this writes a
// check_runs row keyed by siteId instead — same call site, durable evidence, and the partial
// delivery finally shows up on the board rather than only in a log somebody has to think to open.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const siteId = String(body?.siteId || "").slice(0, 120);
    const at = String(body?.at || "").slice(0, 40);
    const problems = (Array.isArray(body?.problems) ? body.problems : [])
      .slice(0, 10)
      .map((p: unknown) => String(p).slice(0, 300));

    if (problems.length) {
      // One greppable prefix, one line. `[lead-problem]` is the string to search Vercel logs for.
      console.error(`[lead-problem] site=${siteId || "?"} at=${at || "?"} :: ${problems.join(" | ")}`);
    }
  } catch {
    // Reporting a problem must never itself become a problem.
  }

  // Always 204. The browser sent this with sendBeacon and is not listening for an answer; a status
  // it can't read would only invite a caller somewhere to start branching on it.
  return new Response(null, { status: 204 });
}
