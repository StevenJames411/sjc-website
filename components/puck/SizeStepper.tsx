"use client";
import React from "react";

// Infinite size control for the builder: a − button, a typeable number, and a + button.
// Replaces the fixed Small/Normal/Large dropdown so any block can be sized from tiny to huge.
// value is the size; 0/undefined means "not set yet" → we show `fallback` as the starting point.
export default function SizeStepper({
  value,
  onChange,
  fallback = 18,
  step = 2,
  min = 6,
  label,
  allowZero = true,
  unit = "px",
  clearable = false,
  unsetLabel = "not set",
}: {
  value?: number;
  onChange: (v: number | null) => void;
  fallback?: number;
  step?: number;
  min?: number;
  label?: string;
  // When true, 0 is a real value the user can land on (spacing/padding). When false,
  // 0 means "not set → use the default" (font size, where a 0px size makes no sense).
  allowZero?: boolean;
  /**
   * ⛔ THE SUFFIX WAS HARDCODED "px", AND THIS CONTROL IS NOT ALWAYS px.
   *
   * It draws "See-through %", "Zoom %", "Frame width %", "Button width on mobile, %" and "Fade
   * direction (degrees)" — fields whose label says one unit while the box says another. Cheap to
   * mis-read, and the sort of thing that makes a whole panel feel untrustworthy.
   */
  unit?: string;
  /**
   * ⛔ THE ONE-WAY DOOR, AND IT SAT ON THE CONTROL USED MOST ON IMPORTED PAGES.
   *
   * An imported section's padding starts as null, meaning "keep whatever spacing the design
   * shipped with". A stepper cannot show null, so it displayed the FALLBACK instead: a number that
   * was not in effect and that nobody had chosen. Nudge it once and the null was gone, with no way
   * back to the design's own spacing short of re-importing the page.
   *
   * Clearable renders the empty state honestly — placeholder, not a fake number — and puts a Reset
   * beside it once a real value exists.
   */
  clearable?: boolean;
  unsetLabel?: string;
}) {
  const isSet = typeof value === "number" && (allowZero || value > 0);
  const current = isSet ? (value as number) : fallback;
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
          // ⚠️ EMPTY, NOT THE FALLBACK, when clearable and unset — showing the fallback is exactly
          // the lie this prop exists to stop. The placeholder still tells you what is in effect.
          value={clearable && !isSet ? "" : current}
          placeholder={clearable && !isSet ? String(fallback) : undefined}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              // Clearing the box on a clearable field is how you get BACK to the design's own.
              if (clearable) return onChange(null);
              return set(allowZero ? min : fallback);
            }
            const n = Number(raw);
            set(Number.isNaN(n) ? fallback : n);
          }}
          style={INPUT}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>{unit}</span>
        <button type="button" aria-label="Bigger" onClick={() => set(current + step)} style={BTN}>
          +
        </button>
        {clearable && isSet ? (
          <button
            type="button"
            title={`Back to ${unsetLabel}`}
            onClick={() => onChange(null)}
            style={RESET}
          >
            Reset
          </button>
        ) : null}
      </div>
      {clearable && !isSet ? (
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{unsetLabel}</div>
      ) : null}
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
const RESET: React.CSSProperties = {
  height: 32,
  padding: "0 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: 12,
  cursor: "pointer",
  color: "#374151",
};
