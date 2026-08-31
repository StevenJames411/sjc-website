"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CalEmbed from "./CalEmbed";

// Put the REAL booking calendar where the design drew its embed.
//
// ── THE SAME TRADE AS DesignFormMount, FOR THE SAME REASON ────────────────────────────────────
// An imported page's Cal.com calendar arrives as an empty `<div id="my-cal-inline-…">` plus a
// script, and the importer strips every script — correctly, it is the only thing standing between
// a bought design and arbitrary JavaScript running on a client's site. So the design keeps its
// heading, its band and its white card, and the box in the middle is empty.
//
// Steven, 2026-08-26: *"the Cal.com didn't come over because that was an HTML in the sealed
// section… we can make our own section and it looks like it belongs on the page."* Mounting into
// the design's own box is the version of that where nothing has to be rebuilt to match: the card,
// the shadow, the padding and the spacing above and below are the design's, unchanged.
//
// ⚠️ MOUNTED, NOT STRING-SPLIT — see the note in DesignFormMount. The box sits several divs deep,
// so cutting the markup in two leaves both halves with unbalanced tags and the section collapses.

export default function DesignCalMount({ calLink }: { calLink: string }) {
  // An anchor in the normal flow, so we find OUR section's calendar rather than the first one on
  // the page. A page can carry more than one imported section.
  const anchor = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = anchor.current?.parentElement;
    if (!root) return;
    const target = root.querySelector<HTMLElement>("[data-sjc-cal]");
    if (!target) return;
    // The design's placeholder carries `overflow:scroll` and a 100% height from Cal's own snippet.
    // Both are wrong once Cal is sizing its own iframe — the height collapses to nothing and the
    // scroll turns into an inner scrollbar around a widget that measures itself.
    target.style.removeProperty("overflow");
    target.style.removeProperty("height");
    target.replaceChildren();
    setHost(target);
  }, []);

  return (
    <>
      <span ref={anchor} hidden aria-hidden="true" />
      {host ? createPortal(<CalEmbed calLink={calLink} minHeight={570} />, host) : null}
    </>
  );
}
