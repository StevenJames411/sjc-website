// The intake form's read/write endpoint. PUBLIC by necessity, token-gated by design.
//
//   GET  /api/intake?site=<id>   -> { answers, photos, submittedAt }
//   PUT  /api/intake?site=<id>   { answers?, submittedAt?, stoppedBecause? } -> { ok }
//
// ⚠️ THE GUARD IS THE OPEN STATE, NOT THE URL. Steven chose a guessable address so the link is
// usable — she can be told it over the phone. That means this route must refuse every site that
// isn't actively being onboarded, and must fail closed for one nobody has opened.
import { checkIntakeOpen, closeIntake } from "@/lib/intakeLinks";
import { readIntake, patchIntake, copyIntakeToSheet, applyAnswersToSite } from "@/lib/intake";
import { findSite } from "@/lib/sites";
import type { IntakeAnswers } from "@/lib/intakeShared";

export const dynamic = "force-dynamic";

async function authorize(req: Request): Promise<{ siteId: string } | Response> {
  const siteId = (new URL(req.url).searchParams.get("site") || "").trim();
  if (!siteId) return Response.json({ ok: false, error: "site required" }, { status: 400 });
  // TWO guards since 2026-08-12: the form must be OPEN, and the caller must hold its link token.
  // A site nobody opened fails closed, so this can never be a write path into a business that
  // isn't onboarding — and the token means knowing the business name is no longer enough.
  //
  // ⚠️ THE ROUTE PROVES IT AGAIN. The page checked the token before rendering, but a route is
  // reachable directly with curl and cannot assume anyone rendered the page first — that is
  // exactly how this endpoint was readable and writable by anyone who guessed the business name.
  const open = await checkIntakeOpen(siteId, new URL(req.url).searchParams.get("k") || "");
  if (!open.ok) return Response.json({ ok: false, error: "form is closed" }, { status: 403 });
  return { siteId };
}

export async function GET(req: Request) {
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;
  const record = await readIntake(auth.siteId);
  return Response.json({ ok: true, ...record });
}

export async function PUT(req: Request) {
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  let body: { answers?: IntakeAnswers; submittedAt?: string; stoppedBecause?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // A form field is a text box on the open internet. Cap it so a stored answer can't be used to
  // bloat the record — this is the one write path a stranger can reach.
  const answers: IntakeAnswers = {};
  for (const [k, v] of Object.entries(body.answers || {})) {
    if (typeof v === "string") answers[k] = v.slice(0, 4000);
    else if (Array.isArray(v)) answers[k] = v.slice(0, 60).map((x) => String(x).slice(0, 500));
  }

  const { ok, reason } = await patchIntake(auth.siteId, {
    answers,
    ...(body.submittedAt ? { submittedAt: body.submittedAt } : {}),
    ...(body.stoppedBecause ? { stoppedBecause: body.stoppedBecause.slice(0, 500) } : {}),
  });

  // THE LINK CLOSES ITSELF. Steven's objection to a manual open/close was that somebody always
  // forgets — so the completion event does it. She submits, every open link for this site flips
  // to expired. Reopening stays a deliberate act, which is the one nobody forgets.
  if (ok && (body.submittedAt || body.stoppedBecause)) {
    await closeIntake(auth.siteId, body.submittedAt ? "submitted" : "not a fit");

    // Carbon copy to the sheet, so Steven and a VA can read it without an admin URL. Only on a
    // real submission — a disqualified form has nothing worth a row. Failures are logged, never
    // raised: her answers are already stored, and telling her the form broke would be a lie.
    if (body.submittedAt) {
      // Her answers fill the blanks on her record, so the build starts from real facts instead
      // of Steven retyping what she just told us. Only empty fields — see applyAnswersToSite.
      const filled = await applyAnswersToSite(auth.siteId);
      if (filled.length) console.log(`[intake] ${auth.siteId} filled from answers: ${filled.join(", ")}`);

      const site = await findSite(auth.siteId);
      // The client's OWN sheet, never SJC's. Until that sheet exists this logs and moves on —
      // her answers are already stored, and the copy is a convenience, not the record.
      const problem = await copyIntakeToSheet(
        auth.siteId,
        site?.business?.name || site?.name || "",
        site?.sheetId
      );
      if (problem) console.error(`[intake] site=${auth.siteId} ${problem}`);
    }
  }

  // Same lesson as the Puck editor: a save that didn't save must never report success.
  return Response.json({ ok, reason }, { status: ok ? 200 : 409 });
}
