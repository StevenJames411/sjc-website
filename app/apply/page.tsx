import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ApplyForm, { type Step, type Intro, type Booking } from "@/components/ApplyForm";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";
import { pageMetadata } from "@/lib/pageMeta";
import { SJC } from "@/lib/siteKeys";
import { findForm } from "@/lib/forms";
import { stepsOf, looksLikeSameForm } from "@/lib/formsShared";

// Public discovery-call intake. ALL copy comes from the Puck "apply" page (edited at
// /edit/apply) — intro, questions, the disclaimer, and the booking-step copy are every one an
// editable/deletable block, nothing user-facing is hardcoded. NOTE: /apply and /api/apply are
// allow-listed through the site password gate in middleware.ts so real prospects can reach this.
export const dynamic = "force-dynamic";

// Preview text too — edited at /edit/apply with no block selected (the Page Settings panel).
// What's below is only the fallback this page shipped with, used while the panel is empty.
export async function generateMetadata() {
  return pageMetadata("apply", {
    path: "/apply",
    title: "Apply — Steven James Consulting",
    description: "Tell us about your business. If it's a fit, we'll talk.",
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function extract(data: any): { intro: Intro; disclaimer: string; booking: Booking; steps: Step[] } {
  const content: any[] = Array.isArray(data?.content) ? data.content : [];

  // A labeled block's text by its id. A PRESENT block wins even if its text is empty — so
  // clearing the text in the editor hides that piece. An ABSENT id falls back to the default,
  // which keeps older published data (that predates a block) from rendering blank.
  const textById = (id: string, dflt: string) => {
    const b = content.find((x) => x?.props?.id === id);
    return b ? String(b.props?.text ?? "") : dflt;
  };

  const steps: Step[] = content
    .filter((b) => b?.type === "FormStep")
    .map((b, si) => {
      const kids: any[] = Array.isArray(b.props?.content) ? b.props.content : [];
      return {
        title: String(b.props?.title || ""),
        questions: kids
          .filter((q) => q?.type === "FormQuestion")
          .map((q, i) => ({
            key: String(q.props?.id || `q${si}-${i}`),
            label: String(q.props?.label || ""),
            type: (["text", "email", "phone", "choice", "multi"].includes(q.props?.questionType)
              ? q.props.questionType
              : "text") as Step["questions"][number]["type"],
            options: (Array.isArray(q.props?.options) ? q.props.options : [])
              .map((o: any) => String(o?.text || "").trim())
              .filter(Boolean),
            required: q.props?.required !== false,
          })),
      };
    });

  const intro: Intro = {
    eyebrow: textById("apply-eyebrow", "Apply to work with me"),
    title: textById("apply-h1", "We're not for everybody — and that's on purpose."),
    sub: textById(
      "apply-sub",
      "A few quick questions so we can see if we can actually help you. Takes under two minutes."
    ),
  };
  const disclaimer = textById("apply-disclaimer", ""); // no default → fully deletable
  const booking: Booking = {
    eyebrow: textById("apply-booking-eyebrow", "Got it"),
    heading: textById("apply-booking-h", "Last step — grab a time for your call."),
    sub: textById(
      "apply-booking-sub",
      "Pick a slot that works and we'll talk through exactly where AI employees plug into your business. No pitch — a real conversation about whether we can help."
    ),
  };
  return { intro, disclaimer, booking, steps };
}

/**
 * The wizard's steps, when the page has been LINKED to a library form in Page Settings.
 *
 * ⚠️ OPT-IN, AND BLANK BY DEFAULT. Unlinked — which is how this page ships and how it stays until
 * Steven picks a form — /apply reads its own FormStep blocks exactly as it always has. Nothing
 * about the live funnel changes on its own.
 *
 * ⚠️ ONLY THE QUESTIONS COME FROM THE LIBRARY. Intro, disclaimer and booking copy stay blocks on
 * the page, because they are page furniture and not questions.
 *
 * ⚠️ AND THE BLOCKS STILL WIN IF THE FORM IS GONE. A pointer at a deleted form falls back to the
 * FormStep blocks — which is exactly why linking does not delete them. Same rule as
 * lib/formPointer.ts: a dangling pointer degrades to STALE, never to EMPTY, and an empty /apply
 * is a public funnel that silently stops collecting.
 */
async function stepsFromLibrary(formId: string, pageKeys: string[]): Promise<Step[] | null> {
  const form = await findForm(formId);
  if (!form?.fields?.length) return null;

  // ⚠️ REFUSE A FORM THAT SHARES NO KEYS WITH THIS PAGE. Nobody rewrites all thirteen keys at
  // once, so zero overlap means the wrong form was picked in Page Settings — and the wrong form
  // here doesn't look broken, it looks fine and quietly starts a second set of columns in the
  // Discovery Intake sheet beside the orphaned first. Falling back to the blocks is the safe
  // direction: the page keeps collecting exactly what it collected yesterday.
  if (!looksLikeSameForm(form.fields.map((f) => f.fieldId), pageKeys)) {
    console.error(
      `[apply] IGNORING linked form '${formId}': none of its questions match this page's ` +
        `(${form.fields.map((f) => f.fieldId).join(",")} vs ${pageKeys.join(",")}). ` +
        `Using the page's own blocks. Link it to the library COPY of /apply, not another form.`
    );
    return null;
  }

  return stepsOf(form.fields).map((s) => ({
    title: s.title,
    questions: s.fields.map((f) => ({
      // ⚠️ THE KEY IS THE COLUMN IN THE DISCOVERY INTAKE SHEET, carried across verbatim. This is
      // the whole reason the library copy was made by READING this page rather than by retyping
      // its questions: link the wizard to a form whose keys don't match and the sheet quietly
      // starts a fresh set of columns, orphaning every application collected so far.
      key: f.fieldId,
      label: f.label,
      type: (f.type === "email"
        ? "email"
        : f.type === "tel"
          ? "phone"
          : f.type === "choice"
            ? "choice"
            : f.type === "multi"
              ? "multi"
            : "text") as Step["questions"][number]["type"],
      options: f.options || [],
      required: f.required !== false,
    })),
  }));
}

export default async function Apply() {
  const data = (await readPuckPublished("apply", SJC)) || seedFor("apply", "Apply");
  const { intro, disclaimer, booking, steps: blockSteps } = extract(data);

  // Set in Page Settings. On the PAGE rather than on a block, because thirteen questions spread
  // across several steps have no single block that owns them.
  const formId = String(
    (data as { root?: { props?: { formId?: string } } })?.root?.props?.formId || ""
  ).trim();
  const pageKeys = blockSteps.flatMap((s) => s.questions.map((q) => q.key));
  const steps = (formId ? await stepsFromLibrary(formId, pageKeys) : null) || blockSteps;
  return (
    <>
      <Nav />
      <main className="bg-[color:var(--color-sjc-bg-soft)]">
        <ApplyForm steps={steps} intro={intro} disclaimer={disclaimer} booking={booking} />
      </main>
      <Footer />
    </>
  );
}
