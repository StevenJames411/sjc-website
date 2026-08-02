"use client";
import { useState } from "react";
import type { Colour } from "@/lib/checksShared";
import { SWATCH, Dot } from "./shared";

// THE ROSTER — one row per owner, in the order Steven put them in.
//
// ── WHY IT DRAGS ──────────────────────────────────────────────────────────────────────────────
// When he is actively building for two or three clients he wants those three at the top and he
// wants them to STAY there through every sweep, whatever colour they turn. The order saves to
// Postgres, so it survives a reload and follows him to his phone.
//
// The reorder itself is the same ten lines as components/edit/SectionsPanel.tsx — native HTML5
// drag-and-drop, no library, originally ported from the cockpit's map engine.
//
// ⚠️ HTML5 DRAG-AND-DROP DOES NOT WORK ON iOS SAFARI, and the phone is the whole reason the back
// office got a cockpit shell in the first place. So every row also carries ▲▼ buttons, revealed on
// coarse pointers. Drag on the laptop, tap on the phone, one stored order behind both — never a
// desktop-only feature on a surface built for the field.

export type RosterRow = {
  key: string;
  title: string;
  subtitle: string;
  summary: string;
  colour: Colour;
};

export default function Roster({ rows }: { rows: RosterRow[] }) {
  const [order, setOrder] = useState<RosterRow[]>(rows);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState("");

  function commit(next: RosterRow[]) {
    setOrder(next);
    setSaveErr("");
    // Optimistic: the row is already where he dropped it. If the save fails he is TOLD, rather
    // than finding out on the next reload when his arrangement is silently gone.
    fetch("/api/board-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ order: next.map((r) => r.key) }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok) setSaveErr("The new order didn't save — it will be back to normal on reload.");
      })
      .catch(() => setSaveErr("The new order didn't save — it will be back to normal on reload."));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    commit(next);
  }

  function drop(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return;
    move(
      order.findIndex((r) => r.key === dragKey),
      order.findIndex((r) => r.key === targetKey)
    );
  }

  return (
    <>
      {saveErr && (
        <p style={{ fontSize: 13, color: "#b91c1c", margin: "0 0 12px" }}>{saveErr}</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {order.map((g, i) => {
          const sw = SWATCH[g.colour];
          return (
            <div
              key={g.key}
              id={`row-${g.key}`}
              draggable
              onDragStart={() => setDragKey(g.key)}
              onDragEnd={() => setDragKey(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(g.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: sw.bg,
                border: `1px solid ${sw.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                opacity: dragKey === g.key ? 0.4 : 1,
              }}
            >
              <span
                title="Drag to reorder"
                style={{ color: "#9ca3af", fontSize: 15, cursor: "grab", flex: "0 0 auto", lineHeight: 1 }}
              >
                ⋮⋮
              </span>

              <Dot colour={g.colour} size={12} />

              {/* The link wraps only the TEXT. Wrapping the whole row would make every drag look
                  like a click, and dropping a row would navigate away from the board. */}
              <a
                href={`/edit/board/${g.key}`}
                style={{ minWidth: 0, flex: 1, textDecoration: "none", color: "inherit" }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", overflowWrap: "anywhere" }}>
                  {g.title}
                </div>
                <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>{g.subtitle}</div>
                <div style={{ fontSize: 13, color: "#374151", marginTop: 6 }}>{g.summary}</div>
              </a>

              {/* Touch path. Hidden on a mouse, where dragging is better. */}
              <span className="board-nudge">
                <button type="button" onClick={() => move(i, i - 1)} aria-label="Move up" style={nudge}>
                  ▲
                </button>
                <button type="button" onClick={() => move(i, i + 1)} aria-label="Move down" style={nudge}>
                  ▼
                </button>
              </span>

              <a
                href={`/edit/board/${g.key}`}
                aria-hidden
                style={{ fontSize: 20, color: "#9ca3af", flex: "0 0 auto", textDecoration: "none" }}
              >
                ›
              </a>
            </div>
          );
        })}
      </div>

      <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 12 }}>
        Drag a row to move it. The order sticks — nothing re-sorts itself on a sweep.
      </p>
    </>
  );
}

const nudge: React.CSSProperties = {
  display: "block",
  width: 30,
  height: 26,
  border: "1px solid #d1d5db",
  background: "#fff",
  borderRadius: 6,
  color: "#4b5563",
  fontSize: 10,
  lineHeight: 1,
  cursor: "pointer",
  marginBottom: 2,
};
