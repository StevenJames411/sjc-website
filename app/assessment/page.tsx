"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const ROLES = [
  {
    name: "CEO",
    description: "You. Sets direction, signs the checks. This seat is yours by default.",
    humanCost: 67000,
    aiCost: 67000,
    hoursPerWeek: 25,
    preAnsweredYes: true,
  },
  {
    name: "Executive Assistant",
    description: "Runs your inbox, calendar, and weekly priorities. Basically your right-hand man.",
    humanCost: 45000,
    aiCost: 1200,
    hoursPerWeek: 35,
  },
  {
    name: "Marketing Manager",
    description: "Attracts strangers and turns them into prospects. Basically the one who gets your phone ringing.",
    humanCost: 50000,
    aiCost: 3600,
    hoursPerWeek: 35,
  },
  {
    name: "Sales Manager",
    description: "Turns prospects into paying customers. Basically your closer.",
    humanCost: 45000,
    aiCost: 3000,
    hoursPerWeek: 35,
  },
  {
    name: "Account Manager",
    description: "Keeps existing customers happy, renewed, and referring others. Basically the one who keeps your customers coming back.",
    humanCost: 40000,
    aiCost: 1200,
    hoursPerWeek: 30,
  },
  {
    name: "Project Manager",
    description: "Runs delivery — on time, on scope, on budget. Basically the one who runs the job from start to finish.",
    humanCost: 50000,
    aiCost: 900,
    hoursPerWeek: 35,
  },
  {
    name: "Operations Manager",
    description: "Builds and runs the systems that keep day-to-day humming. Basically the one who keeps the wheels turning.",
    humanCost: 50000,
    aiCost: 600,
    hoursPerWeek: 30,
  },
  {
    name: "Office Manager",
    description: "Admin, supplies, scheduling, vendor coordination. Basically the one who keeps the lights on.",
    humanCost: 40000,
    aiCost: 600,
    hoursPerWeek: 20,
  },
  {
    name: "Quality Control",
    description: "Catches mistakes before customers see them. Basically your second set of eyes.",
    humanCost: 40000,
    aiCost: 900,
    hoursPerWeek: 15,
  },
  {
    name: "HR Manager",
    description: "Hiring, firing, training, employee handbook. Basically the one who handles your people.",
    humanCost: 45000,
    aiCost: 1200,
    hoursPerWeek: 15,
  },
  {
    name: "Bookkeeper",
    description: "Tracks every dollar in and out. Books, taxes, payroll. Basically the one who keeps the money straight.",
    humanCost: 40000,
    aiCost: 1200,
    hoursPerWeek: 10,
  },
  {
    name: "Lawyer",
    description: "Contracts, leases, compliance — the routine legal work. Basically the one who keeps you out of court.",
    humanCost: 20000,
    aiCost: 600,
    hoursPerWeek: 8,
  },
];

type Stage = "intro" | "asking" | "results" | "form" | "submitting" | "submitted";

// Each role gets one of three answers:
//   "self"   — visitor is doing this work themselves (wearing the hat)
//   "other"  — someone else has the seat (employee, contractor, partner)
//   "nobody" — the seat is empty; no one is covering this work (neglected)
type Answer = "self" | "other" | "nobody";

