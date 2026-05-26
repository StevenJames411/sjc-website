import Link from "next/link";

export default function IntakeCTA() {
  return (
    <section id="audit" className="scroll-mt-20" style={{ backgroundColor: "#1e3a6e" }}>
      <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
          Think your business could survive without you?
        </h2>
        <p className="mt-5 text-xl leading-relaxed text-white/90 md:text-2xl">
          Take the 30-second audit. You&apos;ll see exactly how many hats you&apos;re wearing
          &mdash; and what happens if you can&apos;t wear them tomorrow.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-bold text-[color:var(--color-sjc-blue)] shadow-lg transition hover:bg-gray-100"
          >
            Take the Audit
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="tel:+12102982343"
            className="text-sm font-semibold text-white/80 hover:text-white hover:underline"
          >
            Or call us directly: (210) 298-2343
          </a>
        </div>
      </div>
    </section>
  );
}
