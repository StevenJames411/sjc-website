"use client";
import React from "react";
import { fillTokens } from "@/lib/businessTokens";
import { useBusiness } from "@/components/blocks/SiteContext";

// A text field that shows you what a {{business.*}} token ACTUALLY SAYS.
//
// ── WHY ───────────────────────────────────────────────────────────────────────────────────────
// Steven, looking at his own Page-title field reading `{{business.name}}`:
//
//   *"The token value for business name instead of it having written so I could fucking read it —
//    I don't know the token value until I see the actual business name… that whole custom value
//    bullshit is for code, not humans."*
//
// He is right, and the fix is not to stop using tokens. A token is what stops a phone number being
// frozen into seven blocks on the day it was typed: change it once in Website settings and every
// page follows. That is the whole answer to "a business updates their phone number".
//
// The mistake was letting a STORAGE format be a DISPLAY format. So the field keeps the token — and
// shows, underneath, the words it will render as. You read the real business name while you work,
// and you can still see that it is linked rather than typed.
//
// ⚠️ IT DOES NOT REWRITE THE VALUE. Resolving on screen and saving the resolved text would silently
// convert a live reference into a frozen literal — the exact bug tokens exist to prevent, arriving
// through the door marked "readability". Typing over it is how you deliberately break the link, and
// that is a decision, not a side effect.

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
  // rendered inside the Puck tree, so it reads context the same way a block does.
  const business = useBusiness();
  const raw = String(value ?? "");
  const hasToken = /\{\{\s*business\./.test(raw);
  const resolved = hasToken ? fillTokens(raw, business) : "";
  // A token pointing at a field nobody has filled in resolves to nothing — which on a live page is
  // a blank browser tab. Worth saying out loud here rather than being discovered on the page.
  const empty = hasToken && !resolved.trim();

  return (
    <div>
      <input
        type="text"
        value={raw}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: "1px solid var(--puck-color-grey-09, #dcdcdc)",
          borderRadius: 4,
          font: "inherit",
          background: "var(--puck-color-white, #fff)",
        }}
      />
      {hasToken && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            lineHeight: 1.4,
            color: empty ? "#b45309" : "#4b5563",
          }}
        >
          {empty ? (
            <>
              <strong>Nothing to show yet.</strong> This is linked to Website settings, and that
              field is still blank — so the page would render it empty.
            </>
          ) : (
            <>
              Shows: <strong style={{ color: "#111827" }}>{resolved}</strong>
              <br />
              Linked to Website settings — change it there and every page follows. Type over it here
              to set this page's own wording instead.
            </>
          )}
        </div>
      )}
    </div>
  );
}
