"use client";
import { useScreenOrder } from "@/components/edit/useScreenOrder";
// Smart Links — one website's short links, made, renamed, re-pointed and deleted here.
// The dashboard only looks at them; this is where they are changed.
//
// The list is grouped by the text of the name before the first " - " ("Attention To Dollars -
// Introduction" sits under "Attention To Dollars"); a name without one goes under "Other". The
// dashboard groups the same way.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SmartLink = {
  slug: string;
  name: string;
  note: string;
  destination: string;
  clicks: number;
  clicks_7d: number;
  aliases?: string[];
};

// The part of the name after its folder, which is what a card shows (the folder is already the heading).
const nameIn = (name: string) => {
  const i = (name || "").indexOf(" - ");
  return i > 0 ? name.slice(i + 3).trim() : name;
};

const groupOf = (name: string) => {
  const i = (name || "").indexOf(" - ");
  const g = i > 0 ? name.slice(0, i).trim() : "";
  return g || "Other";
};

function Row({ link, origin, api, onChange }: { link: SmartLink; origin: string; api: string; onChange: () => void }) {
  const [dest, setDest] = useState(link.destination);
  const [name, setName] = useState(link.name);
  const [note, setNote] = useState(link.note);
  const [slug, setSlug] = useState(link.slug);
  const [msg, setMsg] = useState("");
  const url = `${origin}/go/${link.slug}`;
  const dirty = dest !== link.destination || name !== link.name || note !== link.note || slug !== link.slug;

  async function save() {
    if (!name.trim()) return setMsg("Give it a name");
    const r = await fetch(`/api/links/${encodeURIComponent(link.slug)}${api}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ destination: dest, name, note, new_slug: slug }),
    });
    if (r.ok) {
      setMsg("Saved");
      return onChange();
    }
    const e = await r.json().catch(() => ({}));
    setMsg(r.status === 409 ? "That short link is taken" : e.error || "Could not save");
  }
  async function del() {
    if (!confirm(`Delete ${url}?`)) return;
    const r = await fetch(`/api/links/${encodeURIComponent(link.slug)}${api}`, { method: "DELETE", credentials: "same-origin" });
    if (r.ok) onChange();
    else setMsg("Could not delete");
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Copied");
    } catch {
      setMsg("Copy failed");
    }
  }

  return (
    <div style={card}>
      <div style={rowTop}>
        <div style={cardName}>{nameIn(link.name) || link.slug}</div>
        <button type="button" style={navBtn} onClick={copy}>Copy</button>
      </div>
      <div style={{ ...hint, wordBreak: "break-all" }}>{url}</div>
      {link.note && <div style={hint}>{link.note}</div>}
      <div style={chipRow}>
        <span style={chip}>{link.clicks} clicks</span>
        <span style={chipMuted}>{link.clicks_7d} in the last 7 days</span>
      </div>
      <label style={lbl}>Name</label>
      <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
      <label style={lbl}>Where it is used (optional)</label>
      <input style={input} value={note} onChange={(e) => setNote(e.target.value)} />
      <label style={lbl}>Short link (after /go/)</label>
      <input style={input} value={slug} onChange={(e) => setSlug(e.target.value)} />
      {!!link.aliases?.length && (
        <div style={{ ...hint, wordBreak: "break-all" }}>also answers to {link.aliases.map((x) => `/go/${x}`).join(", ")}</div>
      )}
      <label style={lbl}>Goes to</label>
      <input style={input} value={dest} onChange={(e) => setDest(e.target.value)} />
      <div style={actions}>
        <button type="button" style={{ ...primaryBtn, opacity: dirty ? 1 : 0.5 }} onClick={save} disabled={!dirty}>Save</button>
        <button type="button" style={trashBtn} onClick={del}>Delete</button>
        {msg && <span style={saveState}>{msg}</span>}
      </div>
    </div>
  );
}

export default function LinksManager({
  title,
  siteId,
  origin,
  sites,
  extra = [],
}: {
  title: string;
  siteId: string;
  origin: string;
  sites: { id: string; name: string }[];
  /** Read-only sections the page adds (name, then rows of [label, address, note]). They move like any other. */
  extra?: { name: string; items: [string, string, string][] }[];
}) {
  const router = useRouter();
  const api = `?site=${encodeURIComponent(siteId)}`;
  const [links, setLinks] = useState<SmartLink[] | null>(null);
  const [err, setErr] = useState("");
  const [nm, setNm] = useState("");
  const [nt, setNt] = useState("");
  const [slug, setSlug] = useState("");
  const [dest, setDest] = useState("");

  async function load() {
    try {
      const r = await fetch(`/api/links${api}`, { cache: "no-store", credentials: "same-origin" });
      if (r.ok) {
        setErr("");
        setLinks(await r.json());
      } else {
        const e = await r.json().catch(() => ({}));
        setLinks([]);
        setErr(e.error || "Could not load links");
      }
    } catch {
      setLinks([]);
      setErr("Could not load links");
    }
  }
  useEffect(() => {
    setLinks(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  async function add() {
    setErr("");
    const r = await fetch(`/api/links${api}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ slug: slug.trim(), destination: dest.trim(), name: nm.trim(), note: nt.trim() }),
    });
    if (r.ok) {
      setNm("");
      setNt("");
      setSlug("");
      setDest("");
      load();
    } else {
      setErr("Could not add. Use letters, numbers and dashes for the short link.");
    }
  }

  const groups = useMemo(() => {
    const out: { name: string; links: SmartLink[] }[] = [];
    for (const l of Array.isArray(links) ? links : []) {
      const g = groupOf(l.name);
      (out.find((x) => x.name === g) || out[out.push({ name: g, links: [] }) - 1]).links.push(l);
    }
    // THE ORDER OF THE SECTIONS (Steven, 2026-10-04): social media first, then the book, then everything else,
    // "just like a long scrolling web page", each section under its own divider. A link with no heading of
    // its own (no " - " in the name) is filed under "Other links" so it does not become a one-card section.
    // FOLDERS (Steven, 2026-10-08): the links are filed in a handful of folders so the list does not get out
    // of hand: Social Media, Skool, Podcast, Book Buyers, Website Visitors. A folder is the text before " - ".
    const ORDER = ["social media", "skool", "podcast", "book buyers", "website visitors"];
    const rank = (n: string) => (n === "Other links" ? 99 : ORDER.indexOf(n.toLowerCase()) >= 0 ? ORDER.indexOf(n.toLowerCase()) : 50);
    const filed: { name: string; links: SmartLink[] }[] = [];
    for (const g of out) {
      const solo = g.links.length === 1 && g.links[0].name === g.name;
      const name = solo ? "Other links" : g.name;
      (filed.find((x) => x.name === name) || filed[filed.push({ name, links: [] }) - 1]).links.push(...g.links);
    }
    return filed.sort((x, y) => rank(x.name) - rank(y.name) || x.name.localeCompare(y.name));
  }, [links]);

  // Every section on this screen, link groups and the rest alike, in the order he put them (see useScreenOrder).
  const names = useMemo(() => [...groups.map((g) => g.name), "Add a link", ...extra.map((e) => e.name)], [groups, extra]);
  const { ordered, hasLine, Bar } = useScreenOrder("links", siteId, names);
  const shell = (name: string): React.CSSProperties => ({ borderTop: hasLine(name) && !folder ? "2px solid var(--e-line)" : "none", marginTop: folder ? 0 : 36, paddingTop: 4 });
  // THE FOLDER LIST down the left side. "" is every folder at once, the long page it used to be.
  const [folder, setFolder] = useState("");
  const shown = folder && ordered.includes(folder) ? [folder] : ordered;
  const countOf = (name: string) => groups.find((g) => g.name === name)?.links.length;
  const total = groups.reduce((n, g) => n + g.links.length, 0);

  return (
    <div style={page}>
      <div style={head}>
        <div>
          <h1 style={h1}>{title}</h1>
          <div style={sub}>Short links you can hand out. Every click is counted.</div>
        </div>
        {sites.length > 1 && (
          <div>
            <label style={lbl}>Website</label>
            <select style={input} value={siteId} onChange={(e) => router.push(`/edit/links?site=${encodeURIComponent(e.target.value)}`)}>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {err && <div style={errBox}>{err}</div>}
      {links === null && <div style={empty}>Loading...</div>}
      {links !== null && !groups.length && !err && <div style={empty}>No links yet. Add the first one below.</div>}

      <div style={split}>
      <nav style={side} aria-label="Folders">
        <button type="button" style={sideBtn(!folder)} onClick={() => setFolder("")}><span>All links</span><span style={sideNum}>{total}</span></button>
        {ordered.map((name) => (
          <button key={name} type="button" style={sideBtn(folder === name)} onClick={() => setFolder(name)}>
            <span>{name}</span>{countOf(name) !== undefined && <span style={sideNum}>{countOf(name)}</span>}
          </button>
        ))}
      </nav>
      <div style={{ flex: 1, minWidth: 0 }}>
      {shown.map((name) => {
        const g = groups.find((x) => x.name === name);
        const x = extra.find((e) => e.name === name);
        return (
          <section key={name} style={shell(name)}>
            <h2 style={h2}>{name}<Bar name={name} /></h2>
            {g && (
              <div style={grid}>
                {g.links.map((l) => (
                  <Row key={l.slug + l.name + l.destination + l.note} link={l} origin={origin} api={api} onChange={load} />
                ))}
              </div>
            )}
            {x && (
              <div style={{ marginTop: 10 }}>
                {x.items.map(([label, href, why]) => (
                  <div key={href} style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline", padding: "12px 0", borderTop: "1px solid var(--e-line)" }}>
                    <a style={{ fontWeight: 700, color: "var(--e-ink-strong)", textDecoration: "underline" }} href={href} target="_blank" rel="noopener">{label}</a>
                    <span style={{ color: "var(--e-muted)", fontSize: 13.5 }}>{why}</span>
                  </div>
                ))}
              </div>
            )}
            {name === "Add a link" && (
              <>
      <div style={{ ...card, maxWidth: 520 }}>
        <label style={lbl}>Name</label>
        <input style={input} value={nm} onChange={(e) => setNm(e.target.value)} placeholder="Social Media - Pinterest" />
        <div style={hint}>Start the name with a folder and " - " to file it there: Social Media, Skool, Podcast, Book Buyers or Website Visitors.</div>
        <label style={lbl}>Where it is used (optional)</label>
        <input style={input} value={nt} onChange={(e) => setNt(e.target.value)} />
        <label style={lbl}>Short link (after /go/)</label>
        <input style={input} value={slug} onChange={(e) => setSlug(e.target.value)} />
        <label style={lbl}>Goes to</label>
        <input style={input} value={dest} onChange={(e) => setDest(e.target.value)} placeholder="https://" />
        <div style={actions}>
          <button type="button" style={{ ...primaryBtn, opacity: nm.trim() && slug.trim() && dest.trim() ? 1 : 0.5 }} onClick={add} disabled={!nm.trim() || !slug.trim() || !dest.trim()}>Add</button>
        </div>
      </div>
              </>
            )}
          </section>
        );
      })}
      </div>
      </div>
    </div>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const split: React.CSSProperties = { display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap", marginTop: 8 };
const side: React.CSSProperties = { flex: "0 0 220px", position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 4, marginTop: 36 };
const sideBtn = (on: boolean): React.CSSProperties => ({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, textAlign: "left", width: "100%", border: "1px solid " + (on ? "var(--e-ink)" : "transparent"), background: on ? "var(--e-panel)" : "transparent", color: "var(--e-ink-strong)", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontWeight: on ? 700 : 600, cursor: "pointer", fontFamily: font });
const sideNum: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--e-muted)", background: "var(--e-line-soft)", borderRadius: 999, padding: "2px 8px" };
const page: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: "40px 24px 80px", fontFamily: font };
const head: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 };
const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, margin: "32px 0 0", color: "var(--e-ink-strong)" };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16, marginTop: 14 };
const card: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 4, background: "var(--e-panel)", marginTop: 14 };
const rowTop: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 };
const cardName: React.CSSProperties = { fontSize: 17, fontWeight: 700, lineHeight: 1.25 };
const chipRow: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0 8px" };
const chip: React.CSSProperties = { fontSize: 11, fontWeight: 700, background: "var(--e-info-bg)", color: "var(--e-info-ink)", borderRadius: 999, padding: "3px 9px" };
const chipMuted: React.CSSProperties = { ...chip, background: "var(--e-line-soft)", color: "var(--e-muted)" };
const primaryBtn: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const navBtn: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "8px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
const trashBtn: React.CSSProperties = { ...navBtn, padding: "10px 16px", color: "var(--e-danger)" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, margin: "8px 0 5px", color: "var(--e-ink)" };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "8px 11px", fontSize: 14, outline: "none", fontFamily: font, background: "var(--e-panel)", color: "var(--e-ink)" };
const hint: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", marginTop: 3 };
const saveState: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", fontWeight: 600 };
const actions: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 };
const errBox: React.CSSProperties = { background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginTop: 16 };
const empty: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 24 };
