"use client";
import React from "react";
import { useEditText } from "./editContext";

// Wrap any text node with <Editable tid="home.hero.h1" as="h1" className="...">Default
// copy</Editable>. The default copy stays in the component (committed to the repo); the
// editor's change is stored as an override keyed by `tid`. Override wins when present.
//
// Public / non-editing: renders a plain element with the resolved text (+ any saved size).
// Editing: the same element becomes contentEditable. We deliberately do NOT setState on
// every keystroke (that would clobber the cursor) — we capture the result on blur. Focusing
// the element makes it the target for the toolbar's A-/A+ size controls.
type Props = {
  tid: string;
  children: string; // the committed default text
  as?: React.ElementType;
  className?: string;
};

export default function Editable({ tid, children, as, className }: Props) {
  const { editing, getText, setText, getSize, setActiveTid } = useEditText();
  const Tag: React.ElementType = as || "span";
  const value = getText(tid, children);
  const size = getSize(tid);
  const sizeStyle: React.CSSProperties = size ? { fontSize: `${size}px` } : {};

  if (!editing) {
    return (
      <Tag className={className} style={size ? sizeStyle : undefined}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-tid={tid}
      onFocus={() => setActiveTid(tid)}
      style={{
        outline: "2px dashed rgba(37,99,235,0.5)",
        outlineOffset: "2px",
        borderRadius: "3px",
        cursor: "text",
        minWidth: "1ch",
        ...sizeStyle,
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) =>
        setText(tid, e.currentTarget.innerText.replace(/\s+/g, " ").trim())
      }
    >
      {value}
    </Tag>
  );
}