const formatCurrency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function AuditPage() {
  const [stage, setStage] = useState<Stage>("intro");
  // CEO (index 0) is pre-answered "self" — the visitor is the CEO. First asked question is index 1.
  const [currentQ, setCurrentQ] = useState(1);
  const [answers, setAnswers] = useState<(Answer | null)[]>(() => {
    const initial: (Answer | null)[] = Array(ROLES.length).fill(null);
    initial[0] = "self";
    return initial;
  });

  // Scroll back to top whenever the stage changes (or the question advances) — the assessment is a
  // single-page component swapping React state, so the browser preserves scroll position by default
  // and otherwise the user lands on each new stage halfway down the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage, currentQ]);

  const selfCount = answers.filter((a) => a === "self").length;
  const nobodyCount = answers.filter((a) => a === "nobody").length;
  const totalHumanCost = ROLES.reduce(
    (sum, r, i) => sum + (answers[i] === "self" ? r.humanCost : 0),
    0
  );
  const totalAiCost = ROLES.reduce(
    (sum, r, i) => sum + (answers[i] === "self" ? r.aiCost : 0),
    0
  );
  // Excludes CEO ($67k) — the visitor pays themselves that; only non-CEO selves count as "absorbing" unpaid work.
  const totalUnpaidWork = ROLES.reduce(
    (sum, r, i) => sum + (i > 0 && answers[i] === "self" ? r.humanCost : 0),
    0
  );
  // Neglected seats — nobody is covering this work today.
  const neglectedHumanCost = ROLES.reduce(
    (sum, r, i) => sum + (answers[i] === "nobody" ? r.humanCost : 0),
    0
  );
  const neglectedAiCost = ROLES.reduce(
    (sum, r, i) => sum + (answers[i] === "nobody" ? r.aiCost : 0),
    0
  );

  const handleAnswer = (answer: Answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = answer;
    setAnswers(newAnswers);

    if (currentQ < ROLES.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStage("results");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const fullName = String(formData.get("name") ?? "").trim();
    const spaceIdx = fullName.indexOf(" ");
    const firstName = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName;
    const lastName = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "";

    const wornHats = ROLES.filter((_, i) => answers[i] === "self");
    const otherHats = ROLES.filter((_, i) => answers[i] === "other");
    const vacantHats = ROLES.filter((_, i) => answers[i] === "nobody");
    const wornHours = wornHats.reduce((s, r) => s + r.hoursPerWeek, 0);
    const otherHours = otherHats.reduce((s, r) => s + r.hoursPerWeek, 0);
    const vacantHours = vacantHats.reduce((s, r) => s + r.hoursPerWeek, 0);

    // HTML-formatted lists ready to drop into a GoHighLevel email/PDF template
    const formatList = (items: typeof ROLES) =>
      items.map((r, i) => `${i + 1}. ${r.name} (${r.hoursPerWeek} hrs/week)`).join("<br>");

    // Structured copies for the Vercel-side PDF renderer
    const toRolePayload = (items: typeof ROLES) =>
      items.map((r) => ({
        name: r.name,
        description: r.description,
        hoursPerWeek: r.hoursPerWeek,
        humanCost: r.humanCost,
        aiCost: r.aiCost,
      }));

    const payload = {
      // Contact
      name: fullName,
      firstName,
      lastName,
      email: formData.get("email"),
      phone: formData.get("phone"),
      // Counts (always sum to 12)
      worn_count: wornHats.length,
      staff_count: otherHats.length,
      vacant_count: vacantHats.length,
      // Hours per week per bucket
      worn_hours_per_week: wornHours,
      staff_hours_per_week: otherHours,
      vacant_hours_per_week: vacantHours,
      total_hours_per_week: wornHours + otherHours + vacantHours,
      // Lists (HTML-formatted for GHL templates)
      worn_jobs: formatList(wornHats),
      staff_jobs: formatList(otherHats),
      vacant_jobs: formatList(vacantHats),
      // Structured arrays (used by /api/send-roadmap to render the PDF)
      worn_roles: toRolePayload(wornHats),
      staff_roles: toRolePayload(otherHats),
      vacant_roles: toRolePayload(vacantHats),
      // Cost totals
      worn_human_cost: totalHumanCost,
      worn_ai_cost: totalAiCost,
      vacant_human_cost: neglectedHumanCost,
      vacant_ai_cost: neglectedAiCost,
      source: "12-Role Assessment",
    };

    setStage("submitting");

    try {
      await fetch("/api/send-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Roadmap submission failed:", err);
    }

    setStage("submitted");
  };

  return (
    <>
      <Nav />
      <main>
        {stage === "intro" && <IntroSection onStart={() => setStage("asking")} />}

        {stage === "asking" && (
          <AskingSection
            role={ROLES[currentQ]}
            questionNumber={currentQ}
            totalQuestions={ROLES.length - 1}
            selfCount={selfCount}
            totalSeats={ROLES.length}
            onAnswer={handleAnswer}
          />
        )}

        {stage === "results" && (
          <ResultsSection
            answers={answers}
            yesCount={selfCount}
            nobodyCount={nobodyCount}
            onContinue={() => setStage("form")}
          />
        )}

        {stage === "form" && <FormSection onSubmit={handleFormSubmit} />}

        {stage === "submitting" && <SubmittingSection />}

        {stage === "submitted" && <SubmittedSection />}
      </main>
      <Footer />
    </>
  );
}

function IntroSection({ onStart }: { onStart: () => void }) {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-blue)] md:text-4xl">
          Twelve roles every business needs to run without you. Let&apos;s count yours.
        </h1>
        <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
          <p className="font-semibold text-[color:var(--color-sjc-blue)]">
            Want to see where you stand before talking to us? Walk through the twelve roles yourself.
          </p>
          <p>
            When you opened your business, you knew you were the best at the work. You were never
            supposed to be the marketer, the bookkeeper, the scheduler too &mdash; that just happened
            because hiring twelve people was out of reach.
          </p>
          <p>
            I&apos;ll walk you through all twelve. For each one, tell me whether <em>you</em> do it,
            <em>a current staff member</em> does it, or <em>nobody</em> does it.
          </p>
          <p>
            When you&apos;re done, I&apos;ll email you the full roadmap &mdash; every role, every move
            you can make, and the path to get out from under it. Execute it yourself &mdash;
            that&apos;s hat number thirteen &mdash; or let me execute it for you. That&apos;s my
            superpower.
          </p>
        </div>
        <div className="mt-10 flex justify-center">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[color:var(--color-sjc-green)]"
          >
            Let&apos;s count them
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

