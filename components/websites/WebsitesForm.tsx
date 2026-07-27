"use client";

import { useState } from "react";
import { WEBSITES_PHONE, WEBSITES_PHONE_HREF } from "./WebsitesChrome";

// Four fields, one screen, one button. Deliberately NOT the multi-step /apply form — a $795
// buyer with a flip-phone email address will abandon anything longer. We only need enough to
// call him back; the rest of the conversation happens on the phone.
//
// Posts to the existing /api/apply pipe (ordered label/value pairs -> Apps Script -> the SJC
// Discovery Intake sheet + an email to Steven). The first answer is a SOURCE tag so these
// $795 website leads stay sortable apart from the high-ticket AI-implementation leads that
// share the sheet. Split them into their own sheet if the volume ever justifies it.
const SOURCE = "/websites — $795 website offer";

const FIELDS = [
  { key: "name", label: "Your name", type: "text", autoComplete: "name" },
  { key: "business", label: "Business name", type: "text", autoComplete: "organization" },
  { key: "phone", label: "Best phone number", type: "tel", autoComplete: "tel" },
  { key: "trade", label: "What kind of work do you do?", type: "text", autoComplete: "off" },
];

export default function WebsitesForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [trap, setTrap] = useState("");

  const set = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));
  const missing = FIELDS.filter((f) => !(values[f.key] || "").trim()).map((f) => f.key);

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
            { key: "source", label: "Source", value: SOURCE },
            ...FIELDS.map((f) => ({
              key: f.key,
              label: f.label,
              value: (values[f.key] || "").trim(),
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
          Got it. I&apos;ll call you today.
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--color-sjc-mute)]">
          Ten minutes on the phone is all I need. If you&apos;d rather not wait, call me
          straight out at{" "}
          <a
            href={WEBSITES_PHONE_HREF}
            className="font-semibold text-[color:var(--color-sjc-blue)]"
          >
            {WEBSITES_PHONE}
          </a>
          .
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
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label
              htmlFor={`w-${f.key}`}
              className="mb-2 block text-sm font-semibold text-[color:var(--color-sjc-ink)]"
            >
              {f.label}
            </label>
            <input
              id={`w-${f.key}`}
              type={f.type}
              autoComplete={f.autoComplete}
              value={values[f.key] || ""}
              onChange={(e) => set(f.key, e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[color:var(--color-sjc-ink)] outline-none transition focus:border-[color:var(--color-sjc-blue)] focus:ring-2 focus:ring-[color:var(--color-sjc-blue)]/20"
            />
          </div>
        ))}
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
        {state === "sending" ? "Sending…" : "Send Me My Website"}
      </button>

      {state === "error" ? (
        <p className="mt-4 text-center text-base font-semibold text-red-600">
          {missing.length
            ? "Fill in all four boxes and try again."
            : `That didn't go through. Call me at ${WEBSITES_PHONE} and we'll sort it out.`}
        </p>
      ) : null}

      <p className="mt-5 text-center text-sm text-[color:var(--color-sjc-mute)]">
        No obligation, and nothing gets built until you say so. Rather just talk?{" "}
        <a href={WEBSITES_PHONE_HREF} className="font-semibold text-[color:var(--color-sjc-blue)]">
          Call {WEBSITES_PHONE}
        </a>
        .
      </p>
    </form>
  );
}
