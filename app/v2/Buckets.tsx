"use client";

import { useState } from "react";

// The hinge of the page. Up to here he has been reading; here he answers four questions and
// arrives at the conclusion himself. Nobody argues with a diagnosis they made.
//
// Deliberately NOT a lead-capture form. Asking for an email in the middle of the argument
// turns a diagnosis into a trade, and he stops being honest with the answers.

type Q = {
  id: string;
  q: string;
  options: { label: string; bad: boolean }[];
  verdict: string;
};

const QUESTIONS: Q[] = [
  {
    id: "site",
    q: "How old is your website?",
    options: [
      { label: "Under 2 years", bad: false },
      { label: "3–5 years", bad: true },
      { label: "Longer than that", bad: true },
      { label: "I'd have to look", bad: true },
    ],
    verdict:
      "A site more than three years old was built before most of your customers started searching on a phone. It is not that it looks dated — it is that it was designed for a different device.",
  },
  {
    id: "reviews",
    q: "How many Google reviews do you have?",
    options: [
      { label: "50 or more", bad: false },
      { label: "10–50", bad: true },
      { label: "Under 10", bad: true },
      { label: "No idea", bad: true },
    ],
    verdict:
      "Under about fifty, you are not being compared to your competitors — you are being skipped before the comparison starts. It is rarely a quality problem. It is that nobody ever asks.",
  },
  {
    id: "afterhours",
    q: "What happens to a call at six o'clock on a Friday?",
    options: [
      { label: "Answered or returned same day", bad: false },
      { label: "Voicemail, called back Monday", bad: true },
      { label: "Honestly, it depends", bad: true },
      { label: "It's missed", bad: true },
    ],
    verdict:
      "Most enquiries arrive outside the hours you work. The homeowner who called at six called two other people at six as well, and one of them answered.",
  },
  {
    id: "scale",
    q: "What breaks if you double your leads tomorrow?",
    options: [
      { label: "Nothing — we'd handle it", bad: false },
      { label: "The follow-up", bad: true },
      { label: "The scheduling", bad: true },
      { label: "Me", bad: true },
    ],
    verdict:
      "This is the one that decides whether advertising is worth doing at all. Paid traffic poured into a business that cannot absorb it just makes the leak bigger and more expensive.",
  },
];

export default function Buckets() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const answered = Object.keys(answers).length;
  const flagged = QUESTIONS.filter((q) => {
    const i = answers[q.id];
    return i !== undefined && q.options[i].bad;
  });

  return (
    <section id="diagnosis" style={{ padding: "clamp(64px,9vw,130px) clamp(20px,5vw,60px)", maxWidth: 1280, margin: "0 auto", scrollMarginTop: 20 }}>
      <div style={{ fontSize: "clamp(15px,1.35vw,19px)", letterSpacing: ".3em", textTransform: "uppercase", color: "#c9a227", textAlign: "center", fontWeight: 500 }}>
        Four Questions
      </div>
      <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 300, fontSize: "clamp(27px,3.8vw,52px)", textAlign: "center", margin: "24px 0 0", lineHeight: 1.15 }}>
        Answer these honestly. Nobody sees it but you.
      </h2>
      <p style={{ maxWidth: "min(86ch,1180px)", margin: "26px auto 0", textAlign: "center", color: "rgba(255,255,255,.66)", fontWeight: 300, lineHeight: 1.78, fontSize: "clamp(15px,1.32vw,21px)" }}>
        No email, no form. This is the same walkthrough I&rsquo;d do with you on a call.
      </p>

      <div style={{ maxWidth: 900, margin: "clamp(40px,5vw,64px) auto 0", display: "grid", gap: 18 }}>
        {QUESTIONS.map((q, qi) => {
          const chosen = answers[q.id];
          const isBad = chosen !== undefined && q.options[chosen].bad;
          return (
            <div key={q.id} style={{
              border: `1px solid ${chosen === undefined ? "rgba(255,255,255,.09)" : isBad ? "rgba(201,162,39,.45)" : "rgba(255,255,255,.16)"}`,
              background: "#101010", padding: "clamp(24px,2.8vw,34px)", transition: "border-color .4s",
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <span style={{ fontFamily: "Georgia, serif", color: "#c9a227", fontSize: 17 }}>{String(qi + 1).padStart(2, "0")}</span>
                <h3 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(20px,1.9vw,27px)", margin: 0, lineHeight: 1.3 }}>{q.q}</h3>
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
                        background: on ? "rgba(201,162,39,.12)" : "rgba(255,255,255,.03)",
                        border: `1px solid ${on ? "#c9a227" : "rgba(255,255,255,.14)"}`,
                        color: on ? "#e8c65a" : "rgba(255,255,255,.72)", borderRadius: 2, transition: ".25s",
                      }}
                    >{o.label}</button>
                  );
                })}
              </div>

              {isBad && (
                <p style={{ margin: "20px 0 0", color: "rgba(255,255,255,.72)", fontSize: "clamp(15px,1.1vw,17px)", lineHeight: 1.85, fontWeight: 300, borderLeft: "2px solid #c9a227", paddingLeft: 18 }}>
                  {q.verdict}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {answered === QUESTIONS.length && (
        <div style={{ maxWidth: 900, margin: "clamp(34px,4vw,52px) auto 0", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "clamp(21px,2.2vw,32px)", lineHeight: 1.5, color: "#fff", margin: 0 }}>
            {flagged.length === 0
              ? "Then you are in better shape than most — and you probably don't need me yet."
              : flagged.length === 1
                ? "One weak link. That is the cheapest possible place to be, and the fastest to fix."
                : flagged.length === QUESTIONS.length
                  ? "All four. That is normal, and it is why advertising has never worked the way you were told it would."
                  : `${flagged.length} of the four. That is normal, and it is why advertising has not worked the way you were told it would.`}
          </p>
          {flagged.length > 0 && (
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 16, lineHeight: 1.8, marginTop: 18, fontWeight: 300 }}>
              They get fixed in order, not all at once. Keep scrolling.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
