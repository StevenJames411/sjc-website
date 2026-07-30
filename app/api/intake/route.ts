// The intake form's read/write endpoint. PUBLIC by necessity, token-gated by design.
//
//   GET  /api/intake?site=<id>&k=<token>   -> { answers, photos, submittedAt }
//   PUT  /api/intake?site=<id>&k=<token>   { answers?, submittedAt?, stoppedBecause? } -> { ok }
//
// ⚠️ THE RULE THIS FILE EXISTS TO ENFORCE: the site id is read from the SIGNED TOKEN, never from
// the query string. `?site=` is only ever used to fail fast on an obvious mismatch. If the id came
// from the URL, anyone holding one valid link could read and overwrite every other client's
// answers by editing one word — the failure that ends a business, not an afternoon.
import { readIntakeToken } from "@/lib/intakeToken";
import { readIntake, patchIntake } from "@/lib/intake";
import type { IntakeAnswers } from "@/lib/intakeShared";

export const dynamic = "force-dynamic";

function authorize(req: Request): { siteId: string } | Response {
  const url = new URL(req.url);
  const check = readIntakeToken(url.searchParams.get("k"));
  if (!check.ok) {
    return Response.json({ ok: false, error: "link not valid" }, { status: 401 });
  }
  const claimed = url.searchParams.get("site");
  if (claimed && claimed !== check.siteId) {
    // The token is real but points somewhere else — that's someone editing the URL.
    return Response.json({ ok: false, error: "link not valid" }, { status: 403 });
  }
  return { siteId: check.siteId };
}

export async function GET(req: Request) {
  const auth = authorize(req);
  if (auth instanceof Response) return auth;
  const record = await readIntake(auth.siteId);
  return Response.json({ ok: true, ...record });
}

export async function PUT(req: Request) {
  const auth = authorize(req);
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

  // Same lesson as the Puck editor: a save that didn't save must never report success.
  return Response.json({ ok, reason }, { status: ok ? 200 : 409 });
}
