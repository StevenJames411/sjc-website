"use client";
import Editable from "./edit/Editable";

const SEATS_DEFAULTS = [
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
        <Editable
          tid="home.expansion.table.header.eyebrow"
          as="p"
          className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80 md:text-sm"
        >
          The Expansion
        </Editable>
        <Editable
          tid="home.expansion.table.header.title"
          as="p"
          className="mt-3 text-base font-bold leading-snug md:text-lg"
        >
          An entire AI org chart — for about the price of one assistant.
        </Editable>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600 md:px-6 md:text-sm">
        <Editable tid="home.expansion.table.col.role" as="span">Role</Editable>
        <Editable tid="home.expansion.table.col.human" as="span" className="text-right">Human (annual)</Editable>
        <Editable tid="home.expansion.table.col.ai" as="span" className="text-right">AI employee (annual)</Editable>
      </div>

      <ul className="bg-white">
        <li className="grid grid-cols-[1.6fr_1fr_1fr] items-center gap-2 border-b border-gray-100 bg-blue-50 px-4 py-3 text-sm md:px-6 md:py-3.5 md:text-base">
          <div className="flex flex-col">
            <Editable
              tid="home.expansion.table.ceo.role"
              as="span"
              className="font-semibold text-[color:var(--color-sjc-blue)]"
            >
              1. CEO
            </Editable>
            <Editable
              tid="home.expansion.table.ceo.desc"
              as="span"
              className="mt-0.5 text-xs italic text-gray-600 md:text-sm"
            >
              You. The owner. Sets direction, signs the checks.
            </Editable>
          </div>
          <Editable
            tid="home.expansion.table.ceo.human"
            as="span"
            className="text-right font-semibold text-[color:var(--color-sjc-blue)]"
          >
            $67,000 (You)
          </Editable>
          <Editable
            tid="home.expansion.table.ceo.ai"
            as="span"
            className="text-right font-semibold text-[color:var(--color-sjc-blue)]"
          >
            $67,000 (You)
          </Editable>
        </li>
        {SEATS_DEFAULTS.map((s, i) => (
          <li
            key={i}
            className="grid grid-cols-[1.6fr_1fr_1fr] items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm md:px-6 md:py-3.5 md:text-base"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-[color:var(--color-sjc-ink)]">
                {s.n}.{" "}
                <Editable tid={`home.expansion.table.seat${i}.role`} as="span">
                  {s.role}
                </Editable>
              </span>
              <Editable
                tid={`home.expansion.table.seat${i}.desc`}
                as="span"
                className="mt-0.5 text-xs italic text-gray-600 md:text-sm"
              >
                {s.desc}
              </Editable>
            </div>
            <Editable
              tid={`home.expansion.table.seat${i}.human`}
              as="span"
              className="text-right text-[color:var(--color-sjc-ink)]"
            >
              {s.human}
            </Editable>
            <Editable
              tid={`home.expansion.table.seat${i}.ai`}
              as="span"
              className="text-right font-semibold text-[color:var(--color-sjc-blue)]"
            >
              {s.ai}
            </Editable>
          </li>
        ))}
        <li className="grid grid-cols-[1.6fr_1fr_1fr] gap-2 bg-gray-50 px-4 py-4 text-sm font-bold md:px-6 md:py-5 md:text-base">
          <Editable
            tid="home.expansion.table.total.label"
            as="span"
            className="text-[color:var(--color-sjc-ink)]"
          >
            Total
          </Editable>
          <Editable
            tid="home.expansion.table.total.human"
            as="span"
            className="text-right text-[color:var(--color-sjc-ink)]"
          >
            ~$532,000 / yr
          </Editable>
          <Editable
            tid="home.expansion.table.total.ai"
            as="span"
            className="text-right text-[color:var(--color-sjc-blue)]"
          >
            ~$82,000 / yr
          </Editable>
        </li>
      </ul>

      <div className="border-t border-gray-200 bg-gray-50 px-6 py-7 md:px-10 md:py-8">
        {/* Footer prose — bold dollar figures are each their own Editable span */}
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
          <Editable tid="home.expansion.table.footer.p1a" as="span">
            Once your leads are handled, the same setup extends across the rest of the org chart. Filling it with humans runs
          </Editable>{" "}
          <span className="font-bold text-[color:var(--color-sjc-ink)]">
            <Editable tid="home.expansion.table.footer.p1.human" as="span">$532,000</Editable>
          </span>{" "}
          <Editable tid="home.expansion.table.footer.p1b" as="span">
            a year. The AI version runs about
          </Editable>{" "}
          <span className="font-bold text-[color:var(--color-sjc-blue)]">
            <Editable tid="home.expansion.table.footer.p1.ai" as="span">$82,000</Editable>
          </span>{" "}
          <Editable tid="home.expansion.table.footer.p1c" as="span">
            a year — and
          </Editable>{" "}
          <span className="font-bold">
            <Editable tid="home.expansion.table.footer.p1.ceo" as="span">$67,000</Editable>
          </span>{" "}
          <Editable tid="home.expansion.table.footer.p1d" as="span">
            of that is your own CEO pay, money you&apos;re already paying yourself. The rest of the team comes in around
          </Editable>{" "}
          <span className="font-bold text-[color:var(--color-sjc-blue)]">
            <Editable tid="home.expansion.table.footer.p1.rest" as="span">$15,000</Editable>
          </span>{" "}
          <Editable tid="home.expansion.table.footer.p1e" as="span">
            a year. Roughly one assistant&apos;s salary, for an entire executive team that answers to you.
          </Editable>
        </p>
        <Editable
          tid="home.expansion.table.footer.p2"
          as="p"
          className="mx-auto mt-4 max-w-2xl text-sm italic leading-relaxed text-gray-600 md:text-base"
        >
          You don&apos;t have to start here. Most owners begin with one seat — speed to lead — and add seats on your timeline, on your call. The build is a one-time install; a flat monthly keeps it running. You hold the keys the whole way.
        </Editable>
      </div>
    </div>
  );
}
