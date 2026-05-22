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
                I&apos;m a systems engineer who can finally build a real org chart for a small business &mdash; installing AI employees.
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
                <p className="text-sm font-semibold text-[color:var(--color-sjc-ink)] md:text-xs">CTO</p>
                <p className="text-sm font-semibold text-[color:var(--color-sjc-ink)] md:text-xs">Systems Engineer</p>
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
                I started my first business when I was 8 years old, managing my own motorcycle race team — I
                was the rider, the mechanic, everything in between. Fifty years later, I&apos;ve worked in
                nine different industries. I was a mortgage broker. I ran roofing crews — bidding jobs,
                ordering materials, replacing roofs. I ran a restaurant — running the floor, ordering the
                food, training the staff.
              </p>
              <p>
                In every single business, two things were true. I was the technician — great at the actual
                work, the craft itself. And I was also the guy who built the websites, set up the CRMs,
                fixed the email systems. I had a foot in the technology too.
              </p>
              <p>
                The lie was the same every time. I&apos;d be great at the craft. Then I&apos;d open my own
                shop — and suddenly the craft was the smallest part of my job. I was also the marketer. The
                salesperson. The hiring manager, the trainer, the person who had to fire people when it
                didn&apos;t work out. There were never enough hours in the day for any of it to be done well.
              </p>
              <p>
                I was sold the same dreams every small business owner is sold — financial freedom, time
                freedom, building something I could one day sell. None of them came true for me. Not because
                the dreams are fake. Because the math of running a small business by yourself doesn&apos;t
                work — no matter how good you are at one piece of it.
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
                expensive hires, months of training, and a payroll line you have to feed every month —
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
              Then something changed.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                Over the last 24 months, AI has finally gotten good enough to start executing &mdash;
                not just talking with you. Not tools you have to babysit, but actual employees that hold
                a role, take training, and ship work.
              </p>
              <p>
                I&apos;m not talking about a chatbot that answers questions, or a copilot that suggests
                what you might want to write next. I&apos;m talking about an employee that runs an entire
                role end to end — receives a task, breaks it into steps, executes each one, checks its own
                work, and reports back when it&apos;s done. The same way a human employee would.
              </p>
              <p>
                They don&apos;t quit. They don&apos;t get poached. They don&apos;t burn out. They compound —
                every month they&apos;re a little better than the last, because the training I did last
                quarter is still inside them.
              </p>
              <p>
                Here&apos;s what that does to the math. Filling a real org chart with human employees has
                always been the bottleneck — not because the people aren&apos;t worth it, but because there
                isn&apos;t enough revenue early on to support the payroll. Most small and medium
                businesses never built a real org chart at all, because the price tag was a number they
                could never reach. That wasn&apos;t a leadership failure. It was a math problem.
              </p>
            </div>

            <div className="mt-10">
              <CostComparisonChart />
            </div>

            <div className="mt-10 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                And here&apos;s the part that changes the math for a small business: one AI employee can
                wear two or three hats without breaking. So you finally get the same checks and balances
                a giant corporation has — at the size of your business.
              </p>
              <p>
                Now that the cost has collapsed, a solo entrepreneur could afford five of these systems
                if they wanted to. The bottleneck has moved. The new problem isn&apos;t affording the team
                — it&apos;s finding someone capable of installing it. Most people calling themselves AI
                consultants right now are reselling tools. The talent to actually build an AI employee
                org chart end to end is rare, and the few of us who do it are filling up fast.
              </p>
              <p>
                This isn&apos;t a marginal improvement. It&apos;s a generational shift in what a small
                business can afford to be. My own career as a systems engineer is only possible because
                of what&apos;s happened in the last 24 months. I&apos;m not hyping it. The numbers in
                that chart are why I have a business to offer at all.
              </p>
              <div
                id="the-perfect-storm"
                className="mt-12 scroll-mt-24 rounded-2xl border-l-4 border-[color:var(--color-sjc-blue)] bg-blue-50/50 px-6 py-7 md:px-8 md:py-8"
              >
                <h3 className="text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl">
                  The Perfect Storm.
                </h3>
                <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                  Over the last 24 months, the landscape has matured enough to launch this new AI org
                  chart. I&apos;ve watched the space evolve through chatbots, voicebots, AI website
                  builders, and so forth. The tools have finally come together enough that I can build
                  a real modular system for a small business &mdash; and when a tool becomes obsolete,
                  we swap it out and your system keeps humming along in the background. That&apos;s a
                  true first-principles systems engineering approach.
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
                I&apos;ve been a systems engineer since I was 8 years old. I just didn&apos;t know what to
                call it.
              </p>
              <p>
                Racing my own motorcycles, I&apos;d tear the whole bike apart between races to keep it in
                top condition. Every time I did, I&apos;d find myself staring at the manufacturer&apos;s
                choices and asking the same question: <em>why the hell did they put it together like this?</em>{" "}
                I had to take the entire bike apart just to get the air cleaner out. The engineers who
                designed it didn&apos;t care about my time. They built it the way it had always been built.
              </p>
              <p>
                That question — <em>why is this done this way, and how should it be done?</em> — has
                followed me through every business I&apos;ve worked in since. An org chart is a system. A
                sales process is a system. A hiring process is a system. I could always <em>see</em> those
                systems, in every business. I just couldn&apos;t install them at scale on my own — not
                without a computer science degree and a team of engineers I couldn&apos;t afford.
              </p>
              <p>
                That&apos;s what changed. AI got good enough to be the team of engineers. Now I can install
                the systems I&apos;ve always seen — on myself first, on my clients next.
              </p>
              <p>
                Steven James Consulting runs on its own AI employee org chart. Every seat except CEO is an
                AI employee. That&apos;s not a future plan; it&apos;s how the work for clients gets done
                today. When I install the same system for you, I&apos;m installing what I already run on
                myself. The shape of your org chart will look a little different — some seats wearing
                multiple hats, sized to your business — but the structure is the same one every successful
                company uses.
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
            <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              I work with two kinds of businesses.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-sjc-blue)]">
                  The Solo Entrepreneur
                </p>
                <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                  You&apos;re doing every job in the company yourself. I install the full AI employee org
                  chart around you — so you stop being the marketing department, the sales department,
                  operations, and customer service all at once.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-sjc-blue)]">
                  The Small Team (3–5 people)
                </p>
                <p className="mt-4 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
                  You&apos;ve got a real team, but you&apos;re still outsized by much larger competitors.
                  I give every person on your team their own AI assistant. Now your 3–5 humans can output
                  like a company many times your size — and compete on a different field entirely.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7 — Assessment teaser */}
        <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <h2 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
              I&apos;ve got something special for you, and I&apos;m excited to share it with you.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
              <p>
                You&apos;re a rock star at the work. I&apos;m a rock star at the systems behind it.
                For the first time, we can actually team up &mdash; which means you stop wearing
                every hat, get back to the work you opened the doors to do, and finally get the
                time, the money, the legacy you opened it for.
              </p>
              <p>
                The assessment maps your company seat by seat. You walk away with a full plan
                &mdash; every role, every cost, every move. Build it with me, or build it yourself
                if you want another hat to wear.
              </p>
            </div>
            <p className="mt-8 text-center text-xl font-bold leading-snug text-[color:var(--color-sjc-blue)] md:text-2xl">
              Show me my current blind spots and what to do about it.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/assessment" className="btn-cta">
                <span>Click here. Get started. &rarr;</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