type AskingProps = {
  role: (typeof ROLES)[number];
  questionNumber: number;
  totalQuestions: number;
  selfCount: number;
  totalSeats: number;
  onAnswer: (answer: Answer) => void;
};

function AskingSection({
  role,
  questionNumber,
  totalQuestions,
  selfCount,
  totalSeats,
  onAnswer,
}: AskingProps) {
  const progressPct = ((questionNumber - 1) / totalQuestions) * 100;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {/* Progress + running counter */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 md:text-sm">
            <span>
              Question {questionNumber} of {totalQuestions}
            </span>
            <span>
              Hats you&apos;re wearing:{" "}
              <span className="text-[color:var(--color-sjc-blue)]">{selfCount}</span> / {totalSeats}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-[color:var(--color-sjc-blue)] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Current question */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-10">
          <h2 className="text-2xl font-bold leading-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
            Are you currently wearing the <span className="text-[color:var(--color-sjc-blue)]">{role.name}</span>{" "}
            hat?
          </h2>
          <p className="mt-4 text-base text-gray-600 md:text-lg">{role.description}</p>

          <div className="mt-8 grid items-start gap-3 sm:grid-cols-3">
            <button
              onClick={() => onAnswer("self")}
              className="rounded-lg border-2 border-gray-300 bg-white px-5 py-4 text-base font-semibold text-[color:var(--color-sjc-ink)] shadow-sm transition hover:border-[color:var(--color-sjc-blue)] hover:bg-[color:var(--color-sjc-blue)] hover:text-white md:text-base"
            >
              I do this job
            </button>
            <button
              onClick={() => onAnswer("other")}
              className="rounded-lg border-2 border-gray-300 bg-white px-5 py-4 text-base font-semibold text-[color:var(--color-sjc-ink)] shadow-sm transition hover:border-[color:var(--color-sjc-blue)] hover:bg-[color:var(--color-sjc-blue)] hover:text-white md:text-base"
            >
              Current staff member
            </button>
            <button
              onClick={() => onAnswer("nobody")}
              className="rounded-lg border-2 border-gray-300 bg-white px-5 py-4 text-base font-semibold text-[color:var(--color-sjc-ink)] shadow-sm transition hover:border-[color:var(--color-sjc-blue)] hover:bg-[color:var(--color-sjc-blue)] hover:text-white md:text-base"
            >
              Vacant job role
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

type ResultsProps = {
  answers: (Answer | null)[];
  yesCount: number;
  nobodyCount: number;
  onContinue: () => void;
};

function ResultsSection({ answers, yesCount, nobodyCount, onContinue }: ResultsProps) {
  const wornHats = ROLES.filter((_, i) => answers[i] === "self");
  const otherHats = ROLES.filter((_, i) => answers[i] === "other");
  const vacantHats = ROLES.filter((_, i) => answers[i] === "nobody");
  const wornHours = wornHats.reduce((sum, r) => sum + r.hoursPerWeek, 0);
  const otherHours = otherHats.reduce((sum, r) => sum + r.hoursPerWeek, 0);
  const vacantHours = vacantHats.reduce((sum, r) => sum + r.hoursPerWeek, 0);

  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-blue)] md:text-4xl">
          Where you stand with the twelve job roles.
        </h1>
        <p className="mt-6 text-2xl font-bold leading-snug text-[color:var(--color-sjc-ink)] md:text-3xl">
          You&apos;re responsible for {yesCount} {yesCount === 1 ? "job" : "jobs"}.
          <br />
          Current staff member handles {otherHats.length} {otherHats.length === 1 ? "job" : "jobs"}.
          <br />
          {nobodyCount} {nobodyCount === 1 ? "job is" : "jobs are"} vacant.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
          Here are the specifics. The jobs you&apos;re personally holding, the jobs your current
          staff handles, and the jobs sitting empty. Each group has a different fix &mdash; and
          together they&apos;re the gap between the business you have and the business that runs
          without you.
        </p>

        {/* Hats list */}
        {wornHats.length > 0 && (
          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
            <div
              style={{ backgroundColor: "#1e3a6e" }}
              className="px-6 py-4 text-white"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80 md:text-sm">
                Seats you&apos;re holding right now
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              {wornHats.map((r, idx) => (
                <li
                  key={r.name}
                  className="px-4 py-3 text-sm md:px-6 md:py-4 md:text-base"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-[color:var(--color-sjc-ink)]">
                      {idx + 1}. {r.name}
                    </p>
                    <p className="whitespace-nowrap text-sm font-semibold text-[color:var(--color-sjc-blue)]">
                      {r.hoursPerWeek} hrs/week
                    </p>
                  </div>
                  <p className="mt-1 text-gray-600">{r.description}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 text-center md:px-6 md:py-5">
              <span className="inline-flex items-center rounded-full bg-[color:var(--color-sjc-blue)] px-5 py-2 text-sm font-bold text-white md:text-base">
                Total: {wornHours} hrs/week
              </span>
            </div>
          </div>
        )}

        {/* Seats covered by someone else — accounting completeness for all 12 roles */}
        {otherHats.length > 0 && (
          <div className="mt-14 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
            <div
              style={{ backgroundColor: "#1e3a6e" }}
              className="px-6 py-4 text-white"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80 md:text-sm">
                Seats your current staff member handles
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              {otherHats.map((r, idx) => (
                <li
                  key={r.name}
                  className="px-4 py-3 text-sm md:px-6 md:py-4 md:text-base"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-[color:var(--color-sjc-ink)]">
                      {idx + 1}. {r.name}
                    </p>
                    <p className="whitespace-nowrap text-sm font-semibold text-[color:var(--color-sjc-blue)]">
                      {r.hoursPerWeek} hrs/week
                    </p>
                  </div>
                  <p className="mt-1 text-gray-600">{r.description}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 text-center md:px-6 md:py-5">
              <span className="inline-flex items-center rounded-full bg-[color:var(--color-sjc-blue)] px-5 py-2 text-sm font-bold text-white md:text-base">
                Total: {otherHours} hrs/week
              </span>
            </div>
          </div>
        )}

        {/* Vacant seats list — the "nobody's covering this" pillar */}
        {vacantHats.length > 0 && (
          <div className="mt-14 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
            <div
              style={{ backgroundColor: "#1e3a6e" }}
              className="px-6 py-4 text-white"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80 md:text-sm">
                Vacant seats &mdash; no one is covering this work
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              {vacantHats.map((r, idx) => (
                <li
                  key={r.name}
                  className="px-4 py-3 text-sm md:px-6 md:py-4 md:text-base"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-[color:var(--color-sjc-ink)]">
                      {idx + 1}. {r.name}
                    </p>
                    <p className="whitespace-nowrap text-sm font-semibold text-[color:var(--color-sjc-blue)]">
                      {r.hoursPerWeek} hrs/week
                    </p>
                  </div>
                  <p className="mt-1 text-gray-600">{r.description}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 text-center md:px-6 md:py-5">
              <span className="inline-flex items-center rounded-full bg-[color:var(--color-sjc-blue)] px-5 py-2 text-sm font-bold text-white md:text-base">
                Total: {vacantHours} hrs/week
              </span>
            </div>
          </div>
        )}

        {/* The close — 90-day litmus + augmentation framing + the original possibilities/excited paragraph */}
        <div className="mt-12 space-y-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
          <p>
            That&apos;s the picture. Here&apos;s the real question: could your business operate if
            you took 90 days off &mdash; for any reason? Most owners can&apos;t say yes, even the
            ones with a built team. AI fills the empty seats and supercharges the people you already
            have &mdash; so you finally get the freedom you built this business for.
          </p>
          <p>
            And here&apos;s what&apos;s possible on the other side: you get to choose how involved
            you want to be. The roadmap installs the KPIs, dashboards, systems, and processes so
            the business operates whether you&apos;re in 100 hours a week or stepping away for
            months. Stay all-in because you love the work? Great. Step out completely and let the
            business thrive without you? Also fine. Anywhere in between is yours &mdash; and
            it&apos;s all running at a fraction of what hiring a full human team would have cost.
          </p>
          <p>
            Your full roadmap is built &mdash; every role, every move, the path to take each seat
            off your plate. These possibilities weren&apos;t even available a year ago, and
            I&apos;m excited to walk you through yours. Give me your best email and I&apos;ll send
            the roadmap there &mdash; I look forward to talking soon.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[color:var(--color-sjc-green)]"
          >
            Send me my full roadmap
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <a
            href="https://api.leadconnectorhq.com/widget/bookings/find-your-gap"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[color:var(--color-sjc-blue)] hover:underline"
          >
            Or skip the email and book a call now
          </a>
        </div>
      </div>
    </section>
  );
}

function FormSection({ onSubmit }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-20">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-blue)] md:text-4xl">
          Here&apos;s what you&apos;re going to get.
        </h1>
        <p className="mt-6 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
          The full cost breakdown. The fix I recommend for each job role. The play-by-play to take each
          one off your plate. The KPIs to track it. The entire build laid out at your feet &mdash;
          no strings attached. Run with it yourself? Great. Want my help executing it? I&apos;m here
          for you.
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-[color:var(--color-sjc-ink)]">
              Your name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[color:var(--color-sjc-ink)] shadow-sm focus:border-[color:var(--color-sjc-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-sjc-blue)]"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[color:var(--color-sjc-ink)]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[color:var(--color-sjc-ink)] shadow-sm focus:border-[color:var(--color-sjc-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-sjc-blue)]"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-[color:var(--color-sjc-ink)]">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[color:var(--color-sjc-ink)] shadow-sm focus:border-[color:var(--color-sjc-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-sjc-blue)]"
            />
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[color:var(--color-sjc-green)]"
          >
            Send me my roadmap
          </button>
        </form>
      </div>
    </section>
  );
}

function SubmittingSection() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <div className="mx-auto h-16 w-16">
          <svg
            className="h-16 w-16 animate-spin text-[color:var(--color-sjc-blue)]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-blue)] md:text-4xl">
          Building your roadmap...
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
          We&apos;re generating your custom PDF and sending it to your email. This usually takes 15&ndash;30 seconds.
        </p>
        <p className="mt-8 inline-block rounded-lg bg-white px-6 py-4 text-2xl font-bold tabular-nums text-[color:var(--color-sjc-ink)] shadow">
          {elapsed}s elapsed
        </p>
        <p className="mt-8 text-base font-semibold text-[color:var(--color-sjc-blue)] md:text-lg">
          Please don&apos;t close this window.
        </p>
      </div>
    </section>
  );
}

function SubmittedSection() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-sjc-blue)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-8 w-8 text-white">
            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          Now you know how many hats you&apos;re wearing.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
          Your full roadmap is hitting your inbox now. Check spam if you don&apos;t see it
          in a few minutes.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
          Let&apos;s talk about taking them off. On the call we&apos;ll go seat by seat
          &mdash; the order to fill them, the tools to use, and the path to a business that
          runs without you.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <a
            href="https://api.leadconnectorhq.com/widget/bookings/find-your-gap"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[color:var(--color-sjc-green)]"
          >
            Book a Discovery Call
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a
            href="tel:+12102982343"
            className="text-sm font-semibold text-[color:var(--color-sjc-blue)] hover:underline"
          >
            Or call us directly: (210) 298-2343
          </a>
        </div>
      </div>
    </section>
  );
}
