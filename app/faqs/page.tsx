import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CtaButton from "@/components/CtaButton";
import EditablePage from "@/components/edit/EditablePage";
import Editable from "@/components/edit/Editable";
import { readPublished } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

const FAQS = [
  {
    q: "Do I keep control of my leads, my data, and my accounts?",
    a: "Yes. You keep the keys to everything. It's your CRM, your calendar, your phone number, your leads, your money. I install the AI employees on top of what you already have and operate the plumbing in the background — the same way you rent your CRM or your email. I'm the infrastructure you rent, not the boss. Your hand stays on every lead and every dollar.",
  },
  {
    q: "How is this different from the chatbot or CRM I already have?",
    a: "What you have now is step one: a script that waits. It fires off a few canned messages and stops. It can't hold a real conversation, answer a real question, or get anyone onto your calendar. What I install is step two: a dynamic AI employee that goes to work. It answers every lead the instant it comes in, follows up, handles objections in your own words, books the appointment, and even reaches back out to your cold leads. One waits. The other works.",
  },
  {
    q: "What are the two things you actually install?",
    a: "First, Speed to Lead — every single lead gets answered the second it comes in, day or night, so nothing slips through the cracks while you sleep. Second, a dynamic AI employee infrastructure that doesn't just sit there: it follows up, it reactivates the leads who went quiet, and it books consults on its own. Both run on top of the business you already have.",
  },
  {
    q: "What does it cost — a build fee or a monthly?",
    a: "Both. There's a one-time build fee to install and train the system on your business, and a monthly to operate and maintain the plumbing so you never have to touch it. That's the standard model, the same as renting any other piece of infrastructure your business runs on. We go over the exact numbers for your setup on the call.",
  },
  {
    q: "What do you need from me to get started?",
    a: "A quick intake call. You tell me how you run today — how leads come in, what you use, how you sell — and I'll show you exactly where the AI employees plug in. From there I do the building. You stay in control the whole way; I just handle the wiring.",
  },
];

export default async function FAQs() {
  const published = await readPublished("faqs");
  return (
    <>
      <Nav />
      <main>
        <EditablePage pageKey="faqs" published={published}>
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
              <Editable tid="faqs.eyebrow" as="p" className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
                FAQs
              </Editable>
              <Editable tid="faqs.h1" as="h1" className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
                Questions before you book.
              </Editable>
              <Editable tid="faqs.lead" as="p" className="mt-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
                The short version: you become the AI-first company, the machine does the work, and you keep your hand on every lead and every dollar.
              </Editable>
            </div>
          </section>

          <section className="bg-white">
            <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
              <div className="space-y-10">
                {FAQS.map((f, i) => (
                  <div key={f.q} className="border-b border-gray-200 pb-10 last:border-0">
                    <h2 className="text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl">
                      {i + 1}.{" "}
                      <Editable tid={`faqs.q${i}`} as="span">{f.q}</Editable>
                    </h2>
                    <Editable tid={`faqs.a${i}`} as="p" className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                      {f.a}
                    </Editable>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
              <Editable tid="faqs.cta.h2" as="h2" className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
                Still have a question?
              </Editable>
              <Editable tid="faqs.cta.p" as="p" className="mt-4 text-base text-[color:var(--color-sjc-ink)] md:text-lg">
                Book a quick call and ask me directly. You&apos;ll leave knowing exactly where AI employees plug into your business &mdash; with you holding the keys.
              </Editable>
              <div className="mt-8 flex flex-col items-center gap-4">
                <CtaButton
                  title="Book the Call"
                  subtitle="A quick call to see where AI employees plug into your business."
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
      </main>
      <Footer />
    </>
  );
}
