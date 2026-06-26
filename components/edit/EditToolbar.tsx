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
  hasActive = false,
  activeHidden = false,
  onEnter,
  onExit,
  onSave,
  onSize,
  onAlign,
  onDelete,
  onTogglePanel,
}: {
  editing: boolean;
  dirty: boolean;
  saving: boolean;
  pageKey: string;
  panelOpen: boolean;
  showSections?: boolean;
  hasActive?: boolean;
  activeHidden?: boolean;
  onEnter: () => void;
  onExit: () => void;
  onSave: () => Promise<boolean>;
  onSize?: (delta: number) => void;
  onAlign?: (value: "left" | "center" | "right") => void;
  onDelete?: () => void;
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

  // Rich-text formatting acts on the current selection inside the focused <Editable>.
  // preventDefault on mousedown keeps that selection from clearing when a button is clicked.
  const preventBlur = (e: React.MouseEvent) => e.preventDefault();
  const exec = (command: string, val?: string) => {
    try {
      document.execCommand(command, false, val);
    } catch {
      /* ignore */
    }
  };
  const addLink = () => {
    const sel = window.getSelection();
    const range = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const url = window.prompt("Link URL (https://…)");
    if (!url) return;
    if (sel && range) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    exec("createLink", url);
  };

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
      <div style={sizeGroup}>
        <button style={fmtBtn} onMouseDown={preventBlur} onClick={() => exec("bold")} aria-label="Bold">
          <b>B</b>
        </button>
        <button style={fmtBtn} onMouseDown={preventBlur} onClick={() => exec("italic")} aria-label="Italic">
          <i>I</i>
        </button>
        <button style={fmtBtn} onMouseDown={preventBlur} onClick={() => exec("underline")} aria-label="Underline">
          <u>U</u>
        </button>
        <button style={fmtBtn} onMouseDown={preventBlur} onClick={addLink} aria-label="Add link">
          Link
        </button>
        <button
          style={fmtBtn}
          onMouseDown={preventBlur}
          onClick={() => {
            exec("removeFormat");
            exec("unlink");
          }}
          aria-label="Clear formatting"
        >
          Clear
        </button>
      </div>
      <div style={sizeGroup}>
        {COLORS.map((c) => (
          <button
            key={c}
            style={{ ...swatch, background: c }}
            onMouseDown={preventBlur}
            onClick={() => exec("foreColor", c)}
            aria-label={`Text color ${c}`}
          />
        ))}
      </div>
      {onSize && (
        <div style={sizeGroup} title="Click a text box, then resize it">
          <button
            style={sizeBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSize(-2)}
            aria-label="Smaller text"
          >
            A&minus;
          </button>
          <button
            style={sizeBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSize(2)}
            aria-label="Larger text"
          >
            A+
          </button>
        </div>
      )}
      {onAlign && (
        <div style={sizeGroup} title="Align the selected text box (left / center / right)">
          <button
            style={sizeBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onAlign("left")}
            aria-label="Align left"
          >
            L
          </button>
          <button
            style={sizeBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onAlign("center")}
            aria-label="Align center"
          >
            C
          </button>
          <button
            style={sizeBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onAlign("right")}
            aria-label="Align right"
          >
            R
          </button>
        </div>
      )}
      {onDelete && (
        <button
          style={{
            ...(activeHidden ? restoreBtn : deleteBtn),
            opacity: hasActive ? 1 : 0.45,
          }}
          onMouseDown={preventBlur}
          disabled={!hasActive}
          onClick={onDelete}
          title={
            hasActive
              ? activeHidden
                ? "Restore the selected element"
                : "Delete the selected element (one-click undo with Restore)"
              : "Click an element on the page first, then Delete"
          }
        >
          {activeHidden ? "↩ Restore" : "🗑 Delete"}
        </button>
      )}
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
const deleteBtn: React.CSSProperties = { ...base, background: "#dc2626", color: "#fff" };
const restoreBtn: React.CSSProperties = { ...base, background: "#b45309", color: "#fff" };
const sizeGroup: React.CSSProperties = { display: "flex", gap: 4 };
const sizeBtn: React.CSSProperties = {
  ...base,
  background: "rgba(255,255,255,0.12)",
  color: "#e5e7eb",
  padding: "9px 11px",
};
const fmtBtn: React.CSSProperties = {
  ...base,
  background: "rgba(255,255,255,0.12)",
  color: "#e5e7eb",
  padding: "9px 11px",
  minWidth: 34,
};
const swatch: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.35)",
  cursor: "pointer",
  padding: 0,
};
const COLORS = ["#0f1f3d", "#2563eb", "#2ea043", "#dc2626", "#ffffff"];
