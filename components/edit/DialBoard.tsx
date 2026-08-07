"use client";
// THE DIAL BOARD — one prospect on screen, a Call button, six outcomes, and the next one.
//
// ── WHAT IT REPLACES ──────────────────────────────────────────────────────────────────────────
// Steven read a row off a Google Sheet, keyed ten digits into the Mac Phone app by hand, talked,
// clicked back into the sheet, typed the note by hand, then scrolled to find where he was. Every
// one of those steps is a place to lose your place at 40 dials an hour.
//
// ── WHAT THE COMPETITOR GOT RIGHT AND WRONG (Targetley, looked at 2026-08-07) ────────────────
// Right: one contact at a time, big outcome buttons, a skip, a counter. Same shape as this.
// Wrong, and it is the whole reason this exists: there is nowhere to TYPE what was said, and its
// "Callback Later" only paints a tag on a card in its own database — it never touches a calendar.
// A dialer you cannot write in and cannot book from is a demo of a dialer.
//
// ── THE TWO THINGS THAT MUST NOT BREAK ────────────────────────────────────────────────────────
//  1. A note must never land on the wrong business. Every write carries the name the board thinks
//     is on that row and the script re-finds the business if the sheet has been sorted underneath.
//  2. The sheet stays the database. Nothing here caches a prospect; a reload re-reads the sheet.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  OUTCOMES,
  calendarHref,
  isDone,
  prettyWhen,
  siteHref,
  telHref,
  type CallList,
  type Prospect,
} from "@/lib/dialShared";

