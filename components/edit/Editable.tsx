"use client";
import React from "react";
import { useEditText } from "./editContext";

// Wrap any text node with <Editable tid="home.hero.h1" as="h1" className="...">Default
// copy</Editable>. The default copy stays in the component (committed to the repo); the
// editor's change is stored as an override keyed by `tid`. Override wins when present.
//
// Public / non-editing: renders a plain element with the resolved text.
// Editing: the same element becomes contentEditable. We deliberately do NOT setState on
// every keystroke (that would clobber the cursor) — we capture the result on blur.
type Props = {
  tid: string;
  children: string; // the committed default text
  as?: React.ElementType;
  className?: string;
};

export default function Editable({ tid, children, as, className }: Props) {
  const { editing, getText, setText } = useEditText();
  const Tag: React.ElementType = as || "span";
  const value = getText(tid, children);

  if (!editing) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-tid={tid}
      style={{
        outline: "2px dashed rgba(37,99,235,0.5)",
        outlineOffset: "2px",
        borderRadius: "3px",
        cursor: "text",
        minWidth: "1ch",
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) =>
        setText(tid, e.currentTarget.innerText.replace(/\s+/g, " ").trim())
      }
    >
      {value}
    </Tag>
  );
}
