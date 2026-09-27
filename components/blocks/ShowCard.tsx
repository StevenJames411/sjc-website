"use client";
// FUNNEL HACK LIVE — THE PLAYER IS NEVER A BLACK BOX (09-27). Outside the show (weekdays 11:00–12:00
// Central) the YouTube live embed shows "This video is unavailable" ~23 hours a day. This covers it with a
// "next show" card and a countdown; during the show the card steps aside and the live feed plays.
// Week two: the latest episode's replay (own player) replaces the card.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const PHOTO = "https://agent-sjc.onrender.com/sjc/roleplay/media/twin-cutout.webp";

// Central-time wall clock, via Intl (DST handled by the browser's tz database).
function central(now: Date) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short", hour: "numeric", minute: "numeric", second: "numeric", hour12: false });
  const parts = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return { day, h: Number(parts.hour) % 24, m: Number(parts.minute), s: Number(parts.second) };
}

function status(now: Date) {
  const c = central(now);
  const weekday = c.day >= 1 && c.day <= 5;
  if (weekday && c.h === 11) return { live: true, secs: 0, label: "" };
  // seconds until the next weekday 11:00 Central
  const nowSecs = c.h * 3600 + c.m * 60 + c.s;
  let add = 0, d = c.day;
  if (!(weekday && nowSecs < 11 * 3600)) { add = 86400 - nowSecs; d = (d + 1) % 7; while (d === 0 || d === 6) { add += 86400; d = (d + 1) % 7; } add += 11 * 3600; }
  else add = 11 * 3600 - nowSecs;
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const label = d === c.day ? "Today" : names[d];
  return { live: false, secs: add, label };
}

export default function ShowCard() {
  const [host, setHost] = useState<Element | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setHost(document.querySelector("[data-sjc-fhl-player]"));
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  if (!host || !now) return null;
  const s = status(now);
  if (s.live) return null;
  const hh = Math.floor(s.secs / 3600), mm = Math.floor((s.secs % 3600) / 60), ss = s.secs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return createPortal(
    <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", alignItems: "center", background: "radial-gradient(ellipse at 70% 60%, #1b2a6b 0%, #0A0E27 70%)", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: "0 6%", color: "#fff", fontFamily: "var(--font-family-body)" }}>
        <div style={{ color: "#ffd700", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", fontSize: 14 }}>Next show</div>
        <div style={{ fontWeight: 700, fontSize: "clamp(22px,2.6vw,38px)", lineHeight: 1.15, marginTop: 8 }}>{s.label}<br /><span style={{ whiteSpace: "nowrap" }}>11 a.m. Central</span></div>
        <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: "clamp(26px,3.4vw,52px)", marginTop: 14, color: "#ffd700" }}>
          {hh}:{pad(mm)}:{pad(ss)}
          <span style={{ fontSize: "0.38em", marginLeft: 10, opacity: 0.9 }}>hours</span>
        </div>
        <div style={{ opacity: 0.8, marginTop: 10, fontSize: 15 }}>Live here, YouTube and Facebook.</div>
      </div>
      <img src={PHOTO} alt="Steven Barchetti" style={{ height: "92%", alignSelf: "flex-end", marginRight: "3%" }} />
    </div>,
    host
  );
}
