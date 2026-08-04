"use client";
// The three packages, and the Stripe buy button that collects money for each one.
//
// Account-level, not per-invoice: a button is minted once in Stripe and then rides on every
// invoice that sells that package. This panel is where the paste lands.
//
// ── WHAT IT STORES ────────────────────────────────────────────────────────────────────────────
// Not the pasted snippet — the two ids inside it (see parseBuyButton). Parsing here means a bad
// paste is caught in front of the person who did it, with the box still open, instead of becoming
// a Pay button that renders as nothing on an invoice already sent. The server parses again on the
// way in; this check is for the human.
//
// The publishable key in that snippet is PUBLISHABLE. It is designed to sit in a public page, and
// storing it is not storing a secret — that's what makes this whole approach keyless.
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  fromCents,
  parseBuyButton,
  toCents,
  type PaymentPackage,
} from "@/lib/invoicesShared";

type Draft = {
  key: string;
  label: string;
  buildText: string;
  hostingText: string;
  buildLabel: string;
  hostingLabel: string;
  /** Blank means "leave whatever is saved alone"; the Clear button is what removes a button. */
  button: string;
  /** What's already stored, so the panel can say "connected" without echoing the snippet back. */
  connectedId: string;
  clear: boolean;
};

const toDraft = (p: PaymentPackage): Draft => ({
  key: p.key,
  label: p.label,
  buildText: fromCents(p.buildCents),
  hostingText: fromCents(p.hostingCents),
  buildLabel: p.buildLabel,
  hostingLabel: p.hostingLabel,
  button: "",
  connectedId: p.buttonId || "",
  clear: false,
});

