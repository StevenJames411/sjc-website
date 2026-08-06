// Every lead, written down before anyone tries to deliver it. SERVER ONLY.
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────────────────────────────
// Until 2026-08-06 a lead was DELIVERY-ONLY. The answers lived in the visitor's browser, went out
// to an inbox, a sheet and a webhook, and were held nowhere. Three separate reporting paths all
// ended in `console.error`, so a partial delivery — email landed, client's sheet failed — was
// discoverable only by grepping Vercel logs, which nobody does unprompted. And when every leg
// failed, she saw "that didn't go through" and the enquiry existed nowhere on earth.
//
// The onboarding questionnaire had always got this right: store the answers, then copy them to
// the sheet, and a failed copy costs a retry rather than the answers. Leads — the thing a client
// actually pays for — had not.
//
// Writing first turns the entire class of delivery failures from LOST into UNDELIVERED. That is
// the difference between a support ticket and a lost retainer.
//
// ⚠️ THIS IS NOT A CRM AND MUST NOT BECOME ONE.
//
// The standing boundary is: SJC writes a submission and forgets it; it never reads one back. That
// still holds, and this is the one deliberate exception with a fence around it — nothing
// customer-facing reads this. No inbox, no list, no reply, no contact record, no status a client
// can see, nothing that drives a workflow. GHL and the client's own sheet remain the truth.
//
// The single permitted reader is Steven, going to look for a lead he already knows failed. The
// day anything here feeds a drip, a dashboard a client logs into, or a "mark as contacted"
// button, the boundary is gone and this file was the crossing.
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { siteKeys } from "./siteKeys";
import type { Answer } from "./leadDelivery";

/** How many leads are kept per site. A safety net, not an archive — see the trim note below. */
export const MAX_STORED_LEADS = 500;

export type StoredLead = {
  /** Minted here, so a lead can be named in a log line and found again. */
  id: string;
  submittedAt: string;
  answers: Answer[];
  /** Per-leg outcome, filled in after delivery is attempted. Absent = not attempted yet. */
  delivery?: {
    toOwner: boolean | null;
    toRecord: boolean | null;
    toSheet: boolean | null;
    toGhl: boolean | null;
    problems: string[];
  };
};

type LeadsBlob = { leads?: StoredLead[] };

const store = (siteId: string) => createKvStore(getClient(), siteKeys(siteId).leads);

/**
 * An id that sorts by time and can be read out loud.
 *
 * ⚠️ NOT Math.random alone — two submissions in the same millisecond must not collide, and the
 * timestamp prefix is what makes a log line like `[lead] site=marbleford id=...` locatable in the
 * stored list without a search.
 */
function mintId(submittedAt: string): string {
  const t = Date.parse(submittedAt);
  const stamp = Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
  return `${stamp.replace(/[-:.TZ]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Write the lead down. Returns its id, or null if even this failed.
 *
 * ⚠️ NULL IS MEANINGFUL AND THE CALLER MUST NOT IGNORE IT. It means the safety net itself is
 * down, so a delivery failure after this point really would lose the answers — which is exactly
 * when the log line matters most.
 */
export async function recordLead(
  siteId: string,
  answers: Answer[],
  submittedAt: string
): Promise<string | null> {
  const id = mintId(submittedAt);
  try {
    const s = store(siteId);
    const blob = (await s.read<LeadsBlob>()) || {};
    const leads = Array.isArray(blob.leads) ? blob.leads : [];
    // Newest first, and trimmed. ⚠️ The trim is a cap on a SAFETY NET, not retention policy: the
    // client's own sheet is the durable record and this is the copy that survives a bad night.
    // Unbounded growth would eventually make every write of this document slower than the
    // delivery it is protecting.
    const next = [{ id, submittedAt, answers }, ...leads].slice(0, MAX_STORED_LEADS);
    const res = await s.writeResult({ leads: next });
    if (!res.ok) throw new Error(res.reason || "refused");
    return id;
  } catch (e) {
    // ⚠️ NEVER THROW. A store that is down must not also cost the visitor her submission — the
    // delivery attempt below is still worth making, and is now the only chance this lead has.
    console.error(
      `[lead] COULD NOT STORE lead for site='${siteId}': ${(e as Error).message}. ` +
        `Delivery is now the only copy.`
    );
    return null;
  }
}

/**
 * Attach what actually happened to each leg, once delivery has been attempted.
 *
 * Best-effort by design: the lead is already safe, and failing to annotate it must never turn a
 * successful delivery into an error the visitor sees.
 */
export async function attachDelivery(
  siteId: string,
  leadId: string,
  delivery: StoredLead["delivery"]
): Promise<void> {
  try {
    const s = store(siteId);
    const blob = (await s.read<LeadsBlob>()) || {};
    const leads = Array.isArray(blob.leads) ? blob.leads : [];
    const next = leads.map((l) => (l.id === leadId ? { ...l, delivery } : l));
    await s.writeResult({ leads: next });
  } catch (e) {
    console.error(`[lead] could not annotate ${leadId}: ${(e as Error).message}`);
  }
}

/**
 * The stored leads for one site, newest first.
 *
 * ⚠️ OWNER-ONLY, AND THE ONLY READER. See the boundary note at the top of this file before wiring
 * this to anything.
 */
export async function readLeads(siteId: string): Promise<StoredLead[]> {
  const blob = (await store(siteId).read<LeadsBlob>()) || {};
  return Array.isArray(blob.leads) ? blob.leads : [];
}
