"use client";
import React, { useState } from "react";
import { fillTokens } from "@/lib/businessTokens";
import { useBusiness } from "@/components/blocks/SiteContext";

// A text field that shows the BUSINESS NAME, not `{{business.name}}`.
//
// ── WHY ───────────────────────────────────────────────────────────────────────────────────────
// Steven, looking at his own Page-title field:
//
//   *"Instead of business name in quotes, I want to see the actual business name. Code view
//    doesn't help a human."*
//
// He is right twice over. A token is unreadable, and the first attempt at this put the resolved
// words in a HINT underneath — which still left the code in the box he actually reads. The value
// on screen has to be the words.
//
// ── BUT THE TOKEN IS STILL WHAT GETS SAVED ────────────────────────────────────────────────────
// That is the whole reason tokens exist. A phone number or a business name typed literally into a
// block is frozen the day it was typed: change it in Website settings and seven blocks still say
// the old one. Stored as a reference, one edit updates every page — which is the answer to *"it's
// not like you put a phone number in once and it never changes again."*
//
// So: DISPLAY resolves, STORAGE stays a reference. The two were only ever conflated by accident.
//
// ⚠️ TYPING IS WHAT BREAKS THE LINK, AND ONLY TYPING. Focusing the field, or opening the page and
// closing it, must never rewrite anything — that would silently convert a live reference into a
// frozen literal, which is the exact bug tokens prevent, arriving through the door marked
// "readability". `onChange` fires only on a real edit, and when it does the field says plainly
// that this page now has its own wording, with one click to link it back.
export default function TokenText({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  // The site being edited, from the provider the editor page already wraps in. A custom field is
  // rendered inside the Puck tree, so it reads context exactly the way a block does.
  const business = useBusiness();
  const raw = String(value ?? "");
  const linked = /\{\{\s*business\./.test(raw);
  const resolved = fillTokens(raw, business);

  // The token is remembered so "Link it back" is one click and does not need to guess which field
  // it came from. Held in state rather than written anywhere: unlinking is an edit, relinking is
  // an edit, and neither should happen without one.
  const [wasLinked, setWasLinked] = useState(linked ? raw : "");

  // A reference to a settings field nobody has filled in renders as nothing — a blank browser tab
  // on the live page. Said out loud here rather than discovered later.
  const empty = linked && !resolved.trim();

  return (
    <div>
      <input
        type="text"
        // THE WORDS, not the reference. On a linked field this is the resolved text; the token
        // itself never reaches the screen.
        value={linked ? resolved : raw}
        placeholder={placeholder}
        onChange={(e) => {
          if (linked) setWasLinked(raw);
          // Typing replaces the reference with exactly what was typed. Deliberate, and reversible
          // by the button below.
          onChange(e.target.value);
        }}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: `1px solid ${empty ? "#f59e0b" : "var(--puck-color-grey-09, #dcdcdc)"}`,
          borderRadius: 4,
          font: "inherit",
          background: "var(--puck-color-white, #fff)",
        }}
      />

      {empty && (
        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.4, color: "#b45309" }}>
          <strong>Empty.</strong> This follows Website settings, and that field is still blank — so
          the page would show nothing here.
        </div>
      )}

      {linked && !empty && (
        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.4, color: "#4b5563" }}>
          Follows Website settings — change it there and every page updates. Type here to give this
          page its own wording.
        </div>
      )}

      {!linked && wasLinked && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            lineHeight: 1.4,
            color: "#4b5563",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>This page&rsquo;s own wording — it no longer follows Website settings.</span>
          <button
            type="button"
            onClick={() => {
              onChange(wasLinked);
              setWasLinked("");
            }}
            style={{
              font: "inherit",
              fontSize: 12,
              padding: "3px 8px",
              borderRadius: 4,
              border: "1px solid #cbd5e1",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Follow settings again
          </button>
        </div>
      )}
    </div>
  );
}
