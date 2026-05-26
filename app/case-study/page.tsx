import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import IntakeCTA from "@/components/IntakeCTA";

export const metadata = {
  title: "Case Study: Chloe — Steven James Consulting",
  description:
    "How an AI employee named Chloe booked 4 appointments in 90 minutes on a Sunday night. Built from 1.6M characters of owner transcripts.",
};

const RESULTS = [
  "4 appointments booked in 90 minutes on first Sunday evening live",
  "~$4,948 potential lifetime value from one evening",
  "Multi-channel: SMS, Facebook Messenger, Instagram DMs, Google Chat",
  "24/7 operation — no human intervention needed",
  "Handles price objections, medical redirects, booking confirmations",
  "Auto-tags contacts, personalizes based on Facebook lead form answers",
];

export default function CaseStudy() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero — lead with the pain, not the solution */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-4xl px-6 pt-10 pb-16 text-center md:pt-14 md:pb-20">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
              Case Study Zero
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
              A med spa owner was losing 71% of his paid leads. They filled out the form and
              disappeared.
            </h1>
          </div>
        </section>

        {/* Section 1 — The Problem */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
              The Problem
            </p>
            <div className="mt-6 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
              <p>
                A med spa owner in south Texas was spending $150/day on Facebook ads. The ads
                were working &mdash; leads were coming in. But the owner was doing everything
                himself: consultations, follow-ups, intake, billing. By the time he got back to
                a new lead, they&apos;d already booked somewhere else or gone cold.
              </p>
              <p>
                Only 29% of leads were self-booking an appointment. The other 71% were just
                sitting there. That&apos;s 71 out of every 100 people who raised their hand and
                said &ldquo;I&apos;m interested&rdquo; &mdash; gone. The funnel leaked at the
                exact point where it should have converted.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 — The Build */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
              The Build
            </p>
            <div className="mt-6 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
              <p>
                We extracted 1.6 million characters of the owner&apos;s actual sales call
                transcripts. Not scripts someone wrote for him &mdash; his real calls with real
                patients. His objection handling. His pricing cadence. His $12/day reframe for
                sticker shock. The way he educates without diagnosing. The phrases he uses and
                the ones he never would.
              </p>
              <p>
                We fed all of this into an AI employee we named Chloe. She was trained on
                the owner&apos;s brain, not on a generic sales template. She speaks in 1-3
                sentences, like a real person texting. She handles SMS, Facebook Messenger,
                Instagram DMs, and Google chat &mdash; all channels, one employee.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 — The Clone, Not Copy Principle */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
              Clone, Not Copy
            </p>
            <div className="mt-6 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
              <p>
                Here&apos;s what makes this different from a chatbot. The owner is loose on his
                calls. He plays doctor sometimes &mdash; makes clinical-sounding statements a
                licensed employee should never repeat. He goes off-script when he&apos;s excited
                about a patient&apos;s progress.
              </p>
              <p>
                Chloe absorbed his best qualities and filtered out the liability. She knows
                everything he knows about the services, the pricing, the patient journey. But
                she only says what she should say. When someone asks a medical question, she
                redirects to the consultation. When someone pushes on price, she uses the
                owner&apos;s own reframe &mdash; but she never promises outcomes.
              </p>
              <p className="text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl">
                Deep knowledge is defensive, not offensive.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 — The Results */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
              The Results
            </p>
            <ul className="mt-8 space-y-4">
              {RESULTS.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-lg text-[color:var(--color-sjc-ink)]"
                >
                  <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--color-sjc-blue)]" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 5 — The Sales Psychology */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
            <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
              Why It Worked
            </p>
            <div className="mt-6 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
              <p>
                The leads were already raising their hands. Facebook ads had done their job
                &mdash; people were interested. The problem was nobody was working them.
              </p>
              <p>
                Chloe doesn&apos;t just answer questions. She moves toward the booking. When
                someone says &ldquo;I need to think about it,&rdquo; she acknowledges, redirects,
                and reframes. When someone pushes on price, she uses the owner&apos;s own
                $12/day math. Every conversation has a direction.
              </p>
              <p>
                That&apos;s not aggressive &mdash; it&apos;s what the lead signed up for when
                they filled out the form.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6 — CTA */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <p className="text-xl font-bold leading-snug text-[color:var(--color-sjc-ink)] md:text-2xl">
              That&apos;s one seat in the org chart. Chloe filled the Sales Manager role. Imagine
              all twelve seats filled &mdash; each one trained on the owner&apos;s best instincts,
              running 24/7 across every channel.
            </p>
          </div>
        </section>

        <IntakeCTA />
      </main>
      <Footer />
    </>
  );
}
