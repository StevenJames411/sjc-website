"use client";
// A LIVE link from this block to a form in the library.
//
// ⚠️ THE OPPOSITE OF FormPicker, WHICH SITS RIGHT BELOW IT. FormPicker copies a form's questions
// into the page and the link is over. This stores the form's ID and nothing else — the questions
// are filled in at render (lib/formPointer), so editing the form in the library changes every
// page pointing at it.
//
// Steven, 2026-08-06: *"once an onboarding form gets created for a page or a client, if I change a
// question in the form library, whatever's on their website should update."* And it is emphatically
// not an embed: the questions resolve to plain data and OUR components draw them, so the form
// inherits the host site's header, footer, fonts and colours. It looks like a page because it is.
//
// The two live together on purpose. Live is the default answer; copy is for a one-off variant of
// a standard form that must NOT drag every other page along with it.
import { useEffect, useState } from "react";
import type { FormDef } from "@/lib/formsShared";

export default function FormLink({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const [forms, setForms] = useState<FormDef[] | null>(null);

  useEffect(() => {
    fetch("/api/forms", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setForms(Array.isArray(d?.forms) ? d.forms : []))
      .catch(() => setForms([]));
  }, []);

  const linked = (value || "").trim();
  const form = forms?.find((f) => f.id === linked);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <select
        value={linked}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "6px 8px",
          border: "1px solid var(--color-sjc-line)",
          borderRadius: 6,
          fontSize: 13,
        }}
      >
        <option value="">Not linked — this page owns its questions</option>
        {(forms || []).map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      {/* Said out loud, because "linked" is invisible otherwise: the questions list below stops
          being the record the moment this is set, and someone editing it would be editing
          something that gets overwritten at render. */}
      {linked ? (
        <p style={{ margin: 0, fontSize: 12, color: "#4b5563" }}>
          Live link to <strong>{form?.name || linked}</strong>. Its questions come from the form
          library — edit them there and this page follows. The Questions list below is ignored.
        </p>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
          Link this to a form and editing that form updates every page using it.
        </p>
      )}
    </div>
  );
}
