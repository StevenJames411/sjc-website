"use client";
import { useSiteId } from "@/components/blocks/SiteContext";

import { useState } from "react";
import { resolveColor } from "@/lib/brandColor";

// A short lead-capture form, fully driven by props so it can be dropped on ANY page from the
// builder and re-labelled without touching code. Add/remove/reorder the questions, change the
// button, change the thank-you — all fields.
//
// Posts to /api/apply (ordered label/value pairs -> Apps Script -> the SJC Discovery Intake
// sheet + an email to Steven). The "source" value rides along as the first answer so leads from
// different pages stay sortable in the one sheet.

export type LeadFormField = {
  label: string;
  inputType: string;
  /**
   * THE SPREADSHEET COLUMN. Present on any question that came from the form library; absent on
   * blocks built before the library existed.
   *
   * ⚠️ When it's absent we fall back to slugifying the label, which is what the old code always
   * did — and that is the bug: reword the question and the answer starts landing in a NEW column,
   * orphaning everything collected so far. The fallback exists only so published pages keep
   * behaving exactly as they do today. Anything picked from the library carries a real key and
   * can be reworded freely.
   */
  fieldId?: string;
  /** Library questions can be optional. A block without this stays all-or-nothing, as before. */
  required?: boolean;
};
export type LeadFormProps = {
  source?: string;
  fields?: LeadFormField[];
  buttonLabel?: string;
  note?: string;
  successHeading?: string;
  successBody?: string;
  // The submit button was welded to SJC blue — our brand on the client's most important
  // element. Blank keeps the old behaviour exactly.
  buttonColor?: string;
  // Drops the centring + max-width so the form can sit in one half of a two-column layout
  // (contact details on the left, form on the right) instead of always being a centred island.
  inColumn?: boolean;
  // "dark" restyles the card for a dark section (glass panel, light labels) without touching the
  // delivery path. Added for /websites, whose contact band is near-black — a white card sat on it
  // like a patch. Everything else keeps "light", so no existing page changes.
  theme?: "light" | "dark";
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
  note: "No obligation, and nothing gets built until you say so. Rather just talk? Call (210) 851-4906.",
  successHeading: "Got it. I'll call you today.",
  buttonColor: "",
  inColumn: false,
  theme: "light",
  successBody:
    "Ten minutes on the phone is all I need. If you'd rather not wait, call me straight out at (210) 851-4906.",
};

