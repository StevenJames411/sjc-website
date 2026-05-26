import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CostComparisonChart from "@/components/CostComparisonChart";

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
                Five businesses. 40 years in the founder&apos;s trap. The tools finally caught up.
              </h1>
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
                <p className="text-sm font-semibold text-[color:var(--color-sjc-ink)] md:text-xs">Founder</p>
                <p className="text-sm font-semibold text-[color:var(--color-sjc-ink)] md:text-xs">40-Year Tech Lead</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 — The lies */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              I fell for all six entrepreneur lies.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                I&apos;m not writing about the six lies on this site because I read about them in a book.
                I&apos;m writing about them because I fell for every one of them.
              </p>
              <p>
                My first business was a restaurant in 1986. Then a mortgage company with my brother. Then
                six years of roofing &mdash; bidding jobs, ordering materials, managing crews. Then a
                trucking company I ran for 20 years. In every single business, two things were true: I was
                great at the actual work, and I was also the guy who built the websites, set up the CRMs,
                fixed the email systems. The technician AND the tech lead. Same person, wearing every hat.
              </p>
              <p>
                The lie was the same every time. I&apos;d be great at the craft. Then I&apos;d open my own
                shop &mdash; and suddenly the craft was the smallest part of my job. I was also the marketer.
                The salesperson. The hiring manager, the trainer, the person who had to fire people when it
                didn&apos;t work out. There were never enough hours in the day for any of it to be done well.
              </p>
              <p>
                I was sold the same dreams every small business owner is sold &mdash; financial freedom, time
                freedom, building something I could one day sell. None of them came true. Not because
                the dreams are fake. Because the math of running a small business by yourself doesn&apos;t
                work &mdash; no matter how good you are at one piece of it.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 — Why the old escape was broken */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              The solution everybody recommends only works if you&apos;re already a large company.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                Every business book gives the same advice: build a real org chart. Hire someone to handle
                marketing. Hire someone to handle sales. Hire a project manager. Fill every seat with a
                trained person.
              </p>
              <p>
                Fine advice if you&apos;re a corporation with deep pockets. For a small business it means
                expensive hires, months of training, and a payroll line you have to feed every month &mdash;
                whether business is up or down.
              </p>
              <p>
                And the person you finally trained walks out the door the moment someone offers them more
                money.
              </p>
              <p>
                Most small business owners can&apos;t afford the escape. So they stay stuck.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 — What changed */}
        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              Then the tools caught up.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                Over the last 24 months, the tools finally got good enough to actually execute the
                work &mdash; not just brainstorm it. Not tools you babysit, but actual employees that hold
                a role, take training, and ship work.
              </p>
              <p>
                I&apos;m not talking about a chatbot that answers questions. I&apos;m talking about an
                employee that runs an entire role end to end &mdash; receives a task, breaks it into steps,
                executes each one, checks its own work, and reports back when it&apos;s done. The same way a
                human employee would.
              </p>
              <p>
                They don&apos;t quit. They don&apos;t get poached. They don&apos;t burn out. They
                compound &mdash; every month they&apos;re a little better than the last, because the
                training from last quarter is still inside them.
              </p>
              <p>
                Here&apos;s what that does to the math. Filling a real org chart with human employees has
                always been the bottleneck &mdash; not because the people aren&apos;t worth it, but because
                there isn&apos;t enough revenue early on to support the payroll. Most small businesses never
                built a real org chart at all, because the price tag was a number they could never reach.
                That wasn&apos;t a leadership failure. It was a math problem.
              </p>
            </div>

            <div className="mt-10">
              <CostComparisonChart />
            </div>

            <div className="mt-10 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                And here&apos;s the part that changes the math for a small business: one AI employee can
                wear two or three hats without breaking. So you finally get the same checks and balances
                a giant corporation has &mdash; at the size of your business.
              </p>
              <p>
                Now that the cost has collapsed, a solo entrepreneur could afford five of these systems
                if they wanted to. The bottleneck has moved. The new problem isn&apos;t affording the
                team &mdash; it&apos;s finding someone capable of installing it. Most people calling
                themselves consultants right now are reselling tools. The talent to actually build an AI
                employee org chart end to end is rare, and the few of us who do it are filling up fast.
              </p>
              <div
                id="the-perfect-storm"
                className="mt-12 scroll-mt-24 rounded-2xl border-l-4 border-[color:var(--color-sjc-blue)] bg-blue-50/50 px-6 py-7 md:px-8 md:py-8"
              >
                <h3 className="text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl">
                  The Perfect Storm.
                </h3>
                <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                  Over the last 24 months, the landscape has matured enough to launch this. I&apos;ve
                  watched the space evolve through chatbots, voicebots, website builders, and so forth.
                  The tools have finally come together enough that I can build a real modular system for
                  a small business &mdash; and when a tool becomes obsolete, we swap it out and your
                  system keeps humming along in the background. That&apos;s a true first-principles
                  systems engineering approach.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 — Full circle */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              I&apos;ve come full circle.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                I&apos;ve been a systems engineer across five businesses and forty years. I just
                didn&apos;t know what to call it.
              </p>
              <p>
                Racing my own motorcycles, I&apos;d tear the whole bike apart between races to keep it in
                top condition. Every time I did, I&apos;d find myself staring at the manufacturer&apos;s
                choices and asking the same question: <em>why the hell did they put it together like
                this?</em> The engineers who designed it didn&apos;t care about my time. They built it the
                way it had always been built.
              </p>
              <p>
                That question &mdash; <em>why is this done this way, and how should it be done?</em> &mdash;
                has followed me through every business I&apos;ve worked in since. An org chart is a system.
                A sales process is a system. A hiring process is a system. I could always <em>see</em> those
                systems, in every business. I just couldn&apos;t install them at scale on my own.
              </p>
              <p>
                That&apos;s what changed. The tools got good enough to be the team of engineers. Now I can
                install the systems I&apos;ve always seen &mdash; on myself first, on my clients next.
              </p>
              <p>
                Steven James Consulting runs on its own AI employee org chart. Every seat except CEO is an
                AI employee. That&apos;s not a future plan; it&apos;s how the work gets done today. When I
                install the same system for you, I&apos;m installing what I already run on myself.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6 — Who this is for */}
        <section className="bg-white">
          <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              Who this is for.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                Founder-led businesses doing $1-2M in revenue. You&apos;ve got humans &mdash; they&apos;re
                good. But leads are slipping through the cracks because nobody&apos;s working them fast
                enough. The org chart has gaps nobody&apos;s filling. The AI employees don&apos;t replace
                your people &mdash; they give every human seat a counterpart that handles the volume.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7 — Assessment CTA */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              Think your business could survive without you?
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                Take the 30-second audit. You&apos;ll see exactly how many hats you&apos;re
                wearing &mdash; and what happens if you can&apos;t wear them tomorrow.
              </p>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
              <Link href="/assessment" className="btn-cta">
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
