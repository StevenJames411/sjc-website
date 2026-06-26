"use client";
import React, { useEffect, useRef } from "react";
import { useEditText } from "./editContext";

// Wrap any text node with <Editable tid="home.hero.h1" as="h1" className="...">Default
// copy</Editable>. The default copy stays in the component (committed to the repo); the
// editor stores an override (rich HTML) keyed by `tid`. Override wins when present.
//
// Rich text: the stored value is HTML (bold/italic/underline/color/links applied via the
// toolbar's execCommand buttons). Public / non-editing renders that HTML (+ any saved
// size/align). Editing turns the element contentEditable; we seed it with the current value
// ONCE when edit mode turns on (via a ref) so typing, formatting, and size/align changes
// never reset the cursor or clobber unsaved edits. We capture innerHTML on blur.
type Props = {
  tid: string;
  children: string; // the committed default text
  as?: React.ElementType;
  className?: string;
};

// Owner-only editor, but strip the obvious dangerous bits from stored HTML anyway.
function sanitize(html: string): string {
  return html
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "");
}

export default function Editable({ tid, children, as, className }: Props) {
  const { editing, getText, setText, getSize, getAlign, setActiveTid, getHidden } = useEditText();
  const Tag: React.ElementType = (as || "span") as React.ElementType;
  const value = getText(tid, children);
  const hidden = getHidden(tid);
  const ref = useRef<HTMLElement | null>(null);

  const overrideStyle: React.CSSProperties = {};
  const size = getSize(tid);
  if (size) overrideStyle.fontSize = `${size}px`;
  const align = getAlign(tid);
  if (align) overrideStyle.textAlign = align;
  const hasOverride = size !== undefined || align !== undefined;

  // Seed the contentEditable with the current value when edit mode turns on — and only then,
  // so re-renders (size/align/other boxes) don't wipe what's being typed.
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  if (!editing) {
    // Deleted/hidden elements vanish entirely for the public.
    if (hidden) return null;
    return (
      <Tag
        className={className}
        style={hasOverride ? overrideStyle : undefined}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-tid={tid}
      onFocus={() => setActiveTid(tid)}
      style={{
        outline: hidden ? "2px dashed rgba(220,38,38,0.6)" : "2px dashed rgba(37,99,235,0.5)",
        outlineOffset: "2px",
        borderRadius: "3px",
        cursor: "text",
        minWidth: "1ch",
        // Hidden-but-editing: faded + struck so it's still selectable to Restore.
        opacity: hidden ? 0.4 : 1,
        textDecoration: hidden ? "line-through" : undefined,
        ...overrideStyle,
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => setText(tid, sanitize(e.currentTarget.innerHTML))}
    />
  );
}
