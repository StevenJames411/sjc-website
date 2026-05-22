import CtaButton from "./CtaButton";

export default function AuditSection() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          Org Chart Audit
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
          If you couldn&apos;t work for 30 to 90 days, would your business thrive — or implode?
        </h2>

        <div className="mt-8 space-y-5 text-left text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
          <p>
            I&apos;m a systems engineer. I built my own AI employee org chart and run my company on it
            today.
          </p>
          <p>
            The Org Chart Audit shows you what your chart actually looks like right now — which seats
            you&apos;re holding by yourself, what it would cost to fill them with humans, and what the
            AI version costs instead.
          </p>
          <p className="font-semibold">60 seconds. Free. No email required to start.</p>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaButton />
        </div>
      </div>
    </section>
  );
}
