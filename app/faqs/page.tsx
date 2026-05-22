import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CtaButton from "@/components/CtaButton";

const FAQS = [
  {
    q: "What does the assessment actually give me?",
    a: "A few minutes of questions about the twelve roles every business needs to run without you. You'll see which jobs are landing on your plate, which your current staff handles, and which are sitting vacant. Then I email you the full roadmap — every seat, every move, the path to take each one off your plate. Yours to keep, whether we work together or not.",
  },
  {
    q: "What does this cost?",
    a: "Assessment: free. Email roadmap: free. The build itself is priced per scope — usually a one-time installation fee plus monthly tooling that runs you a fraction of what those salaries would cost. No SaaS lock-in. No agency-forever traps. I'll quote real numbers after I see your assessment.",
  },
  {
    q: "What if I already have a team?",
    a: "Even better. AI sits as a layer above your humans — they keep doing the work that takes judgment (closing, creating, deciding) while AI absorbs the routine that's eating their week. Your team does more without costing more. Nobody gets laid off.",
  },
  {
    q: "Won't AI replace ME?",
    a: "No. AI replaces the work you don't want to be doing — inbox, scheduling, first drafts, routine follow-up. What it doesn't replace: your judgment, your taste, your relationships, your strategic calls. You stay CEO. Everything else gets covered.",
  },
  {
    q: "How is this different from buying ChatGPT and figuring it out myself?",
    a: "ChatGPT is a chat window. I install an operating system — position contracts per role, monitoring, repair routines, and full integration into your CRM, email, calendar, and pipeline. The DIY path is real, and it's hat number thirteen — you're now in the org-chart-building business on top of running your actual business. I do the build so you don't have to.",
  },
  {
    q: "Isn't this just hiring a VA?",
    a: "VAs replace tasks. AI replaces seats. VAs need training, management, schedules, and have human limits. AI employees follow position contracts, scale instantly, and live inside the tools you already use. VAs are humans. AI is infrastructure.",
  },
  {
    q: "How long does the install take?",
    a: "Most builds run 4–8 weeks depending on scope. I don't drag projects out — every week you're still wearing the hats is a week the business depends on you to function. We move fast.",
  },
  {
    q: "Doesn't Gerber say I need a real team?",
    a: "He wrote The E-Myth in 1986. The principle — build systems so the business runs without you — is right. The mechanism — hire humans into seats — was the only option then. In 2026, AI employees fill those seats following the same position contracts. Same org chart, same accountability, no payroll, no turnover, no HR.",
  },
];

export default function FAQs() {
  return (
    <>
      <Nav />
      <main>
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
            <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
              FAQs
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
              Questions before you find your gap.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
              The assessment shows you which of the twelve roles you&apos;re wearing, which your team covers, and which are sitting vacant. Here&apos;s what people ask before they take it.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <div className="space-y-10">
              {FAQS.map((f, i) => (
                <div key={f.q} className="border-b border-gray-200 pb-10 last:border-0">
                  <h2 className="text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl">
                    {i + 1}. {f.q}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              Ready to find your gap?
            </h2>
            <p className="mt-4 text-base text-[color:var(--color-sjc-ink)] md:text-lg">
              Take the assessment. You&apos;ll see exactly which seats you&apos;re still wearing &mdash; and get the roadmap to hand each one off.
            </p>
            <div className="mt-8 flex justify-center">
              <CtaButton />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
