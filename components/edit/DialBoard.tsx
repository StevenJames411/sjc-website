"use client";
// THE DIAL BOARD — the whole sheet as a wall of cards, dialled through his own iPhone.
//
// ── WHAT IT REPLACES ──────────────────────────────────────────────────────────────────────────
// Steven read a row off a Google Sheet, keyed ten digits into the Mac Phone app by hand, talked,
// clicked back into the sheet, typed the note by hand, then scrolled to find where he was — with
// SiteDrop's Lead Finder open in a third tab to see the business. This is all three.
//
// ── ⛔ WHY EVERY BUSINESS RENDERS, NOT ONE AT A TIME ──────────────────────────────────────────
// The first version showed one business and advanced — the shape every power dialer uses. Steven
// killed it: *"I just want to be able to scroll the whole page. I don't want to have to toggle one
// business at a time to look at what's on my sheet."* This is not a call-centre queue being fed to
// an agent; it is HIS sheet, and he decides what to work next. Done cards stay visible and go
// quiet rather than disappearing.
//
// ── THE THREE THINGS THAT MUST NOT BREAK ──────────────────────────────────────────────────────
//  1. A note must never land on the wrong business — every write carries the name the board thinks
//     is on that row, and the script re-finds it if the sheet was sorted underneath.
//  2. The sheet stays the database. Nothing here caches a prospect; a reload re-reads the sheet.
//  3. Sheet order is the default. His deck tab is "San Antonio — Neediest First"; the only thing
//     allowed to re-order it is a choice he makes on screen. See sortFor() in lib/dialShared.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  activeMs,
  clock,
  count,
  countDial,
  isPaused,
  pause,
  resume,
  startSession,
  toRow,
  type Session,
} from "@/lib/dialSession";
import {
  DEFAULT_FILTERS,
  OUTCOMES,
  applyFilters,
  calendarHref,
  filterCounts,
  isDefaultFilters,
  labelFor,
  normaliseStatus,
  pitchLine,
  prettyWhen,
  siteHref,
  sortFor,
  telHref,
  toneFor,
  type CallList,
  type Cell,
  type Filters,
  type Prospect,
  type Sort,
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
  const [dials, setDials] = useState(0);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [booking, setBooking] = useState<{ row: number; when: string } | null>(null);
  /**
   * Rows saved in the last few seconds.
   *
   * ⛔ THE SAVE WAS INVISIBLE, AND AN INVISIBLE SAVE READS AS A BROKEN ONE. Steven: *"I now see a
   * save button, but it didn't save anywhere."* It had saved — the write returned
   * `wrote: ["Notes"]` — but all three signals were wrong: the input cleared (looks like the text
   * was thrown away), the confirmation flashed at the TOP of a page he was scrolled down inside,
   * and the note itself landed in a COLLAPSED block. Nothing changed where he was looking.
   *
   * So the card now says so itself, and opens to show the note that just landed.
   */
  const [justSaved, setJustSaved] = useState<Record<number, boolean>>({});

  /**
   * The calling session. ⛔ PAGE STATE ON PURPOSE — closing the tab must END it, not resume it
   * later: *"if I forget to end the session and I just close the window, I want it to end the
   * session."* A clock that outlives the page is a clock that runs all night.
   */
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  /**
   * ⚠️ `tick` IS NOT DEAD CODE — it is the whole reason the clock moves. Elapsed time is DERIVED
   * from `startedAt` on every render rather than stored, so nothing can drift; this state exists
   * only to cause a render once a second. Deleting it freezes the display while the session keeps
   * running, which is worse than no clock.
   */
  const [tick, setTick] = useState(0);
  void tick;

  // One interval for the whole page, and only while a session is actually running.
  useEffect(() => {
    if (!session || isPaused(session)) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [session]);

  const endSession = useCallback(
    (s: Session, endedAt: number, beacon: boolean) => {
      const payload = JSON.stringify({ session: toRow(s, endedAt) });
      if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        // ⚠️ THE ONLY THING THAT WORKS ON THE WAY OUT. A fetch started in `beforeunload` is killed
        // with the page; sendBeacon is handed to the browser to deliver after we are gone. It sends
        // a Blob with no custom headers, which is why the route parses text rather than JSON.
        navigator.sendBeacon("/api/dial/session", new Blob([payload], { type: "text/plain" }));
        return;
      }
      void fetch("/api/dial/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      })
        .then((r) => r.json())
        .then((b) => {
          setFlash(b?.ok ? `Session logged · ${clock(activeMs(s, endedAt))} worked` : b?.error || "Couldn't log the session.");
          setTimeout(() => setFlash(""), 3000);
        })
        .catch(() => setErr("Couldn't reach the sheet — the session wasn't logged."));
    },
    []
  );

  /** ⛔ Closing the tab ENDS the session. Not "pauses", not "resumes later". */
  useEffect(() => {
    const out = () => {
      const s = sessionRef.current;
      if (s) endSession(s, Date.now(), true);
    };
    window.addEventListener("pagehide", out);
    return () => window.removeEventListener("pagehide", out);
  }, [endSession]);

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
        // Filters belong to a list, not to the page — carrying "no website" across to a sheet with
        // different columns shows him an empty screen he did not ask for.
        setFilters(DEFAULT_FILTERS);
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

  /** Rows with text typed and not yet written. Drives both guards below. */
  const unsaved = useMemo(() => Object.values(notes).filter((v) => v.trim()).length, [notes]);

  /**
   * ⚠️ DON'T LET A TYPED NOTE DIE QUIETLY. He writes these mid-call, which is exactly when he is
   * least likely to notice one vanish. The browser guard covers a closed tab or a reload; the
   * list-switch guard below covers the click that actually loses them most often.
   */
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  function switchList(id: string) {
    if (id === activeId) return;
    if (
      unsaved &&
      !window.confirm(
        `You have ${unsaved} note${unsaved === 1 ? "" : "s"} typed but not saved. Switching lists will lose ${unsaved === 1 ? "it" : "them"}.`
      )
    ) {
      return;
    }
    setActiveId(id);
  }

  const all = useMemo(() => data?.prospects || [], [data]);
  const counts = useMemo(() => filterCounts(all), [all]);
  const shown = useMemo(() => applyFilters(all, filters), [all, filters]);
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  /**
   * Write to a row.
   *
   * ⛔ `outcome` IS OPTIONAL, AND THAT IS THE WHOLE POINT. Steven typed "call me tomorrow" into a
   * card and had no way to save it — the note only ever reached the sheet as a passenger on an
   * outcome click, so a note written while a prospect was still talking could be lost by clicking
   * anywhere else. A note-only write already worked server-side (`logCall_` writes Status only
   * `if (body.outcome)`); nothing but the button was missing.
   *
   * ⚠️ A note-only save must NOT colour the card or count as worked. Writing something down is not
   * an outcome, and a card that turns green because he took a note would be lying to him about
   * what he has already dealt with.
   */
  async function log(p: Prospect, outcome?: string, extra?: { callbackAt?: string }) {
    if (!activeId) return;
    setSaving(p.row);
    setErr("");
    const note = (notes[p.row] || "").trim();
    if (!outcome && !note) return setSaving(null);
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
        // screen, or the card goes green over a write that never landed.
        setErr(b.error || "The sheet refused that write.");
        return;
      }
      setData((d) =>
        d
          ? {
              ...d,
              prospects: d.prospects.map((x) =>
                x.row === b.row
                  ? {
                      ...x,
                      // Status and lastCalled only move when there WAS an outcome.
                      status: outcome ?? x.status,
                      lastCalled: outcome ? b.at : x.lastCalled,
                      notes: [x.notes, `${b.at} — ${outcome || "note"}${note ? `: ${note}` : ""}`]
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
      setFlash(outcome ? `${p.name} → ${labelFor(outcome)}` : `Note saved to ${p.name}`);
      setTimeout(() => setFlash(""), 2200);
      // Tell the CARD, not just the top of the page.
      setJustSaved((s) => ({ ...s, [p.row]: true }));
      setTimeout(() => setJustSaved((s) => ({ ...s, [p.row]: false })), 4000);
      // Outcomes feed the session row. A note-only save just keeps the session alive.
      setSession((cur) => (cur ? (outcome ? count(cur, outcome, Date.now()) : cur) : cur));
    } catch {
      setErr("Couldn't reach the sheet — nothing was written.");
    } finally {
      setSaving(null);
    }
  }

  function bookCallback(p: Prospect) {
    if (!booking || booking.row !== p.row || !booking.when) return;
    const href = calendarHref({
      name: p.name,
      phone: p.phone,
      when: booking.when,
      note: (notes[p.row] || "").trim(),
    });
    // ⚠️ OPENED SYNCHRONOUSLY, INSIDE THE CLICK. Both Safari and Chrome block a window.open that
    // happens after an await — the popup loses its user-gesture. Book first, log second.
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
      <div style={bar}>
        {/* ⛔ NO SUBTITLE. It explained what the page is, once, to the only person who will ever
            open it — and then cost a line of vertical space on every session forever. Steven:
            *"I don't need the words explaining what the sheet is because that's taking up a line
            item that doesn't need to be there."* The header is title + counters, one line. */}
        {/* ⛔ TWO ROWS, NOT FOUR, AND NOTHING REMOVED. Steven, twice: *"I hate how much real estate
            we're taking up for the data that it's giving me. I don't want less data, I just want
            it organised better and take up less vertical height."* Title, lists and counters share
            row one; every filter shares row two. */}
        <div style={barTop}>
          <h1 style={h1}>{title}</h1>
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => switchList(l.id)}
              style={l.id === activeId ? { ...pill, ...pillOn } : pill}
            >
              {l.name}
            </button>
          ))}
          <button onClick={() => setAdding((v) => !v)} style={{ ...pill, borderStyle: "dashed" }} title="Add a list">
            +
          </button>
          {activeId ? (
            <button
              onClick={() => void dropList(activeId)}
              style={dropBtn}
              title="Take this list off the board — the sheet is untouched"
            >
              Remove
            </button>
          ) : null}
          <div style={{ display: "flex", gap: 14, marginLeft: "auto", alignItems: "center" }}>
            {/* ── the session clock ────────────────────────────────────────────────────────── */}
            {session ? (
              <>
                <span
                  style={{ ...clockFace, ...(isPaused(session) ? clockPaused : null) }}
                  title={isPaused(session) ? "Paused" : "Session running"}
                >
                  {clock(activeMs(session, Date.now()))}
                  {isPaused(session) ? " ⏸" : ""}
                </span>
                <button
                  onClick={() =>
                    setSession((s) => (s ? (isPaused(s) ? resume(s, Date.now()) : pause(s, Date.now())) : s))
                  }
                  style={ghost}
                >
                  {isPaused(session) ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={() => {
                    endSession(session, Date.now(), false);
                    setSession(null);
                  }}
                  style={endBtn}
                >
                  End
                </button>
              </>
            ) : (
              <button
                onClick={() => setSession(startSession(Date.now(), data?.list.name || ""))}
                style={primary}
                title="Start the clock — it logs to your ops sheet when you end it"
              >
                ▶ Start session
              </button>
            )}
            <Stat n={session?.dials ?? dials} cap="dials" accent />
            <Stat n={counts.done} cap="worked" />
            <Stat n={counts.todo} cap="left" />
          </div>
        </div>

        {data ? (
          <div style={filterRow}>
            {/* ⛔ THE PITCH TOGGLE. Not "who is worth calling" — WHICH SCRIPT AM I RUNNING.
                ⚠️ The chips used to read "No website — sell the site (27)". That label is what
                forced the whole bar onto a second and third line, and it was redundant: the pitch
                script is printed on EVERY CARD, which is where he reads it mid-call. The chip only
                has to name the segment. Same information, one row back. */}
            <Seg
              value={filters.pitch}
              onChange={(pitch) => set({ pitch: pitch as Filters["pitch"], sort: null })}
              options={[
                { v: "all", label: `All (${counts.total})` },
                { v: "site", label: `No website (${counts.site})` },
                { v: "reviews", label: `Has a website (${counts.reviews})` },
              ]}
            />
            <Seg
              value={filters.work}
              onChange={(work) => set({ work: work as Filters["work"] })}
              options={[
                { v: "all", label: "All" },
                { v: "todo", label: `To do (${counts.todo})` },
                { v: "done", label: `Worked (${counts.done})` },
              ]}
            />

            {/* Labels folded into the options, so each control is one element wide, not two. */}
            <select
              value={filters.minRating}
              onChange={(e) => set({ minRating: Number(e.target.value) })}
              style={sel}
              title="Minimum rating"
            >
              {[0, 3, 3.5, 4, 4.5, 5].map((n) => (
                <option key={n} value={n}>{n ? `${n}★+` : "any ★"}</option>
              ))}
            </select>
            <select
              value={filters.minReviews}
              onChange={(e) => set({ minReviews: Number(e.target.value) })}
              style={sel}
              title="Minimum review count"
            >
              {[0, 5, 10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n ? `${n}+ reviews` : "any reviews"}</option>
              ))}
            </select>
            <label style={mini} title={counts.noPhone ? `${counts.noPhone} rows have no number` : ""}>
              <input
                type="checkbox"
                checked={filters.phoneOnly}
                onChange={(e) => set({ phoneOnly: e.target.checked })}
              />
              has a number
            </label>
            <select
              value={sortFor(filters)}
              onChange={(e) => set({ sort: e.target.value as Sort })}
              style={sel}
              title="Sort"
            >
              <option value="sheet">sheet order</option>
              <option value="fewest-reviews">fewest reviews</option>
              <option value="most-reviews">most reviews</option>
              <option value="rating">highest rated</option>
            </select>
            <input
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Find a business…"
              style={search}
            />
            {!isDefaultFilters(filters) ? (
              <button onClick={() => setFilters(DEFAULT_FILTERS)} style={clearBtn}>
                Clear
              </button>
            ) : null}

            {/* Folded up out of its own line. It belongs next to the controls that change it. */}
            <span style={progress}>
              <b>{shown.length}</b> of {counts.total} ·{" "}
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
            </span>
          </div>
        ) : null}
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
          <div style={grid}>
            {shown.map((p, i) => (
              <Card
                key={p.row}
                p={p}
                n={i + 1}
                note={notes[p.row] || ""}
                onNote={(v) => setNotes((s) => ({ ...s, [p.row]: v }))}
                saving={saving === p.row}
                justSaved={Boolean(justSaved[p.row])}
                booking={booking?.row === p.row ? booking.when : null}
                onBook={(when) => setBooking({ row: p.row, when })}
                onCancelBook={() => setBooking(null)}
                onConfirmBook={() => bookCallback(p)}
                onDial={() => {
                  setDials((n) => n + 1);
                  setSession((s) => (s ? countDial(s, Date.now()) : s));
                }}
                onSaveNote={() => void log(p)}
                onOutcome={(o) =>
                  o === "callback" ? setBooking({ row: p.row, when: "" }) : void log(p, o)
                }
              />
            ))}
          </div>

          {!shown.length ? (
            <p style={muted}>
              Nothing matches. <button onClick={() => setFilters(DEFAULT_FILTERS)} style={linkBtn}>Clear the filters</button> to
              see all {counts.total}.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/* ── one business ─────────────────────────────────────────────────────────────────────────── */

function Card({
  p,
  n,
  note,
  onNote,
  saving,
  justSaved,
  booking,
  onBook,
  onCancelBook,
  onConfirmBook,
  onOutcome,
  onSaveNote,
  onDial,
}: {
  p: Prospect;
  n: number;
  note: string;
  onNote: (v: string) => void;
  saving: boolean;
  justSaved: boolean;
  booking: string | null;
  onBook: (when: string) => void;
  onCancelBook: () => void;
  onConfirmBook: () => void;
  onOutcome: (key: string) => void;
  onSaveNote: () => void;
  onDial: () => void;
}) {
  const [open, setOpen] = useState(false);
  const tone = toneFor(p.status);
  const tel = telHref(p.phone);
  const pitch = pitchLine(p);

  // Open the notes block the moment something lands in it, so the save is visible where he is
  // looking instead of two seconds of banner at the top of the page.
  useEffect(() => {
    if (justSaved) setOpen(true);
  }, [justSaved]);

  return (
    <div style={{ ...card, ...cardTone(tone) }}>
      <div style={cardHead}>
        <span style={num}>{n}</span>
        <span style={name}>{p.name || "(no name on this row)"}</span>
      </div>
      <div style={metaLine}>
        {p.rating ? <b style={star}>★ {p.rating}</b> : null}
        {p.reviews ? <span> ({p.reviews})</span> : null}
        {p.category ? <span> · {p.category}</span> : null}
      </div>
      {p.address ? <div style={metaLine}>{p.address}</div> : null}

      {/* ⛔ The pitch line follows the MODE, and speaks to both halves of the list. */}
      <div style={pitch.tone === "site" ? pitchSite : pitchReviews}>{pitch.text}</div>

      {tel ? (
        <a href={tel} onClick={onDial} style={callBtn}>
          ☎ {p.phone}
        </a>
      ) : (
        <span style={noPhone}>no number on this row</span>
      )}

      {/* The two links he opens before dialling. Both were already in the sheet. */}
      {p.maps || p.reviewsUrl || p.website ? (
        <div style={linkRow}>
          {p.maps ? (
            <a href={p.maps} target="_blank" rel="noreferrer" style={linkBtnSm}>
              🗺 Maps
            </a>
          ) : null}
          {p.reviewsUrl ? (
            <a href={p.reviewsUrl} target="_blank" rel="noreferrer" style={linkBtnSm}>
              ★ Reviews
            </a>
          ) : null}
          {p.website ? (
            <a href={siteHref(p.website)} target="_blank" rel="noreferrer" style={linkBtnSm}>
              ↗ Site
            </a>
          ) : null}
        </div>
      ) : null}

      {/* ⛔ THE SAVE BUTTON ONLY EXISTS WHEN THERE IS SOMETHING TO SAVE, so an empty card stays as
          short as it was and a card with a typed note is visibly unfinished. Enter saves too —
          he is on the phone, not reaching for a mouse. */}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={note}
          onChange={(e) => onNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && note.trim()) onSaveNote();
          }}
          placeholder="What was said…"
          style={noteBox}
        />
        {note.trim() ? (
          <button onClick={onSaveNote} disabled={saving} style={saveNoteBtn} title="Save to the sheet — this does not set an outcome">
            {saving ? "…" : "Save"}
          </button>
        ) : justSaved ? (
          <span style={savedTick}>✓ Saved</span>
        ) : null}
      </div>

      <div style={outGrid}>
        {OUTCOMES.map((o) => {
          // ⚠️ Read from the sheet's Status, so it survives a reload AND reflects a hand-edit.
          const on = normaliseStatus(p.status) === o.key;
          return (
            <button
              key={o.key}
              onClick={() => onOutcome(o.key)}
              disabled={saving}
              style={{ ...outBtn, ...(on ? solid(o.tone) : faint(o.tone)) }}
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
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onConfirmBook} disabled={!booking} style={primary}>
              Add to my calendar
            </button>
            <button onClick={onCancelBook} style={ghost}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div style={cardFoot}>
        {p.status ? (
          <span style={stamp}>
            {labelFor(p.status)}
            {p.lastCalled ? ` · ${p.lastCalled}` : ""}
          </span>
        ) : (
          <span />
        )}
        {p.notes || p.raw.length ? (
          <button onClick={() => setOpen((v) => !v)} style={linkBtn}>
            {open ? "▾ less" : `▸ ${p.notes ? "on the sheet" : "details"}`}
          </button>
        ) : null}
      </div>

      {/* ⚠️ LABELLED, because it sits inches from the box he TYPES into and the two looked like the
          same thing. This is what is already written down; that is what he is writing now. */}
      {open && p.notes ? (
        <div style={priorBody}>
          <div style={priorCap}>Already on the sheet</div>
          {p.notes}
        </div>
      ) : null}
      {open && p.raw.length ? <CellList rows={p.raw} /> : null}
    </div>
  );
}

function Seg({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; label: string }[];
}) {
  return (
    <div style={seg}>
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={o.v === value ? { ...segBtn, ...segOn } : segBtn}
        >
          {o.label}
        </button>
      ))}
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
 * ⚠️ THE DECK SHEET HOLDS A 394-CHARACTER URL. `minWidth: 0` on the flex child is the half everyone
 * forgets — without it a flex item refuses to shrink below its content and `overflowWrap` never
 * gets a say, and the card pushes the whole page sideways.
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

/* ── tone → colour. One table, so a card, a button and a stamp can never disagree. ─────────── */

const TONE: Record<string, { bg: string; line: string; ink: string; dot: string }> = {
  ok: { bg: "var(--e-ok-bg)", line: "var(--e-ok-line)", ink: "var(--e-ok-ink)", dot: "var(--e-ok-dot)" },
  bad: { bg: "var(--e-bad-bg)", line: "var(--e-bad-line)", ink: "var(--e-bad-ink)", dot: "var(--e-bad-dot)" },
  warn: { bg: "var(--e-warn-bg)", line: "var(--e-warn-line)", ink: "var(--e-warn-ink)", dot: "var(--e-warn-dot)" },
  info: { bg: "var(--e-info-bg)", line: "var(--e-info-line)", ink: "var(--e-info-ink)", dot: "var(--e-accent)" },
  none: { bg: "var(--e-none-bg)", line: "var(--e-none-line)", ink: "var(--e-muted)", dot: "var(--e-none-dot)" },
};

function cardTone(tone: string): React.CSSProperties {
  if (!tone) return {};
  const t = TONE[tone] || TONE.none;
  return { background: t.bg, borderColor: t.line, borderTop: `4px solid ${t.dot}` };
}
function solid(tone: string): React.CSSProperties {
  const t = TONE[tone] || TONE.none;
  return { background: t.dot, borderColor: t.dot, color: "#fff", fontWeight: 800 };
}
function faint(tone: string): React.CSSProperties {
  const t = TONE[tone] || TONE.none;
  return { background: "var(--e-panel)", borderColor: "var(--e-line)", color: t.ink };
}

/* ── styles ───────────────────────────────────────────────────────────────────────────────── */

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
/* ⚠️ `padding-top: 0` IS DELIBERATE AND IT ONLY WORKS BECAUSE THE BAR IS STICKY. The shell gives
   the canvas no top padding of its own, so the header sits flush against the top of the viewport
   and the first row of cards is ~150px higher than it was. Every pixel above the fold on this page
   is a business he can see without scrolling. */
const page: React.CSSProperties = { padding: "0 24px 120px", fontFamily: font };
const bar: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 5,
  background: "var(--e-bg)",
  borderBottom: "1px solid var(--e-line)",
  padding: "12px 0 9px",
  marginBottom: 12,
};
/* Wraps rather than overflows: on a narrow window the counters drop to their own line instead of
   the list pills being pushed off the edge where he can't reach them. */
