"use client";
// Edit one form. Built for speed: everything is on one screen, nothing opens a dialog, and a
// question is added in one click from the standard list.
//
// ── THE ONE THING THAT IS NOT EDITABLE, AND WHY ───────────────────────────────────────────────
// Every question carries a `fieldId`. That string IS the column in the client's Google Sheet —
// the Apps Script matches columns by it (kept in the header cell's note), which is exactly what
// lets you reword a question and keep its history. So the label is freely editable forever and
// the key never changes. Deriving the key from the label is the bug this replaces: rewording
// "Best phone number" to "Cell" used to orphan the column and silently start a new one.
//
// The key is shown, greyed, under each question. It is shown rather than hidden so that when
// Steven is looking at a spreadsheet header note trying to work out which column is which, the
// answer is on this screen. It is not editable, and the server refuses to change it either way.
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FIELD_TYPE_LABELS,
  STANDARD_FIELDS,
  type FormDef,
  type FormField,
  type FormFieldType,
} from "@/lib/formsShared";

const TYPES = Object.keys(FIELD_TYPE_LABELS) as FormFieldType[];

export default function FormEditor({ form }: { form: FormDef }) {
  const router = useRouter();
  const [f, setF] = useState<FormDef>(form);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const dirty = JSON.stringify(f) !== JSON.stringify(form);

  function fields(next: FormField[]) {
    setF({ ...f, fields: next });
    setMsg("");
  }
  function patchField(i: number, patch: Partial<FormField>) {
    fields(f.fields.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  }
  function move(i: number, by: number) {
    const to = i + by;
    if (to < 0 || to >= f.fields.length) return;
    const next = f.fields.slice();
    const [row] = next.splice(i, 1);
    next.splice(to, 0, row);
    fields(next);
  }
  function addStandard(std: FormField) {
    if (f.fields.some((x) => x.fieldId === std.fieldId)) return;
    fields([...f.fields, { ...std }]);
  }
  function addCustom() {
    // No fieldId — the server mints one. Sending a guess from the browser is how a key could be
    // forged onto somebody else's column, so normalizeFields ignores unknown ones anyway.
    fields([...f.fields, { fieldId: "", label: "New question", type: "text" } as FormField]);
  }

  async function save() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/forms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: f.id,
          name: f.name,
          description: f.description,
          fields: f.fields,
          buttonLabel: f.buttonLabel,
          note: f.note,
          successHeading: f.successHeading,
          successBody: f.successBody,
        }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't save.");
      setMsg("Saved.");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const unused = STANDARD_FIELDS.filter((s) => !f.fields.some((x) => x.fieldId === s.fieldId));

  return (
    <div style={page}>
      <button type="button" style={back} onClick={() => router.push("/edit/forms")}>
        ← All forms
      </button>

      <h1 style={h1}>{f.name || "Untitled form"}</h1>
      <p style={sub}>
        {f.kind === "builtin" ? "Built in — your edits are kept on top of it." : "Your form."}
      </p>

      <h2 style={sec}>Questions</h2>
      <p style={hint}>
        Reword anything you like — the spreadsheet column stays with its answers. Drag order with
        the arrows; the order here is the order on the page.
      </p>

      {f.fields.map((x, i) => (
        <div key={`${x.fieldId || "new"}-${i}`} style={row}>
          <div style={rowHead}>
            <input
              value={x.label}
              onChange={(e) => patchField(i, { label: e.target.value })}
              placeholder="The question, in their words"
              style={{ ...input, fontWeight: 600 }}
            />
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" style={tiny} onClick={() => move(i, -1)} disabled={i === 0} title="Up">
                ↑
              </button>
              <button
                type="button"
                style={tiny}
                onClick={() => move(i, 1)}
                disabled={i === f.fields.length - 1}
                title="Down"
              >
                ↓
              </button>
              <button
                type="button"
                style={tiny}
                onClick={() => fields(f.fields.filter((_, n) => n !== i))}
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>

          <div style={rowMeta}>
            <select
              value={x.type}
              onChange={(e) => patchField(i, { type: e.target.value as FormFieldType })}
              style={select}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {FIELD_TYPE_LABELS[t]}
                </option>
              ))}
            </select>

            <label style={checkLbl}>
              <input
                type="checkbox"
                checked={!!x.required}
                onChange={(e) => patchField(i, { required: e.target.checked })}
              />
              Must be filled in
            </label>

            <span style={keyTag} title="The column this answer lands in. Fixed on purpose.">
              column: {x.fieldId || "made when you save"}
            </span>
          </div>

          <input
            value={x.help || ""}
            onChange={(e) => patchField(i, { help: e.target.value })}
            placeholder="Helper line under the question (optional)"
            style={{ ...input, marginTop: 8, fontSize: 13 }}
          />

          {x.type === "choice" ? (
            <input
              value={(x.options || []).join(", ")}
              onChange={(e) =>
                patchField(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })
              }
              placeholder="The choices, separated by commas"
              style={{ ...input, marginTop: 8, fontSize: 13 }}
            />
          ) : null}
        </div>
      ))}

      {f.fields.length === 0 ? <p style={hint}>No questions yet — add one below.</p> : null}

      <div style={addBar}>
        <button type="button" style={primary} onClick={addCustom}>
          + Add a question
        </button>
        {unused.length ? (
          <>
            <span style={{ fontSize: 12, color: "var(--e-muted)", alignSelf: "center" }}>or the usual ones:</span>
            {unused.map((s) => (
              <button key={s.fieldId} type="button" style={smallGhost} onClick={() => addStandard(s)}>
                + {s.label}
              </button>
            ))}
          </>
        ) : null}
      </div>

      <h2 style={sec}>The button and the thank-you</h2>
      <Field label="Button text" v={f.buttonLabel} on={(v) => setF({ ...f, buttonLabel: v })} ph="Send it" />
      <Field
        label="Small line under the button"
        v={f.note}
        on={(v) => setF({ ...f, note: v })}
        ph="No obligation. We'll call you back to talk it through."
        area
      />
      <Field
        label="Thank-you heading"
        v={f.successHeading}
        on={(v) => setF({ ...f, successHeading: v })}
        ph="Got it — thank you."
      />
      <Field
        label="Thank-you body"
        v={f.successBody}
        on={(v) => setF({ ...f, successBody: v })}
        ph="We'll be in touch shortly."
        area
      />

      <div style={tokenBox}>
        <p style={{ ...hint, margin: 0 }}>
          Write <code style={code}>{"{{business.phone}}"}</code> or{" "}
          <code style={code}>{"{{business.name}}"}</code> anywhere above and it fills in from that
          website&apos;s own settings. Type a real phone number instead and every client who uses
          this form gets that number.
        </p>
      </div>

      <h2 style={sec}>In your list</h2>
      <Field label="Form name" v={f.name} on={(v) => setF({ ...f, name: v })} ph="Quote request" />
      <Field
        label="Note to yourself"
        v={f.description || ""}
        on={(v) => setF({ ...f, description: v })}
        ph="Who this one is for"
      />

      {err ? <p style={errBox}>{err}</p> : null}
      {msg ? <p style={okBox}>{msg}</p> : null}

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button type="button" style={primary} onClick={save} disabled={busy || !dirty}>
          {busy ? "Saving…" : dirty ? "Save this form" : "Saved"}
        </button>
        <button type="button" style={ghost} onClick={() => router.push("/edit/forms")}>
          Back to all forms
        </button>
      </div>

      <p style={footNote}>
        Saving changes this form in your library. Websites that already use it keep the questions
        they were given — nothing on a live site moves until you pick this form again on that page.
      </p>
    </div>
  );
}

