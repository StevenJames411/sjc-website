"use client";
import { useEffect, useState } from "react";

type Totals = { view: number; play: number; p25: number; p50: number; p75: number; done: number };
type Stat = { video: string; totals: Totals; days: { day: string; plays: number; views: number }[] };

const rate = (t: Totals) => (t.view ? `${Math.round((t.play / t.view) * 100)}%` : "-");

export default function VideoViews({ title }: { title: string }) {
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/video-stats", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setStats(j.videos || []))
      .catch(() => setErr("Could not load the numbers. Refresh to try again."));
  }, []);

  return (
    <div style={page}>
      <h1 style={h1}>{title}</h1>
      <div style={sub}>
        Page loads is how many times the page with the video was opened. Plays is how many of those pressed play. The
        percent columns count people who watched that far. Search engines and link previews are left out.
      </div>
      {err && <div style={errBox}>{err}</div>}
      {stats === null && !err && <div style={empty}>Loading...</div>}
      {stats !== null && !stats.length && <div style={empty}>No views yet. The first visit to the home page will show up here.</div>}
      {stats !== null && stats.length > 0 && (
        <>
          <div style={scroll}>
            <table style={table}>
              <thead>
                <tr>
                  {["Video", "Page loads", "Plays", "Watched 25%", "50%", "75%", "Finished", "Play rate"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.video}>
                    <td style={td}>{s.video}</td>
                    <td style={td}>{s.totals.view}</td>
                    <td style={td}>{s.totals.play}</td>
                    <td style={td}>{s.totals.p25}</td>
                    <td style={td}>{s.totals.p50}</td>
                    <td style={td}>{s.totals.p75}</td>
                    <td style={td}>{s.totals.done}</td>
                    <td style={td}>{rate(s.totals)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stats.map((s) => (
            <div key={s.video}>
              <h2 style={h2}>Last 14 days: {s.video}</h2>
              <div style={scroll}>
                <table style={{ ...table, maxWidth: 420 }}>
                  <thead>
                    <tr>{["Day", "Page loads", "Plays"].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {s.days.length ? (
                      s.days.map((d) => (
                        <tr key={d.day}>
                          <td style={td}>{d.day}</td>
                          <td style={td}>{d.views}</td>
                          <td style={td}>{d.plays}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td style={td} colSpan={3}>Nothing in the last 14 days.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const page: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px", fontFamily: font };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 6 };
const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, margin: "32px 0 0", color: "var(--e-ink-strong)" };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4, maxWidth: 720 };
const scroll: React.CSSProperties = { overflowX: "auto", marginTop: 14 };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", border: "1px solid var(--e-line)", background: "var(--e-panel)", fontSize: 14 };
const th: React.CSSProperties = { textAlign: "left", padding: "9px 12px", fontSize: 12.5, fontWeight: 700, borderBottom: "1px solid var(--e-line)", color: "var(--e-ink)", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "9px 12px", borderTop: "1px solid var(--e-line)", color: "var(--e-ink)" };
const errBox: React.CSSProperties = { background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginTop: 16 };
const empty: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 24 };
