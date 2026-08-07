"use client";
// THE DIAL BOARD — the whole sheet on one scrolling page, dialled through his own iPhone.
//
// ── WHAT IT REPLACES ──────────────────────────────────────────────────────────────────────────
// Steven read a row off a Google Sheet, keyed ten digits into the Mac Phone app by hand, talked,
// clicked back into the sheet, typed the note by hand, then scrolled to find where he was.
//
// ── ⛔ WHY THIS IS A LIST AND NOT A ONE-CARD-AT-A-TIME DIALER ─────────────────────────────────
// The first version showed one business, took an outcome, and advanced — the shape every power
// dialer uses, including Targetley's. Steven, 2026-08-07:
//
//   *"I just want to be able to scroll the whole page. I don't want to have to toggle one business
//    at a time to look at what's on my sheet."*
//
// He is right, and the reason is that this is not a call-centre queue being fed to an agent. It is
// HIS sheet, and he is the one who decides what to work next — he wants to see that there are
// fourteen five-star shops below the one he is looking at. A queue takes that judgement away and
// gives back nothing, because there is no supervisor here to enforce an order.
//
// So: every row rendered, nothing hidden, sheet order preserved. Rows that are already done stay
// visible and go quiet rather than disappearing. His deck sheet's tab is literally called
// "San Antonio — Neediest First", so the sheet is ALREADY sorted the way he wants to work it;
// re-sorting here would override a decision he made upstream.
//
// ── THE TWO THINGS THAT MUST NOT BREAK ────────────────────────────────────────────────────────
//  1. A note must never land on the wrong business — every write carries the name the board thinks
//     is on that row, and the script re-finds it if the sheet was sorted underneath.
//  2. The sheet stays the database. Nothing here caches a prospect; a reload re-reads the sheet.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  OUTCOMES,
  calendarHref,
  isDone,
  labelFor,
  normaliseStatus,
  prettyWhen,
  siteHref,
  telHref,
  toneFor,
  type CallList,
  type Cell,
  type Prospect,
} from "@/lib/dialShared";

type Loaded = {
  list: CallList;
  title: string;
  tab: string;
  prospects: Prospect[];
  truncated: boolean;
};