function Field({
  label, v, on, ph, area,
}: { label: string; v: string; on: (v: string) => void; ph?: string; area?: boolean }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={lbl}>{label}</span>
      {area ? (
        <textarea value={v} onChange={(e) => on(e.target.value)} placeholder={ph} style={{ ...input, minHeight: 70 }} />
      ) : (
        <input value={v} onChange={(e) => on(e.target.value)} placeholder={ph} style={input} />
      )}
    </label>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const page: React.CSSProperties = { maxWidth: 720, margin: "0 auto", padding: "32px 24px 100px", fontFamily: font };
const back: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const sec: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--e-muted)", margin: "34px 0 6px", borderTop: "1px solid var(--e-line)", paddingTop: 20 };
const hint: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", lineHeight: 1.55, margin: "0 0 14px" };
const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: font };
const select: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 8, padding: "6px 9px", fontSize: 13, fontFamily: font, background: "var(--e-panel)" };
const row: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 10, padding: 14, marginBottom: 10, background: "var(--e-panel)" };
const rowHead: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
const rowMeta: React.CSSProperties = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 10 };
const checkLbl: React.CSSProperties = { display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: "var(--e-ink)" };
const keyTag: React.CSSProperties = { fontSize: 11, color: "var(--e-muted)", fontFamily: "ui-monospace,monospace", marginLeft: "auto" };
const tiny: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", borderRadius: 6, width: 30, height: 30, fontSize: 13, cursor: "pointer", flexShrink: 0 };
const addBar: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 };
const smallGhost: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const code: React.CSSProperties = { background: "var(--e-line-soft)", borderRadius: 4, padding: "1px 5px", fontFamily: "ui-monospace,monospace", fontSize: 12 };
const tokenBox: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel-2)", borderRadius: 10, padding: 14, marginTop: 6 };
const primary: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const ghost: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const errBox: React.CSSProperties = { marginTop: 16, background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
const okBox: React.CSSProperties = { marginTop: 16, background: "var(--e-ok-bg)", border: "1px solid var(--e-ok-line)", color: "var(--e-ok-ink)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
const footNote: React.CSSProperties = { fontSize: 12, color: "var(--e-muted)", lineHeight: 1.6, marginTop: 30, borderTop: "1px solid var(--e-line)", paddingTop: 16 };
