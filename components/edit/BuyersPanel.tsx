"use client";
// BOOK BUYERS, BY NAME: who bought, the pages they opened on the website, and the taps on the links inside their
// own signature copy (lib/bookBuyers.ts). Shown inside the Book Buyers folder of Smart Links.
import { useEffect, useState } from "react";

type Buyer = {
  code: string; name: string; email: string; bought: string;
  views: { at: string; path: string }[];
  taps: { at: string; link: string; own: boolean; device: string; country: string }[];
};

const day = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function BuyersPanel() {
  const [buyers, setBuyers] = useState<Buyer[] | null>(null);
  const [open, setOpen] = useState("");
  useEffect(() => {
    fetch("/api/buyers", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { buyers: [] }))
      .then((j) => setBuyers(j.buyers || []))
      .catch(() => setBuyers([]));
  }, []);
  return (
    <div style={{ marginTop: 26 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--e-ink-strong)", margin: 0 }}>The buyers, by name</h3>
      <div style={hint}>Pages each buyer opened on your website, and taps on the links inside their own copy of the book and study guides.</div>
      {buyers === null && <div style={hint}>Loading...</div>}
      {buyers !== null && !buyers.length && <div style={{ ...hint, marginTop: 10 }}>No buyers yet. The first sale shows up here.</div>}
      {(buyers || []).map((b) => {
        const away = b.taps.filter((t) => !t.own).length;
        const on = open === b.code;
        return (
          <div key={b.code} style={card}>
            <button type="button" style={row} onClick={() => setOpen(on ? "" : b.code)}>
              <span>
                <b style={{ fontSize: 16 }}>{b.name || b.email}</b>
                <span style={{ ...hint, display: "block" }}>{b.name ? b.email + " · " : ""}bought {day(b.bought)}</span>
              </span>
              <span style={chips}>
                <span style={chip}>{b.views.length} pages opened</span>
                <span style={chip}>{b.taps.length} taps from their copy</span>
                {away > 0 && <span style={{ ...chip, background: "var(--e-bad-bg)", color: "var(--e-danger)" }}>{away} from another device</span>}
              </span>
            </button>
            {on && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18, marginTop: 12 }}>
                <div>
                  <div style={lbl}>Pages opened, newest first</div>
                  {!b.views.length && <div style={hint}>None yet.</div>}
                  {b.views.slice(-25).reverse().map((v, i) => <div key={i} style={line}><span>{v.path === "/" ? "Home" : v.path}</span><span style={hint}>{day(v.at)}</span></div>)}
                </div>
                <div>
                  <div style={lbl}>Taps from their copy, newest first</div>
                  {!b.taps.length && <div style={hint}>None yet.</div>}
                  {b.taps.slice(-25).reverse().map((t, i) => (
                    <div key={i} style={line}>
                      <span>{t.link} <span style={hint}>on a {t.device}{t.country ? ", " + t.country : ""}{t.own ? "" : " · not their own device"}</span></span>
                      <span style={hint}>{day(t.at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const hint: React.CSSProperties = { fontSize: 12.5, color: "var(--e-muted)", marginTop: 3, fontWeight: 400 };
const card: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 16, background: "var(--e-panel)", marginTop: 12, fontFamily: font };
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", width: "100%", background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", color: "var(--e-ink-strong)", fontFamily: font };
const chips: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
const chip: React.CSSProperties = { fontSize: 11, fontWeight: 700, background: "var(--e-info-bg)", color: "var(--e-info-ink)", borderRadius: 999, padding: "3px 9px" };
const lbl: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: "var(--e-ink)", marginBottom: 4 };
const line: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderTop: "1px solid var(--e-line)", fontSize: 13.5, color: "var(--e-ink-strong)" };
