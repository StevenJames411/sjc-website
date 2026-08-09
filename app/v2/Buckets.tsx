"use client";

import { useState } from "react";
import { BUCKETS } from "./content";
import { Section, Eyebrow, H2, Lede } from "./Section";

// The hinge of the page. Up to here he has been reading; here he answers four questions and
// arrives at the conclusion himself. Nobody argues with a diagnosis they made.
//
// Deliberately NOT a lead-capture form. Asking for an email in the middle of the argument
// turns a diagnosis into a trade, and he stops being honest with the answers.

const QUESTIONS = BUCKETS.questions;

export default function Buckets() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const answered = Object.keys(answers).length;
  const flagged = QUESTIONS.filter((q) => {
    const i = answers[q.id];
    return i !== undefined && q.options[i].bad;
  });

  return (
    // ⚠️ It rolled its own <section> and so sat OUTSIDE the tone system — every var(--text-2)
    // in here resolved to nothing. It now goes through Section like everything else.
    <Section id="diagnosis" tone="raised">
      <Eyebrow>Four Questions</Eyebrow>
      <H2>Answer these honestly. Nobody sees it but you.</H2>
      <Lede>No email, no form. This is the same walkthrough we&rsquo;d do with you on a call.</Lede>

      <div style={{ maxWidth: 900, margin: "clamp(40px,5vw,64px) auto 0", display: "grid", gap: 18 }}>
        {QUESTIONS.map((q, qi) => {
          const chosen = answers[q.id];
          const isBad = chosen !== undefined && q.options[chosen].bad;
          return (
            <div key={q.id} style={{
              border: `1px solid ${chosen === undefined ? "rgba(var(--edge),.12)" : isBad ? "rgba(var(--accent-rgb),.45)" : "rgba(var(--edge),.2)"}`,
              background: "var(--panel)", padding: "clamp(24px,2.8vw,34px)", transition: "border-color .4s",
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <span style={{ fontFamily: "Georgia, serif", color: "var(--accent)", fontSize: 17 }}>{String(qi + 1).padStart(2, "0")}</span>
                <h3 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(20px,1.9vw,27px)", margin: 0, lineHeight: 1.3, color: "var(--text)" }}>{q.q}</h3>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 20 }}>
                {q.options.map((o, oi) => {
                  const on = chosen === oi;
                  return (
                    <button
                      key={o.label}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      style={{
                        padding: "11px 18px", cursor: "pointer", fontFamily: "inherit", fontSize: 14.5,
                        background: on ? "rgba(var(--accent-rgb),.12)" : "rgba(var(--edge),.04)",
                        border: `1px solid ${on ? "var(--accent)" : "rgba(var(--edge),.18)"}`,
                        color: on ? "var(--accent)" : "var(--text-2)", borderRadius: 2, transition: ".25s",
                      }}
                    >{o.label}</button>
                  );
                })}
              </div>

              {isBad && (
                <p style={{ margin: "20px 0 0", color: "var(--text-2)", fontSize: "clamp(15px,1.1vw,17px)", lineHeight: 1.85, fontWeight: 300, borderLeft: "2px solid var(--accent)", paddingLeft: 18 }}>
                  {q.verdict}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {answered === QUESTIONS.length && (
        <div style={{ maxWidth: 900, margin: "clamp(34px,4vw,52px) auto 0", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "clamp(21px,2.2vw,32px)", lineHeight: 1.5, color: "var(--text)", margin: 0 }}>
            {flagged.length === 0
              ? "Then you are in better shape than most — and you probably don't need us yet."
              : flagged.length === 1
                ? "One weak link. That is the cheapest possible place to be, and the fastest to fix."
                : flagged.length === QUESTIONS.length
                  ? "All four. That is normal, and it is why advertising has never worked the way you were told it would."
                  : `${flagged.length} of the four. That is normal, and it is why advertising has not worked the way you were told it would.`}
          </p>
          {flagged.length > 0 && (
            <p style={{ color: "var(--text-3)", fontSize: 16, lineHeight: 1.8, marginTop: 18, fontWeight: 300 }}>
              They get fixed in order, not all at once. Keep scrolling.
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
