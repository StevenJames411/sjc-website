"use client";
// THE CALL CARD (ported 2026-09-27 from sjc-server/roleplay_routes.py's practice-page render()) —
// the read-along screen that rides along the live Twilio call: the script names a card, code owns
// every tile ("the tiles are mechanical the script names a card and code owns every button"). This
// is a straight port, not a redesign — same fields, same taps, same stages (choices → slots →
// contact lines → confirm → booked) — recoloured for the public site's solid-colour law (no gray
// labels, no faint borders; the server's own #5b6785/#dfe6f3 become solid navy).

import { useEffect, useRef, useState } from "react";

type Slot = { label: string };
type Choices = { title: string; options: string[] };
export type CallCardData = {
  choices?: Choices | null;
  slots?: Slot[];
  slots_kind?: string;
  stage?: string;
  picked?: string;
  chosen?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  need_email?: boolean;
  said?: string;
};

type Field = "first_name" | "last_name" | "phone" | "email";
type Tap = { kind: "choice" | "slot" | "confirm"; text?: string } | { kind: "field"; field: Field; value: string };

function useFlash(value: string): boolean {
  const [on, setOn] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (value && value !== prev.current) {
      prev.current = value;
      setOn(true);
      const t = setTimeout(() => setOn(false), 1400);
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);
  return on;
}

function Line({
  label, field, value, ask, editable, onSubmit,
}: {
  label: string; field: string; value: string; ask?: boolean; editable?: boolean;
  onSubmit?: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const flash = useFlash(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { setDraft(value); inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!value && !ask) return null;
  const finish = () => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== value && onSubmit) onSubmit(v);
  };
  return (
    <div
      className={"sjc-cc-line" + (flash ? " sjc-cc-flash" : "") + (ask ? " sjc-cc-ask" : "")}
      onClick={() => editable && !editing && setEditing(true)}
    >
      <span className="sjc-cc-k">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          className="sjc-cc-input"
          value={draft}
          type={field === "phone" ? "tel" : field === "email" ? "email" : "text"}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={finish}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="sjc-cc-v">{ask ? "Tap here to type your email, or spell it for me." : value}</span>
      )}
      {editable && <span className="sjc-cc-fix">Fix</span>}
    </div>
  );
}

// ⭐ DEV-ONLY PREVIEW (see ?cardpreview=1 in HomeTwinOrb) — a stage the real call never reaches on
// its own, kept here so the shape is proofread in one place.
export const SAMPLE_CARD: CallCardData = {
  choices: { title: "Are you using either one right now?", options: ["Paid ads", "Organic content", "Both", "Neither"] },
  said: "Quick question so I point you the right way —",
};

export default function CallCard({ card, onTap, status }: { card: CallCardData; onTap: (tap: Tap) => void; status?: string }) {
  const stage = card.stage || "";
  const slots = stage === "confirm" || stage === "booked" ? [] : card.slots || [];
  const showChoices = !!card.choices;
  const title = card.choices ? card.choices.title : "Your call with Steven";
  const sk = slots.length ? card.slots_kind || "" : "";
  const hint =
    stage === "booked" ? "The invite is in your email."
    : stage === "confirm" ? "Tap if it's all correct, or tell me to submit it."
    : showChoices ? "Tap one, or just tell me."
    : sk === "day" ? "Tap a day, or just tell me." : sk === "time" ? "Tap a time, or just tell me." : sk === "part" ? "Tap one, or just tell me."
    : (card.first_name || card.phone || card.email || card.need_email) ? "Tap a line to fix it, or just tell me."
    : "";
  const booked = stage === "booked";

  return (
    <div className="sjc-call-card" aria-live="polite">
      <h2 className="sjc-cc-title">{title}</h2>
      {hint && <p className="sjc-cc-hint">{hint}</p>}
      {showChoices && (
        <div className="sjc-cc-chips">
          {card.choices!.options.map((name) => (
            <button key={name} onClick={() => onTap({ kind: "choice", text: name })}>{name}</button>
          ))}
        </div>
      )}
      {slots.length > 0 && (
        <div className="sjc-cc-slots">
          {slots.map((x) => (
            <button
              key={x.label}
              className={card.picked === x.label || card.chosen === x.label ? "sjc-cc-picked" : ""}
              onClick={() => onTap({ kind: "slot", text: x.label })}
            >
              {x.label}
            </button>
          ))}
        </div>
      )}
      <Line label="When" field="picked" value={card.picked || ""} />
      <div className="sjc-cc-names">
        <Line label="First" field="first_name" value={card.first_name || ""} editable={!booked} onSubmit={(v) => onTap({ kind: "field", field: "first_name", value: v })} />
        <Line label="Last" field="last_name" value={card.last_name || ""} editable={!booked} onSubmit={(v) => onTap({ kind: "field", field: "last_name", value: v })} />
      </div>
      <Line label="Mobile" field="phone" value={card.phone || ""} editable={!booked} onSubmit={(v) => onTap({ kind: "field", field: "phone", value: v })} />
      <Line label="Email" field="email" value={card.email || ""} ask={!card.email && !!card.need_email} editable={!booked} onSubmit={(v) => onTap({ kind: "field", field: "email", value: v })} />
      {stage === "confirm" && (
        <button className="sjc-cc-ok" onClick={() => onTap({ kind: "confirm" })}>That's right</button>
      )}
      {booked && (
        <div className="sjc-cc-done">
          <div className="sjc-cc-done-big">You're booked.</div>
          <div className="sjc-cc-done-when">{card.picked || ""}</div>
          <span className="sjc-cc-add">The invite is in your email</span>
        </div>
      )}
      {status && <p className="sjc-cc-status">{status}</p>}
    </div>
  );
}
