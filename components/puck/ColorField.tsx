"use client";
import React from "react";

// Full color control for a single-color block (headings, etc.): one-click swatches for the
// brand palette PLUS a native picker + hex box for ANY color. Replaces the 4-option dropdown
// so a heading can be set to green (or anything) in a click, while staying a real <h2>.
const SWATCHES = [
  { label: "Ink", value: "#111827" },
  { label: "White", value: "#ffffff" },
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#22c55e" },
  { label: "Navy", value: "#0f1f3d" },
  { label: "Red", value: "#ef4444" },
  { label: "Muted", value: "#6b7280" },
];

export default function ColorField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const v = value || "#111827";
  const isHex = /^#[0-9a-f]{6}$/i.test(v);
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {SWATCHES.map((s) => (
          <button
            key={s.value}
            type="button"
            title={s.label}
            aria-label={s.label}
            onClick={() => onChange(s.value)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              cursor: "pointer",
              background: s.value,
              border:
                v.toLowerCase() === s.value.toLowerCase()
                  ? "3px solid #2563eb"
                  : "1px solid #d1d5db",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="color"
          value={isHex ? v : "#111827"}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 36, height: 32, border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", padding: 2 }}
        />
        <input
          type="text"
          value={v}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 100, height: 32, border: "1px solid #d1d5db", borderRadius: 6, textAlign: "center", fontSize: 13 }}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>any color</span>
      </div>
    </div>
  );
}
