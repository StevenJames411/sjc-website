// Mint an intake link, and read back what the business owner has filled in so far.
//
//   GET /api/admin/intake-link?site=<id>[&days=45]
//     -> { url, expires, record: { answers, photos, submittedAt, updatedAt } }
//
// OWNER ONLY. It lives under /api/admin precisely because middleware already guards that prefix —
// the minting endpoint has to be harder to reach than the links it produces, or the token is
// decoration. (The intake routes themselves are public by necessity and carry their own gate.)
import { mintIntakeToken } from "@/lib/intakeToken";
import { readIntake } from "@/lib/intake";
import { findSite } from "@/lib/sites";
import { questionsFor } from "@/lib/intakeShared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const site = (url.searchParams.get("site") || "").trim();
  if (!site) return Response.json({ ok: false, error: "site required" }, { status: 400 });

  const record = await findSite(site);
  if (!record) return Response.json({ ok: false, error: `no site '${site}'` }, { status: 404 });

  const days = Math.min(180, Math.max(1, Number(url.searchParams.get("days")) || 45));
  const token = mintIntakeToken(site, days);
  if (!token) {
    return Response.json(
      { ok: false, error: "SITE_EDIT_TOKEN is not set, so links can't be signed" },
      { status: 503 }
    );
  }

  const intake = await readIntake(site);
  const asked = questionsFor(record);

  return Response.json({
    ok: true,
    url: `${url.origin}/start/${site}?k=${token}`,
    expires: new Date(Date.now() + days * 86400_000).toISOString(),
    // What she'll actually be asked — the point being that a prospected client sees fewer
    // questions, and this is how Steven checks that before sending the link.
    willAsk: asked.map((q) => q.id),
    answeredAlready: Object.keys(intake.answers).length,
    photos: intake.photos.length,
    submittedAt: intake.submittedAt || null,
    updatedAt: intake.updatedAt || null,
    stoppedBecause: intake.stoppedBecause || null,
    record: intake,
  });
}
