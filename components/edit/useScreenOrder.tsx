"use client";
// MOVE SECTIONS UP AND DOWN ON ANY STUDIO SCREEN (Steven, 2026-10-04). Give it the screen's name and the
// names of the sections it has right now; it hands back the names in his saved order, plus the little bar
// (number, up, down, line on/off) to put beside each section's heading. Numbers are computed, never typed.
import { useCallback, useEffect, useMemo, useState } from "react";

export function useScreenOrder(screen: string, siteId: string, names: string[]) {
  const [saved, setSaved] = useState<{ order: string[]; noLine: string[] }>({ order: [], noLine: [] });
  const q = `?site=${encodeURIComponent(siteId)}&screen=${encodeURIComponent(screen)}`;
  useEffect(() => {
    let off = false;
    fetch(`/api/screen-order${q}`, { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!off && j) setSaved({ order: j.order || [], noLine: j.noLine || [] }); })
      .catch(() => {});
    return () => { off = true; };
  }, [q]);

  // A stored order wins; a section it has never seen keeps its place at the end, in the order given.
  const ordered = useMemo(() => {
    const known = saved.order.filter((n) => names.includes(n));
    return [...known, ...names.filter((n) => !known.includes(n))];
  }, [saved.order, names]);

  const save = useCallback((order: string[], noLine: string[]) => {
    setSaved({ order, noLine });
    fetch(`/api/screen-order${q}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order, noLine }) }).catch(() => {});
  }, [q]);

  const move = (name: string, by: number) => {
    const i = ordered.indexOf(name), j = i + by;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    const next = [...ordered]; [next[i], next[j]] = [next[j], next[i]];
    save(next, saved.noLine);
  };
  const toggleLine = (name: string) => save(ordered, saved.noLine.includes(name) ? saved.noLine.filter((n) => n !== name) : [...saved.noLine, name]);
  const hasLine = (name: string) => !saved.noLine.includes(name);

  const btn: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 8, padding: "4px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer", lineHeight: 1.2 };
  const Bar = ({ name }: { name: string }) => {
    const i = ordered.indexOf(name);
    return (
      <span style={{ display: "inline-flex", gap: 6, alignItems: "center", marginLeft: 12, verticalAlign: "middle" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--e-muted)", minWidth: 16, textAlign: "right" }}>{i + 1}</span>
        <button type="button" style={{ ...btn, opacity: i === 0 ? 0.35 : 1 }} disabled={i === 0} onClick={() => move(name, -1)} aria-label={`Move ${name} up`}>↑</button>
        <button type="button" style={{ ...btn, opacity: i === ordered.length - 1 ? 0.35 : 1 }} disabled={i === ordered.length - 1} onClick={() => move(name, 1)} aria-label={`Move ${name} down`}>↓</button>
        <button type="button" style={btn} onClick={() => toggleLine(name)}>{hasLine(name) ? "Line: on" : "Line: off"}</button>
      </span>
    );
  };
  return { ordered, hasLine, Bar };
}
