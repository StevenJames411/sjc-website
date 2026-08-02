"use client";
// The form library — every reusable set of questions, on cards, the way the websites are.
//
// A form here is a STARTING POINT, not a live link. Picking one in the builder copies its
// questions onto that page; editing it afterwards changes the library, never a client's live
// site. That is deliberate — see the long note in lib/formsShared.ts.
//
// So there is no "used on" list and no blast radius, because there is no blast radius to warn
// about. The one thing a card must never grow is a destination: where a lead goes is decided by
// which WEBSITE it came from, and it is set once in that website's settings.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FIELD_TYPE_LABELS, type FormDef } from "@/lib/formsShared";

export default function FormLibrary({ forms, title }: { forms: FormDef[]; title: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [naming, setNaming] = useState<{ from?: string; name: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return forms;
    return forms.filter(
      (f) =>
        f.name.toLowerCase().includes(t) ||
        (f.description || "").toLowerCase().includes(t) ||
        f.fields.some((x) => x.label.toLowerCase().includes(t))
    );
  }, [forms, q]);

  const builtins = shown.filter((f) => f.kind === "builtin");
  const mine = shown.filter((f) => f.kind !== "builtin");

  async function create() {
    if (!naming) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: naming.name, from: naming.from }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't create it.");
      setNaming(null);
      router.push(`/edit/forms/${body.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/forms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't delete it.");
      setConfirming(null);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const Card = (f: FormDef) => (
    <div key={f.id} style={f.kind === "builtin" ? { ...card, borderStyle: "dashed" } : card}>
      <div style={badgeRow}>
        {f.kind === "builtin" ? <span style={chip}>Built in</span> : null}
        <span style={countChip}>
          {f.fields.length} question{f.fields.length === 1 ? "" : "s"}
        </span>
      </div>

      <h2 style={cardName}>{f.name}</h2>
      {f.description ? <p style={cardDesc}>{f.description}</p> : null}

      <ul style={list}>
        {f.fields.map((x) => (
          <li key={x.fieldId} style={li}>
            <span>{x.label}</span>
            <span style={typeTag}>{FIELD_TYPE_LABELS[x.type] || x.type}</span>
          </li>
        ))}
        {f.fields.length === 0 ? <li style={{ ...li, color: "var(--e-muted)" }}>No questions yet</li> : null}
      </ul>

      <p style={btnLine}>Button: “{f.buttonLabel}”</p>

      {confirming === f.id ? (
        <div style={delPanel}>
          <p style={{ margin: "0 0 10px", fontSize: 13 }}>Delete “{f.name}”? Pages already using it keep their questions.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={dangerBtn} onClick={() => remove(f.id)} disabled={busy}>
              {busy ? "Deleting…" : "Delete it"}
            </button>
            <button type="button" style={smallGhost} onClick={() => setConfirming(null)}>
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <div style={cardFoot}>
          <button type="button" style={smallGhost} onClick={() => router.push(`/edit/forms/${f.id}`)}>
            Edit
          </button>
          <button
            type="button"
            style={smallGhost}
            onClick={() => setNaming({ from: f.id, name: `${f.name} copy` })}
          >
            Make a copy
          </button>
          {f.kind !== "builtin" ? (
            <button type="button" style={iconBtn} title="Delete" onClick={() => setConfirming(f.id)}>
              🗑
            </button>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <div style={page}>
      {/* "← All websites" lived here until the rail took over global navigation. */}

      <div style={head}>
        <div>
          <h1 style={h1}>{title}</h1>
          <p style={sub}>Question sets you can drop onto any website</p>
        </div>
        <button type="button" style={primaryBtn} onClick={() => setNaming({ name: "" })}>
          + New form
        </button>
      </div>

      <p style={hint}>
        Pick one of these in the builder and its questions are <strong>copied</strong> onto that
        page. Editing a form here never changes a website that already has it — so you can rewrite
        anything without wondering what else you just touched.
      </p>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search forms…" style={search} />

      {err ? <p style={errBox}>{err}</p> : null}

      {mine.length ? <div style={grid}>{mine.map(Card)}</div> : null}

      <h2 style={sec}>Built in</h2>
      <div style={grid}>{builtins.map(Card)}</div>

      <p style={footNote}>
        Leads land in each client&apos;s own Google Sheet and inbox. This is where the{" "}
        <strong>questions</strong> live — not the answers. Where a client&apos;s leads go is set
        once, in that website&apos;s settings.
      </p>

      {naming ? (
        <div style={scrim} onClick={() => setNaming(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
              {naming.from ? "Copy this form" : "New form"}
            </h2>
            <p style={{ ...hint, marginTop: 6 }}>
              {naming.from
                ? "The copy keeps the same questions and the same spreadsheet columns."
                : "Give it a name you'll recognise in the builder."}
            </p>
            <input
              autoFocus
              value={naming.name}
              onChange={(e) => setNaming({ ...naming, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && naming.name.trim()) create();
              }}
              placeholder="Quote request"
              style={input}
            />
            {err ? <p style={errBox}>{err}</p> : null}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="button" style={primary} onClick={create} disabled={busy || !naming.name.trim()}>
                {busy ? "Creating…" : "Create it"}
              </button>
              <button type="button" style={ghost} onClick={() => setNaming(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const page: React.CSSProperties = { maxWidth: 1080, margin: "0 auto", padding: "32px 24px 100px", fontFamily: font };
const back: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 };
const head: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const hint: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", lineHeight: 1.55, margin: "16px 0 0", maxWidth: 720 };
const sec: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--e-muted)", margin: "34px 0 12px", borderTop: "1px solid var(--e-line)", paddingTop: 20 };
const search: React.CSSProperties = { width: "100%", maxWidth: 340, border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: font, margin: "18px 0 22px" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 };
const card: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 18, background: "var(--e-panel)", display: "flex", flexDirection: "column" };
const badgeRow: React.CSSProperties = { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" };
const chip: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", background: "var(--e-line-soft)", color: "var(--e-muted)", borderRadius: 999, padding: "3px 9px" };
const countChip: React.CSSProperties = { ...chip, background: "var(--e-info-bg)", color: "var(--e-info-ink)" };
const cardName: React.CSSProperties = { fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" };
const cardDesc: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", margin: "6px 0 0", lineHeight: 1.5 };
const list: React.CSSProperties = { listStyle: "none", padding: 0, margin: "14px 0 0", borderTop: "1px solid var(--e-line-soft)" };
const li: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "7px 0", borderBottom: "1px solid var(--e-panel-2)" };
const typeTag: React.CSSProperties = { fontSize: 11, color: "var(--e-muted)", whiteSpace: "nowrap" };
const btnLine: React.CSSProperties = { fontSize: 12, color: "var(--e-muted)", margin: "12px 0 0" };
const cardFoot: React.CSSProperties = { display: "flex", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--e-line-soft)" };
const smallGhost: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const iconBtn: React.CSSProperties = { ...smallGhost, marginLeft: "auto", padding: "6px 10px" };
const delPanel: React.CSSProperties = { marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--e-bad-line)", background: "var(--e-bad-bg)", borderRadius: 8, padding: 12 };
const dangerBtn: React.CSSProperties = { background: "var(--e-danger)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const primaryBtn: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
const primary: React.CSSProperties = primaryBtn;
const ghost: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: font, marginTop: 10 };
const errBox: React.CSSProperties = { marginTop: 16, background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
const footNote: React.CSSProperties = { fontSize: 12, color: "var(--e-muted)", lineHeight: 1.6, marginTop: 34, borderTop: "1px solid var(--e-line)", paddingTop: 16, maxWidth: 720 };
const scrim: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(17,24,39,.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const modal: React.CSSProperties = { background: "var(--e-panel)", borderRadius: 14, padding: 24, width: "100%", maxWidth: 440, fontFamily: font };
