import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CtaButton from "@/components/CtaButton";
import MedSpaWound from "@/components/medspa/MedSpaWound";
import MedSpaStep from "@/components/medspa/MedSpaStep";
import MedSpaPricing from "@/components/medspa/MedSpaPricing";
import EditablePage from "@/components/edit/EditablePage";
import Editable from "@/components/edit/Editable";
import { readPublished } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI employees for med spas | Steven James Consulting",
  description:
    "The leads you already paid for, answered and booked the second they land. AI employees installed into your med spa — done for you.",
};

export default async function MedSpaPage() {
  const published = await readPublished("med-spa");

  return (
    <>
      <Nav />

      <main>
        <EditablePage pageKey="med-spa" published={published}>
          {/* Hero */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-4xl px-6 pt-6 pb-16 text-center md:pt-10 md:pb-24">
              <Editable
                tid="med-spa.hero.eyebrow"
                as="p"
                className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
              >
                Med Spa AI Employees
              </Editable>
              <Editable
                tid="med-spa.hero.h1"
                as="h1"
                className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl"
              >
                AI employees for med spas — the leads you already paid for, answered and booked the second they land.
              </Editable>
              <Editable
                tid="med-spa.hero.sub1"
                as="p"
                className="mx-auto mt-5 max-w-2xl text-xl font-semibold text-[color:var(--color-sjc-blue)] md:text-2xl"
              >
                You&apos;ve tried to hire help, more than once, in every corner of the business. It never sticks — you end up with a handful of average people and all the real work still on you. And it&apos;s quietly worn you down.
              </Editable>
              <Editable
                tid="med-spa.hero.sub2"
                as="p"
                className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--color-sjc-mute)] md:text-lg"
              >
                The game just changed. As your growth partner, the first thing I install is your first AI employee — a salesperson better than any you could hire, aimed straight at your growth. We start there.
              </Editable>
              <div className="mt-10 flex justify-center">
                <CtaButton
                  title="Book the Call"
                  subtitle="See exactly what we'd install — and what you'd control."
                />
              </div>
            </div>
          </section>

          <MedSpaWound />
          <MedSpaStep />
          <MedSpaPricing />

          {/* Buyer CTA */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
              <Editable
                tid="med-spa.cta.eyebrow"
                as="p"
                className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
              >
                Your Next Move
              </Editable>
              <Editable
                tid="med-spa.cta.h2"
                as="h2"
                className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl"
              >
                You always knew you needed this. The employee you could never find or keep now exists.
              </Editable>
              <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
                <Editable tid="med-spa.cta.p1" as="p">
                  Get on a quick call. Tell me how you run today, and I&apos;ll show you exactly where your first AI employee plugs in — starting with speed to lead.
                </Editable>
                <Editable tid="med-spa.cta.p2" as="p" className="font-semibold">
                  I install it. You turn it on. You stay in command.
                </Editable>
              </div>
              <div className="mt-10 flex justify-center">
                <CtaButton
                  title="Book the Call"
                  subtitle="A quick call. No pitch deck — just where AI fits on your business."
                />
              </div>
            </div>
          </section>
        </EditablePage>
      </main>

      <Footer />
    </>
  );
}
