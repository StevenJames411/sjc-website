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
import { onboardUrlFor } from "@/lib/hostShared";

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
  let shareWarning = "";
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

    // ⚠️ THE SHEET EXISTING AND THE CLIENT BEING ABLE TO OPEN IT ARE TWO DIFFERENT OUTCOMES.
    //
    // addViewer is caught inside the Apps Script on purpose — a typo'd address must not lose a
    // spreadsheet that was built correctly. But it meant a failed share and a successful one were
    // indistinguishable here: sheet created, id stored, everything green, and she cannot open the
    // record of her own leads. The only person who ever found out was her, months later.
    //
    // Not fatal — the sheet is real, leads still land in it, re-sharing takes ten seconds. So it
    // rides back on the response as a warning Steven sees while he still has her on the phone.
    if (str("shareWith") && !made.sharedWith) {
      shareWarning = `sheet created but NOT shared with ${str("shareWith")}${
        made.shareError ? ` — ${made.shareError}` : ""
      }`;
      console.error(`[onboard] ${shareWarning}`);
    }
  }

  // ⚠️ THIS USED TO LIVE INSIDE `if (!sheetId)`, AND THAT WAS THE BUG.
  //
  // `leadEmail` is the ONLY thing that triggers the owner's new-lead alert. Setting it only on the
  // call that happened to create the sheet meant that a site made by hand in the gallery, or a
  // "Sold" tick processed twice, ended up with a working website, a shared spreadsheet, and no
  // alert — with nothing on any screen saying so. Silent, and only discovered when a customer asks
  // why nobody called back.
  //
  // Built conditionally because `updateSite` spreads the patch: passing `leadEmail: undefined`
  // would overwrite a good address with nothing. An address already on the record wins — this
  // route runs off a call sheet, and what Steven typed in Website settings is the better source.
  const patch: Record<string, string> = {};
  if (sheetId && sheetId !== site?.sheetId) patch.sheetId = sheetId;
  if (str("email") && !site?.leadEmail) patch.leadEmail = str("email");

  // ⚠️ THE RESULT OF THIS WRITE WAS DISCARDED, AND IT IS THE MOST IMPORTANT WRITE ON THE ROUTE.
  //
  // `updateSite` returns {ok, error}. Thrown away, a failed write — storage down, or the save
  // guard refusing — still answered ok:true with a sheet link and an onboard link. Steven reads
  // the sheet URL to a client on the phone and believes she's wired up. She isn't: no sheetId and
  // no leadEmail, so every lead from that day forward takes the silent path — into SJC's intake,
  // no owner email, nobody told. The one step that exists to prevent a silent lead was able to
  // fail silently itself.
  //
  // Now it rides back as a warning on the response, the same shape as the share failure above:
  // not fatal (the site works, the sheet is real), but it needs a human, and the human is on the
  // phone right now.
  let wiringWarning = "";
  if (Object.keys(patch).length) {
    const wrote = await updateSite(siteId, patch);
    if (!wrote.ok) {
      wiringWarning =
        `LEAD WIRING NOT SAVED (${Object.keys(patch).join(", ")})` +
        `${wrote.error ? ` — ${wrote.error}` : ""}. Her leads will not reach her until this is ` +
        `set in Website settings.`;
      console.error(`[onboard] ${siteId}: ${wiringWarning}`);
    }
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

  // The token is minted here and appears only in the URL below — there is no second copy to
  // look up later, by design. Reopening from /api/admin/intake mints a new one.
  const { token: intakeToken } = await openIntake(siteId);

  return Response.json({
    ok: true,
    siteId,
    onboardUrl: onboardUrlFor({ id: siteId, domain: site?.domain }, intakeToken),
    sheetUrl,
    editUrl: `${origin}/edit/${siteId}/home`,
    reused: Boolean(already),
    // Present only when something needs a human. Everything else here is a success field.
    // Both are collected — a call can fail the share AND the wiring, and reporting one would
    // make the other look fine.
    ...(shareWarning || wiringWarning
      ? { warning: [shareWarning, wiringWarning].filter(Boolean).join(" · ") }
      : {}),
  });
}
