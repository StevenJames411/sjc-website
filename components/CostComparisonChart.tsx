const SEATS = [
  {
    n: 2,
    role: "Executive Assistant",
    desc: "Runs your inbox, calendar, and weekly priorities. Basically your right-hand man.",
    human: "$45,000",
    ai: "$1,200",
  },
  {
    n: 3,
    role: "Marketing Manager",
    desc: "Attracts strangers and turns them into prospects. Basically the one who gets your phone ringing.",
    human: "$50,000",
    ai: "$3,600",
  },
  {
    n: 4,
    role: "Sales Manager",
    desc: "Turns prospects into paying customers. Basically your closer.",
    human: "$45,000",
    ai: "$3,000",
  },
  {
    n: 5,
    role: "Account Manager",
    desc: "Keeps existing customers happy, renewed, and referring others. Basically the one who keeps your customers coming back.",
    human: "$40,000",
    ai: "$1,200",
  },
  {
    n: 6,
    role: "Project Manager",
    desc: "Runs delivery — on time, on scope, on budget. Basically the one who runs the job from start to finish.",
    human: "$50,000",
    ai: "$900",
  },
  {
    n: 7,
    role: "Operations Manager",
    desc: "Builds and runs the systems that keep day-to-day humming. Basically the one who keeps the wheels turning.",
    human: "$50,000",
    ai: "$600",
  },
  {
    n: 8,
    role: "Office Manager",
    desc: "Admin, supplies, scheduling, vendor coordination. Basically the one who keeps the lights on.",
    human: "$40,000",
    ai: "$600",
  },
  {
    n: 9,
    role: "Quality Control",
    desc: "Catches mistakes before customers see them. Basically your second set of eyes.",
    human: "$40,000",
    ai: "$900",
  },
  {
    n: 10,
    role: "HR Manager",
    desc: "Hiring, firing, training, employee handbook. Basically the one who handles your people.",
    human: "$45,000",
    ai: "$1,200",
  },
  {
    n: 11,
    role: "Bookkeeper",
    desc: "Tracks every dollar in and out. Books, taxes, payroll. Basically the one who keeps the money straight.",
    human: "$40,000",
    ai: "$1,200",
  },
  {
    n: 12,
    role: "Lawyer",
    desc: "Contracts, leases, compliance — the routine legal work. Basically the one who keeps you out of court.",
    human: "$20,000",
    ai: "$600",
  },
];

export default function CostComparisonChart() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      <div style={{ backgroundColor: "#1e3a6e" }} className="px-6 py-5 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80 md:text-sm">
          Cost Comparison
        </p>
        <p className="mt-3 text-base font-bold leading-snug md:text-lg">
          Typical human org chart vs. typical AI employee org chart &mdash; two different planets.
        </p>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600 md:px-6 md:text-sm">
        <span>Role</span>
        <span className="text-right">Human (annual)</span>
        <span className="text-right">AI employee (annual)</span>
      </div>

      <ul className="bg-white">
        <li className="grid grid-cols-[1.6fr_1fr_1fr] items-center gap-2 border-b border-gray-100 bg-blue-50 px-4 py-3 text-sm md:px-6 md:py-3.5 md:text-base">
          <div className="flex flex-col">
            <span className="font-semibold text-[color:var(--color-sjc-blue)]">1. CEO</span>
            <span className="mt-0.5 text-xs italic text-gray-600 md:text-sm">
              You. The owner. Sets direction, signs the checks.
            </span>
          </div>
          <span className="text-right font-semibold text-[color:var(--color-sjc-blue)]">$67,000 (You)</span>
          <span className="text-right font-semibold text-[color:var(--color-sjc-blue)]">$67,000 (You)</span>
        </li>
        {SEATS.map((s) => (
          <li
            key={s.role}
            className="grid grid-cols-[1.6fr_1fr_1fr] items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm md:px-6 md:py-3.5 md:text-base"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-[color:var(--color-sjc-ink)]">
                {s.n}. {s.role}
              </span>
              <span className="mt-0.5 text-xs italic text-gray-600 md:text-sm">{s.desc}</span>
            </div>
            <span className="text-right text-[color:var(--color-sjc-ink)]">{s.human}</span>
            <span className="text-right font-semibold text-[color:var(--color-sjc-blue)]">{s.ai}</span>
          </li>
        ))}
        <li className="grid grid-cols-[1.6fr_1fr_1fr] gap-2 bg-gray-50 px-4 py-4 text-sm font-bold md:px-6 md:py-5 md:text-base">
          <span className="text-[color:var(--color-sjc-ink)]">Total</span>
          <span className="text-right text-[color:var(--color-sjc-ink)]">~$532,000 / yr</span>
          <span className="text-right text-[color:var(--color-sjc-blue)]">~$82,000 / yr</span>
        </li>
      </ul>

      <div className="border-t border-gray-200 bg-gray-50 px-6 py-7 md:px-10 md:py-8">
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
          Twenty-four months ago, this org chart was impossible. To fill it with humans, you&apos;d pay{" "}
          <span className="font-bold text-[color:var(--color-sjc-ink)]">$532,000</span>{" "}
          a year &mdash; nothing a solo entrepreneur could ever afford. So nobody ever built it. AI has changed everything. The same org chart now costs{" "}
          <span className="font-bold text-[color:var(--color-sjc-blue)]">$82,000</span>{" "}
          a year. And{" "}
          <span className="font-bold">$67,000</span>{" "}
          of that is your own CEO pay &mdash; money you&apos;d already be paying yourself. The true investment price for the rest of the team? Just{" "}
          <span className="font-bold text-[color:var(--color-sjc-blue)]">$15,000</span>{" "}
          a year. That investment of $15,000 gets you an entire executive team. That&apos;s a{" "}
          <span className="font-bold text-[color:var(--color-sjc-blue)]">$450,000</span>{" "}
          payroll savings every year moving forward.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm italic leading-relaxed text-gray-600 md:text-base">
          These salary estimates run roughly 30% below current market rates. The real cost of building this team in 2026 would push the savings even higher.
        </p>
      </div>
    </div>
  );
}
