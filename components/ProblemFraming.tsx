import CtaButton from "./CtaButton";

export default function ProblemFraming() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-lg font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          The shift no one is talking about.
        </p>
        <h2 className="mt-4 text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
          Your competitors aren&apos;t beating you in Google Search.
        </h2>
        <h3 className="mt-3 text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl">
          They&apos;re beating you with AI search.
        </h3>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
          <p>
            When a customer asks &ldquo;Who is the best [Roofer, Dentist, Plumber, Etc.] near me&rdquo; with
            ChatGPT, Perplexity, or Gemini, one company gets recommended.
          </p>
          <p>
            The companies getting recommended aren&apos;t bigger.
            <br />
            They&apos;re not older. They&apos;re just findable by AI.
          </p>
          <p>
            They have Schema markups, Google Reviews, Content Structure, Citations.
            <br />
            All built for AI.
          </p>
          <p>Most owners doing $1 Million–$5 Million have none of that wired up yet.</p>
          <p className="font-bold">
            The 60-second audit shows you exactly which signals you&apos;re missing, and how to fix it!
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton />
        </div>
      </div>
    </section>
  );
}
