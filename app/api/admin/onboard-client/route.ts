// SOLD A CLIENT — everything that used to be manual, in one request.
//
//   POST /api/admin/onboard-client
//   Authorization: Bearer <SITE_EDIT_TOKEN>
//   { businessName, phone?, email?, address?, hours?, notes?, extra?: {…} }
//     -> { siteId, onboardUrl, sheetUrl, editUrl }
//
// Called from a Google Sheet: Steven ticks "Sold" on the row he is looking at during the call,
// and the onboarding link appears in the next cell before he has hung up.
//
// What it replaces, in order, all of which he was doing by hand:
//   New website in the builder · create her spreadsheet · bind and deploy a script · authorize it
//   · store the webhook · open her onboarding · copy the link
//
// ── EVERY COLUMN COMES ALONG ───────────────────────────────────────────────────────────────────
// `extra` takes the whole row. His call sheets differ per niche and per city and will grow — the
// groomer sheet and the deck-builder sheet already have different shapes. Anything that hardcodes
// a column list breaks on the second sheet, so unknown columns are KEPT rather than dropped. What
// he knew going in stays attached to her record even when we have no field named for it.
import { createSite, updateSite, findSite } from "@/lib/sites";
import { createClientSheet, sheetsConfigured } from "@/lib/sheets";
import { openIntake } from "@/lib/intakeLinks";
import { patchIntake } from "@/lib/intake";

export const dynamic = "force-dynamic";
// Creating a spreadsheet through Apps Script is slow enough to trip the default limit.
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!sheetsConfigured()) {
    return Response.json(
      { ok: false, error: "SHEETS_WEBHOOK_URL / SHEETS_SECRET are not set on the server" },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const str = (k: string) => String(body[k] ?? "").trim();
  const businessName = str("businessName");
  if (!businessName) {
    return Response.json({ ok: false, error: "businessName required" }, { status: 400 });
  }

  // Ticking the box twice must not produce two websites. Same name -> hand back what exists.
  const slug = businessName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const already = await findSite(slug);
  const origin = new URL(req.url).origin;

  let siteId: string;
  if (already) {
    siteId = already.id;
  } else {
    const made = await createSite({
      name: businessName,
      kind: "client",
      description: str("notes") || undefined,
      business: {
        name: businessName,
        phone: str("phone"),
        phoneDisplay: str("phoneDisplay") || str("phone"),
        email: str("email"),
        address: str("address"),
        hours: str("hours"),
      },
    });
    if (!made.ok || !made.id) {
      return Response.json({ ok: false, error: made.error || "could not create site" }, { status: 400 });
    }
    siteId = made.id;
  }

  // Her sheet. Reuse it if this row was already processed.
  const site = await findSite(siteId);
  let sheetId = site?.sheetId || "";
  let sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : "";
  if (!sheetId) {
    const made = await createClientSheet(businessName, str("shareWith"));
    if (!made.ok) {
      // The website exists; say so rather than pretending the whole thing failed.
      return Response.json(
        { ok: false, error: `site created (${siteId}) but sheet failed: ${made.error}`, siteId },
        { status: 502 }
      );
    }
    sheetId = made.spreadsheetId;
    sheetUrl = made.url;
    await updateSite(siteId, { sheetId, leadEmail: str("email") || undefined });
  }

  // Everything the call sheet knew, kept verbatim — see the note at the top of this file.
  const extra = (body.extra && typeof body.extra === "object" ? body.extra : {}) as Record<string, unknown>;
  if (Object.keys(extra).length) {
    await patchIntake(siteId, {
      answers: Object.fromEntries(
        Object.entries(extra).map(([k, v]) => [`prospect.${k}`, String(v ?? "")])
      ),
    });
  }

  await openIntake(siteId);

  return Response.json({
    ok: true,
    siteId,
    onboardUrl: `${origin}/${siteId}/onboard`,
    sheetUrl,
    editUrl: `${origin}/edit/${siteId}/home`,
    reused: Boolean(already),
  });
}