// The stored key wins. Only fall back to the label when a block predates the form library —
// see the note on LeadFormField.fieldId.
const keyFor = (f: LeadFormField | undefined, i: number) => {
  const stored = String(f?.fieldId || "").trim();
  if (stored) return stored;
  return (
    String(f?.label || `q${i + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `q${i + 1}`
  );
};

// A question is mandatory unless the library explicitly marked it optional. Blocks from before
// the library have no `required` on any field, so they stay all-or-nothing exactly as before.
const isRequired = (f: LeadFormField | undefined, list: LeadFormField[]) =>
  list.some((x) => typeof x?.required === "boolean") ? !!f?.required : true;

export default function LeadForm(props: LeadFormProps) {
  const {
    source = LEADFORM_DEFAULTS.source,
    fields,
    buttonLabel = LEADFORM_DEFAULTS.buttonLabel,
    note = LEADFORM_DEFAULTS.note,
    successHeading = LEADFORM_DEFAULTS.successHeading,
    successBody = LEADFORM_DEFAULTS.successBody,
    buttonColor,
    inColumn,
    theme = "light",
  } = props;

  const dark = theme === "dark";
  const cardCls = dark
    ? "rounded-3xl border border-white/20 bg-white/[0.07] p-8 text-left shadow-2xl backdrop-blur-2xl md:p-10"
    : "rounded-2xl bg-white p-8 text-left shadow-sm md:p-10";
  const labelCls = dark
    ? "mb-2 block text-xs font-medium uppercase tracking-wider text-slate-300"
    : "mb-2 block text-sm font-semibold text-[color:var(--color-sjc-ink)]";
  const inputCls = dark
    ? "w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-[#00D9FF]"
    : "w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[color:var(--color-sjc-ink)] outline-none transition focus:border-[color:var(--color-sjc-blue)] focus:ring-2 focus:ring-[color:var(--color-sjc-blue)]/20";
  const noteCls = dark
    ? "mt-5 text-center text-sm text-slate-400"
    : "mt-5 text-center text-sm text-[color:var(--color-sjc-mute)]";

  // Comes from the route this page is served under, not from anything editable on the block.
  const siteId = useSiteId();

  const list = (Array.isArray(fields) && fields.length ? fields : LEADFORM_DEFAULTS.fields) || [];

  const [values, setValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [trap, setTrap] = useState("");

  const missing = list.filter(
    (f, i) => isRequired(f, list) && !(values[keyFor(f, i)] || "").trim()
  );

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
          // Which WEBSITE this came from, taken from the route rather than a typed field. The
          // server decides the destination from it — see app/api/apply. `source` stays as a
          // human label only; it must never be the thing that routes a lead.
          siteId,
          answers: [
            { key: "source", label: "Source", value: source || "" },
            ...list.map((f, i) => ({
              key: keyFor(f, i),
              label: f?.label || `Question ${i + 1}`,
              value: (values[keyFor(f, i)] || "").trim(),
            })),
          ],
        }),
      });
      if (!res.ok) throw new Error(String(res.status));

      // ⚠️ A 200 HERE DOES NOT MEAN THE LEAD GOT EVERYWHERE IT WAS OWED.
      //
      // /api/apply deliberately answers 200 when ANY destination landed, because a visitor must
      // never be punished for our plumbing — she typed her name in good faith and the enquiry does
      // exist somewhere. But this component used to stop reading at res.ok, so a lead that reached
      // SJC's intake and never reached the client's inbox or sheet rendered a green thank-you and
      // nobody anywhere was told. The one failure lib/leadDelivery.ts exists to prevent, reported
      // as a success by the last component in the chain.
      //
      // deliverLead already returns per-leg truth and the route already puts it on the wire, so the
      // fix is to READ it. She still sees success — that part was right. The difference is that a
      // partial delivery now leaves a trace instead of looking identical to a clean one.
      const body = await res.json().catch(() => null);
      const problems: string[] = Array.isArray(body?.problems) ? body.problems : [];
      if (problems.length) {
        // Console first: it costs nothing, it's visible in Vercel's logs against this request, and
        // it works even if the beacon below is blocked.
        console.error(`[lead] partial delivery for ${siteId}: ${problems.join(" | ")}`);
        // Fire-and-forget. `sendBeacon` survives the page being closed a moment later, which a
        // fetch does not — and a visitor who submits and immediately navigates away is exactly the
        // case where losing the report would matter most.
        try {
          navigator.sendBeacon?.(
            "/api/lead-problem",
            new Blob([JSON.stringify({ siteId, problems, at: new Date().toISOString() })], {
              type: "application/json",
            })
          );
        } catch {
          /* reporting must never break the thank-you screen */
        }
      }

      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className={`${cardCls} text-center${inColumn ? "" : " mx-auto max-w-xl"}`}>
        <h3
          className={`text-2xl font-bold md:text-3xl ${
            dark ? "text-white" : "text-[color:var(--color-sjc-ink)]"
          }`}
        >
          {successHeading}
        </h3>
        <p
          className={`mt-4 text-lg leading-relaxed ${
            dark ? "text-slate-300" : "text-[color:var(--color-sjc-mute)]"
          }`}
        >
          {successBody}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className={`${cardCls}${inColumn ? "" : " mx-auto max-w-xl"}`}
    >
      <div className="space-y-5">
        {list.map((f, i) => {
          const k = keyFor(f, i);
          return (
            <div key={k}>
              <label htmlFor={`lf-${k}`} className={labelCls}>
                {f?.label}
                {isRequired(f, list) ? null : (
                  <span className="ml-1 font-normal opacity-60">(optional)</span>
                )}
              </label>
              <input
                id={`lf-${k}`}
                type={f?.inputType || "text"}
                value={values[k] || ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [k]: e.target.value }))}
                className={inputCls}
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
        className={
          dark
            ? "mt-8 w-full rounded-xl bg-[#00D9FF] px-6 py-4 text-lg font-bold text-[#0A0E27] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[#00D9FF]/50 disabled:opacity-60"
            : `mt-8 w-full rounded-lg px-6 py-4 text-lg font-bold text-white shadow-sm transition disabled:opacity-60${
                buttonColor
                  ? " hover:opacity-90"
                  : " bg-[color:var(--color-sjc-blue)] hover:bg-[color:var(--color-sjc-green)]"
              }`
        }
        style={!dark && buttonColor ? { backgroundColor: resolveColor(buttonColor) } : undefined}
      >
        {state === "sending" ? "Sending…" : buttonLabel}
      </button>

      {state === "error" ? (
        <p
          className={`mt-4 text-center text-base font-semibold ${
            dark ? "text-red-400" : "text-red-600"
          }`}
        >
          {missing.length
            ? "Fill in every box and try again."
            : "That didn't go through — give it another try, or just call."}
        </p>
      ) : null}

      {note ? <p className={noteCls}>{note}</p> : null}
    </form>
  );
}
