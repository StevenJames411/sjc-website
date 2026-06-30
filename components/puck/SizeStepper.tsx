"use client";
import React from "react";

// Infinite font-size control for the builder: a − button, a typeable px number, and a + button.
// Replaces the fixed Small/Normal/Large dropdown so any block can be sized from tiny to huge.
// value is the px size; 0/undefined means "not set yet" → we show `fallback` as the starting point.
export default function SizeStepper({
  value,
  onChange,
  fallback = 18,
  step = 2,
  min = 6,
  label,
  allowZero = true,
}: {
  value?: number;
  onChange: (v: number) => void;
  fallback?: number;
  step?: number;
  min?: number;
  label?: string;
  // When true, 0 is a real value the user can land on (spacing/padding). When false,
  // 0 means "not set → use the default" (font size, where a 0px size makes no sense).
  allowZero?: boolean;
}) {
  const current = typeof value === "number" && (allowZero || value > 0) ? value : fallback;
  const set = (n: number) => onChange(Math.max(min, Math.round(Number.isFinite(n) ? n : fallback)));
  return (
    <div>
      {label ? (
        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button type="button" aria-label="Smaller" onClick={() => set(current - step)} style={BTN}>
          −
        </button>
        <input
          type="number"
          value={current}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return set(allowZero ? min : fallback);
            const n = Number(raw);
            set(Number.isNaN(n) ? fallback : n);
          }}
          style={INPUT}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>px</span>
        <button type="button" aria-label="Bigger" onClick={() => set(current + step)} style={BTN}>
          +
        </button>
      </div>
    </div>
  );
}

const BTN: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: 18,
  lineHeight: 1,
  cursor: "pointer",
  fontWeight: 700,
};
const INPUT: React.CSSProperties = {
  width: 60,
  height: 32,
  borderRadius: 6,
  border: "1px solid #d1d5db",
  textAlign: "center",
  fontSize: 13,
};
