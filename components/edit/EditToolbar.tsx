"use client";
import React, { useCallback, useEffect, useState } from "react";

// The floating editor bar. Only renders for the signed-in editor.
//   not editing -> a single "Edit this page" button
//   editing     -> Sections panel toggle · Save · Draft/Published toggle · Done
// The Draft/Published toggle mirrors the cockpit's: dark "Draft" = the public sees the
// last published version (or committed defaults); green "Published" = your current edits
// are live. Publishing saves the draft first, then snapshots it to the public copy.
export default function EditToolbar({
  editing,
  dirty,
  saving,
  pageKey,
  panelOpen,
  showSections = true,
  onEnter,
  onExit,
  onSave,
  onTogglePanel,
}: {
  editing: boolean;
  dirty: boolean;
  saving: boolean;
  pageKey: string;
  panelOpen: boolean;
  showSections?: boolean;
  onEnter: () => void;
  onExit: () => void;
  onSave: () => Promise<boolean>;
  onTogglePanel: () => void;
}) {
  const [pubState, setPubState] = useState<"draft" | "published" | "unknown">("unknown");
  const [pubBusy, setPubBusy] = useState(false);

  const refreshPub = useCallback(async () => {
    try {
      const r = await fetch(`/api/site-content?page=${encodeURIComponent(pageKey)}&pub=1`);
      const j = await r.json();
      setPubState(j && j.state && j.state._pub ? "published" : "draft");
    } catch {
      setPubState("unknown");
    }
  }, [pageKey]);

  useEffect(() => {
    if (editing) refreshPub();
  }, [editing, refreshPub]);

  const publish = useCallback(async () => {
    if (pubBusy) return;
    if (pubState !== "published") {
      if (!confirm("Publish your current edits to the live site?")) return;
      setPubBusy(true);
      try {
        await onSave(); // persist the draft first
        const r = await fetch(`/api/site-content/publish?page=${encodeURIComponent(pageKey)}`, {
          method: "POST",
          credentials: "same-origin",
        });
        const j = await r.json();
        setPubState(j && j.ok ? "published" : "draft");
      } catch {
        /* leave state as-is */
      } finally {
        setPubBusy(false);
      }
    } else {
      setPubBusy(true);
      try {
        const r = await fetch(
          `/api/site-content/publish?page=${encodeURIComponent(pageKey)}&action=unpublish`,
          { method: "POST", credentials: "same-origin" }
        );
        const j = await r.json();
        setPubState(j && j.ok ? "draft" : "published");
      } catch {
        /* leave state as-is */
      } finally {
        setPubBusy(false);
      }
    }
  }, [pubBusy, pubState, pageKey, onSave]);

  if (!editing) {
    return (
      <div style={bar}>
        <button style={primary} onClick={onEnter}>
          ✎ Edit this page
        </button>
      </div>
    );
  }

  return (
    <div style={bar}>
      {showSections && (
        <button style={ghost} onClick={onTogglePanel}>
          {panelOpen ? "Sections ▾" : "Sections ▸"}
        </button>
      )}
      <button
        style={{ ...primary, opacity: dirty && !saving ? 1 : 0.55 }}
        disabled={!dirty || saving}
        onClick={onSave}
      >
        {saving ? "Saving…" : dirty ? "Save" : "Saved"}
      </button>
      <button
        style={pubState === "published" ? pubOn : pubOff}
        disabled={pubBusy}
        onClick={publish}
        title={pubState === "published" ? "Live — click to unpublish" : "Draft — click to publish"}
      >
        {pubBusy ? "…" : pubState === "published" ? "Published" : "Draft"}
      </button>
      <button style={ghost} onClick={onExit}>
        Done
      </button>
    </div>
  );
}

const bar: React.CSSProperties = {
  position: "fixed",
  left: 18,
  bottom: 18,
  zIndex: 950,
  display: "flex",
  gap: 8,
  background: "#0f1f3d",
  padding: 8,
  borderRadius: 12,
  boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};
const base: React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  padding: "9px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const primary: React.CSSProperties = { ...base, background: "#2563eb", color: "#fff" };
const ghost: React.CSSProperties = { ...base, background: "rgba(255,255,255,0.12)", color: "#e5e7eb" };
const pubOn: React.CSSProperties = { ...base, background: "#2ea043", color: "#fff" };
const pubOff: React.CSSProperties = { ...base, background: "rgba(255,255,255,0.12)", color: "#9ca3af" };
