// Does the Apps Script that's RUNNING match the file in this repo?
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// The .gs files in scripts/ are the source of truth for code that lives inside Google. Nothing
// connects the two: you paste the file into script.google.com by hand, save, and redeploy. Miss
// any of those three and the repo says one thing while production does another — with no error,
// no warning, and a green "Completed" in the execution log either way.
//
// On 2026-08-05 that cost most of a day. A timestamp fix was written, committed, pasted and
// "deployed"; the sheet kept writing raw ISO. A second attempt did the same. Both times every
// signal said shipped. The only thing that disagreed was the spreadsheet.
//
// Each script now reports SCRIPT_VERSION — a fingerprint of its own file contents — from doGet.
// This asks each live deployment for that and compares it to what the repo expects.
//
//   GET /api/admin/check-scripts  ->  { ok, checked: [{ script, expected, live, status }] }
//
// ⚠️ IT HAS TO BE A DEPLOYED ROUTE. The /exec URLs are server-side secrets, so a laptop can't
// reach them — the same reason the Upstash→Postgres migration had to run as a route rather than a
// local script.
//
// `unreachable` is NOT treated as pass. A check that goes quiet when it can't see anything is how
// you end up trusting a dashboard that stopped looking.
import { SCRIPT_VERSIONS } from "@/lib/scriptVersions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Which env var holds each script's live /exec URL. Scripts with no web app aren't checkable. */
const DEPLOYED: Record<string, string> = {
  "apply-webhook": "APPLY_WEBHOOK_URL",
  "sjc-sheets": "SHEETS_WEBHOOK_URL",
};

/** The fingerprint is a 12-char hex; find it wherever the script chose to put it in its reply. */
function versionFrom(text: string): string | null {
  return (text.match(/\b[0-9a-f]{12}\b/) || [])[0] || null;
}

export async function GET() {
  const checked: {
    script: string;
    expected: string;
    live: string | null;
    status: "match" | "drift" | "unreachable" | "not-deployed";
    detail?: string;
  }[] = [];

  for (const [script, expected] of Object.entries(SCRIPT_VERSIONS)) {
    const envVar = DEPLOYED[script];
    if (!envVar) {
      // call-sheet and client-sheet are pasted per-spreadsheet and have no single web app, so
      // there is nothing to interrogate. Said out loud rather than skipped silently.
      checked.push({ script, expected, live: null, status: "not-deployed" });
      continue;
    }

    const url = process.env[envVar];
    if (!url) {
      checked.push({ script, expected, live: null, status: "unreachable", detail: `${envVar} not set` });
      continue;
    }

    try {
      const res = await fetch(url, { redirect: "follow", cache: "no-store" });
      const text = await res.text();
      const live = versionFrom(text);
      checked.push({
        script,
        expected,
        live,
        status: live === expected ? "match" : live ? "drift" : "unreachable",
        detail: live ? undefined : `no version in reply: ${text.slice(0, 120)}`,
      });
    } catch (e) {
      checked.push({
        script,
        expected,
        live: null,
        status: "unreachable",
        detail: e instanceof Error ? e.message : "fetch failed",
      });
    }
  }

  // Only an explicit match passes. Anything else — drift, unreachable, no web app — is a finding.
  const ok = checked.every((c) => c.status === "match" || c.status === "not-deployed");
  return Response.json({ ok, checked }, { status: ok ? 200 : 409 });
}
