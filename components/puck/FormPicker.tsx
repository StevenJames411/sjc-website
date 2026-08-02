"use client";
// "Start from a preset" — the bridge between the form library and a page.
//
// ⚠️ IT COPIES. Picking a preset writes its questions into THIS block's own props and then the
// link is over: the page owns those questions, and editing the preset later never touches this
// page. That is the whole safety model — see lib/formsShared.ts. It also means there is no such
// thing here as a dangling reference, a shared edit that surprises you, or a form you can't
// delete because something published points at it.
//
// The Puck field this renders into is `fields` (the existing array of questions), NOT a new
// formId prop. So nothing about how a page stores or renders its form changes — this is a
// faster way to fill in an array Steven can already edit by hand.
// It sets one string — the id of the form to copy in. The block's `resolveData` in
// components/puck/config.tsx does the copying and then clears this back to "", which is why a
// saved page never carries a preset id around: the questions are the record, the preset was just
// how they got there.
import { useEffect, useState } from "react";
import type { FormDef } from "@/lib/formsShared";

export default function FormPicker({ onApply }: { onApply: (formId: string) => void }) {
  const [forms, setForms] = useState<FormDef[] | null>(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || forms) return;
    fetch("/api/forms", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setForms(Array.isArray(d?.forms) ? d.forms : []))
      .catch(() => setErr("Couldn't load your forms."));
  }, [open, forms]);

  function apply(f: FormDef) {
    onApply(f.id);
    setOpen(false);
  }

  if (!open) {
    return (
      <div style={wrap}>
        <button type="button" style={btn} onClick={() => setOpen(true)}>
          Start from a preset…
        </button>
        <p style={hint}>
          Copies a form&apos;s questions onto this page. You can edit them here afterwards without
          affecting anything else.
        </p>
      </div>
    );
  }

  return (
    <div style={wrap}>
      {err ? <p style={errLine}>{err}</p> : null}
      {!forms ? <p style={hint}>Loading…</p> : null}
      {forms?.map((f) => (
        <button key={f.id} type="button" style={row} onClick={() => apply(f)}>
          <span style={{ fontWeight: 700 }}>{f.name}</span>
          <span style={rowSub}>
            {f.fields.length} question{f.fields.length === 1 ? "" : "s"} —{" "}
            {f.fields.map((x) => x.label).join(" · ") || "empty"}
          </span>
        </button>
      ))}
      {forms && forms.length === 0 ? <p style={hint}>No forms yet. Make one in Forms.</p> : null}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="button" style={btn} onClick={() => setOpen(false)}>
          Cancel
        </button>
        <a href="/edit/forms" target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: "none" }}>
          Manage forms ↗
        </a>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const btn: React.CSSProperties = { border: "1px solid #d1d5db", background: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center", color: "#111827" };
const row: React.CSSProperties = { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "9px 11px", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 3, fontSize: 13 };
const rowSub: React.CSSProperties = { fontSize: 11, color: "#6b7280", lineHeight: 1.4 };
const hint: React.CSSProperties = { fontSize: 11, color: "#6b7280", lineHeight: 1.5, margin: 0 };
const errLine: React.CSSProperties = { fontSize: 12, color: "#b91c1c", margin: 0 };
