const TIERS = [
  { title: "Foundation", subtitle: "Findable", items: ["Schema", "Listings", "Reviews"] },
  { title: "Signal", subtitle: "Credible", items: ["Content", "Citations", "Authority"] },
  { title: "System", subtitle: "Converting", items: ["Speed-to-lead", "Follow-up", "Documents"] },
];

export default function AuditReveals() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="text-lg font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          What The Audit Reveals
        </p>
        <h2 className="mt-4 text-3xl font-bold text-[color:var(--color-sjc-ink)] md:text-4xl">
          A 20-Point AI Visibility Audit
        </h2>
        <p className="mt-4 text-lg text-[color:var(--color-sjc-ink)]">
          Scored across three tiers. You&apos;ll see your gaps in 60 seconds.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.title}
              className="flex flex-col items-center rounded-2xl bg-[color:var(--color-sjc-line)]/60 px-8 py-10"
            >
              <h3 className="text-lg font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
                {tier.title}
              </h3>
              <p className="mt-3 text-xl font-bold text-[color:var(--color-sjc-ink)]">{tier.subtitle}</p>
              <ul className="mt-6 space-y-2 text-base text-[color:var(--color-sjc-ink)]">
                {tier.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
