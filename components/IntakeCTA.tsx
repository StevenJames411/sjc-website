import Link from "next/link";

export default function IntakeCTA() {
  return (
    <section id="intake" className="scroll-mt-20" style={{ backgroundColor: "#1e3a6e" }}>
      <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
          We build it for you.
        </h2>
        <p className="mt-5 text-xl leading-relaxed text-white/90 md:text-2xl">
          Or you can try to explain your business to someone who&apos;s never lived it.
        </p>

        <div className="mt-8 space-y-5 text-lg leading-relaxed text-white/80 md:text-xl">
          <p>
            The intake call is where we figure out which seats you&apos;re holding, which ones are
            empty, and what the build looks like for your specific business. No pitch deck. No
            discovery questionnaire. Just a founder-to-founder conversation about what&apos;s broken
            and how to fix it.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <a
            href="#intake"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-lg font-bold text-[color:var(--color-sjc-blue)] shadow-lg transition hover:bg-gray-100"
          >
            Book an Intake Call
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <Link
            href="/assessment"
            className="text-sm font-semibold text-white/80 hover:text-white hover:underline"
          >
            Or take the self-service assessment
          </Link>
        </div>
      </div>
    </section>
  );
}
