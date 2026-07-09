"use client";

import { useState } from "react";

// Data-driven discovery-call intake. The steps/questions come from the Puck "apply" page
// (edited at /edit/apply) — nothing here is hardcoded. Renders a multi-step wizard, posts the
// answers to /api/apply (→ Google Sheet + email), THEN reveals the Google Calendar booking.

export type Question = {
  key: string;
  label: string;
  type: "text" | "email" | "phone" | "choice" | "multi";
  options: string[];
  required: boolean;
};
export type Step = { title: string; questions: Question[] };
export type Intro = { eyebrow: string; title: string; sub: string };
export type Booking = { eyebrow: string; heading: string; sub: string };

const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || "";

// Intro / booking / disclaimer copy comes from the rich-text editor as HTML (bold, links, etc.,
// wrapped in <p>). Strip the block <p> wrappers so the INLINE formatting renders inside our own
// styled elements — otherwise the raw tags leak onto the page as plain text.
const rt = (s: string) =>
  (s || "").replace(/<\/p>\s*<p[^>]*>/gi, " ").replace(/<\/?p[^>]*>/gi, "").trim();

export default function ApplyForm({
  steps,
  intro,
  disclaimer,
  booking,
  bookingUrl,
  submitPath,
}: {
  steps: Step[];
  intro: Intro;
  disclaimer: string;
  booking: Booking;
  // Optional overrides so this same wizard powers other intake forms (e.g. /guest) with a
  // different calendar + submit endpoint. Unset = the original client-intake behavior.
  bookingUrl?: string;
  submitPath?: string;
}) {
  const bookingSrc = bookingUrl || BOOKING_URL;
  const postPath = submitPath || "/api/apply";
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const total = steps.length;
  const safeSteps = total > 0 ? steps : [];

  const set = (k: string, v: string) => {
    setAnswers((a) => ({ ...a, [k]: v }));
    setError("");
  };

  function validate(s: number): string {
    const cur = safeSteps[s];
    if (!cur) return "";
    for (const q of cur.questions) {
      const v = (answers[q.key] || "").trim();
      if (q.required && !v) return "Please answer every question to continue.";
      if (v && q.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        return "Please enter a valid email.";
      if (v && q.type === "phone" && v.replace(/\D/g, "").length < 7)
        return "Please enter a valid phone number.";
    }
    return "";
  }

  function next() {
    const msg = validate(step);
    if (msg) return setError(msg);
    if (step < total - 1) return setStep(step + 1);
    submit();
  }

  function back() {
    setError("");
    if (step > 0) setStep(step - 1);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    // ordered label/value pairs across every step — this is what lands in the Sheet + email
    const payload = {
      submittedAt: new Date().toISOString(),
      answers: safeSteps.flatMap((st) =>
        st.questions.map((q) => ({ key: q.key, label: q.label, value: (answers[q.key] || "").trim() }))
      ),
    };
    try {
      const res = await fetch(postPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad response");
      setDone(true);
    } catch {
      setError("Something went wrong sending that. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  const firstName = (answers["q-first"] || "").trim();

  // ---- Booking step (answers already saved) --------------------------------
  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-20">
        <div className="rounded-2xl border border-[color:var(--color-sjc-line)] bg-white p-8 text-center shadow-sm">
          {booking.eyebrow ? (
            <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-green)]">
              <span dangerouslySetInnerHTML={{ __html: rt(booking.eyebrow) }} />
              {firstName ? `, ${firstName}` : ""}
            </p>
          ) : null}
          {booking.heading ? (
            <h1
              className="mt-3 text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl"
              dangerouslySetInnerHTML={{ __html: rt(booking.heading) }}
            />
          ) : null}
          {booking.sub ? (
            <p
              className="mt-4 text-base text-[color:var(--color-sjc-mute)]"
              dangerouslySetInnerHTML={{ __html: rt(booking.sub) }}
            />
          ) : null}
        </div>
        {bookingSrc ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-[color:var(--color-sjc-line)] bg-white shadow-sm">
            <iframe src={bookingSrc} title="Book your time" className="h-[720px] w-full" />
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

  if (total === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center text-[color:var(--color-sjc-mute)]">
        This form has no questions yet. Add a Form Step at <code>/edit/apply</code>.
      </div>
    );
  }

  const cur = safeSteps[step];

  return (
    <>
      {/* intro */}
      <section className="w-full">
        <div className="mx-auto max-w-2xl px-6 pt-14 text-center md:pt-20">
          {intro.eyebrow ? (
            <p
              className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]"
              dangerouslySetInnerHTML={{ __html: rt(intro.eyebrow) }}
            />
          ) : null}
          {intro.title ? (
            <h1
              className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
              dangerouslySetInnerHTML={{ __html: rt(intro.title) }}
            />
          ) : null}
          {intro.sub ? (
            <p
              className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--color-sjc-mute)]"
              dangerouslySetInnerHTML={{ __html: rt(intro.sub) }}
            />
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-xl px-6 py-14 md:py-16">
        {/* progress */}
        <div className="mb-8 flex gap-2">
          {safeSteps.map((_, i) => (
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
            Step {step + 1} of {total}
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-[color:var(--color-sjc-ink)] md:text-3xl">
            {cur.title}
          </h2>

          <div className="mt-7 space-y-6">
            {cur.questions.map((q) => (
              <div key={q.key}>
                <label className="mb-2 block text-sm font-semibold text-[color:var(--color-sjc-ink)]">
                  {q.label}
                </label>
                {q.type === "choice" || q.type === "multi" ? (
                  <Cards
                    options={q.options}
                    value={answers[q.key] || ""}
                    onPick={(v) => set(q.key, v)}
                    multi={q.type === "multi"}
                  />
                ) : (
                  <input
                    type={q.type === "email" ? "email" : q.type === "phone" ? "tel" : "text"}
                    className={inputCls}
                    value={answers[q.key] || ""}
                    onChange={(e) => set(q.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          {error ? <p className="mt-5 text-sm font-semibold text-red-600">{error}</p> : null}

          <div className="mt-8 flex items-center justify-between gap-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                disabled={submitting}
                className="text-sm font-semibold text-[color:var(--color-sjc-mute)] hover:text-[color:var(--color-sjc-ink)]"
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
              {submitting ? "Sending…" : step < total - 1 ? "Next →" : "See call times →"}
            </button>
          </div>
        </div>

        {disclaimer ? (
          <p
            className="mt-6 text-center text-xs text-[color:var(--color-sjc-mute)]"
            dangerouslySetInnerHTML={{ __html: rt(disclaimer) }}
          />
        ) : null}
      </div>
    </>
  );
}

const inputCls =
  "w-full rounded-lg border border-[color:var(--color-sjc-line)] bg-white px-4 py-3 text-base text-[color:var(--color-sjc-ink)] outline-none transition-colors focus:border-[color:var(--color-sjc-blue)]";

function Cards({
  options,
  value,
  onPick,
  multi,
}: {
  options: string[];
  value: string;
  onPick: (v: string) => void;
  multi?: boolean;
}) {
  // single-choice: value is one option. multi: value is a ", "-joined list of options.
  const selected = multi ? value.split(", ").filter(Boolean) : [value];
  const pick = (opt: string) => {
    if (!multi) return onPick(opt);
    const set = new Set(selected);
    if (set.has(opt)) set.delete(opt);
    else set.add(opt);
    onPick(options.filter((o) => set.has(o)).join(", ")); // re-join in option order = stable
  };
  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => pick(opt)}
            className={`flex w-full items-center rounded-lg border px-4 py-3 text-left text-base transition-colors ${
              active
                ? "border-[color:var(--color-sjc-blue)] bg-blue-50 font-semibold text-[color:var(--color-sjc-ink)]"
                : "border-[color:var(--color-sjc-line)] bg-white text-[color:var(--color-sjc-ink)] hover:border-[color:var(--color-sjc-blue)]"
            }`}
          >
            <span
              className={`mr-3 flex h-5 w-5 flex-none items-center justify-center border ${
                multi ? "rounded" : "rounded-full"
              } ${
                active ? "border-[color:var(--color-sjc-blue)] bg-[color:var(--color-sjc-blue)]" : "border-gray-300"
              }`}
            >
              {active ? (
                multi ? (
                  <span className="text-[11px] font-bold leading-none text-white">✓</span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )
              ) : null}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
