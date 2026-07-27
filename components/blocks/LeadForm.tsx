"use client";

import { useState } from "react";

// A short lead-capture form, fully driven by props so it can be dropped on ANY page from the
// builder and re-labelled without touching code. Add/remove/reorder the questions, change the
// button, change the thank-you — all fields.
//
// Posts to /api/apply (ordered label/value pairs -> Apps Script -> the SJC Discovery Intake
// sheet + an email to Steven). The "source" value rides along as the first answer so leads from
// different pages stay sortable in the one sheet.

export type LeadFormField = { label: string; inputType: string };
export type LeadFormProps = {
  source?: string;
  fields?: LeadFormField[];
  buttonLabel?: string;
  note?: string;
  successHeading?: string;
  successBody?: string;
};

export const LEADFORM_DEFAULTS: LeadFormProps = {
  source: "/websites — $795 website offer",
  fields: [
    { label: "Your name", inputType: "text" },
    { label: "Business name", inputType: "text" },
    { label: "Best phone number", inputType: "tel" },
    { label: "What kind of work do you do?", inputType: "text" },
  ],
  buttonLabel: "Send Me My Website",
  note: "No obligation, and nothing gets built until you say so. Rather just talk? Call (210) 298-2343.",
  successHeading: "Got it. I'll call you today.",
  successBody:
    "Ten minutes on the phone is all I need. If you'd rather not wait, call me straight out at (210) 298-2343.",
};

const keyFor = (label: string, i: number) =>
  String(label || `q${i + 1}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `q${i + 1}`;

export default function LeadForm(props: LeadFormProps) {
  const {
    source = LEADFORM_DEFAULTS.source,
    fields,
    buttonLabel = LEADFORM_DEFAULTS.buttonLabel,
    note = LEADFORM_DEFAULTS.note,
    successHeading = LEADFORM_DEFAULTS.successHeading,
    successBody = LEADFORM_DEFAULTS.successBody,
  } = props;

  const list = (Array.isArray(fields) && fields.length ? fields : LEADFORM_DEFAULTS.fields) || [];

  const [values, setValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [trap, setTrap] = useState("");

  const missing = list.filter((f, i) => !(values[keyFor(f?.label, i)] || "").trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (trap) return; // honeypot caught a bot — silently do nothing
    if (missing.length) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submittedAt: new Date().toISOString(),
          answers: [
            { key: "source", label: "Source", value: source || "" },
            ...list.map((f, i) => ({
              key: keyFor(f?.label, i),
              label: f?.label || `Question ${i + 1}`,
              value: (values[keyFor(f?.label, i)] || "").trim(),
            })),
          ],
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm md:p-10">
        <h3 className="text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
          {successHeading}
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-sjc-mute)]">
          {successBody}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-left shadow-sm md:p-10"
    >
      <div className="space-y-5">
        {list.map((f, i) => {
          const k = keyFor(f?.label, i);
          return (
            <div key={k}>
              <label
                htmlFor={`lf-${k}`}
                className="mb-2 block text-sm font-semibold text-[color:var(--color-sjc-ink)]"
              >
                {f?.label}
              </label>
              <input
                id={`lf-${k}`}
                type={f?.inputType || "text"}
                value={values[k] || ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [k]: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[color:var(--color-sjc-ink)] outline-none transition focus:border-[color:var(--color-sjc-blue)] focus:ring-2 focus:ring-[color:var(--color-sjc-blue)]/20"
              />
            </div>
          );
        })}
      </div>

      {/* honeypot — off-screen for people, irresistible to bots */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        className="absolute left-[-9999px]"
      />

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-8 w-full rounded-lg bg-[color:var(--color-sjc-blue)] px-6 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-[color:var(--color-sjc-green)] disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : buttonLabel}
      </button>

      {state === "error" ? (
        <p className="mt-4 text-center text-base font-semibold text-red-600">
          {missing.length
            ? "Fill in every box and try again."
            : "That didn't go through — give it another try, or just call."}
        </p>
      ) : null}

      {note ? (
        <p className="mt-5 text-center text-sm text-[color:var(--color-sjc-mute)]">{note}</p>
      ) : null}
    </form>
  );
}