const barTop: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const h1: React.CSSProperties = { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 };
const bigNum: React.CSSProperties = { fontSize: 22, fontWeight: 800, lineHeight: 1 };
const numCap: React.CSSProperties = { fontSize: 9.5, color: "var(--e-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 };
const filterRow: React.CSSProperties = { display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--e-line-soft)" };
const pill: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 999, padding: "7px 14px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: font };
const pillOn: React.CSSProperties = { borderColor: "var(--e-accent)", color: "var(--e-accent)", fontWeight: 800 };
const dropBtn: React.CSSProperties = { ...pill, marginLeft: "auto", color: "var(--e-muted)", fontWeight: 500 };
const seg: React.CSSProperties = { display: "inline-flex", border: "1px solid var(--e-line)", borderRadius: 8, overflow: "hidden" };
const segBtn: React.CSSProperties = { border: "none", borderRight: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-muted)", padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" };
const segOn: React.CSSProperties = { background: "var(--e-accent)", color: "#fff", fontWeight: 800 };
const mini: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--e-muted)" };
const sel: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 7, padding: "5px 7px", fontSize: 12.5, fontFamily: font };
const search: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 8, padding: "7px 11px", fontSize: 13, fontFamily: font, outline: "none", minWidth: 170 };
const clearBtn: React.CSSProperties = { border: "1px solid var(--e-accent)", background: "none", color: "var(--e-accent)", borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: font };
const addBox: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 16, background: "var(--e-panel-2)", marginBottom: 14 };
const addGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 12 };
const lab: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, color: "var(--e-ink)" };
const input: React.CSSProperties = { display: "block", width: "100%", border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-ink)", borderRadius: 8, padding: "8px 10px", fontSize: 13.5, fontFamily: font, outline: "none" };
const primary: React.CSSProperties = { border: "1px solid var(--e-accent)", background: "var(--e-accent)", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" };
const ghost: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", color: "var(--e-muted)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font };
/* marginLeft:auto pushes it to the far right of the filter row, so it reads as a result rather
   than as another control. */
