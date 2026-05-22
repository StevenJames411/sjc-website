const BARRIERS = [
  { title: "Expensive", body: "Salaries, benefits, taxes, equipment, training time." },
  { title: "Slow", body: "Recruit, vet, train, onboard, ramp. Months before they're useful." },
  { title: "Risky", body: "Wrong hires. Turnover. Drama. Lawsuits. Reputation damage." },
  { title: "Loss of control", body: "Voice drift. Brand drift. Customer drift. They're not you." },
  { title: "Managerial overhead", body: "Honestly? You don't want to manage humans." },
];

export default function Problem() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          The Problem
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          Why hiring isn&apos;t the answer.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            Gerber&apos;s prescription was: hire humans into the seats. Marketing. Operations. Sales.
            Customer service. Build a franchise prototype that runs without you.
          </p>
          <p className="font-semibold">Here&apos;s what stopped you:</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BARRIERS.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-base font-bold text-[color:var(--color-sjc-blue)]">{b.title}</h3>
              <p className="mt-2 text-base text-[color:var(--color-sjc-ink)]">{b.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-4 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p className="text-xl font-bold md:text-2xl">
            You&apos;re not anti-team. You&apos;re anti-hassle.
          </p>
          <p>
            You&apos;d rather keep doing it yourself than become someone&apos;s HR department.
            Which means the org chart never gets built. Which means you stay the ceiling.
          </p>
        </div>
      </div>
    </section>
  );
}
