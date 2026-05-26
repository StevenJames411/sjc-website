import Image from "next/image";

export default function About() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.4fr_1fr] md:items-center md:py-24">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
            The Builder
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
            Not a consultant who read about this in a blog post.
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
            <p>
              I&apos;m Steven Barchetti. I&apos;ve been the tech lead in my own businesses for 40 years.
              Five different companies across five industries &mdash; a restaurant in 1986, a mortgage
              company, a roofing contractor, a trucking company I ran for 20 years, and now this.
            </p>
            <p>
              In every single one, I was great at the work &mdash; and stuck running every other job in the
              company too. I built the websites, set up the CRMs, fixed the email systems, ran the ads. I
              was the technician AND the IT department. Same trap, different decade.
            </p>
            <p>
              The tools just kept getting better. But they never got good enough to actually replace
              the seats &mdash; until now. Over the last 24 months, everything changed. I finally built
              the org chart I&apos;d been trying to build for four decades. Every seat except CEO is now
              an AI employee. I run my company on the same system I install for my clients.
            </p>
            <p className="font-semibold">
              I&apos;m not selling theory. I&apos;m selling what I already run on myself &mdash; built
              by someone who&apos;s been in your exact chair for longer than most consultants have been alive.
            </p>
          </div>
          <div className="mt-8">
            <a
              href="/about"
              className="inline-flex items-center gap-2 text-base font-semibold text-[color:var(--color-sjc-blue)] hover:underline"
            >
              Read the full story
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
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
  );
}
