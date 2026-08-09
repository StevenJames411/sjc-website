"use client";

import { useState } from "react";

// DEMO-ONLY. Six complete palettes — accent AND ground, not just the accent — so the whole
// page changes and Steven can actually judge it. Four demo sites on the same near-black read
// as one template with different photographs, which is the opposite of what a bespoke studio
// sells; the ground is part of the palette, not a constant.
//
// Delete this component and its two lines in page.tsx before this ever goes public.

type Theme = {
  id: string;
  label: string;
  ink: string;
  inkRgb: string;
  surface: string;
  surface2: string;
  line: string;
  accent: string;
  accentRgb: string;
  accentSoft: string;
  // ⛔ A LIGHT SECTION NEEDS ITS OWN ACCENT. Every accent here is mid-tone — tuned to glow on a
  // near-black ground. Put #4a90d9 on near-white and it reads at ~2.6:1, which is invisible at
  // eyebrow size. So each palette carries a DEEP accent, and a light section swaps to it. The
  // light ground is tinted toward the palette too, or the page reads as two unrelated sites.
  accentDeep: string;
  accentDeepRgb: string;
  lightBg: string;
  lightPanel: string;
};

export const THEMES: Theme[] = [
  { id: "navy",     label: "Navy",     ink: "#0a1020", inkRgb: "10,16,32",  surface: "#111a2e", surface2: "#17233b", line: "150,180,235", accent: "#4a90d9", accentRgb: "74,144,217",  accentSoft: "#8cc0f0" , accentDeep: "#1f5794", accentDeepRgb: "31,87,148", lightBg: "#f1f4f9", lightPanel: "#ffffff" },
  { id: "ink",      label: "Ink",      ink: "#0b0b0b", inkRgb: "11,11,11",  surface: "#111111", surface2: "#171717", line: "255,255,255", accent: "#c9a227", accentRgb: "201,162,39",  accentSoft: "#e8c65a" , accentDeep: "#8a6d10", accentDeepRgb: "138,109,16", lightBg: "#f5f4f1", lightPanel: "#fffefc" },
  { id: "steel",    label: "Steel",    ink: "#0e1620", inkRgb: "14,22,32",  surface: "#152131", surface2: "#1c2b3d", line: "150,190,230", accent: "#5fb0c4", accentRgb: "95,176,196",  accentSoft: "#8fd4e4" , accentDeep: "#226d80", accentDeepRgb: "34,109,128", lightBg: "#f0f5f7", lightPanel: "#ffffff" },
  { id: "forest",   label: "Forest",   ink: "#0d1610", inkRgb: "13,22,16",  surface: "#14211a", surface2: "#1b2c22", line: "175,215,180", accent: "#6aa84f", accentRgb: "106,168,79",  accentSoft: "#9ed483" , accentDeep: "#3a6b28", accentDeepRgb: "58,107,40", lightBg: "#f2f5f1", lightPanel: "#fdfffc" },
  { id: "espresso", label: "Espresso", ink: "#1a1210", inkRgb: "26,18,16",  surface: "#241a16", surface2: "#2e221c", line: "235,200,175", accent: "#c07a44", accentRgb: "192,122,68",  accentSoft: "#e8a877" , accentDeep: "#8a4a1c", accentDeepRgb: "138,74,28", lightBg: "#f7f2ed", lightPanel: "#fffdfa" },
  { id: "bone",     label: "Bone",     ink: "#12100d", inkRgb: "18,16,13",  surface: "#1a1713", surface2: "#221e19", line: "235,228,215", accent: "#b9a37a", accentRgb: "185,163,122", accentSoft: "#ded0b4" , accentDeep: "#7a6440", accentDeepRgb: "122,100,64", lightBg: "#f6f3ec", lightPanel: "#fffdf7" },
];

export default function PaletteSwitcher() {
  const [id, setId] = useState("navy");
  const t = THEMES.find((x) => x.id === id) || THEMES[0];

  return (
    <>
      <style>{`
        :root{
          --ink:${t.ink}; --inkrgb:${t.inkRgb};
          --surface:${t.surface}; --surface-2:${t.surface2};
          --line:${t.line};
          --accent:${t.accent}; --accent-rgb:${t.accentRgb}; --accent-soft:${t.accentSoft};
          --accent-deep:${t.accentDeep}; --accent-deep-rgb:${t.accentDeepRgb};
          --light-bg:${t.lightBg}; --light-panel:${t.lightPanel};
        }
        body{background:${t.ink}}
      `}</style>

      <div style={{
        position: "fixed", right: 16, bottom: 16, zIndex: 90, display: "flex", alignItems: "center",
        gap: 7, padding: 7, borderRadius: 100, background: "rgba(10,10,10,.55)",
        backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.1)",
      }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(10,10,10,.9)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(10,10,10,.55)")}
      >
        {THEMES.map((x) => (
          <button
            key={x.id}
            onClick={() => setId(x.id)}
            title={x.label}
            aria-label={x.label}
            style={{
              width: 20, height: 20, borderRadius: "50%", cursor: "pointer", padding: 0, fontSize: 0,
              background: `linear-gradient(135deg, ${x.ink} 0 50%, ${x.accent} 50% 100%)`,
              border: id === x.id ? "1px solid #fff" : "1px solid rgba(255,255,255,.3)",
              boxShadow: id === x.id ? "0 0 0 2px rgba(255,255,255,.22)" : "none",
              transition: ".25s",
            }}
          />
        ))}
        <span style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", padding: "0 6px 0 4px" }}>
          {t.label}
        </span>
      </div>
    </>
  );
}
