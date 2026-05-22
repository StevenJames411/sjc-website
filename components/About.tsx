import Image from "next/image";

export default function About() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.4fr_1fr] md:items-center md:py-24">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
            So who&apos;s going to build your org chart?
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
            You already know you have to do something. If you took any time off, your business is in trouble —
            and so is the family that depends on it.
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
            <p>
              I&apos;m Steven Barchetti. I&apos;ve run businesses in nine different industries. In every one,
              I was great at the craft &mdash; and stuck running every other job in the company too. The usual
              small-business trap.
            </p>
            <p>
              Over the last 24 months, AI finally got good enough to actually execute the work &mdash;
              not just brainstorm it. That&apos;s when I was finally able to build my org chart. Every
              seat except CEO is now an AI employee. I run my company on the same system I build for
              my clients.
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
            <p className="text-sm font-semibold text-[color:var(--color-sjc-ink)] md:text-xs">CTO</p>
            <p className="text-sm font-semibold text-[color:var(--color-sjc-ink)] md:text-xs">Systems Engineer</p>
          </div>
        </div>
      </div>
    </section>
  );
}
