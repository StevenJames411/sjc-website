// Open, close, and read a business's onboarding form. OWNER ONLY.
//
//   GET  /api/admin/intake?site=<id>                 -> status, the link, and everything she's said
//   POST /api/admin/intake?site=<id>&action=open     -> switch it on
//   POST /api/admin/intake?site=<id>&action=close    -> switch it off
//
// Lives under /api/admin because middleware already guards that prefix. That matters more here
// than usual: the onboarding URL itself is public and guessable by design, so THIS is the only
// thing deciding whether it works. If opening a form were reachable by a stranger, the open/closed
// state would be decoration.
import { openIntake, closeIntake, intakeAccess } from "@/lib/intakeLinks";
import { readIntake, patchIntake, intakeSummaries } from "@/lib/intake";
import { findSite } from "@/lib/sites";
import { questionsFor, INTAKE_QUESTIONS } from "@/lib/intakeShared";

export const dynamic = "force-dynamic";

async function siteOr404(req: Request) {
  const id = (new URL(req.url).searchParams.get("site") || "").trim();
  if (!id) return { error: Response.json({ ok: false, error: "site required" }, { status: 400 }) };
  const site = await findSite(id);
  if (!site) return { error: Response.json({ ok: false, error: `no site '${id}'` }, { status: 404 }) };
  return { id, site };
}

export async function GET(req: Request) {
  const found = await siteOr404(req);
  if (found.error) return found.error;
  const { id, site } = found;

  const access = await intakeAccess(id);
  const record = await readIntake(id);
  const asked = questionsFor(site);
  // The SAME count the gallery card shows. Computing it separately here is how the card ended up
  // saying "5 of 9" while this said "4 of 9" for the same client at the same moment.
  const summary = (await intakeSummaries([{ id }]))[id];

  // Her answers with the question text beside them, so this is readable without cross-referencing
  // the code to find out what "wantMore" was asking.
  const answers = INTAKE_QUESTIONS.filter((q) => record.answers[q.id]).map((q) => ({
    question: q.label,
    answer: record.answers[q.id],
  }));

  return Response.json({
    ok: true,
    site: id,
    url: `${new URL(req.url).origin}/${id}/onboard`,
    status: access?.status || "never opened",
    openedAt: access?.openedAt || null,
    lastUsedAt: access?.lastUsedAt || null,
    closedBecause: access?.closedBecause || null,
    // What she'll be asked — a prospected client sees fewer, and this is how to check that
    // before sending the link.
    willAsk: asked.map((q) => q.id),
    // ONE definition of "answered", shared with the gallery card — photos count as one of her
    // questions, because they are one. Two counts of the same thing that disagree (the card said
    // 5 of 9 while this said 4 of 9) make the number worthless.
    progress: `${summary.answered} of ${summary.asked} answered · ${summary.photos} photos`,
    submittedAt: record.submittedAt || null,
    stoppedBecause: record.stoppedBecause || null,
    answers,
    photos: record.photos,
  });
}

export async function POST(req: Request) {
  const found = await siteOr404(req);
  if (found.error) return found.error;
  const { id } = found;

  const action = new URL(req.url).searchParams.get("action");
  if (action === "open") {
    const ok = await openIntake(id);
    // REOPENING MEANS "KEEP GOING". Without this, a form she already submitted reopens straight
    // onto "Got it — thank you", with no way to add the photos that were the whole reason for
    // opening it again. Her answers stay; only the finished flag is lifted.
    await patchIntake(id, { submittedAt: "", stoppedBecause: "" });
    return Response.json({ ok, status: "open", url: `${new URL(req.url).origin}/${id}/onboard` });
  }
  if (action === "close") {
    const ok = await closeIntake(id, "closed by Steven");
    return Response.json({ ok, status: "closed" });
  }
  return Response.json({ ok: false, error: "action must be open or close" }, { status: 400 });
}
