"use client";
import React from "react";
import { useEditText } from "./editContext";

// Makes any NON-text element (a button, a link, an image, a whole block) deletable by the
// editor. Wrap it: <Removable tid="about.s5.cta"><CtaButton .../></Removable>. Text nodes use
// <Editable> instead — this is for things you can't put a cursor in.
//
// Public / not-editing: renders the children verbatim (no wrapper, zero layout change) — or
// nothing at all if it's been deleted (hidden). Editing: a dashed selection box; click to
// select it (link clicks are suppressed so selecting never navigates), then hit 🗑 Delete on
// the toolbar. Deleted-but-editing shows faded + struck so you can select it again to Restore.
export default function Removable({
  tid,
  children,
}: {
  tid: string;
  children: React.ReactNode;
}) {
  const { editing, getHidden, setActiveTid } = useEditText();
  const hidden = getHidden(tid);

  if (!editing) {
    if (hidden) return null;
    return <>{children}</>;
  }

  return (
    <div
      data-tid={tid}
      onClick={(e) => {
        e.preventDefault();
        setActiveTid(tid);
      }}
      title={
        hidden
          ? "Hidden — selected; click ↩ Restore to bring it back"
          : "Click to select, then 🗑 Delete to remove it"
      }
      style={{
        outline: hidden ? "2px dashed rgba(220,38,38,0.6)" : "2px dashed rgba(37,99,235,0.5)",
        outlineOffset: "4px",
        borderRadius: "3px",
        cursor: "pointer",
        opacity: hidden ? 0.4 : 1,
        textDecoration: hidden ? "line-through" : undefined,
      }}
    >
      {children}
    </div>
  );
}
