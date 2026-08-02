"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
// ⛔ TWO ROUTES RENDER BARE — see BARE below. A layout under app/edit wraps EVERYTHING beneath it,
// including places a second navigation rail would be actively wrong, so the exclusion has to live
// here. A pathname check rather than a route-group reshuffle: one line to change, no files moved.
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
  // /edit/<site>/<page> — three segments after /edit. Deliberately NOT matching /edit/<site> or
  // /edit/<site>/settings, which are ordinary pages and do want the rail.
  const m = pathname.match(/^\/edit\/([^/]+)\/([^/]+)\/?$/);
  if (!m) return false;
  const [, site, page] = m;
  // These are real sections, not site ids. Everything else in that shape is the builder.
  const SECTIONS = ["board", "forms", "invoices", "brand", "import"];
  return !SECTIONS.includes(site) && page !== "settings";
}

type Item = { href: string; label: string };

const NAV: { section?: string; items: Item[] }[] = [
  { items: [{ href: "/edit", label: "Websites" }] },
  { section: "Watch", items: [{ href: "/edit/board", label: "The board" }] },
  { section: "Money", items: [{ href: "/edit/invoices", label: "Invoices" }] },
  {
    section: "Library",
    items: [
      { href: "/edit/forms", label: "Forms" },
      { href: "/edit/brand", label: "Brand" },
      { href: "/edit/import", label: "Import a design" },
    ],
  },
];

// The phone's thumb row. Four, because five stops being tappable — the same four Steven opens.
const TABS: Item[] = [
  { href: "/edit", label: "Websites" },
  { href: "/edit/board", label: "Board" },
  { href: "/edit/invoices", label: "Invoices" },
  { href: "/edit/forms", label: "Forms" },
];

export default function EditShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/edit";
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop rail hidden
  const [dark, setDark] = useState(false);

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

  const link = (it: Item) => (
    <a
      key={it.href}
      href={it.href}
      className={`edit-side-link${active(it.href) ? " is-active" : ""}`}
    >
      {it.label}
    </a>
  );

  async function signOut() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      /* ignore — the reload re-checks auth either way */
    }
    window.location.href = "/edit";
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
        <span className="edit-topbar-title">SJC Studio</span>
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
          <span className="edit-side-brand">SJC Studio</span>
          <div style={{ display: "flex", gap: 6 }}>
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

        {NAV.map((group, i) => (
          <div key={group.section || `g${i}`}>
            {group.section && <div className="edit-side-section">{group.section}</div>}
            {group.items.map(link)}
          </div>
        ))}

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
