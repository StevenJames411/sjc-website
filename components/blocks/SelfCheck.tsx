"use client";

import { useState } from "react";
import { resolveColorOr } from "@/lib/brandColor";

// THE SELF-CHECK — a handful of questions the visitor answers to reach the diagnosis himself.
//
// ⛔ DELIBERATELY NOT A LEAD FORM. Asking for an email in the middle of the argument turns a
// diagnosis into a trade, and he stops answering honestly. Nothing is submitted, stored or sent —
// the answers never leave the browser. That is the whole reason it works: "no email, no form" is
// a promise the block actually keeps.
//
// Nobody argues with a diagnosis they made themselves, which is why this sits between the problem
// and the solution rather than at the end as a CTA.

export type SelfCheckOption = { label: string; bad?: boolean };
export type SelfCheckQuestion = {
  q: string;
  options?: SelfCheckOption[];
  verdict?: string;   // shown only when a "bad" answer is picked
};
export type SelfCheckProps = {
  questions?: SelfCheckQuestion[];
  color?: string;
  onDark?: boolean;
  summaryNone?: string;
  summaryOne?: string;
  summaryMany?: string;   // {n} is replaced with how many were flagged
  summaryTail?: string;
};

export const SELFCHECK_DEFAULTS: SelfCheckProps = {
  color: "accent",
  onDark: true,
  summaryNone: "Then you are in better shape than most — and you probably don't need us yet.",
  summaryOne: "One weak link. That is the cheapest possible place to be, and the fastest to fix.",
  summaryMany: "{n} of them. That is normal, and it is why advertising has not worked the way you were told it would.",
  summaryTail: "They get fixed in order, not all at once. Keep scrolling.",
  questions: [
    { q: "How old is your website?", verdict: "Anything past three years is usually the problem.", options: [
      { label: "Under 2 years" }, { label: "3–5 years", bad: true }, { label: "Longer than that", bad: true }, { label: "I'd have to look", bad: true },
    ] },
  ],
};

export default function SelfCheck({
  questions, color, onDark, summaryNone, summaryOne, summaryMany, summaryTail,
}: SelfCheckProps) {
  const list = Array.isArray(questions) ? questions.filter((q) => q && q.q) : [];
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const accent = resolveColorOr(color, "var(--color-sjc-accent)");
  const ink = onDark ? "#fff" : "var(--color-sjc-ink)";
  const body = onDark ? "rgba(255,255,255,.72)" : "var(--color-sjc-mute)";
  const dim = onDark ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.5)";
  const hair = onDark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.14)";
  const panel = onDark ? "rgba(255,255,255,.04)" : "#fff";

  const answered = Object.keys(answers).length;
  const flagged = list.filter((q, i) => {
    const pick = answers[i];
    return pick !== undefined && q.options?.[pick]?.bad;
  }).length;

  const summary =
    flagged === 0 ? summaryNone
      : flagged === 1 ? summaryOne
        : (summaryMany || "").replace("{n}", String(flagged));

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-3xl gap-[18px]">
        {list.map((q, qi) => {
          const pick = answers[qi];
          const isBad = pick !== undefined && q.options?.[pick]?.bad;
          return (
            <div
              key={qi}
              className="p-6 transition-colors duration-300 md:p-8"
              style={{
                background: panel,
                border: `1px solid ${isBad ? accent : hair}`,
              }}
            >
              <div className="flex items-baseline gap-3.5">
                <span className="text-[17px]" style={{ color: accent }}>{String(qi + 1).padStart(2, "0")}</span>
                <h3 className="text-xl leading-tight md:text-2xl" style={{ color: ink }}>{q.q}</h3>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {(q.options || []).filter((o) => o && o.label).map((o, oi) => {
                  const on = pick === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      className="px-[18px] py-2.5 text-sm transition"
                      style={{
                        background: on ? `color-mix(in srgb, ${accent} 12%, transparent)` : "transparent",
                        border: `1px solid ${on ? accent : hair}`,
                        color: on ? accent : body,
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>

              {isBad && q.verdict ? (
                <p className="mt-5 pl-[18px] text-base leading-relaxed" style={{ color: body, borderLeft: `2px solid ${accent}` }}>
                  {q.verdict}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {list.length > 0 && answered === list.length ? (
        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-xl leading-snug md:text-3xl" style={{ color: ink }}>{summary}</p>
          {flagged > 0 && summaryTail ? (
            <p className="mt-4 text-base leading-relaxed" style={{ color: dim }}>{summaryTail}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
