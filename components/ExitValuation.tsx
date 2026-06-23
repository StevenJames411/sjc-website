import CtaButton from "./CtaButton";

export default function ExitValuation() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          Why Me
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          Forty years. Five businesses. I&apos;ve been the tech guy in every
          one.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            I&apos;ve run my own businesses since 1986 &mdash; a restaurant, a
            mortgage company, a roofing contractor, a trucking company I ran for
            twenty years, and now this. In every single one, I was the owner{" "}
            <em>and</em> the tech guy who wired up the systems and kept them
            running. I&apos;ve worn your exact hat for four decades.
          </p>
          <p>
            The tools finally caught up to what I always needed. So I built it
            for myself first.
          </p>
          <p className="text-xl font-bold text-[color:var(--color-sjc-ink)] md:text-2xl">
            Steven James Consulting runs on this exact system today.
          </p>
          <p>
            I&apos;m not selling you a theory I read in a book. I run my own
            company on the same AI employees I install for you. The first client
            I built this for is already answering leads in seconds and booking
            appointments around the clock &mdash; on top of the business they
            already ran, with their hand still on every dollar.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton
            title="Book the Call"
            subtitle="See the system that runs my own company — and what it'd look like on yours."
          />
        </div>
      </div>
    </section>
  );
}
