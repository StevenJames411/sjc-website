"use client";
import { useEffect, useState } from "react";

// What a business owner told us, readable — on the card, while she's still filling it in.
//
// This replaces reading a raw JSON admin URL. That URL worked, and it was a developer surface
// handed to the person who runs the business and to whoever eventually does this job instead of
// him. A thing you can only read as JSON is not finished.
//
// FETCHED ON OPEN, not shipped with the gallery. At three clients it makes no difference; at a
// hundred, sending every answer and photo URL down with every page load to render two lines of
// status would be the wrong shape. You load what you actually open.

type Answer = { question: string; answer: string | string[] };
type Payload = {
  progress?: string;
  status?: string;
  submittedAt?: string | null;
  stoppedBecause?: string | null;
  answers?: Answer[];
  photos?: string[];
  url?: string;
};

export default function IntakeAnswers({
  siteId,
  businessName,
  onClose,
}: {
  siteId: string;
  businessName: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/intake?site=${encodeURIComponent(siteId)}`, { credentials: "same-origin" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok || !body?.ok) throw new Error(body?.error || `HTTP ${r.status}`);
        if (alive) setData(body);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "could not load"));
    return () => {
      alive = false;
    };
  }, [siteId]);

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={panelHead}>
          <div>
            <h2 style={title}>{businessName}</h2>
            <p style={sub}>{data?.progress || "…"}</p>
          </div>
          <button type="button" style={closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {error ? <p style={danger}>{error}</p> : null}

        {/* A form she abandoned and a form she finished look identical in a list of answers, and
            they need completely different actions from Steven — chase her, or start building. */}
        {data?.stoppedBecause ? (
          <p style={noteWarn}>Stopped: {data.stoppedBecause}</p>
        ) : data?.submittedAt ? (
          <p style={noteGood}>Finished {new Date(data.submittedAt).toLocaleString()}</p>
        ) : data ? (
          <p style={note}>Still filling it in — this updates as she goes.</p>
        ) : null}

        {data && (data.answers || []).length === 0 ? (
          <p style={note}>Nothing answered yet.</p>
        ) : null}

        {(data?.answers || []).map((a) => (
          <div key={a.question} style={qa}>
            <div style={qLabel}>{a.question}</div>
            <div style={aText}>{Array.isArray(a.answer) ? a.answer.join(", ") : a.answer}</div>
          </div>
        ))}

        {(data?.photos || []).length > 0 ? (
          <>
            <div style={qLabel}>Photos she sent ({data?.photos?.length})</div>
            <div style={photoGrid}>
              {(data?.photos || []).map((u) => (
                // Clickable, because the next thing you do with a photo is open it full size to
                // decide whether it's good enough for her homepage.
                <a key={u} href={u} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" style={thumb} />
                </a>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 50,
};

const panel: React.CSSProperties = {
  background: "var(--e-panel)",
  borderRadius: 14,
  padding: 24,
  width: "100%",
  maxWidth: 680,
  maxHeight: "85vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,.25)",
};

const panelHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 14,
};

const title: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: "var(--e-ink-strong)" };
const sub: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", marginTop: 2 };
const closeBtn: React.CSSProperties = {
  border: "none",
  background: "none",
  fontSize: 18,
  cursor: "pointer",
  color: "var(--e-muted)",
  lineHeight: 1,
};

const qa: React.CSSProperties = { padding: "10px 0", borderTop: "1px solid var(--e-line-soft)" };
const qLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--e-accent)",
  textTransform: "uppercase",
  letterSpacing: ".04em",
  marginTop: 12,
};
// Her words, at readable size and preserving her line breaks — this is the raw material the
// website gets written from, so it should be pleasant to actually read.
const aText: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.55,
  color: "var(--e-ink-strong)",
  marginTop: 4,
  whiteSpace: "pre-wrap",
};

const note: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)" };
const noteGood: React.CSSProperties = { ...note, color: "var(--e-ok-dot)", fontWeight: 600 };
const noteWarn: React.CSSProperties = { ...note, color: "var(--e-warn-ink)", fontWeight: 600 };
const danger: React.CSSProperties = { ...note, color: "var(--e-danger)" };

const photoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
  gap: 8,
  marginTop: 8,
};

const thumb: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1",
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid var(--e-line)",
  display: "block",
};
