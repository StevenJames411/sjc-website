"use client";
import { useRef, useState } from "react";
import type { Colour } from "@/lib/checksShared";
import { SWATCH, Dot } from "./shared";

// THE ROSTER — one row per owner, in the order Steven put them in.
//
// ── WHY IT DRAGS ──────────────────────────────────────────────────────────────────────────────
// When he is actively building for two or three clients he wants those three at the top and he
// wants them to STAY there through every sweep, whatever colour they turn. The order saves to
// Postgres, so it survives a reload and follows him to his phone.
//
// ── ⚠️ WHY POINTER EVENTS AND NOT HTML5 DRAG-AND-DROP ─────────────────────────────────────────
// components/edit/SectionsPanel.tsx uses the HTML5 `draggable` API, and this started as a copy of
// it. Two problems, and the second is the one that matters:
//
//   1. HTML5 drag-and-drop does not fire on iOS Safari at all. The phone is the entire reason the
//      back office got a cockpit shell — shipping a desktop-only reorder onto a surface built for
//      the field is shipping half a feature.
//   2. It cannot be verified. Synthetic mouse events (Chrome DevTools Protocol, which is how this
//      gets driven and tested) do not trigger native drag events either, so a broken HTML5 drag
//      and a working one look identical from outside. "Probably fine" is not a receipt.
//
// Pointer events fire for a mouse, a trackpad, a finger and a test harness, identically. One code
// path, one behaviour, actually checkable. The ▲▼ buttons stay as the keyboard/accessible path.

export type RosterRow = {
  key: string;
  title: string;
  subtitle: string;
  summary: string;
  colour: Colour;
  /** One line per check — its NAME and how it came back. Counts told him nothing; names do. */
  lines: { colour: Colour; label: string; detail: string }[];
  /** draft / demo / published / archived. Absent on the mainline, which is not a website. */
  state?: string;
  /** "last looked 24m ago" — kept as words because a board without a timestamp is a placebo. */
  looked?: string;
};

