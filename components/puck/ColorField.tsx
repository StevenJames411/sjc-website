"use client";
import React from "react";
import { ROLES, ROLE_LABELS, isRole, type BrandRole } from "@/lib/brandColor";

// The colour control for a block.
//
// WHAT CHANGED AND WHY. This used to hand back a literal hex — pick blue, the page stores
// "#2563eb" forever, and the site's palette is frozen into its content. Now the swatches save a
// ROLE ("accent", "highlight"), so the brand panel drives them and changing a client's colours is
// one screen instead of every block on every page.
//
// The custom picker stays, because a genuine one-off exists (a client's exact brand colour on one
// badge). It saves as "custom:#rrggbb" — deliberately marked, so it's obvious in the data that it
// was a decision and not drift.
//
// A raw hex already saved on an older page still shows here and still renders; it just displays
// as a custom colour until the normaliser converts it.

// What each role looks like right now, purely so the swatch has something to show. The rendered
// page reads the live CSS variable, not this.
const ROLE_PREVIEW: Record<BrandRole, string> = {
  accent: "#2563eb",
  secondary: "#22c55e",
  highlight: "#f59e0b",
  ink: "#111827",
  mute: "#4b5563",
  line: "#e5e7eb",
  bandSoft: "#f3f4f6",
  bandDark: "#1e3a6e",
  bandDarker: "#0f1f3d",
  bandHeader: "#0f1f3d",
  cta: "#22c55e",
  white: "#ffffff",
};

export default function ColorField({
  value,
  onChange,
  label,
}: {
  value?: string;
  onChange: (v: string) => void;
  /**
   * ⛔ PUCK DOES NOT CAPTION A CUSTOM FIELD — see its own source: it wraps a field with its label
   * for every type EXCEPT "custom" and "slot". So every colour picker in this builder has always
   * rendered as an unlabelled grid of swatches, and a panel with two of them gave you no way to
   * tell the button colour from the band colour. Steven, looking at the hero section: *"I see
   * colour settings. I don't even know what they adjust. What colour? The text, the background."*
   *
   * The caption has to come from here, because nothing above will draw it.
   */
  label?: string;
}) {
  const v = (value || "").trim();
  const custom = v.startsWith("custom:") ? v.slice(7) : /^#[0-9a-f]{6}$/i.test(v) ? v : "";
  const activeRole = isRole(v) ? v : null;

  return (
    <div>
      {label ? (
        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            title={ROLE_LABELS[r]}
            aria-label={ROLE_LABELS[r]}
            onClick={() => onChange(r)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              cursor: "pointer",
              background: ROLE_PREVIEW[r],
              border: activeRole === r ? "3px solid #111827" : "1px solid #d1d5db",
            }}
          />
        ))}
        <button
          type="button"
          title="No colour — inherit"
          onClick={() => onChange("")}
          style={{
            height: 26,
            padding: "0 8px",
            borderRadius: 6,
            cursor: "pointer",
            background: "#fff",
            fontSize: 11,
            color: "#6b7280",
            border: !v ? "3px solid #111827" : "1px solid #d1d5db",
          }}
        >
          none
        </button>
      </div>

      <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px" }}>
        {activeRole
          ? `${ROLE_LABELS[activeRole]} — follows this site's brand`
          : custom
            ? "Custom — this one won't follow the brand"
            : "Not set"}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="color"
          value={custom || "#111827"}
          onChange={(e) => onChange(`custom:${e.target.value}`)}
          style={{ width: 36, height: 32, border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", padding: 2 }}
        />
        <input
          type="text"
          value={custom}
          placeholder="#rrggbb"
          onChange={(e) => {
            const hex = e.target.value.trim();
            onChange(hex ? `custom:${hex}` : "");
          }}
          style={{ width: 100, height: 32, border: "1px solid #d1d5db", borderRadius: 6, textAlign: "center", fontSize: 13 }}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>one-off</span>
      </div>
    </div>
  );
}
