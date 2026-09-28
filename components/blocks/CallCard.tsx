"use client";
// THE CALL CARD (2026-09-27, rebuilt same day after Steven's real call) — a colour-for-colour copy
// of the PROVEN reference at agent-sjc.onrender.com/sjc/roleplay (roleplay_routes.py's `#twin #card`
// / render()), not a reinterpretation: same title styling, same two-column navy/gold pills, same
// hint line, same contact-line taps, same confirm/booked stages. The one thing that changes on the
// website is POSITION — the reference's photo is full-height so its card floats over the bottom
// third; this site's photo is small, so the SAME card sits in normal flow directly below it (his
// face and body stay fully visible for the whole call) instead of overlapping it.

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
  // dev-only stress-test flag (never sent by the server): shows slots AND the confirm button
  // together so the widest/tallest possible card can be measured in one static frame.
  __previewForceAll?: boolean;
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

function CardBody({ card, onTap, status }: { card: CallCardData; onTap: (tap: Tap) => void; status?: string }) {
  const stage = card.stage || "";
  const forceAll = !!card.__previewForceAll;
  const slots = (stage === "confirm" || stage === "booked") && !forceAll ? [] : card.slots || [];
  const showChoices = !!card.choices;
  // BLANK-TITLE GUARD (Steven's 09-27 real call: tiles right, title area blank): fall back the
  // instant the title string is empty for ANY reason, never render nothing.
  const title = (card.choices && card.choices.title) || "Your call with Steven";
  const sk = slots.length ? card.slots_kind || "" : "";
  const hint =
    stage === "booked" ? "The invite is in your email."
    : stage === "confirm" ? "Tap if it's all correct, or tell me to submit it."
    : showChoices ? "Tap one, or just tell me."
    : sk === "day" ? "Tap a day, or just tell me." : sk === "time" ? "Tap a time, or just tell me." : sk === "part" ? "Tap one, or just tell me."
    : (card.first_name || card.phone || card.email || card.need_email) ? "Tap a line to fix it, or just tell me."
    : "";
  const booked = stage === "booked";
  // The heading belongs to the booking part of the card. While the twin is only talking (no
  // choices, times, contact lines, confirm or booked yet) the card is the read-along text alone —
  // a heading over nothing reads like a box that failed to open (Steven, 09-28 live call).
  const hasBody = showChoices || slots.length > 0 || !!card.picked || !!card.first_name || !!card.last_name
    || !!card.phone || !!card.email || !!card.need_email || stage === "confirm" || booked || forceAll;

  return (
    // data-sjc-ownbg: the card has its own white background, so it opts OUT of the band's forced
    // white h1/h2/strong/b text (DesignSection.tsx markBandRoot) — without this the title (h2) and
    // "You're booked." (a .big, not bold-tag, safe) render invisible-white on this white card. This
    // is exactly what bit Steven on the real call: tiles right, title blank.
    <div className="sjc-call-card" data-sjc-ownbg="" aria-live="polite">
      {card.said && <p className="sjc-cc-caption">{card.said}</p>}
      {hasBody && <h2 className="sjc-cc-title">{title}</h2>}
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
      {(stage === "confirm" || forceAll) && (
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

// ⭐ DEV-ONLY PREVIEW (see ?cardpreview=1 in HomeTwinOrb) — the WORST CASE, not a typical turn: the
// server never shows slots and the confirm button together, but stress-testing the widest/tallest
// possible card (caption + time slots + every contact line + the confirm button) in one static frame
// is how the width/height/wrap fixes below get measured, not eyeballed (Steven's 09-27 real-call bugs
// — "Rober/ts", "jackroberts@yahoo.c/om", "Wednesday at 4:00 / PM" — were all wrap bugs at the OLD
// 340px width, and this sample carries every one of those exact strings).
export const SAMPLE_CARD: CallCardData = {
  said: "Great — I've got a couple of times Wednesday afternoon open on my screen.",
  slots_kind: "time",
  slots: [{ label: "Wednesday at 4:00 PM" }, { label: "Wednesday at 5:30 PM" }],
  picked: "Wednesday at 4:00 PM",
  first_name: "Jack",
  last_name: "Roberts",
  phone: "(512) 555-0148",
  email: "jackroberts@yahoo.com",
  stage: "confirm",
  __previewForceAll: true,
};

// THE ENTER/EXIT SHELL — two variants of the exact same card:
// "flow" (phone): normal document flow, never position:absolute, never overlapping the photo. A
//   real call fires the card in as soon as the brain names one, and out a few seconds after hangup;
//   `overflow:hidden` + a max-height transition on THIS wrapper only exist so the collapse on exit
//   is smooth — the card itself (CardBody) never scrolls and is never height-capped while shown.
// "float" (laptop, 09-27: "too tall for the hero... beside me, not under me"): the CALLER already
//   positions this absolutely, left of the photo — this shell only fades/slides it in from the right
//   and fades it out; no height collapse needed because nothing here is ever in flow to begin with.
export default function CallCard({
  card, onTap, status, variant = "flow",
}: { card: CallCardData | null; onTap: (tap: Tap) => void; status?: string; variant?: "flow" | "float" }) {
  const [shown, setShown] = useState<CallCardData | null>(null);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const wrapRef = useRef<HTMLDivElement>(null);
  const cls = variant === "float" ? "sjc-cc-float" : "sjc-cc-flow";

  useEffect(() => {
    if (card) { setShown(card); setPhase("in"); return; }
    if (!shown) return;
    if (variant === "flow") {
      const el = wrapRef.current;
      if (el) { el.style.maxHeight = el.scrollHeight + "px"; void el.offsetHeight; }
    }
    setPhase("out");
    const t = setTimeout(() => setShown(null), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  if (!shown) return null;
  return (
    <div ref={wrapRef} className={cls + " " + (phase === "in" ? cls + "-in" : cls + "-out")}>
      <CardBody card={card || shown} onTap={onTap} status={status} />
    </div>
  );
}
