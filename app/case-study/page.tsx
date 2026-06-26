import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CtaButton from "@/components/CtaButton";
import EditablePage from "@/components/edit/EditablePage";
import PublishedOrFallback from "@/components/puck/PublishedOrFallback";
import Editable from "@/components/edit/Editable";
import { readPublished } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

const RECEIPTS = [
  { value: "Instant", label: "Every lead answered the second it comes in" },
  { value: "4", label: "Consults booked in the first 90 minutes live" },
  { value: "Sunday night", label: "When a human would've been asleep" },
];

const DID = [
  {
    title: "Answered every lead the instant it landed",
    body: "A lead fills out the form at 9:47 on a Sunday night. Before, it sat in the CRM until Monday morning — cold, or gone to a competitor. Now it gets a real reply in seconds, every time, day or night.",
  },
  {
    title: "Booked the consult on its own",
    body: "It doesn't just say hello and wait. It asks the right questions, handles the price objection the way the owner handles it, answers what it can, and walks the lead onto the calendar. Four of them in the first hour and a half.",
  },
  {
    title: "Went back and woke up the cold leads",
    body: "Every business is sitting on a list of leads that went quiet. Instead of letting them rot, the AI employee reaches back out, restarts the conversation, and pulls the ones who are ready back into the pipeline.",
  },
];

export default async function CaseStudy() {
  const published = await readPublished("case-study");
  return (
    <>
      <Nav />
      <main>
       <PublishedOrFallback page="case-study">
        <EditablePage pageKey="case-study" published={published}>
          {/* Section 1 — Hero */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
              <Editable tid="case-study.s1.eyebrow" as="p" className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
                The proof
              </Editable>
              <Editable tid="case-study.h1" as="h1" className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
                The machine is the receipt.
              </Editable>
              <Editable tid="case-study.s1.lead" as="p" className="mt-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
                You don&apos;t have to take my word for what a dynamic AI employee does. Here&apos;s one already doing it &mdash; in a real business, with real leads, on a Sunday night.
              </Editable>
            </div>
          </section>

          {/* Section 2 — The before */}
          <section className="bg-white">
            <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
              <Editable tid="case-study.s2.h2" as="h2" className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                The setup: good leads, slow follow-up.
              </Editable>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                <Editable tid="case-study.s2.p1" as="p">
                  A med spa was running paid ads and getting plenty of leads. The problem was the same one almost every owner has. Leads filled out the form, landed in the CRM, and sat there. By the time someone got around to calling, the lead had gone cold &mdash; or already booked somewhere else.
                </Editable>
                <Editable tid="case-study.s2.p2" as="p">
                  They&apos;d already tried the usual fix: an automated email-and-text follow-up that fired off a few canned messages and stopped. That&apos;s step one &mdash; a script that waits. It helps a little, then runs out of road. It can&apos;t hold a real conversation, can&apos;t answer a question, and can&apos;t get anyone onto the calendar. It just waits.
                </Editable>
              </div>
            </div>
          </section>

          {/* Section 3 — What we installed */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
              <Editable tid="case-study.s3.h2" as="h2" className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                What we installed: a dynamic AI employee.
              </Editable>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                <Editable tid="case-study.s3.p1" as="p">
                  We took the owner&apos;s own sales conversations &mdash; how he answers questions, how he handles the price objection, how he talks to people &mdash; and trained an AI employee on all of it. We named her Chloe.
                </Editable>
                <Editable tid="case-study.s3.p2" as="p">
                  This is step two. Not a script that waits for someone to reply. An employee that goes to work: she answers the lead, holds a real back-and-forth, handles objections in the owner&apos;s own words, and books the appointment herself. She sounds like the owner trained her &mdash; because he did, through his own recordings.
                </Editable>
              </div>
            </div>
          </section>

          {/* Section 4 — What she actually did */}
          <section className="bg-white">
            <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
              <Editable tid="case-study.s4.h2" as="h2" className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                What she actually did.
              </Editable>
              <div className="mt-8 space-y-6">
                {DID.map((d, i) => (
                  <div
                    key={d.title}
                    className="rounded-2xl border-l-4 border-[color:var(--color-sjc-blue)] bg-blue-50/50 px-6 py-7 md:px-8"
                  >
                    <Editable tid={`case-study.did${i}.title`} as="h3" className="text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl">
                      {d.title}
                    </Editable>
                    <Editable tid={`case-study.did${i}.body`} as="p" className="mt-3 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                      {d.body}
                    </Editable>
                  </div>
                ))}
              </div>

              <div className="mt-12 grid gap-5 md:grid-cols-3">
                {RECEIPTS.map((r, i) => (
                  <div
                    key={r.label}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-7 text-center shadow-sm"
                  >
                    <Editable tid={`case-study.receipt${i}.value`} as="p" className="text-2xl font-bold text-[color:var(--color-sjc-blue)] md:text-3xl">
                      {r.value}
                    </Editable>
                    <Editable tid={`case-study.receipt${i}.label`} as="p" className="mt-2 text-sm font-semibold text-[color:var(--color-sjc-ink)]">
                      {r.label}
                    </Editable>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5 — The point */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
              <Editable tid="case-study.s5.h2" as="h2" className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                And the owner kept the keys the whole time.
              </Editable>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                <Editable tid="case-study.s5.p1" as="p">
                  Chloe runs on top of the business the owner already had. His CRM. His calendar. His leads. His pricing. Nothing got ripped out and nothing got taken away. I operate the plumbing in the background so he doesn&apos;t have to &mdash; and he can watch every conversation and every booking as it happens.
                </Editable>
                <Editable tid="case-study.s5.p2" as="p" className="font-semibold">
                  That&apos;s the whole idea. You become the AI-first company, the machine does the work, and your hand stays on every lead and every dollar.
                </Editable>
              </div>
            </div>
          </section>

          {/* Section 6 — CTA */}
          <section className="bg-white">
            <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
              <Editable tid="case-study.s6.h2" as="h2" className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                Want one of these answering your leads?
              </Editable>
              <Editable tid="case-study.s6.p" as="p" className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                Apply to work with me. I&apos;ll show you exactly where a dynamic AI employee plugs into the business you already run.
              </Editable>
              <div className="mt-8 flex flex-col items-center gap-4">
                <CtaButton
                  title="Apply to work with me"
                  subtitle="See where a dynamic AI employee plugs into your business."
                  href="/#contact"
                />
                <a
                  href="tel:+12102982343"
                  className="text-sm font-semibold text-[color:var(--color-sjc-blue)] hover:underline"
                >
                  Or call me directly: (210) 298-2343
                </a>
              </div>
            </div>
          </section>
        </EditablePage>
       </PublishedOrFallback>
      </main>
      <Footer />
    </>
  );
}
