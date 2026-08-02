"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { NavDoc, NavEntry } from "@/lib/editNav";

// THE BACK-OFFICE SHELL.
//
// ── WHY ───────────────────────────────────────────────────────────────────────────────────────
// /edit grew as a pile of standalone full-width pages, each with its own "← All websites" link and
// a row of nav buttons that existed on the gallery and nowhere else. That works at two clients on a
// big screen. It does not work at fifteen on a 13" laptop, and on a phone in the field it does not
// work at all — which is the canvas Steven actually operates under.
//
// The cockpit already solved this, so this is its Shell.js ported: a fixed rail on desktop that
// collapses to hand back the whole canvas, a slide-in drawer plus bottom tabs on the phone. Same
// breakpoint (820px), same collapse-preference trick, so the two surfaces feel like one system.
//
// ── THE MENU IS DATA, AND THE PENCIL IS THE POINT ─────────────────────────────────────────────
// Every label here — the brand, the section headings, each item — is stored, renameable and
// draggable. The hrefs are NOT: they come from lib/editNav.ts, keyed, and no amount of typing in
// this component can move one. Rename "Invoices" to whatever you like; it still goes to
// /edit/invoices. See the law at the top of lib/editNav.ts.
//
// ⛔ TWO ROUTES RENDER BARE — see BARE below. A layout under app/edit wraps EVERYTHING beneath it,
// including places a second navigation rail would be actively wrong, so the exclusion lives here.
const COLLAPSE_KEY = "sjc-edit-sidebar-collapsed";
const THEME_KEY = "sjc-edit-theme";

/**
 * Routes that get NO chrome at all.
 *
 *  1. The page builder owns the full canvas and ships its own left and right panels. A third rail
 *     fights it for the same pixels on the screen where pixels are scarcest.
 *  2. A customer's invoice PDF. InvoicePrint already isolates the sheet, but the surest way for
 *     app chrome never to reach a customer's document is for it never to render.
 */
function isBare(pathname: string): boolean {
  if (/^\/edit\/invoices\/[^/]+\/print\/?$/.test(pathname)) return true;
  const m = pathname.match(/^\/edit\/([^/]+)\/([^/]+)\/?$/);
  if (!m) return false;
  const [, site, page] = m;
  // ⚠️ These are real sections, not site ids. Everything else in that shape is the builder.
  // Keys, not labels — renaming "The board" must not turn the board into the page editor.
  const SECTIONS = ["board", "forms", "invoices", "brand", "import"];
  return !SECTIONS.includes(site) && page !== "settings";
}

// The phone's thumb row. Fixed and NOT renameable on purpose: four targets is all a thumb row can
// hold, and it is the one surface where a long custom label breaks the layout outright.
const TABS = [
  { href: "/edit", label: "Websites" },
  { href: "/edit/board", label: "Board" },
  { href: "/edit/invoices", label: "Invoices" },
  { href: "/edit/forms", label: "Forms" },
];