const progress: React.CSSProperties = { fontSize: 12, color: "var(--e-muted)", marginLeft: "auto" };

/* ⛔ THE WHOLE LAYOUT DECISION, IN ONE LINE. Steven: *"when I get rid of our left sidebar on my
   laptop, that's plenty of canvas for three columns. If I want to use my iPad, it would probably
   just default to two columns and a phone would default to one."* auto-fill + a 400px floor does
   exactly that with no media queries: ~1456px collapsed → 3, ~1224 with the rail → 3, iPad
   landscape ~892 → 2, phone (rail auto-hides under 820) → 1.
   ⚠️ THE FLOOR IS 400 AND NOT 320 ON PURPOSE. Six outcome buttons three-across need ~120px each to
   hold "Left voicemail"; tighter and a cramped *Not interested* sits beside *Callback*, and that
   misclick costs a real prospect. */
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 12, alignItems: "start" };
const card: React.CSSProperties = { border: "1px solid var(--e-line)", borderTop: "4px solid var(--e-line)", borderRadius: 12, background: "var(--e-panel)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 7 };
const cardHead: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: 8 };
const num: React.CSSProperties = { fontSize: 11.5, color: "var(--e-muted)", fontVariantNumeric: "tabular-nums" };
const name: React.CSSProperties = { fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em", overflowWrap: "anywhere" };
const star: React.CSSProperties = { color: "var(--e-ok-ink)" };
const metaLine: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", overflowWrap: "anywhere" };
const pitchSite: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "var(--e-ok-ink)", background: "var(--e-ok-bg)", border: "1px solid var(--e-ok-line)", borderRadius: 7, padding: "6px 9px" };
const pitchReviews: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "var(--e-info-ink)", background: "var(--e-info-bg)", border: "1px solid var(--e-info-line)", borderRadius: 7, padding: "6px 9px" };
const callBtn: React.CSSProperties = { display: "block", textAlign: "center", background: "#16a34a", color: "#fff", borderRadius: 9, padding: "11px 14px", fontSize: 16, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" };
const noPhone: React.CSSProperties = { display: "block", textAlign: "center", borderRadius: 9, padding: "11px 14px", fontSize: 13, fontWeight: 700, background: "var(--e-warn-bg)", border: "1px solid var(--e-warn-line)", color: "var(--e-warn-ink)" };
const linkRow: React.CSSProperties = { display: "flex", gap: 6 };
const linkBtnSm: React.CSSProperties = { flex: 1, textAlign: "center", border: "1px solid var(--e-line)", background: "var(--e-panel-2)", color: "var(--e-ink)", borderRadius: 7, padding: "6px 8px", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" };
const noteBox: React.CSSProperties = { ...input, flex: 1, minWidth: 0 };
/* Green, because it writes to the sheet — same promise as the Call button, not a neutral control. */
const saveNoteBtn: React.CSSProperties = { flex: "0 0 auto", border: "1px solid #16a34a", background: "#16a34a", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: font };
/* Sits where the Save button was, so the eye that just clicked lands on the confirmation. */
const savedTick: React.CSSProperties = { flex: "0 0 auto", display: "flex", alignItems: "center", padding: "0 8px", fontSize: 12.5, fontWeight: 800, color: "var(--e-ok-ink)", whiteSpace: "nowrap" };
/* Tabular numerals so the seconds ticking doesn't shuffle the buttons beside it every second. */
const clockFace: React.CSSProperties = { fontSize: 19, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--e-ok-ink)", minWidth: 62, textAlign: "right" };
const clockPaused: React.CSSProperties = { color: "var(--e-warn-ink)" };
const endBtn: React.CSSProperties = { border: "1px solid var(--e-bad-line)", background: "var(--e-bad-bg)", color: "var(--e-bad-ink)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font };
const priorCap: React.CSSProperties = { fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--e-muted)", fontWeight: 700, marginBottom: 4 };
const outGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 };
const outBtn: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 7, padding: "8px 4px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const bookBox: React.CSSProperties = { display: "grid", gap: 6, border: "1px solid var(--e-warn-line)", background: "var(--e-warn-bg)", borderRadius: 8, padding: 8 };
const cardFoot: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 };
const stamp: React.CSSProperties = { fontSize: 11.5, color: "var(--e-muted)", fontWeight: 600 };
const linkBtn: React.CSSProperties = { background: "none", border: "none", padding: 0, fontSize: 12, color: "var(--e-accent)", cursor: "pointer", fontFamily: font };
const priorBody: React.CSSProperties = { fontSize: 12.5, whiteSpace: "pre-wrap", lineHeight: 1.5, color: "var(--e-ink)", background: "var(--e-panel-2)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "8px 10px" };
const extraList: React.CSSProperties = { listStyle: "none", padding: 0, margin: 0, borderTop: "1px solid var(--e-line-soft)" };
const extraLi: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--e-panel-2)", color: "var(--e-ink)" };
const extraLab: React.CSSProperties = { color: "var(--e-muted)", flex: "0 0 auto" };
const extraVal: React.CSSProperties = { minWidth: 0, overflowWrap: "anywhere", textAlign: "right" };
const link: React.CSSProperties = { color: "var(--e-accent)", textDecoration: "none" };
const muted: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 20 };
const errBox: React.CSSProperties = { marginBottom: 14, padding: "11px 14px", borderRadius: 10, background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-bad-ink)", fontSize: 14, lineHeight: 1.5 };
const okBox: React.CSSProperties = { marginBottom: 14, padding: "9px 14px", borderRadius: 10, background: "var(--e-ok-bg)", border: "1px solid var(--e-ok-line)", color: "var(--e-ok-ink)", fontSize: 13.5 };
const warnBox: React.CSSProperties = { marginBottom: 18, padding: "12px 14px", borderRadius: 10, background: "var(--e-warn-bg)", border: "1px solid var(--e-warn-line)", color: "var(--e-warn-ink)", fontSize: 14, lineHeight: 1.55 };
