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
                I&apos;m a solo entrepreneur, just like you. Forty years.
                Five businesses of my own.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
                And the whole time, I had the same problem you have. I could never find people
                worth the effort &mdash; people who&apos;d stick around, take the training, and
                actually do the job right. So I did it all myself. For forty years.
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
                <p className="text-sm font-semibold text-[color:var(--color-sjc-ink)] md:text-xs">Founder &middot; 40-Year Solo Entrepreneur</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 — The closed loop */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              I never could find people worth the effort.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                I&apos;m Steven Barchetti. I&apos;ve run my own businesses for forty years &mdash;
                five of them, in five different trades. A restaurant in 1986. A mortgage company
                with my brother. A roofing company. A trucking company I ran for twenty years.
                And now this.
              </p>
              <p>
                And in every one of them, I hit the same wall: I could never find people who&apos;d
                stick around, take the training, and be worth the effort. They quit. They cut
                corners. They went off and did their own thing. So I gave up on it and did
                everything myself &mdash; the work, the books, the follow-up, the ads, and yes, I
                was the computer guy too. Whatever needed doing, that was me.
              </p>
              <p>
                So I&apos;ve been sitting in your exact chair, doing 90% of it with my own two
                hands, longer than most of these consultants have been alive. I know what it feels
                like to be great at the work and still buried under every other job in the company.
                I lived it five times.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 — The tools finally caught up */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              Then, for the first time in forty years, that problem got solved.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                Every decade handed me a slightly better set of tools. Phone, fax, the first
                websites, email blasts, the customer list software. Each one helped a little. But
                not one of them ever did the actual work. They sat there and waited for me to push
                the button. They were tools, and I was still the one holding them.
              </p>
              <p>
                A couple of years ago that changed for good. For the first time, I could finally
                hire the employee I&apos;d been looking for my whole career &mdash; an AI employee.
                It takes the training. It doesn&apos;t quit. It doesn&apos;t go off and freelance.
                It doesn&apos;t call in sick or take days off. It answers every lead the second it
                comes in, follows up, books the appointment, and circles back on the cold ones. It
                does the job the same way every time, and I can see everything it does.
              </p>
              <p>
                Now here&apos;s the part that matters. Just about everyone else selling AI right now
                is selling you a chatbot &mdash; a little pop-up that answers a question and then
                hands you back the work. That&apos;s not an employee. What I do is build a real AI
                employee right into the same software you already use to run your business, so it
                works your leads and your calendar like a real member of your staff. That part is
                hard, and it&apos;s the part nobody else has figured out. I build it myself, by hand.
              </p>
              <p>
                I built it for my own company first. Steven James Consulting runs on its own AI
                employees today &mdash; the exact same thing I&apos;ll set up for you. I&apos;m not
                selling you an idea. I&apos;m selling you the thing I already run my own business on.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 — The full circle / why me */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              That&apos;s why I started this: to set it up for you, and put you in charge of it.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                Most people calling themselves AI consultants right now are just reselling somebody
                else&apos;s gadget. I&apos;m a guy who&apos;s been building this stuff with his own
                hands, in real businesses, since 1986. I just finally have what I need to do it the
                way it should be done.
              </p>
              <p>
                I set the AI employee up on top of the business you already run. I don&apos;t rip
                out what&apos;s working. I don&apos;t take the reins from you. I do the hard part in
                the background so you never have to think about it &mdash; and you keep your hand on
                every lead and every dollar.
              </p>
              <p className="font-semibold">
                You stay in charge. You&apos;re the one running it. I just build the thing and keep
                it running, so the whole machine answers to you.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 — CTA */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              Want to see what this would look like in your shop?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              Let&apos;s get on a quick call. You tell me how you run things today, and I&apos;ll
              show you exactly where an AI employee fits in &mdash; with you in charge the whole way.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <CtaButton
                title="Book the Call"
                subtitle="A quick call to see where an AI employee fits into your business."
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