type Loaded = {
  list: CallList;
  title: string;
  tab: string;
  tabs: string[];
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

  /** Where we are in the queue. Reset whenever the list changes. */
  const [at, setAt] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState<string>("");
  /** Dials made since this page was opened — the session counter, and nothing more than that. */
  const [dials, setDials] = useState(0);
  const [booking, setBooking] = useState(false);
  const [when, setWhen] = useState("");
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState("");

  const noteRef = useRef<HTMLTextAreaElement>(null);

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
        setAt(0);
        setNote("");
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

  /**
   * The queue: everyone not yet dealt with, in sheet order.
   *
   * ⚠️ ROWS ALREADY MARKED SOLD OR NOT-INTERESTED ARE OUT, everything else is in — including a
   * "no answer" from yesterday, which is a call to make again, not a closed door. Filtering those
   * out too was the obvious first version and it silently retires a prospect after one unanswered
   * ring.
   */
  const queue = useMemo(() => (data?.prospects || []).filter((p) => !isDone(p)), [data]);
  const current = queue[at];

  const counts = useMemo(() => {
    const all = data?.prospects || [];
    return { total: all.length, left: queue.length, done: all.length - queue.length };
  }, [data, queue]);

  function advance() {
    setNote("");
    setBooking(false);
    setWhen("");
    setAt((i) => Math.min(i + 1, Math.max(queue.length - 1, 0)));
  }

  async function log(outcome: string, extra?: { callbackAt?: string }) {
    if (!current || !activeId) return;
    setSaving(outcome);
    setErr("");
    try {
      const r = await fetch("/api/dial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeId,
          row: current.row,
          expectName: current.name,
          outcome,
          note: note.trim() || undefined,
          callbackAt: extra?.callbackAt,
        }),
      });
      const b = await r.json();
      if (!b.ok) {
        // A refused write is the safety net doing its job — say what happened and DO NOT advance,
        // or the outcome is lost and he never learns the row moved.
        setErr(b.error || "The sheet refused that write.");
        return;
      }

      // Patch the row in place rather than re-reading the whole sheet: a re-read mid-session would
      // re-sort the queue under him and change which business is on screen.
      setData((d) =>
        d
          ? {
              ...d,
              prospects: d.prospects.map((p) =>
                p.row === b.row
                  ? { ...p, status: outcome, lastCalled: b.at, notes: p.notes }
                  : p
              ),
            }
          : d
      );
      setFlash(`Saved to row ${b.row}`);
      setTimeout(() => setFlash(""), 2200);
      advance();
    } catch {
      setErr("Couldn't reach the sheet — nothing was written.");
    } finally {
      setSaving("");
    }
  }

  /** Callback: book it, then log it. The calendar tab opens on the click, never after an await. */
  function bookCallback() {
    if (!current || !when) return;
    const href = calendarHref({
      name: current.name,
      phone: current.phone,
      when,
      note: note.trim(),
    });
    // ⚠️ OPENED SYNCHRONOUSLY, INSIDE THE CLICK. Safari and Chrome both block a window.open that
    // happens after an await — the popup loses its user-gesture. Booking first and logging second
    // is not a preference, it is the only order that works.
    if (href) window.open(href, "_blank", "noopener");
    void log("callback", { callbackAt: prettyWhen(when) });
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
      <div style={head}>
        <div>
          <h1 style={h1}>{title}</h1>
          <p style={sub}>
            Your sheet is still the boss. This just stops you keying digits and typing notes.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={bigNum}>{dials}</div>
          <div style={numCap}>dials this session</div>
        </div>
      </div>

      {!configured ? (
        <p style={warnBox}>
          <b>The sheets connection isn&apos;t switched on.</b> `SHEETS_WEBHOOK_URL` and
          `SHEETS_SECRET` need to be set before this page can read anything.
        </p>
      ) : null}

      {/* ── which list ─────────────────────────────────────────────────────────────────── */}
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
        {activeId ? (
          <button onClick={() => void dropList(activeId)} style={dropBtn} title="Take this list off the board — the sheet is untouched">
            Remove
          </button>
        ) : null}
      </div>

      {adding ? (
        <form onSubmit={addList} style={addBox}>
          <div style={addGrid}>
            <label style={lab}>
              What do you call it
              <input name="name" placeholder="Austin pet groomers" style={input} required />
            </label>
            <label style={lab}>
              Paste the Google Sheet link
              <input name="paste" placeholder="https://docs.google.com/spreadsheets/d/…" style={input} required />
            </label>
            <label style={lab}>
              Tab <span style={{ color: "var(--e-muted)", fontWeight: 400 }}>(blank = the first one)</span>
              <input name="tab" placeholder="Austin-Pet-Groomers" style={input} />
            </label>
          </div>
          <button type="submit" style={primary}>Add it</button>
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
            <b>{counts.left}</b> to call · {counts.done} done · {counts.total} on the sheet
            {data.truncated ? " (first 2,000 rows)" : ""} · reading{" "}
            <a href={`https://docs.google.com/spreadsheets/d/${data.list.spreadsheetId}`} target="_blank" rel="noreferrer" style={link}>
              {data.title}
            </a>
            {data.tab ? ` → ${data.tab}` : ""}
          </p>

          {!current ? (
            <div style={card}>
              <h2 style={cardName}>That&apos;s the list.</h2>
              <p style={cardDesc}>
                Every business on this sheet is either sold or marked not interested. Add another
                list, or open the sheet and clear a status to bring someone back.
              </p>
            </div>
          ) : (
            <div style={card}>
              <div style={badgeRow}>
                <span style={chip}>
                  {at + 1} of {queue.length}
                </span>
                {current.rating ? <span style={okChip}>★ {current.rating}</span> : null}
                {current.reviews ? <span style={infoChip}>{current.reviews} reviews</span> : null}
                {current.claimed ? <span style={chip}>Claimed: {current.claimed}</span> : null}
                {current.status ? <span style={warnChip}>{current.status}</span> : null}
              </div>

              <h2 style={cardName}>{current.name || "(no name on this row)"}</h2>
              {current.category || current.address ? (
                <p style={cardDesc}>
                  {[current.category, current.address].filter(Boolean).join(" · ")}
                </p>
              ) : null}

              {current.website ? (
                <p style={{ margin: "8px 0 0" }}>
                  <a href={siteHref(current.website)} target="_blank" rel="noreferrer" style={link}>
                    {current.website}
                  </a>
                </p>
              ) : (
                <p style={{ ...cardDesc, color: "var(--e-ok-ink)", fontWeight: 600 }}>
                  No website — that&apos;s the pitch.
                </p>
              )}

              {/* ── the dialer ──────────────────────────────────────────────────────────── */}
              {telHref(current.phone) ? (
                <a
                  href={telHref(current.phone)}
                  onClick={() => setDials((n) => n + 1)}
                  style={callBtn}
                >
                  ☎ Call {current.phone}
                </a>
              ) : (
                <p style={noPhone}>No phone number on this row — skip it or find one.</p>
              )}

              {current.notes ? (
                <div style={priorBox}>
                  <div style={priorCap}>Already on this row</div>
                  <div style={priorBody}>{current.notes}</div>
                </div>
              ) : null}

              <textarea
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What was said. This appends to the Notes cell — it never overwrites what's there."
                style={noteBox}
                rows={3}
              />

              {/* ── the outcomes ────────────────────────────────────────────────────────── */}
              <div style={outGrid}>
                {OUTCOMES.map((o) =>
                  o.key === "callback" ? (
                    <button
                      key={o.key}
                      onClick={() => setBooking((v) => !v)}
                      style={{ ...outBtn, ...toneStyle(o.tone), ...(booking ? ringed : null) }}
                    >
                      {o.label}
                    </button>
                  ) : (
                    <button
                      key={o.key}
                      onClick={() => void log(o.key)}
                      disabled={Boolean(saving)}
                      style={{ ...outBtn, ...toneStyle(o.tone) }}
                    >
                      {saving === o.key ? "Saving…" : o.label}
                    </button>
                  )
                )}
              </div>

              {booking ? (
                <div style={bookBox}>
                  <label style={lab}>
                    When should you call back?
                    <input
                      type="datetime-local"
                      value={when}
                      onChange={(e) => setWhen(e.target.value)}
                      style={input}
                    />
                  </label>
                  <button onClick={bookCallback} disabled={!when} style={primary}>
                    Put it on my calendar
                  </button>
                  <p style={bookHint}>
                    Opens a prefilled Google Calendar event with her name, number and your note —
                    you hit Save. The sheet gets the date too.
                  </p>
                </div>
              ) : null}

              <div style={cardFoot}>
                <button onClick={advance} style={ghost}>
                  Skip — don&apos;t log anything
                </button>
                <button onClick={() => setAt((i) => Math.max(i - 1, 0))} disabled={at === 0} style={ghost}>
                  ← Back
                </button>
              </div>

              {current.extra.length ? <CellList rows={current.extra} /> : null}

              {/* Past the sheet's own "— full data →" marker: 100+ columns of scrape. Collapsed,
                  because it is reference material, not something you read before dialling. */}
              {current.raw.length ? (
                <details style={rawBox}>
                  <summary style={rawSummary}>
                    Everything else on this row ({current.raw.length})
                  </summary>
                  <CellList rows={current.raw} />
                </details>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

/**
 * A label/value table that CANNOT push the page sideways.
 *
 * ⚠️ THE DECK SHEET HOLDS A 394-CHARACTER URL (`location_reviews_link`). An unbroken string that
 * long has no wrap opportunity, so the row grew until the card overflowed its container and the
 * whole page scrolled horizontally. `minWidth: 0` on the flex child is the half everyone forgets —
 * without it a flex item refuses to shrink below its content and `overflowWrap` never gets a say.
 *
 * A value that is a URL becomes a link, because the ones long enough to cause the problem are
 * exactly the ones worth clicking (the Maps listing, the reviews page).
 */
function CellList({ rows }: { rows: { label: string; value: string }[] }) {
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

function toneStyle(tone: string): React.CSSProperties {
  if (tone === "ok") return { background: "var(--e-ok-bg)", borderColor: "var(--e-ok-line)", color: "var(--e-ok-ink)", fontWeight: 800 };
  if (tone === "bad") return { background: "var(--e-bad-bg)", borderColor: "var(--e-bad-line)", color: "var(--e-bad-ink)" };
  if (tone === "warn") return { background: "var(--e-warn-bg)", borderColor: "var(--e-warn-line)", color: "var(--e-warn-ink)" };
  if (tone === "info") return { background: "var(--e-info-bg)", borderColor: "var(--e-info-line)", color: "var(--e-info-ink)" };
  return {};
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const page: React.CSSProperties = { maxWidth: 780, margin: "0 auto", padding: "32px 24px 100px", fontFamily: font };
const head: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const bigNum: React.CSSProperties = { fontSize: 34, fontWeight: 800, lineHeight: 1, color: "var(--e-accent)" };
const numCap: React.CSSProperties = { fontSize: 11.5, color: "var(--e-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 };
const listRow: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", margin: "22px 0 0" };
const pill: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 999, padding: "7px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: font };
const pillOn: React.CSSProperties = { borderColor: "var(--e-accent)", color: "var(--e-accent)", fontWeight: 800 };
const dropBtn: React.CSSProperties = { ...pill, marginLeft: "auto", color: "var(--e-muted)", fontWeight: 500 };
const addBox: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 16, background: "var(--e-panel-2)", marginTop: 14 };
const addGrid: React.CSSProperties = { display: "grid", gap: 12, marginBottom: 12 };
const lab: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, color: "var(--e-ink)" };
const input: React.CSSProperties = { display: "block", width: "100%", marginTop: 5, border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 8, padding: "9px 11px", fontSize: 14, fontFamily: font, outline: "none" };
const primary: React.CSSProperties = { border: "1px solid var(--e-accent)", background: "var(--e-accent)", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: font };
const ghost: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-muted)", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font };
const progress: React.CSSProperties = { fontSize: 13.5, color: "var(--e-muted)", margin: "20px 0 12px" };
const card: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 14, padding: 24, background: "var(--e-panel)" };
const badgeRow: React.CSSProperties = { display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" };
const chip: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", background: "var(--e-line-soft)", color: "var(--e-muted)", borderRadius: 999, padding: "4px 10px" };
const okChip: React.CSSProperties = { ...chip, background: "var(--e-ok-bg)", color: "var(--e-ok-ink)" };
const infoChip: React.CSSProperties = { ...chip, background: "var(--e-info-bg)", color: "var(--e-info-ink)" };
const warnChip: React.CSSProperties = { ...chip, background: "var(--e-warn-bg)", color: "var(--e-warn-ink)" };
const cardName: React.CSSProperties = { fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" };
const cardDesc: React.CSSProperties = { fontSize: 14.5, color: "var(--e-muted)", margin: "6px 0 0", lineHeight: 1.5 };
const link: React.CSSProperties = { color: "var(--e-accent)", textDecoration: "none", fontSize: 14 };
const callBtn: React.CSSProperties = { display: "block", textAlign: "center", marginTop: 18, background: "#16a34a", color: "#fff", borderRadius: 12, padding: "16px 20px", fontSize: 19, fontWeight: 800, textDecoration: "none", letterSpacing: "-0.01em" };
const noPhone: React.CSSProperties = { marginTop: 18, padding: "14px 16px", borderRadius: 10, background: "var(--e-warn-bg)", border: "1px solid var(--e-warn-line)", color: "var(--e-warn-ink)", fontSize: 14, fontWeight: 600 };
const priorBox: React.CSSProperties = { marginTop: 16, border: "1px solid var(--e-line)", borderRadius: 10, background: "var(--e-panel-2)", padding: "10px 12px" };
const priorCap: React.CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--e-muted)", fontWeight: 700, marginBottom: 4 };
const priorBody: React.CSSProperties = { fontSize: 13.5, whiteSpace: "pre-wrap", lineHeight: 1.5, color: "var(--e-ink)" };
const noteBox: React.CSSProperties = { width: "100%", marginTop: 16, border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 10, padding: "11px 12px", fontSize: 14.5, fontFamily: font, lineHeight: 1.5, outline: "none", resize: "vertical" };
const outGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginTop: 14 };
const outBtn: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel-2)", color: "var(--e-ink)", borderRadius: 10, padding: "13px 12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: font };
const ringed: React.CSSProperties = { outline: "2px solid var(--e-accent)", outlineOffset: 1 };
const bookBox: React.CSSProperties = { marginTop: 12, border: "1px solid var(--e-warn-line)", background: "var(--e-warn-bg)", borderRadius: 10, padding: 14, display: "grid", gap: 10 };
const bookHint: React.CSSProperties = { fontSize: 12.5, color: "var(--e-warn-ink)", margin: 0, lineHeight: 1.5 };
const cardFoot: React.CSSProperties = { display: "flex", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--e-line-soft)" };
const extraList: React.CSSProperties = { listStyle: "none", padding: 0, margin: "16px 0 0", borderTop: "1px solid var(--e-line-soft)" };
const extraLi: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--e-panel-2)", color: "var(--e-ink)" };
/* flex: 0 0 auto so a long value can never squeeze the label to nothing. */
const extraLab: React.CSSProperties = { color: "var(--e-muted)", flex: "0 0 auto" };
/* The two lines that stop a 394-character URL from widening the page — see CellList. */
const extraVal: React.CSSProperties = { minWidth: 0, overflowWrap: "anywhere", textAlign: "right" };
const rawBox: React.CSSProperties = { marginTop: 16, borderTop: "1px solid var(--e-line-soft)", paddingTop: 12 };
const rawSummary: React.CSSProperties = { cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--e-muted)", listStyle: "revert" };
const muted: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 20 };
const errBox: React.CSSProperties = { marginTop: 14, padding: "11px 14px", borderRadius: 10, background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-bad-ink)", fontSize: 14, lineHeight: 1.5 };
const okBox: React.CSSProperties = { marginTop: 14, padding: "9px 14px", borderRadius: 10, background: "var(--e-ok-bg)", border: "1px solid var(--e-ok-line)", color: "var(--e-ok-ink)", fontSize: 13.5 };
const warnBox: React.CSSProperties = { marginTop: 18, padding: "12px 14px", borderRadius: 10, background: "var(--e-warn-bg)", border: "1px solid var(--e-warn-line)", color: "var(--e-warn-ink)", fontSize: 14, lineHeight: 1.55 };
