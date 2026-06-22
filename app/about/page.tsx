import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CtaButton from "@/components/CtaButton";

export default function About() {
  return (
    <>
      <Nav />
      <main>
        {/* Section 1 — Hero */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr] md:items-center md:py-24">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
                My story
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
                Five businesses. Forty years. I&apos;ve been the tech guy in the founder&apos;s
                chair the whole time.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
                You already know you need AI. Everyone&apos;s telling you. What you actually
                need is the person who installs it on top of the business you already run &mdash;
                and hands you the keys.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <Image
                src="/about-headshot.webp"
                alt="Steven Barchetti, founder of Steven James Consulting"
                width={490}
                height={766}
                sizes="(min-width: 768px) 240px, 208px"
                className="w-52 rounded-xl shadow-lg md:w-60"
              />
              <div className="mt-4 w-52 text-center md:w-60">
                <p className="text-sm font-semibold text-[color:var(--color-sjc-ink)] md:text-xs">Steven Barchetti</p>
                <p className="text-sm font-semibold text-[color:var(--color-sjc-ink)] md:text-xs">Founder &middot; 40-Year Tech Lead</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 — The closed loop */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              I&apos;m not a consultant who read about this in a book.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                I&apos;m Steven Barchetti. I&apos;ve run my own businesses for forty years &mdash;
                five of them, across five industries. A restaurant in 1986. A mortgage company
                with my brother. A roofing contractor. A trucking company I ran for twenty years.
                And now this.
              </p>
              <p>
                Here&apos;s the part most people miss. In every single one of those businesses, I
                wasn&apos;t just the owner. I was the tech guy. I built the websites. I set up the
                phone systems and the CRMs. I wired up the follow-up. I ran the ads. Whatever the
                technology of that decade was, I was the one installing it and keeping it running.
              </p>
              <p>
                So I&apos;ve been wearing your exact hat &mdash; for longer than most consultants
                have been alive. I know what it feels like to be great at the work and still buried
                under every other job in the company. I lived it five times.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 — The tools finally caught up */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              The tools just kept getting better. Then they finally caught up.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                Every decade gave me a slightly better toolbox. Phone, fax, the first websites,
                email marketing, the CRM. Each one helped. None of them ever did the actual work.
                They waited for me to push the button. They were tools, and I was still the one
                holding them.
              </p>
              <p>
                Over the last couple of years that changed. For the first time in forty years, I
                can install something that doesn&apos;t just sit there waiting &mdash; it goes to
                work. It answers the lead. It follows up. It books the appointment. It picks the
                cold leads back up. It holds a real seat in the business instead of being one more
                thing I have to run.
              </p>
              <p>
                I built it for myself first. Steven James Consulting runs on its own AI employees
                today &mdash; the same setup I install for clients. I&apos;m not selling you a
                theory. I&apos;m selling you the thing I already run on my own company.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 — The full circle / why me */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              That&apos;s why I&apos;m the partner who installs it and lets you keep control.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                Most people calling themselves AI consultants right now are reselling somebody
                else&apos;s tool. I&apos;m a systems guy who&apos;s been doing this work, by hand,
                in real businesses, since 1986. I just finally have the tools to do it right.
              </p>
              <p>
                I install AI on top of the business you already run. I don&apos;t rip out your
                systems. I don&apos;t take over your accounts. I operate the plumbing in the
                background so you don&apos;t have to think about it &mdash; and you keep your hand
                on every lead and every dollar.
              </p>
              <p className="font-semibold">
                You stay in control. You become the AI-first company. I&apos;m just the
                infrastructure you rent to keep it that way.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 — CTA */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              Want to see what this looks like on your business?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              We&apos;ll get on a quick call. You tell me how you run today, and I&apos;ll show you
              exactly where AI employees plug in &mdash; with you holding the keys the whole way.
            </p>
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
      </main>
      <Footer />
    </>
  );
}
