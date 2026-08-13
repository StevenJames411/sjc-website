// THE CLIENT'S OWN ENQUIRIES — the only leads route a customer can reach.
//
//   GET /api/client/leads?site=<id>  -> { ok, site, leads: [{ at, answers }] }
//
// ── WHY A SECOND LEADS ROUTE ──────────────────────────────────────────────────────────────────
// /api/admin/leads exists and does more, and that is exactly why it is not this. It lives under
// the admin prefix, which refuses everyone but Steven — a fork put there after a client session
// read another client's stored leads through it. Widening it to let customers in would undo that
// with one edit, on the route with the most sensitive data on the platform.
//
// So: a separate, deliberately small route. It answers one question about one website, and it goes
// through the same siteOr check as everything else, which means a client asking for a site that is
// not theirs gets the same "no website with id" a stranger gets.
//
// ⚠️ IT RETURNS THE ENQUIRIES AND NOTHING ELSE. The admin version also carries delivery diagnostics
// — which legs failed, what the sheet said, whether the CRM webhook 500'd. That is SJC's operational
// detail: a contractor seeing "sheet write failed" learns only that something is broken and rings
// Steven about a problem he cannot act on.
import { siteOr } from "@/lib/siteAccess";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { siteKeys } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";

type StoredLead = {
  at?: string;
  submittedAt?: string;
  answers?: { key?: string; label?: string; value?: string }[];
  problems?: string[];
};

export async function GET(req: Request) {
  const asked = new URL(req.url).searchParams.get("site");
  const { site, deny } = await siteOr(asked, req);
  if (deny) return deny;

  const store = createKvStore(getClient(), siteKeys(site.id).leads);
  const raw = (await store.read<{ leads?: StoredLead[] }>()) || {};
  const leads = (raw.leads || []).map((l) => ({
    at: l.at || l.submittedAt || "",
    // Drop the internal `key` too — a client reading their enquiries has no use for `cell_phone`
    // sitting next to "Cell phone", and it is the column name their spreadsheet is keyed on.
    answers: (l.answers || [])
      .filter((a) => (a?.value || "").trim())
      .map((a) => ({ label: a.label || "", value: a.value || "" })),
  }));

  // Newest first. An enquiry list in the order it happened to be stored is a list nobody scans.
  leads.sort((a, b) => (b.at || "").localeCompare(a.at || ""));

  return Response.json({ ok: true, site: site.id, name: site.business?.name || site.name, leads });
}
