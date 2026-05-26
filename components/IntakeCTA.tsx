import Link from "next/link";

export default function IntakeCTA() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          We build it for you.
        </h2>
        <p className="mt-4 text-xl leading-relaxed text-[color:var(--color-sjc-ink)] md:text-2xl">
          Or you can try to explain your business to someone who&apos;s never lived it.
        </p>

        <div className="mt-8 space-y-5 text-left text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-center md:text-xl">
          <p>
            The intake call is where we figure out which seats you&apos;re holding, which ones are
            empty, and what the build looks like for your specific business. No pitch deck. No
            discovery questionnaire. Just a founder-to-founder conversation about what&apos;s broken
            and how to fix it.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/assessment"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[color:var(--color-sjc-green)] sm:w-auto"
          >
            Take the Assessment
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="tel:+12102982343"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[color:var(--color-sjc-blue)] bg-white px-8 py-4 text-lg font-semibold text-[color:var(--color-sjc-blue)] shadow-sm transition hover:bg-[color:var(--color-sjc-blue)] hover:text-white sm:w-auto"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
            </svg>
            Call Direct
          </a>
        </div>
      </div>
    </section>
  );
}
