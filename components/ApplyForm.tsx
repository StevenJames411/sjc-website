"use client";

import { useState } from "react";

// Discovery-call intake — 4 quick screens + a booking step. Posts the answers to
// /api/apply (which forwards to the Google Apps Script webhook: append-to-Sheet + email
// Steven), THEN reveals the Google Calendar booking page. Answers are captured before the
// booking step, so Steven gets the lead even if they don't book.

const GROWTH_OPTIONS = [
  "I need more customers — now",
  "Growing, but it's chaos",
  "Maxed out — can't take on more work",
  "Just exploring",
];

const REVENUE_OPTIONS = [
  "Under $10k / mo",
  "$10k – $25k / mo",
  "$25k – $50k / mo",
  "$50k – $100k / mo",
  "$100k+ / mo",
];

const EMERGENCY_OPTIONS = [
  "It'd thrive without me",
  "It'd hold steady for a while",
  "It'd be in serious jeopardy",
];

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || "";
const TOTAL_STEPS = 4;

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  industry: string;
  growth: string;
  revenueNow: string;
  revenueGoal: string;
  emergency: string;
};

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  industry: "",
  growth: "",
  revenueNow: "",
  revenueGoal: "",
  emergency: "",
};

export default function ApplyForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false); // reached the booking step (answers saved)

  const set = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  function validStep(s: number): string {
    if (s === 0) {
      if (!form.firstName.trim() || !form.lastName.trim()) return "Please add your name.";
      if (!emailOk) return "Please enter a valid email.";
      if (form.phone.replace(/\D/g, "").length < 7) return "Please enter your cell number.";
    }
    if (s === 1) {
      if (!form.industry.trim()) return "Tell us what you do.";
      if (!form.growth) return "Pick the one that fits.";
    }
    if (s === 2) {
      if (!form.revenueNow) return "Pick your current revenue.";
      if (!form.revenueGoal) return "Pick your 12-month goal.";
    }
    if (s === 3) {
      if (!form.emergency) return "Pick the one that fits.";
    }
    return "";
  }

  function next() {
    const msg = validStep(step);
    if (msg) return setError(msg);
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    submit();
  }

  function back() {
    setError("");
    if (step > 0) setStep(step - 1);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("bad response");
      setBooked(true);
    } catch {
      setError("Something went wrong sending that. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Booking step (answers already saved) --------------------------------
  if (booked) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-20">
        <div className="rounded-2xl border border-[color:var(--color-sjc-line)] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-green)]">
            Got it, {form.firstName}
          </p>
          <h1 className="mt-3 text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
            Last step — grab a time for your call.
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-sjc-mute)]">
            Pick a slot that works and we&apos;ll talk through exactly where AI employees plug into
            your business. No pitch — a real conversation about whether we can help.
          </p>
        </div>

        {BOOKING_URL ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-[color:var(--color-sjc-line)] bg-white shadow-sm">
            <iframe
              src={BOOKING_URL}
              title="Book your discovery call"
              className="h-[720px] w-full"
            />
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-[color:var(--color-sjc-line)] bg-white p-8 text-center">
            <p className="text-base font-semibold text-[color:var(--color-sjc-ink)]">
              You&apos;re on the list — I&apos;ll reach out personally to set the time.
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-sjc-mute)]">
              (The live booking calendar is being connected now.)
            </p>
          </div>
        )}
      </div>
    );
  }

  // ---- Question steps ------------------------------------------------------
  const HEADINGS = [
    { eyebrow: "Step 1 of 4", title: "First, who are you?" },
    { eyebrow: "Step 2 of 4", title: "Tell us about your business." },
    { eyebrow: "Step 3 of 4", title: "Where are you — and where do you want to be?" },
    { eyebrow: "Step 4 of 4", title: "One last question — the important one." },
  ];
  const h = HEADINGS[step];

  return (
    <div className="mx-auto max-w-xl px-6 py-14 md:py-20">
      {/* progress */}
      <div className="mb-8 flex gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-[color:var(--color-sjc-blue)]" : "bg-[color:var(--color-sjc-line)]"
            }`}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-[color:var(--color-sjc-line)] bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          {h.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-[color:var(--color-sjc-ink)] md:text-3xl">
          {h.title}
        </h1>

        <div className="mt-7 space-y-5">
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First name">
                  <input
                    className={inputCls}
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Last name">
                  <input
                    className={inputCls}
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Email">
                <input
                  type="email"
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@business.com"
                />
              </Field>
              <Field label="Cell phone">
                <input
                  type="tel"
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="(210) 555-1234"
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="What industry are you in / what do you do?">
                <input
                  className={inputCls}
                  value={form.industry}
                  onChange={(e) => set("industry", e.target.value)}
                  placeholder="e.g. roofing, med spa, HVAC, dental…"
                  autoFocus
                />
              </Field>
              <Field label="Where's your head at with growth right now?">
                <Cards
                  options={GROWTH_OPTIONS}
                  value={form.growth}
                  onPick={(v) => set("growth", v)}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Roughly what's the business doing in revenue now?">
                <Cards
                  options={REVENUE_OPTIONS}
                  value={form.revenueNow}
                  onPick={(v) => set("revenueNow", v)}
                />
              </Field>
              <Field label="Where do you want it in the next 12 months?">
                <Cards
                  options={REVENUE_OPTIONS}
                  value={form.revenueGoal}
                  onPick={(v) => set("revenueGoal", v)}
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <Field label="If a health emergency kept you out of work for 4–6 weeks, would your business thrive — or be in serious jeopardy?">
              <Cards
                options={EMERGENCY_OPTIONS}
                value={form.emergency}
                onPick={(v) => set("emergency", v)}
              />
            </Field>
          )}
        </div>

        {error ? (
          <p className="mt-5 text-sm font-semibold text-red-600">{error}</p>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="text-sm font-semibold text-[color:var(--color-sjc-mute)] hover:text-[color:var(--color-sjc-ink)]"
              disabled={submitting}
            >
              ← Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={next}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-[color:var(--color-sjc-blue)] px-7 py-3 font-semibold text-white shadow transition-colors hover:bg-[color:var(--color-sjc-green)] disabled:opacity-60"
          >
            {submitting
              ? "Sending…"
              : step < TOTAL_STEPS - 1
              ? "Next →"
              : "See call times →"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-[color:var(--color-sjc-mute)]">
        We only use this to see if we&apos;re a fit — no spam, ever.
      </p>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-sjc-line)] bg-white px-4 py-3 text-base text-[color:var(--color-sjc-ink)] outline-none transition-colors focus:border-[color:var(--color-sjc-blue)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[color:var(--color-sjc-ink)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Cards({
  options,
  value,
  onPick,
}: {
  options: string[];
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(opt)}
            className={`flex w-full items-center rounded-lg border px-4 py-3 text-left text-base transition-colors ${
              active
                ? "border-[color:var(--color-sjc-blue)] bg-blue-50 font-semibold text-[color:var(--color-sjc-ink)]"
                : "border-[color:var(--color-sjc-line)] bg-white text-[color:var(--color-sjc-ink)] hover:border-[color:var(--color-sjc-blue)]"
            }`}
          >
            <span
              className={`mr-3 flex h-5 w-5 flex-none items-center justify-center rounded-full border ${
                active
                  ? "border-[color:var(--color-sjc-blue)] bg-[color:var(--color-sjc-blue)]"
                  : "border-gray-300"
              }`}
            >
              {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
