import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ApplyForm, { type Step, type Intro } from "@/components/ApplyForm";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";

// Public discovery-call intake. Content comes from the Puck "apply" page (edited at /edit/apply)
// — steps/questions/intro are all editable, nothing hardcoded. NOTE: /apply and /api/apply are
// allow-listed through the site password gate in middleware.ts so real prospects can reach this.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apply — Steven James Consulting",
  description: "Tell us about your business. If it's a fit, we'll talk.",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function extract(data: any): { intro: Intro; steps: Step[] } {
  const content: any[] = Array.isArray(data?.content) ? data.content : [];
  const leadTexts: string[] = [];
  let headline = "";
  const steps: Step[] = [];

  for (const b of content) {
    if (b?.type === "FormStep") {
      const kids: any[] = Array.isArray(b.props?.content) ? b.props.content : [];
      steps.push({
        title: String(b.props?.title || ""),
        questions: kids
          .filter((q) => q?.type === "FormQuestion")
          .map((q, i) => ({
            key: String(q.props?.id || `q${steps.length}-${i}`),
            label: String(q.props?.label || ""),
            type: (["text", "email", "phone", "choice"].includes(q.props?.questionType)
              ? q.props.questionType
              : "text") as Step["questions"][number]["type"],
            options: (Array.isArray(q.props?.options) ? q.props.options : [])
              .map((o: any) => String(o?.text || "").trim())
              .filter(Boolean),
            required: q.props?.required !== false,
          })),
      });
    } else if (b?.type === "Heading" && !headline) {
      headline = String(b.props?.text || "");
    } else if (b?.type === "Text") {
      leadTexts.push(String(b.props?.text || ""));
    }
  }

  const intro: Intro = {
    eyebrow: leadTexts[0] || "Apply to work with me",
    title: headline || "We're not for everybody — and that's on purpose.",
    sub:
      leadTexts[1] ||
      "A few quick questions so we can see if we can actually help you. Takes under two minutes.",
  };
  return { intro, steps };
}

export default async function Apply() {
  const data = (await readPuckPublished("apply")) || seedFor("apply", "Apply");
  const { intro, steps } = extract(data);
  return (
    <>
      <Nav />
      <main className="bg-[color:var(--color-sjc-bg-soft)]">
        <ApplyForm steps={steps} intro={intro} />
      </main>
      <Footer />
    </>
  );
}