export default function Roster({ rows }: { rows: RosterRow[] }) {
  const [order, setOrder] = useState<RosterRow[]>(rows);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  // ⚠️ THE DRAG STATE LIVES IN REFS, AND THE STATE COPY IS ONLY FOR PAINTING.
  //
  // React state is asynchronous. A pointermove can arrive in the same task as the pointerdown that
  // started the drag — a fast flick, or any synthetic event — and at that moment the handler's
  // closure still sees dragKey === null and throws the move away. That is exactly why the first
  // version looked dead: not a broken listener, a listener reading a value that hadn't landed yet.
  //
  // Same reason for the order: pointermove outruns re-renders, so reading `order` would compute
  // each swap from a stale list and the row would fight the pointer.
  const live = useRef<RosterRow[]>(rows);
  const dragRef = useRef<string | null>(null);

  function save(next: RosterRow[]) {
    setSaveErr("");
    fetch("/api/board-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ order: next.map((r) => r.key) }),
    })
      .then((r) => r.json())
      .then((j) => {
        // Optimistic: the row is already where he dropped it. If the save failed he is TOLD, rather
        // than finding out on the next reload when his arrangement is quietly gone.
        if (!j?.ok) setSaveErr("That new order didn't save — a reload will put it back as it was.");
      })
      .catch(() => setSaveErr("That new order didn't save — a reload will put it back as it was."));
  }

  function reorder(from: number, to: number): RosterRow[] | null {
    if (to < 0 || to >= live.current.length || from === to) return null;
    const next = [...live.current];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    live.current = next;
    setOrder(next);
    return next;
  }

  function nudge(from: number, to: number) {
    const next = reorder(from, to);
    if (next) save(next);
  }

  function onPointerDown(e: React.PointerEvent, key: string) {
    // Left button / touch / pen only — a right-click must not start a drag.
    if (e.button !== 0) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = key;
    setDragKey(key);
  }

  function onPointerMove(e: React.PointerEvent) {
    const key = dragRef.current;
    if (!key || !listRef.current) return;
    e.preventDefault();
    const from = live.current.findIndex((r) => r.key === key);
    if (from < 0) return;

    // Which row is the pointer sitting over? Measured from the live DOM rather than from assumed
    // row heights — the rows are different heights (one, two or three status phrases) and a fixed
    // height would make the swap point drift further down the list on every row.
    const kids = Array.from(listRef.current.children) as HTMLElement[];
    const to = kids.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (to >= 0 && to !== from) reorder(from, to);
  }

  function onPointerUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragKey(null);
    save(live.current);
  }

  return (
    <>
      {saveErr && <p style={{ fontSize: 13, color: "var(--e-danger)", margin: "0 0 12px" }}>{saveErr}</p>}

      <div
        ref={listRef}
        style={{ display: "grid", gap: 10 }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {order.map((g, i) => {
          const sw = SWATCH[g.colour];
          return (
            <div
              key={g.key}
              id={`row-${g.key}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: sw.bg,
                border: `1px solid ${sw.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                opacity: dragKey === g.key ? 0.55 : 1,
                boxShadow: dragKey === g.key ? "0 8px 24px rgba(0,0,0,0.18)" : "none",
              }}
            >
              <span
                onPointerDown={(e) => onPointerDown(e, g.key)}
                title="Drag to reorder"
                aria-label="Drag to reorder"
                style={{
                  color: "var(--e-muted)",
                  fontSize: 16,
                  cursor: dragKey === g.key ? "grabbing" : "grab",
                  flex: "0 0 auto",
                  lineHeight: 1,
                  padding: "6px 4px",
                  // Without this the phone scrolls the page instead of moving the row.
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
                ⋮⋮
              </span>

              {/* The link wraps the TEXT, not the row. Wrapping the row made every drag end in a
                  navigation away from the board the moment the pointer came up. */}
              <a
                href={`/edit/board/${g.key}`}
                style={{ minWidth: 0, flex: 1, textDecoration: "none", color: "inherit" }}
                draggable={false}
              >
                {/* THE ROW'S OWN LIGHT SITS ON THE TITLE LINE. It used to sit in the left gutter,
                    vertically centred against a block that grows — so it drifted away from the name
                    it describes and stole a column from a canvas Steven deliberately keeps narrow. */}
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <Dot colour={g.colour} size={12} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--e-ink)", overflowWrap: "anywhere" }}>
                    {g.title}
                  </span>
                  {g.state && g.state !== "published" ? (
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        background: "var(--e-muted-bg, #eef1f6)",
                        color: "var(--e-muted-ink, #55617a)",
                        textTransform: "capitalize",
                      }}
                      title={
                        g.state === "draft"
                          ? "Only you can reach this site, so most checks have nothing to test"
                          : g.state === "archived"
                            ? "Retired and reachable by nobody"
                            : "Shareable demo link, kept out of Google"
                      }
                    >
                      {g.state}
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--e-muted)", marginTop: 2 }}>{g.subtitle}</div>
                {/* ONE LINE PER CHECK, WORST FIRST — a NOUN and what it said.
                    The name and the detail are on separate lines: side by side they wrap into each
                    other the moment the canvas is narrow, which is how Steven actually works. */}
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
                  {g.lines.map((l) => (
                    <div key={l.label} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5 }}>
                      {/* ⚠️ inline-flex, NOT a plain span. Dot is a <span> sized with width/height,
                          and those do nothing on an inline element — it only ever worked because it
                          sat directly inside a flex container. Wrapping it in a normal span
                          rendered it at zero size: still in the DOM, invisible on screen. */}
                      <span style={{ display: "inline-flex", marginTop: 4 }}>
                        <Dot colour={l.colour} size={8} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 700, color: "var(--e-ink)" }}>{l.label}</span>
                        {l.detail ? (
                          <span style={{ display: "block", color: "var(--e-muted)", marginTop: 1 }}>
                            {l.detail.length > 96 ? `${l.detail.slice(0, 96)}…` : l.detail}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  {g.looked ? (
                    <span style={{ fontSize: 12, color: "var(--e-muted)" }}>· {g.looked}</span>
                  ) : null}
                </div>
              </a>

              <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: "0 0 auto" }}>
                <button type="button" onClick={() => nudge(i, i - 1)} aria-label="Move up" style={nudgeBtn}>
                  ▲
                </button>
                <button type="button" onClick={() => nudge(i, i + 1)} aria-label="Move down" style={nudgeBtn}>
                  ▼
                </button>
              </span>

              <a
                href={`/edit/board/${g.key}`}
                aria-hidden
                style={{ fontSize: 20, color: "var(--e-muted)", flex: "0 0 auto", textDecoration: "none" }}
              >
                ›
              </a>
            </div>
          );
        })}
      </div>

      <p style={{ color: "var(--e-muted)", fontSize: 12, marginTop: 12 }}>
        Drag a row by its handle, or use ▲▼. The order sticks — nothing re-sorts itself on a sweep.
      </p>
    </>
  );
}

const nudgeBtn: React.CSSProperties = {
  display: "block",
  width: 28,
  height: 22,
  border: "1px solid var(--e-line)",
  background: "var(--e-panel)",
  borderRadius: 5,
  color: "var(--e-muted)",
  fontSize: 9,
  lineHeight: 1,
  cursor: "pointer",
  padding: 0,
};
