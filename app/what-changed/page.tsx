import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CtaButton from "@/components/CtaButton";
import EditablePage from "@/components/edit/EditablePage";
import Editable from "@/components/edit/Editable";
import PublishedOrFallback from "@/components/puck/PublishedOrFallback";
import { readPublished } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "What Changed | Steven James Consulting",
  description:
    "For forty years the one employee you needed didn't exist. A couple of years ago, that changed. The breakthrough the whole business stands on.",
};

export default async function WhatChanged() {
  const published = await readPublished("what-changed");
  return (
    <>
      <Nav />
      <main>
       <PublishedOrFallback page="what-changed">
        <EditablePage pageKey="what-changed" published={published}>
          {/* Section 1 — Hero */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
              <Editable tid="what-changed.s1.eyebrow" as="p" className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
                What changed
              </Editable>
              <Editable tid="what-changed.h1" as="h1" className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
                The hire you could never make finally exists.
              </Editable>
              <Editable tid="what-changed.s1.lead" as="p" className="mt-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
                For forty years I needed one thing I could never get my hands on: an employee who would actually show up, learn the job, and do it right every time. It didn&apos;t exist &mdash; not for a business my size. A couple of years ago that changed, and it changes everything about the business you&apos;re running right now.
              </Editable>
            </div>
          </section>

          {/* Section 2 — The before */}
          <section className="bg-white">
            <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
              <Editable tid="what-changed.s2.h2" as="h2" className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                For forty years, the org chart was a fantasy.
              </Editable>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                <Editable tid="what-changed.s2.p1" as="p">
                  Every business that grows past the owner needs the same thing: an org chart with the seats filled &mdash; someone on the phones, someone on follow-up, someone on sales, someone running operations. Michael Gerber wrote that down forty years ago, and he was right. The part nobody says out loud is that for a business your size, those seats were never really fillable. You couldn&apos;t find the people. The ones you found didn&apos;t stick. And even the average ones cost more than the work was worth.
                </Editable>
                <Editable tid="what-changed.s2.p2" as="p">
                  So every empty seat fell back on the one person who&apos;d always catch it &mdash; you. That&apos;s not a you problem; that&apos;s every owner-run business since the beginning. You became the system because there was never another option. The org chart on the wall and the org chart in real life were two different things, and the gap between them was always your own two hands.
                </Editable>
              </div>
            </div>
          </section>

          {/* Section 3 — The line technology crossed */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
              <Editable tid="what-changed.s3.h2" as="h2" className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                Then, for the first time, a tool did the work instead of waiting for you.
              </Editable>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                <Editable tid="what-changed.s3.p1" as="p">
                  Every tool before this one had the same flaw: it waited. The phone waited for you to dial. The CRM waited for you to type. The email blast waited for you to push the button. They were tools, and you were still the one holding them. Helpful &mdash; but not one of them ever filled a seat. They just gave you a faster way to do the work yourself.
                </Editable>
                <Editable tid="what-changed.s3.p2" as="p">
                  A couple of years ago the technology crossed a line it had never crossed before. For the first time, a tool doesn&apos;t wait &mdash; it works. Not a chatbot that answers one question and hands you back the job. A real AI employee: trained on the way YOU do it, it answers every lead the second it lands, holds a real conversation, handles the objection in your own words, books the appointment, and goes back to wake up the leads that went cold. It does the job the same way every time, it never quits, and you can see everything it does.
                </Editable>
                <Editable tid="what-changed.s3.p3" as="p" className="font-semibold">
                  That&apos;s the whole breakthrough. The seat that was never fillable is finally fillable &mdash; by something other than you. It was impossible your entire career. Now it&apos;s real. That&apos;s what changed.
                </Editable>
              </div>
            </div>
          </section>

          {/* Section 4 — What it means for you */}
          <section className="bg-white">
            <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
              <Editable tid="what-changed.s4.h2" as="h2" className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                What it means for the business you run.
              </Editable>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                <Editable tid="what-changed.s4.p1" as="p">
                  When the seats fill themselves, the lid comes off. The leads stop leaking. The follow-up actually happens. The work that used to live in your head and your calendar moves into a system you control &mdash; and for the first time, delegating tightens your grip instead of loosening it, because every conversation is logged and nothing lives in some new person&apos;s head where you can&apos;t see it.
                </Editable>
                <Editable tid="what-changed.s4.p2" as="p" className="font-semibold">
                  You stop owning a job. You start owning a business.
                </Editable>
              </div>
            </div>
          </section>

          {/* Section 5 — What it looks like (PRICING SLOT — Stage 2b drops the generic Gerber human-vs-AI chart here) */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
              <Editable tid="what-changed.s5.eyebrow" as="p" className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
                What it looks like
              </Editable>
              <Editable tid="what-changed.s5.h2" as="h2" className="mt-3 text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                An org chart you can finally afford.
              </Editable>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                <Editable tid="what-changed.s5.p1" as="p">
                  Picture the seats you&apos;d fill with people &mdash; front desk, follow-up, sales, the admin that eats your week &mdash; and what that costs in salary, training, and turnover, year after year, assuming you could even keep them. Now picture the same org chart filled by AI employees: built once, running every day, for a fraction of a single human wage.
                </Editable>
                <Editable tid="what-changed.s5.p2" as="p">
                  That&apos;s the trade: a one-time build to install and train it on your business, and a flat monthly to keep it running &mdash; the same way you already pay for the software you run on. We walk the exact numbers for your setup on the call.
                </Editable>
              </div>
              {/* STAGE 2b: insert the generic Gerber human-org-chart vs AI-org-chart CostComparisonChart here. */}
            </div>
          </section>

          {/* Section 6 — The gate */}
          <section className="bg-white">
            <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
              <Editable tid="what-changed.s6.h2" as="h2" className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                The shift already happened. The only question is who installs it first.
              </Editable>
              <div className="mx-auto mt-6 max-w-2xl space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                <Editable tid="what-changed.s6.p1" as="p">
                  Everyone in your market is about to be running on this. The only question is whether you&apos;re early or late &mdash; and the owners who put it in now own the head start, because their leads get answered the instant they land while everyone else&apos;s still sit in a voicemail box until Monday.
                </Editable>
                <Editable tid="what-changed.s6.p2" as="p" className="font-semibold">
                  I install it. You stay in command.
                </Editable>
              </div>
              <div className="mt-8 flex flex-col items-center gap-4">
                <CtaButton
                  title="Apply to work with me"
                  subtitle="I'll show you exactly where it plugs into the business you already run."
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
