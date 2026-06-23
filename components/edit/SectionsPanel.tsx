"use client";
import React, { useState } from "react";

// The website's version of the dashboard's "Boards / drag to reorder" panel. A simple
// draggable list of the page's sections; dragging reorders the `order` array, which
// re-stacks the page. Native HTML5 drag-and-drop, no external library (same as the
// cockpit map engine).
export default function SectionsPanel({
  order,
  labels,
  onReorder,
  onClose,
}: {
  order: string[];
  labels: Record<string, string>;
  onReorder: (next: string[]) => void;
  onClose: () => void;
}) {
  const [dragKey, setDragKey] = useState<string | null>(null);

  function drop(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return;
    const next = [...order];
    const from = next.indexOf(dragKey);
    const to = next.indexOf(targetKey);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, dragKey);
    onReorder(next);
  }

  return (
    <div style={panel}>
      <div style={head}>
        <span style={title}>Sections</span>
        <button onClick={onClose} style={x} aria-label="Close">
          ×
        </button>
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", padding: "0 14px 10px" }}>
        Drag to reorder the page.
      </div>
      <div>
        {order.map((k) => (
          <div
            key={k}
            draggable
            onDragStart={() => setDragKey(k)}
            onDragEnd={() => setDragKey(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(k)}
            style={{ ...row, opacity: dragKey === k ? 0.4 : 1 }}
          >
            <span style={{ color: "#9ca3af", marginRight: 10, fontSize: 15 }}>⋮⋮</span>
            <span style={{ fontSize: 14, color: "#111827" }}>{labels[k] || k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const panel: React.CSSProperties = {
  position: "fixed",
  left: 18,
  bottom: 74,
  width: 244,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
  zIndex: 900,
  overflow: "hidden",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};
const head: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 14px 8px",
};
const title: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#0f1f3d",
};
const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "10px 14px",
  borderTop: "1px solid #f3f4f6",
  cursor: "grab",
  background: "#fff",
};
const x: React.CSSProperties = {
  border: "none",
  background: "none",
  fontSize: 20,
  lineHeight: 1,
  color: "#9ca3af",
  cursor: "pointer",
};
