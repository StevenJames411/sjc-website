"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LeadForm, { type LeadFormProps } from "./LeadForm";

// Put the REAL lead form where the design drew its fake one.
//
// ── WHY A PORTAL AND NOT A STRING SPLIT ───────────────────────────────────────────────────────
// The obvious approach is to cut the section's markup in two at the form and render
// [before] <LeadForm/> [after]. It doesn't work: the form sits several divs deep inside a grid
// column, so splitting the string leaves both halves with unbalanced tags. The browser then
// auto-closes them and the layout collapses — you'd trade a dead form for a broken section.
//
// So the markup is rendered whole and untouched, and the form is mounted INTO the node the
// importer marked (`data-sjc-form`). The design keeps its own column, spacing and glass panel;
// only the contents of that one box change.
//
// ⚠️ THE FAKE INPUTS ARE REMOVED FIRST. They are a picture of a form — real-looking boxes that
// accept typing and submit nowhere. Leaving them beside a working form would be worse than
// either on its own.

export default function DesignFormMount(props: LeadFormProps) {
  // An anchor in the normal flow, so we can find OUR section rather than the first form on the
  // page — a page can carry several imported sections.
  const anchor = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = anchor.current?.parentElement;
    if (!root) return;
    const target = root.querySelector<HTMLElement>("[data-sjc-form]");
    if (!target) return;
    // Clear the mock inputs, then hand the box to React.
    target.replaceChildren();
    setHost(target);
  }, []);

  return (
    <>
      <span ref={anchor} hidden aria-hidden="true" />
      {host ? createPortal(<LeadForm {...props} />, host) : null}
    </>
  );
}
