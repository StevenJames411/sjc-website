"use client";

import { useState } from "react";

// One form, two question sets. The role picker swaps the tail of the form rather than sending
// applicants to two different pages — showing both seats on one page is the point: it reads as a
// company with teams, not a freelancer with a job ad.

type Q = { key: string; label: string; type?: "text" | "email" | "tel" | "textarea" | "choice"; options?: string[]; required?: boolean };

const SHARED: Q[] = [
  { key: "name", label: "Name", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "phone", label: "Phone", type: "tel", required: true },
  { key: "location", label: "Location and time zone", required: true },
];

const SALES: Q[] = [
  { key: "phone_experience", label: "How long have you sold on the phone?", type: "choice",
    options: ["Under a year", "1–3 years", "3–7 years", "7+ years"], required: true },
  { key: "sold_what", label: "What have you sold, and to whom?", type: "textarea", required: true },
  { key: "commission_ok", label: "This seat is commission only. Does that work for you?", type: "choice",
    options: ["Yes", "Yes, if there is a ramp", "No"], required: true },
  { key: "hours", label: "Hours a week you can dial, and which hours", type: "text", required: true },
  { key: "why", label: "Why this?", type: "textarea" },
];

const BUILDER: Q[] = [
  { key: "years", label: "How long have you been building websites?", type: "choice",
    options: ["Under 2 years", "2–5 years", "5–10 years", "10+ years"], required: true },
  { key: "stack", label: "What do you build with?", type: "textarea", required: true },
  { key: "portfolio", label: "Link to work you have built", type: "text", required: true },
  { key: "availability", label: "Hours a week available, and your time zone overlap with US Central", type: "text", required: true },
  { key: "rate", label: "Your hourly rate in USD", type: "text", required: true },
];

const ROLES = [
  { id: "Appointment Setter", qs: SALES },
  { id: "Web Builder", qs: BUILDER },
];

export default function CareersForm() {
  const [role, setRole] = useState<string>("");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const questions = role ? [...SHARED, ...(ROLES.find((r) => r.id === role)?.qs || [])] : [];

  const submit = async () => {
    setErr("");
    const missing = questions.filter((q) => q.required && !(vals[q.key] || "").trim());
    if (missing.length) { setErr(`Please answer: ${missing[0].label}`); return; }
    setSending(true);
    try {
      await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          answers: questions.map((q) => ({ label: q.label, value: vals[q.key] || "" })),
        }),
      });
      setDone(true);
    } catch {
      // The row may still have landed; never tell an applicant to try again and risk a duplicate.
      setDone(true);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div style={{ ...PANEL, textAlign: "center", padding: "48px 28px" }}>
        <h2 style={{ font: "400 27px/1.3 Georgia, serif", margin: 0 }}>Thank you — that is in.</h2>
        <p style={{ margin: "14px 0 0", color: "rgba(255,255,255,.6)", fontSize: 15.5 }}>
          If it is a fit you will hear from Steven directly to set up a call.
        </p>
      </div>
    );
  }

  return (
    <div style={PANEL}>
      <h2 style={{ font: "400 27px/1.3 Georgia, serif", margin: 0 }}>Apply</h2>

      <label style={LBL}>Which seat</label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            style={{
              ...INPUT, width: "auto", cursor: "pointer", padding: "12px 22px",
              borderColor: role === r.id ? "#c9a227" : "rgba(255,255,255,.14)",
              color: role === r.id ? "#e8c65a" : "rgba(255,255,255,.75)",
            }}
          >{r.id}</button>
        ))}
      </div>

      {role && questions.map((q) => (
        <div key={q.key}>
          <label style={LBL}>{q.label}{q.required && <span style={{ color: "#c9a227" }}> *</span>}</label>
          {q.type === "textarea" ? (
            <textarea
              value={vals[q.key] || ""}
              onChange={(e) => setVals((v) => ({ ...v, [q.key]: e.target.value }))}
              style={{ ...INPUT, minHeight: 110, resize: "vertical" }}
            />
          ) : q.type === "choice" ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(q.options || []).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setVals((v) => ({ ...v, [q.key]: o }))}
                  style={{
                    ...INPUT, width: "auto", cursor: "pointer", padding: "10px 16px", fontSize: 14,
                    borderColor: vals[q.key] === o ? "#c9a227" : "rgba(255,255,255,.14)",
                    color: vals[q.key] === o ? "#e8c65a" : "rgba(255,255,255,.7)",
                  }}
                >{o}</button>
              ))}
            </div>
          ) : (
            <input
              type={q.type || "text"}
              value={vals[q.key] || ""}
              onChange={(e) => setVals((v) => ({ ...v, [q.key]: e.target.value }))}
              style={INPUT}
            />
          )}
        </div>
      ))}

      {err && <div style={{ color: "#fca5a5", fontSize: 14 }}>{err}</div>}

      {role && (
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          style={{
            ...INPUT, width: "auto", justifySelf: "start", cursor: sending ? "default" : "pointer",
            padding: "15px 40px", borderColor: "#c9a227", color: "#e8c65a",
            letterSpacing: ".2em", textTransform: "uppercase", fontSize: 12, opacity: sending ? .6 : 1,
          }}
        >{sending ? "Sending…" : "Send application"}</button>
      )}
    </div>
  );
}

const PANEL: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.1)", background: "#111",
  padding: "clamp(26px,3.4vw,40px)", display: "grid", gap: 14, maxWidth: 720,
};
const LBL: React.CSSProperties = {
  display: "block", fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase",
  color: "rgba(255,255,255,.5)", marginBottom: 8, marginTop: 6,
};
const INPUT: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.14)",
  color: "#fff", padding: "13px 15px", fontSize: 15, fontFamily: "inherit", outline: "none",
  borderRadius: 2,
};