export default function DialBoard({
  lists: initialLists,
  title,
  configured,
}: {
  lists: CallList[];
  title: string;
  configured: boolean;
}) {
  const [lists, setLists] = useState(initialLists);
  const [activeId, setActiveId] = useState(initialLists[0]?.id || "");
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState("");
  /** Dials made since the page was opened. Not persisted — it is a session pace, not a record. */
  const [dials, setDials] = useState(0);
  /** Per-row note text, keyed by sheet row. Cleared once the row is written. */
  const [notes, setNotes] = useState<Record<number, string>>({});
  /** Which row is mid-write, so its buttons can say so without freezing the other 499. */
  const [saving, setSaving] = useState<number | null>(null);
  /** Which row has its callback picker open, and the value in it. */
  const [booking, setBooking] = useState<{ row: number; when: string } | null>(null);
  /** Hide the ones already dealt with. Off by default — he asked to see the whole sheet. */
  const [hideDone, setHideDone] = useState(false);

  const load = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`/api/dial?list=${encodeURIComponent(id)}`, { cache: "no-store" });
      const b = await r.json();
      if (!b.ok) {
        setErr(b.error || "Couldn't read that sheet.");
        setData(null);
      } else {
        setData(b);
        setNotes({});
      }
    } catch {
      setErr("Couldn't reach the sheet.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(activeId);
  }, [activeId, load]);

  const all = useMemo(() => data?.prospects || [], [data]);
  const counts = useMemo(() => {
    const done = all.filter(isDone).length;
    const touched = all.filter((p) => p.status.trim()).length;
    return { total: all.length, done, touched, left: all.length - done };
  }, [all]);
  const shown = useMemo(() => (hideDone ? all.filter((p) => !isDone(p)) : all), [all, hideDone]);

  async function log(p: Prospect, outcome: string, extra?: { callbackAt?: string }) {
    if (!activeId) return;
    setSaving(p.row);
    setErr("");
    const note = (notes[p.row] || "").trim();
    try {
      const r = await fetch("/api/dial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeId,
          row: p.row,
          expectName: p.name,
          outcome,
          note: note || undefined,
          callbackAt: extra?.callbackAt,
        }),
      });
      const b = await r.json();
      if (!b.ok) {
        // A refused write is the safety net doing its job. Say what happened and change NOTHING on
        // screen, or the row goes green over a write that never landed.
        setErr(b.error || "The sheet refused that write.");
        return;
      }

      // Patched in place rather than re-reading: a re-read would rebuild the list under his cursor
      // while he is halfway down it.
      setData((d) =>
        d
          ? {
              ...d,
              prospects: d.prospects.map((x) =>
                x.row === b.row
                  ? {
                      ...x,
                      status: outcome,
                      lastCalled: b.at,
                      notes: [x.notes, `${b.at} — ${outcome}${note ? `: ${note}` : ""}`]
                        .filter(Boolean)
                        .join("\n"),
                    }
                  : x
              ),
            }
          : d
      );
      setNotes((n) => ({ ...n, [p.row]: "" }));
      setBooking(null);
      setFlash(`${p.name} → ${labelFor(outcome)}`);
      setTimeout(() => setFlash(""), 2200);
    } catch {
      setErr("Couldn't reach the sheet — nothing was written.");
    } finally {
      setSaving(null);
    }
  }

  /** Callback: book it, then log it. The calendar tab opens on the click, never after an await. */
  function bookCallback(p: Prospect) {
    if (!booking || booking.row !== p.row || !booking.when) return;
    const href = calendarHref({
      name: p.name,
      phone: p.phone,
      when: booking.when,
      note: (notes[p.row] || "").trim(),
    });
    // ⚠️ OPENED SYNCHRONOUSLY, INSIDE THE CLICK. Both Safari and Chrome block a window.open that
    // happens after an await — the popup loses its user-gesture. Booking first is the only order
    // that works.
    if (href) window.open(href, "_blank", "noopener");
    void log(p, "callback", { callbackAt: prettyWhen(booking.when) });
  }

  async function addList(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setErr("");
    const r = await fetch("/api/dial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        paste: String(form.get("paste") || ""),
        tab: String(form.get("tab") || ""),
      }),
    });
    const b = await r.json();
    if (!b.ok) return setErr(b.error || "Couldn't add that list.");
    const fresh = await (await fetch("/api/dial", { cache: "no-store" })).json();
    setLists(fresh.lists || []);
    setActiveId(b.id);
    setAdding(false);
  }

  async function dropList(id: string) {
    const r = await fetch("/api/dial", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const b = await r.json();
    if (!b.ok) return setErr(b.error || "Couldn't remove that list.");
    const next = lists.filter((l) => l.id !== id);
    setLists(next);
    if (activeId === id) setActiveId(next[0]?.id || "");
  }

  return (
    <div style={page}>
      {/* ── the bar. Sticky, because with 500 rows the counts are the only way to know where you
             are, and scrolling back to the top to check them is the thing this page removes. ── */}
      <div style={bar}>
        <div style={barTop}>
          <div>
            <h1 style={h1}>{title}</h1>
            <p style={sub}>
              Your sheet is still the boss. This just stops you keying digits and typing notes.
            </p>
          </div>
          <div style={{ display: "flex", gap: 26, alignItems: "flex-start" }}>
            <Stat n={dials} cap="dials this session" accent />
            <Stat n={counts.touched} cap="worked" />
            <Stat n={counts.left} cap="left" />
          </div>
        </div>

        <div style={listRow}>
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveId(l.id)}
              style={l.id === activeId ? { ...pill, ...pillOn } : pill}
            >
              {l.name}
            </button>
          ))}
          <button onClick={() => setAdding((v) => !v)} style={{ ...pill, borderStyle: "dashed" }}>
            + Add a list
          </button>
          {data ? (
            <label style={toggle}>
              <input
                type="checkbox"
                checked={hideDone}
                onChange={(e) => setHideDone(e.target.checked)}
              />
              Hide the {counts.done} I&apos;m done with
            </label>
          ) : null}
          {activeId ? (
            <button
              onClick={() => void dropList(activeId)}
              style={dropBtn}
              title="Take this list off the board — the sheet is untouched"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      {!configured ? (
        <p style={warnBox}>
          <b>The sheets connection isn&apos;t switched on.</b> SHEETS_WEBHOOK_URL and SHEETS_SECRET
          need to be set before this page can read anything.
        </p>
      ) : null}

      {adding ? (
        <form onSubmit={addList} style={addBox}>
          <div style={addGrid}>
            <label style={lab}>
              What do you call it
              <input name="name" placeholder="Austin pet groomers" style={input} required />
            </label>
            <label style={lab}>
              Paste the Google Sheet link
              <input
                name="paste"
                placeholder="https://docs.google.com/spreadsheets/d/…"
                style={input}
                required
              />
            </label>
            <label style={lab}>
              Tab{" "}
              <span style={{ color: "var(--e-muted)", fontWeight: 400 }}>
                (blank = the first one)
              </span>
              <input name="tab" placeholder="Austin-Pet-Groomers" style={input} />
            </label>
          </div>
          <button type="submit" style={primary}>
            Add it
          </button>
        </form>
      ) : null}

      {err ? <p style={errBox}>{err}</p> : null}
      {flash ? <p style={okBox}>{flash}</p> : null}
      {loading ? <p style={muted}>Reading the sheet…</p> : null}

      {!loading && !lists.length ? (
        <p style={muted}>
          No lists yet. Add one and it&apos;ll read straight out of the sheet you&apos;re already
          working in.
        </p>
      ) : null}

      {data && !loading ? (
        <>
          <p style={progress}>
            Showing <b>{shown.length}</b> of {counts.total} · reading{" "}
            <a
              href={`https://docs.google.com/spreadsheets/d/${data.list.spreadsheetId}`}
              target="_blank"
              rel="noreferrer"
              style={link}
            >
              {data.title}
            </a>
            {data.tab ? ` → ${data.tab}` : ""}
            {data.truncated ? " · first 2,000 rows" : ""}
          </p>

          <div style={rows}>
            {shown.map((p, i) => (
              <Row
                key={p.row}
                p={p}
                n={i + 1}
                note={notes[p.row] || ""}
                onNote={(v) => setNotes((s) => ({ ...s, [p.row]: v }))}
                saving={saving === p.row}
                booking={booking?.row === p.row ? booking.when : null}
                onBook={(when) => setBooking({ row: p.row, when })}
                onCancelBook={() => setBooking(null)}
                onConfirmBook={() => bookCallback(p)}
                onDial={() => setDials((n) => n + 1)}
                onOutcome={(o) =>
                  o === "callback" ? setBooking({ row: p.row, when: "" }) : void log(p, o)
                }
              />
            ))}
          </div>

          {!shown.length ? (
            <p style={muted}>
              Nothing left showing. Untick &quot;hide the ones I&apos;m done with&quot; to see the
              whole sheet again.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/* ── one business ─────────────────────────────────────────────────────────────────────────── */

function Row({
  p,
  n,
  note,
  onNote,
  saving,
  booking,
  onBook,
  onCancelBook,
  onConfirmBook,
  onOutcome,
  onDial,
}: {
  p: Prospect;
  n: number;
  note: string;
  onNote: (v: string) => void;
  saving: boolean;
  booking: string | null;
  onBook: (when: string) => void;
  onCancelBook: () => void;
  onConfirmBook: () => void;
  onOutcome: (key: string) => void;
  onDial: () => void;
}) {
  const [open, setOpen] = useState(false);
  const tone = toneFor(p.status);
  const tel = telHref(p.phone);

  return (
    <div style={{ ...row, ...rowTone(tone) }}>
      {/* ── who ── */}
      <div style={who}>
        <div style={whoTop}>
          <span style={num}>{n}</span>
          <span style={name}>{p.name || "(no name on this row)"}</span>
          {p.rating ? <span style={star}>★ {p.rating}</span> : null}
          {p.reviews ? <span style={metaDim}>{p.reviews} reviews</span> : null}
        </div>
        <div style={metaLine}>
          {[p.category, p.address].filter(Boolean).join(" · ")}
          {p.website ? (
            <>
              {" · "}
              <a href={siteHref(p.website)} target="_blank" rel="noreferrer" style={link}>
                website
              </a>
            </>
          ) : (
            <b style={pitch}> · No website — that&apos;s the pitch</b>
          )}
        </div>
        {p.notes ? (
          <button onClick={() => setOpen((v) => !v)} style={priorToggle}>
            {open ? "▾" : "▸"} {p.notes.split("\n").length} note
            {p.notes.split("\n").length === 1 ? "" : "s"} on this row
          </button>
        ) : null}
        {open && p.notes ? <div style={priorBody}>{p.notes}</div> : null}
        {open && p.raw.length ? <CellList rows={p.raw} /> : null}
      </div>

      {/* ── the dial ── */}
      <div style={dialCol}>
        {tel ? (
          <a href={tel} onClick={onDial} style={callBtn}>
            ☎ {p.phone}
          </a>
        ) : (
          <span style={noPhone}>no number</span>
        )}
        <input
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="What was said…"
          style={noteBox}
        />
      </div>

      {/* ── the outcome ── */}
      <div style={outCol}>
        <div style={outGrid}>
          {OUTCOMES.map((o) => {
            // ⚠️ THE WHOLE POINT OF THIS BLOCK. Steven: *"when I mark the four outcomes, let's have
            // the button change colors so I know where I'm at… I can't see any difference on the
            // actual cards."* The marked outcome goes SOLID; the rest go quiet. Read from the
            // sheet's Status, so it survives a reload and reflects a hand-edit too.
            const on = normaliseStatus(p.status) === o.key;
            return (
              <button
                key={o.key}
                onClick={() => onOutcome(o.key)}
                disabled={saving}
                style={{ ...outBtn, ...(on ? solid(o.tone) : faint(o.tone)) }}
                title={o.label}
              >
                {saving ? "…" : o.label}
              </button>
            );
          })}
        </div>

        {booking !== null ? (
          <div style={bookBox}>
            <input
              type="datetime-local"
              value={booking}
              onChange={(e) => onBook(e.target.value)}
              style={input}
            />
            <button onClick={onConfirmBook} disabled={!booking} style={primary}>
              Add to my calendar
            </button>
            <button onClick={onCancelBook} style={ghost}>
              Cancel
            </button>
          </div>
        ) : null}

        {p.status ? (
          <div style={stamp}>
            {labelFor(p.status)}
            {p.lastCalled ? ` · ${p.lastCalled}` : ""}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ n, cap, accent }: { n: number; cap: string; accent?: boolean }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ ...bigNum, color: accent ? "var(--e-accent)" : "var(--e-ink)" }}>{n}</div>
      <div style={numCap}>{cap}</div>
    </div>
  );
}

/**
 * A label/value table that CANNOT push the page sideways.
 *
 * ⚠️ THE DECK SHEET HOLDS A 394-CHARACTER URL (`location_reviews_link`). An unbroken string that
 * long has no wrap opportunity, so the row grew until the card overflowed and the whole page
 * scrolled horizontally. `minWidth: 0` on the flex child is the half everyone forgets — without it
 * a flex item refuses to shrink below its content and `overflowWrap` never gets a say.
 */
function CellList({ rows }: { rows: Cell[] }) {
  return (
    <ul style={extraList}>
      {rows.map((x, i) => (
        <li key={`${x.label}-${i}`} style={extraLi}>
          <span style={extraLab}>{x.label}</span>
          <span style={extraVal}>
            {/^https?:\/\//i.test(x.value) ? (
              <a href={x.value} target="_blank" rel="noreferrer" style={link}>
                {x.value}
              </a>
            ) : (
              x.value
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ── tone → colour. One table, so a row, a button and a stamp can never disagree. ─────────── */

const TONE: Record<string, { bg: string; line: string; ink: string; dot: string }> = {
  ok: { bg: "var(--e-ok-bg)", line: "var(--e-ok-line)", ink: "var(--e-ok-ink)", dot: "var(--e-ok-dot)" },
  bad: { bg: "var(--e-bad-bg)", line: "var(--e-bad-line)", ink: "var(--e-bad-ink)", dot: "var(--e-bad-dot)" },
  warn: { bg: "var(--e-warn-bg)", line: "var(--e-warn-line)", ink: "var(--e-warn-ink)", dot: "var(--e-warn-dot)" },
  info: { bg: "var(--e-info-bg)", line: "var(--e-info-line)", ink: "var(--e-info-ink)", dot: "var(--e-accent)" },
  none: { bg: "var(--e-none-bg)", line: "var(--e-none-line)", ink: "var(--e-muted)", dot: "var(--e-none-dot)" },
};

/** The row's own skin: a colour stripe down the left and a wash, once it has an outcome. */
function rowTone(tone: string): React.CSSProperties {
  if (!tone) return {};
  const t = TONE[tone] || TONE.none;
  return { background: t.bg, borderColor: t.line, borderLeft: `5px solid ${t.dot}` };
}

/** The outcome you picked. */
function solid(tone: string): React.CSSProperties {
  const t = TONE[tone] || TONE.none;
  return { background: t.dot, borderColor: t.dot, color: "#fff", fontWeight: 800 };
}

/** The ones you didn't — legible, but they must not compete with the one you did. */
function faint(tone: string): React.CSSProperties {
  const t = TONE[tone] || TONE.none;
  return { background: "var(--e-panel)", borderColor: "var(--e-line)", color: t.ink };
}

/* ── styles ───────────────────────────────────────────────────────────────────────────────── */

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
/* ⛔ NO max-width. Steven: *"let's use this real estate."* With the rail collapsed this is a
   1,500px canvas and the row is built to spend it — name on the left, dial in the middle,
   outcomes on the right, all on one line. The row wraps on a narrow window; it is not pretending
   to be a phone layout, and it does not need to be. */
const page: React.CSSProperties = { padding: "0 28px 120px", fontFamily: font };
const bar: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 5,
  background: "var(--e-bg)",
  borderBottom: "1px solid var(--e-line)",
  padding: "26px 0 14px",
  marginBottom: 18,
};
const barTop: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 };
const h1: React.CSSProperties = { fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 13.5, marginTop: 3 };
const bigNum: React.CSSProperties = { fontSize: 30, fontWeight: 800, lineHeight: 1 };
const numCap: React.CSSProperties = { fontSize: 10.5, color: "var(--e-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 3 };
const listRow: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 16 };
const pill: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 999, padding: "7px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: font };
const pillOn: React.CSSProperties = { borderColor: "var(--e-accent)", color: "var(--e-accent)", fontWeight: 800 };
const toggle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--e-muted)", marginLeft: 8, cursor: "pointer" };
const dropBtn: React.CSSProperties = { ...pill, marginLeft: "auto", color: "var(--e-muted)", fontWeight: 500 };
const addBox: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 16, background: "var(--e-panel-2)", marginBottom: 14 };
const addGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 12 };
const lab: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, color: "var(--e-ink)" };
const input: React.CSSProperties = { display: "block", width: "100%", marginTop: 5, border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 8, padding: "9px 11px", fontSize: 14, fontFamily: font, outline: "none" };
const primary: React.CSSProperties = { border: "1px solid var(--e-accent)", background: "var(--e-accent)", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" };
const ghost: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-muted)", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font };
const progress: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", margin: "0 0 12px" };

const rows: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };
const row: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start",
  gap: 18,
  border: "1px solid var(--e-line)",
  borderLeft: "5px solid var(--e-line)",
  borderRadius: 10,
  background: "var(--e-panel)",
  padding: "12px 16px",
};
/* flex 1 1 320px: the name column takes the slack on a wide screen and is the first to wrap. */
const who: React.CSSProperties = { flex: "1 1 320px", minWidth: 0 };
const whoTop: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" };
const num: React.CSSProperties = { fontSize: 11.5, color: "var(--e-muted)", fontVariantNumeric: "tabular-nums", minWidth: 26 };
const name: React.CSSProperties = { fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" };
const star: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "var(--e-ok-ink)" };
const metaDim: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)" };
const metaLine: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", marginTop: 3, overflowWrap: "anywhere" };
const pitch: React.CSSProperties = { color: "var(--e-ok-ink)" };
const priorToggle: React.CSSProperties = { marginTop: 6, background: "none", border: "none", padding: 0, fontSize: 12.5, color: "var(--e-accent)", cursor: "pointer", fontFamily: font };
const priorBody: React.CSSProperties = { marginTop: 6, fontSize: 12.5, whiteSpace: "pre-wrap", lineHeight: 1.5, color: "var(--e-ink)", background: "var(--e-panel-2)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "8px 10px" };

const dialCol: React.CSSProperties = { flex: "0 1 300px", display: "flex", flexDirection: "column", gap: 7, minWidth: 220 };
const callBtn: React.CSSProperties = { display: "block", textAlign: "center", background: "#16a34a", color: "#fff", borderRadius: 9, padding: "10px 14px", fontSize: 15.5, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" };
const noPhone: React.CSSProperties = { display: "block", textAlign: "center", borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 700, background: "var(--e-warn-bg)", border: "1px solid var(--e-warn-line)", color: "var(--e-warn-ink)" };
const noteBox: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 8, padding: "8px 10px", fontSize: 13.5, fontFamily: font, outline: "none" };

const outCol: React.CSSProperties = { flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 7, alignItems: "flex-end" };
const outGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, minmax(96px, 1fr))", gap: 6 };
const outBtn: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" };
const bookBox: React.CSSProperties = { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" };
const stamp: React.CSSProperties = { fontSize: 11.5, color: "var(--e-muted)", fontWeight: 600 };

const extraList: React.CSSProperties = { listStyle: "none", padding: 0, margin: "10px 0 0", borderTop: "1px solid var(--e-line-soft)" };
const extraLi: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5, padding: "5px 0", borderBottom: "1px solid var(--e-panel-2)", color: "var(--e-ink)" };
const extraLab: React.CSSProperties = { color: "var(--e-muted)", flex: "0 0 auto" };
const extraVal: React.CSSProperties = { minWidth: 0, overflowWrap: "anywhere", textAlign: "right" };

const link: React.CSSProperties = { color: "var(--e-accent)", textDecoration: "none" };
const muted: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 20 };
const errBox: React.CSSProperties = { marginBottom: 14, padding: "11px 14px", borderRadius: 10, background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-bad-ink)", fontSize: 14, lineHeight: 1.5 };
const okBox: React.CSSProperties = { marginBottom: 14, padding: "9px 14px", borderRadius: 10, background: "var(--e-ok-bg)", border: "1px solid var(--e-ok-line)", color: "var(--e-ok-ink)", fontSize: 13.5 };
const warnBox: React.CSSProperties = { marginBottom: 18, padding: "12px 14px", borderRadius: 10, background: "var(--e-warn-bg)", border: "1px solid var(--e-warn-line)", color: "var(--e-warn-ink)", fontSize: 14, lineHeight: 1.55 };
