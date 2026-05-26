import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";

const FAQS = [
  {
    q: "What exactly do you install?",
    a: "An AI Employee Operating System — 5-6 AI employees covering the seats in your org chart that are either empty or sitting on the owner's plate. 2-3 of those are superhuman seats, cloned from your actual talent (sales calls, customer interactions, objection handling). The rest are utility seats (scheduling, follow-up, admin). Every employee is wired into your existing tools — CRM, calendar, email, pipeline.",
  },
  {
    q: "What does this cost?",
    a: "It depends on scope — the number of seats, the complexity of your systems, and how much owner talent needs to be extracted. We walk through all of that on a discovery call. What we can tell you: it’s a fraction of what you’d pay to hire humans for the same roles. No SaaS lock-in. No agency-forever traps. The technology we install is yours.",
  },
  {
    q: "How is this different from hiring a VA or buying ChatGPT?",
    a: "A VA replaces tasks. ChatGPT is a chat window. We install an operating system. Position contracts per role, monitoring, repair routines, and full integration into your tools. The AI employees don't just answer questions — they sell, they book, they follow up, they report. And they carry the owner's actual brain, not a generic template.",
  },
  {
    q: "What do you mean by 'cloned from the owner'?",
    a: "We extract the owner's recorded sales calls, customer interactions, and decision-making patterns — sometimes millions of characters of real transcripts. We train the AI employee on that material. The result sounds like the owner personally trained her, because he did. But the clone is curated — we absorb the best qualities and filter out the liability. The AI knows everything the owner knows, but it only says what it should say.",
  },
  {
    q: "How long does the install take?",
    a: "4-8 weeks depending on scope. We don't drag projects out. Every week you're still wearing the hats is a week the business depends on you to function.",
  },
  {
    q: "What happens if I want to leave?",
    a: "Everything we build is yours. Every vendor is swappable. There is zero lock-in. You can take the entire system to another provider, run it yourself, or shut it down. The retainer covers our ongoing maintenance — cancel it and the system still works, you just maintain it yourself.",
  },
  {
    q: "Will this increase my exit valuation?",
    a: "Yes. The biggest risk buyers see in small businesses is owner dependency. An operating system with documented position contracts, modular architecture, and commodity vendors removes that risk. The org chart runs without the owner. The system IS the asset.",
  },
  {
    q: "Who is this for?",
    a: "Founder-led businesses doing $1-2M in revenue. You've got humans who are good at what they do, but leads are slipping, follow-up is inconsistent, and the owner is still wearing too many hats. If your business would implode without you for 90 days, this is for you.",
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
              Questions before you book.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
              Everything you need to know about what we install and how it works.
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
              Think your business could survive without you?
            </h2>
            <p className="mt-4 text-base text-[color:var(--color-sjc-ink)] md:text-lg">
              Take the 30-second audit. You&apos;ll see exactly how many hats you&apos;re
              wearing &mdash; and what happens if you can&apos;t wear them tomorrow.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <Link
                href="/assessment"
                className="btn-cta"
              >
                <span>Take the Audit</span>
              </Link>
              <a
                href="tel:+12102982343"
                className="text-sm font-semibold text-[color:var(--color-sjc-blue)] hover:underline"
              >
                Or call us directly: (210) 298-2343
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