export default function InvoicePackages({ packages }: { packages: PaymentPackage[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Draft[]>(packages.map(toDraft));
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  function patch(key: string, next: Partial<Draft>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...next } : r)));
    setDirty(true);
    setSaved(false);
    setErr("");
  }

  // A paste that doesn't contain both ids never reaches the save button.
  const badPaste = rows.filter((r) => r.button.trim() && !parseBuyButton(r.button));

  async function save() {
    if (badPaste.length) {
      setErr(
        `That doesn't look like a Stripe buy button — ${badPaste
          .map((r) => r.label)
          .join(", ")}. Copy the whole block from Stripe, including the <script> line.`
      );
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          packages: rows.map((r) => ({
            key: r.key,
            label: r.label,
            buildCents: toCents(r.buildText),
            hostingCents: toCents(r.hostingText),
            buildLabel: r.buildLabel,
            hostingLabel: r.hostingLabel,
            // Only send `button` when there's something to say: an empty string CLEARS the stored
            // one, which is right for the Clear button and wrong for every other save.
            ...(r.clear ? { button: "" } : r.button.trim() ? { button: r.button } : {}),
          })),
        }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't save.");
      setRows((rs) => rs.map((r) => ({ ...r, button: "", clear: false })));
      setDirty(false);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={panel}>
      <div style={headRow}>
        <div>
          <h2 style={panelH}>Packages &amp; payment buttons</h2>
          <p style={hint}>
            Mint a buy button in Stripe, paste it here once, then pick the package on any invoice.
            The invoice keeps its own copy, so re-minting a button never changes one already sent.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={saveState}>{dirty ? "Unsaved" : saved ? "Saved" : ""}</span>
          <button type="button" style={ghostBtn} onClick={save} disabled={busy || !dirty}>
            Save
          </button>
        </div>
      </div>

      {err ? <p style={errBox}>{err}</p> : null}

      <div style={{ display: "grid", gap: 14 }}>
        {rows.map((r) => {
          const parsed = r.button.trim() ? parseBuyButton(r.button) : null;
          const connected = !r.clear && (parsed ? true : Boolean(r.connectedId));
          return (
            <div key={r.key} style={row}>
              <div style={rowHead}>
                <input
                  style={{ ...input, ...labelInput }}
                  value={r.label}
                  onChange={(e) => patch(r.key, { label: e.target.value })}
                />
                <span style={connected ? chipOn : chipOff}>
                  {connected ? "Button connected" : "No button yet"}
                </span>
              </div>

              <div style={row2}>
                <label style={{ display: "block" }}>
                  <span style={lbl}>Build (one-time)</span>
                  <input
                    style={{ ...input, textAlign: "right" }}
                    inputMode="decimal"
                    value={r.buildText}
                    onChange={(e) => patch(r.key, { buildText: e.target.value })}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={lbl}>Hosting (per month)</span>
                  <input
                    style={{ ...input, textAlign: "right" }}
                    inputMode="decimal"
                    value={r.hostingText}
                    onChange={(e) => patch(r.key, { hostingText: e.target.value })}
                  />
                </label>
              </div>

              {/* The wording the CUSTOMER reads. Two lines go on every invoice from this package:
                  the build, and hosting at full price with a credit taking it straight back off. */}
              <div style={{ ...row2, marginTop: 4 }}>
                <label style={{ display: "block" }}>
                  <span style={lbl}>Build line reads</span>
                  <input
                    style={input}
                    value={r.buildLabel}
                    onChange={(e) => patch(r.key, { buildLabel: e.target.value })}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={lbl}>Hosting line reads</span>
                  <input
                    style={input}
                    value={r.hostingLabel}
                    onChange={(e) => patch(r.key, { hostingLabel: e.target.value })}
                  />
                </label>
              </div>

              <p style={preview}>
                Picking {r.label || "this"} writes: <strong>{r.buildLabel}</strong> $
                {r.buildText} · <strong>{r.hostingLabel}</strong> ${r.hostingText} · less $
                {r.hostingText} first-month credit = <strong>${r.buildText} due</strong>
              </p>

              <label style={{ display: "block", marginTop: 10 }}>
                <span style={lbl}>
                  Stripe buy button{" "}
                  {r.connectedId && !r.clear ? (
                    <span style={idNote}>· saved: {r.connectedId}</span>
                  ) : null}
                </span>
                <textarea
                  style={{ ...input, ...code, minHeight: 76, resize: "vertical" }}
                  placeholder={
                    r.connectedId
                      ? "Paste a new block here only if you're replacing it"
                      : '<script async src="https://js.stripe.com/v3/buy-button.js"></script> …'
                  }
                  value={r.button}
                  onChange={(e) => patch(r.key, { button: e.target.value, clear: false })}
                />
              </label>

              <div style={rowFoot}>
                {r.button.trim() ? (
                  parsed ? (
                    <span style={okNote}>Reads as {parsed.buttonId}</span>
                  ) : (
                    <span style={badNote}>
                      Not a buy button — copy the whole block, including the &lt;script&gt; line.
                    </span>
                  )
                ) : (
                  <span />
                )}
                {r.connectedId && !r.button.trim() ? (
                  <button
                    type="button"
                    style={r.clear ? clearOn : clearBtn}
                    onClick={() => patch(r.key, { clear: !r.clear })}
                  >
                    {r.clear ? "Will be removed on save — undo" : "Remove button"}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const mono = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const panel: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 20, background: "var(--e-panel)", marginTop: 16 };
const headRow: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" };
const panelH: React.CSSProperties = { fontSize: 16, fontWeight: 700 };
const hint: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", marginTop: 3, lineHeight: 1.5, maxWidth: 560 };
const row: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 10, padding: 14, background: "var(--e-panel-2)" };
const rowHead: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 };
const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const rowFoot: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8, minHeight: 22, flexWrap: "wrap" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, marginBottom: 5, color: "var(--e-ink)" };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "8px 11px", fontSize: 14, outline: "none", fontFamily: font, background: "var(--e-panel)" };
const labelInput: React.CSSProperties = { fontWeight: 700, maxWidth: 220 };
const code: React.CSSProperties = { fontFamily: mono, fontSize: 11.5, lineHeight: 1.5 };
const chipBase: React.CSSProperties = { fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" };
const chipOn: React.CSSProperties = { ...chipBase, background: "var(--e-ok-bg)", color: "var(--e-ok-ink)" };
const chipOff: React.CSSProperties = { ...chipBase, background: "var(--e-line-soft)", color: "var(--e-muted)" };
const idNote: React.CSSProperties = { fontWeight: 500, color: "var(--e-muted)", fontFamily: mono, fontSize: 11 };
const preview: React.CSSProperties = { fontSize: 12, color: "var(--e-muted)", lineHeight: 1.6, marginTop: 10, background: "var(--e-panel)", border: "1px solid var(--e-line-soft)", borderRadius: 8, padding: "8px 10px" };
const okNote: React.CSSProperties = { fontSize: 12, color: "var(--e-ok-ink)", fontFamily: mono };
const badNote: React.CSSProperties = { fontSize: 12, color: "var(--e-danger)" };
const ghostBtn: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const clearBtn: React.CSSProperties = { background: "none", border: "none", color: "var(--e-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 };
const clearOn: React.CSSProperties = { ...clearBtn, color: "var(--e-danger)" };
const saveState: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", fontWeight: 600 };
const errBox: React.CSSProperties = { background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 14 };