export default function EditShell({ nav, children }: { nav: NavDoc; children: React.ReactNode }) {
  const pathname = usePathname() || "/edit";
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop rail hidden
  const [dark, setDark] = useState(false);

  const [editing, setEditing] = useState(false);
  const [doc, setDoc] = useState<NavDoc>(nav);
  const [saveErr, setSaveErr] = useState("");
  const dragRef = useRef<number | null>(null);
  const liveRef = useRef<NavEntry[]>(nav.entries);
  const listRef = useRef<HTMLDivElement>(null);

  // Both preferences are restored AFTER the first render, deliberately. Reading localStorage during
  // render makes the server's HTML and the browser's first pass disagree, and React throws away the
  // whole tree over it — the same hydration trap the cockpit's Shell.js sidesteps the same way.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved === "dark") setDark(true);
      else if (saved === "light") setDark(false);
      // No stored choice yet: follow the machine. Steven never has to set it to get the right one.
      else setDark(window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
    } catch {
      /* no storage — defaults are fine */
    }
  }, []);

  // The drawer must close on navigation or it covers the page you just asked for.
  useEffect(() => setOpen(false), [pathname]);

  if (isBare(pathname)) return <>{children}</>;

  const persist = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* non-fatal: the preference just doesn't survive the reload */
    }
  };

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      persist(COLLAPSE_KEY, !v ? "1" : "0");
      return !v;
    });

  const toggleTheme = () =>
    setDark((v) => {
      persist(THEME_KEY, !v ? "dark" : "light");
      return !v;
    });

  // "/edit" must match exactly — startsWith would light up Websites on every page in the app.
  const active = (href: string) =>
    href === "/edit" ? pathname === "/edit" : pathname.startsWith(href);

  // ── saving ──────────────────────────────────────────────────────────────────────────────────
  function save(next: NavDoc) {
    setSaveErr("");
    fetch("/api/edit-nav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(next),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok) setSaveErr("That didn't save — a reload will put the menu back as it was.");
      })
      .catch(() => setSaveErr("That didn't save — a reload will put the menu back as it was."));
  }

  function setEntries(entries: NavEntry[]) {
    liveRef.current = entries;
    const next = { ...doc, entries };
    setDoc(next);
    return next;
  }

  function relabel(i: number, label: string) {
    const entries = liveRef.current.map((e, n) => (n === i ? { ...e, label } : e));
    setEntries(entries);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= liveRef.current.length || from === to) return null;
    const entries = [...liveRef.current];
    const [row] = entries.splice(from, 1);
    entries.splice(to, 0, row);
    return setEntries(entries);
  }

  // ⚠️ Drag state in a ref, not state: a pointermove can land in the same task as its pointerdown
  // (a fast flick, or a synthetic event) and a closure reading state would still see null and throw
  // the move away. Same fix as the board roster — see the note in app/edit/board/Roster.tsx.
  function onPointerDown(e: React.PointerEvent, i: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = i;
  }

  function onPointerMove(e: React.PointerEvent) {
    const from = dragRef.current;
    if (from === null || !listRef.current) return;
    const kids = Array.from(listRef.current.children) as HTMLElement[];
    const to = kids.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (to >= 0 && to !== from) {
      move(from, to);
      dragRef.current = to;
    }
  }

  function onPointerUp() {
    if (dragRef.current === null) return;
    dragRef.current = null;
    save({ ...doc, entries: liveRef.current });
  }

  async function signOut() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      /* ignore — the reload re-checks auth either way */
    }
    window.location.href = "/edit";
  }

  async function reset() {
    if (!window.confirm("Put every name and the order back the way it shipped?")) return;
    await fetch("/api/edit-nav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ reset: true }),
    });
    window.location.reload();
  }

  return (
    <div
      className={`edit-shell${collapsed ? " is-collapsed" : ""}`}
      data-theme={dark ? "dark" : "light"}
    >
      <div className="edit-topbar">
        <button className="edit-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          ☰
        </button>
        <span className="edit-topbar-title">{doc.brand}</span>
      </div>

      <button
        className="edit-side-reopen"
        onClick={toggleCollapsed}
        aria-label="Show menu"
        title="Show menu"
      >
        »
      </button>

      <aside className={`edit-sidebar${open ? " is-open" : ""}`}>
        <div className="edit-side-head">
          {editing ? (
            <input
              className="edit-nav-input is-brand"
              value={doc.brand}
              placeholder="Name this place"
              onChange={(e) => setDoc({ ...doc, brand: e.target.value })}
              onBlur={() => save(doc)}
            />
          ) : (
            <span className="edit-side-brand">{doc.brand}</span>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={`edit-side-collapse${editing ? " is-on" : ""}`}
              onClick={() => {
                if (editing) save(doc);
                setEditing((v) => !v);
              }}
              aria-label={editing ? "Done renaming" : "Rename and reorder the menu"}
              title={editing ? "Done" : "Rename and reorder the menu"}
            >
              {editing ? "✓" : "✎"}
            </button>
            <button
              className="edit-theme-toggle"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light" : "Switch to dark"}
              title={dark ? "Switch to light" : "Switch to dark"}
            >
              {dark ? "☀" : "☾"}
            </button>
            <button
              className="edit-side-collapse"
              onClick={toggleCollapsed}
              aria-label="Collapse menu"
              title="Collapse menu — give the canvas the full screen"
            >
              «
            </button>
          </div>
        </div>

        {saveErr && <p className="edit-nav-error">{saveErr}</p>}

        {editing && (
          <p className="edit-nav-hint">
            Rename anything. Drag a row — past a heading to move it into that group. Where each one
            goes never changes.
          </p>
        )}

        <div ref={listRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          {doc.entries.map((e, i) =>
            editing ? (
              <div key={`${e.type}:${e.key}`} className="edit-nav-row">
                <span
                  className="edit-nav-grip"
                  onPointerDown={(ev) => onPointerDown(ev, i)}
                  title="Drag to move"
                  aria-label="Drag to move"
                >
                  ⋮⋮
                </span>
                <input
                  className={`edit-nav-input${e.type === "section" ? " is-section" : ""}`}
                  value={e.label}
                  placeholder={e.type === "section" ? "Group heading" : "Name"}
                  onChange={(ev) => relabel(i, ev.target.value)}
                  onBlur={() => save({ ...doc, entries: liveRef.current })}
                />
                <span className="edit-nav-nudge">
                  <button type="button" onClick={() => { const n = move(i, i - 1); if (n) save(n); }} aria-label="Move up">▲</button>
                  <button type="button" onClick={() => { const n = move(i, i + 1); if (n) save(n); }} aria-label="Move down">▼</button>
                </span>
              </div>
            ) : e.type === "section" ? (
              // An emptied heading disappears rather than leaving a blank gap — that is how you
              // delete a group without a delete button that could strip its items too.
              e.label.trim() ? (
                <div key={`s:${e.key}`} className="edit-side-section">{e.label}</div>
              ) : null
            ) : (
              <a
                key={`i:${e.key}`}
                href={e.href}
                className={`edit-side-link${active(e.href) ? " is-active" : ""}`}
              >
                {e.label}
              </a>
            )
          )}
        </div>

        {editing && (
          <div className="edit-nav-extra">
            <div className="edit-side-section">The board&apos;s shared row</div>
            <input
              className="edit-nav-input"
              value={doc.mainline.title}
              placeholder="Title"
              onChange={(ev) => setDoc({ ...doc, mainline: { ...doc.mainline, title: ev.target.value } })}
              onBlur={() => save(doc)}
            />
            <input
              className="edit-nav-input"
              value={doc.mainline.subtitle}
              placeholder="The line underneath"
              onChange={(ev) => setDoc({ ...doc, mainline: { ...doc.mainline, subtitle: ev.target.value } })}
              onBlur={() => save(doc)}
            />
            <button type="button" className="edit-side-link edit-nav-reset" onClick={reset}>
              Put every name back
            </button>
          </div>
        )}

        <div className="edit-side-foot">
          <button type="button" className="edit-side-link" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      {open && <div className="edit-scrim" onClick={() => setOpen(false)} />}

      <div className="edit-content">{children}</div>

      <nav className="edit-tabs">
        {TABS.map((t) => (
          <a key={t.href} href={t.href} className={active(t.href) ? "is-active" : ""}>
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
