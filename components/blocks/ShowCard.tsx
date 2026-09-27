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
    const el = document.querySelector("[data-sjc-fhl-player]");
    // Lifts the server-painted cover in globals.css (see "FHL PLAYER COVER"). Until this runs the
    // player shows that cover, never YouTube's "This video is unavailable".
    el?.setAttribute("data-fhl-ready", "");
    setHost(el);
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
    <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", background: "radial-gradient(ellipse at 50% 70%, #1b2a6b 0%, #0A0E27 70%)", overflow: "hidden", color: "#fff", fontFamily: "var(--font-family-body)", textAlign: "center" }}>
      <div style={{ paddingTop: "5%" }}>
        <div style={{ fontWeight: 700, fontSize: "clamp(18px,1.9vw,28px)" }}>
          <span style={{ color: "#ffd700", letterSpacing: ".12em", textTransform: "uppercase", fontSize: "0.7em", marginRight: 14 }}>Next show</span>
          {s.label}, 11 a.m. Central
        </div>
        <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: "clamp(26px,3vw,46px)", color: "#ffd700", lineHeight: 1.1, marginTop: 6 }}>
          {hh}:{pad(mm)}:{pad(ss)}
          <span style={{ fontSize: "max(0.38em, 13px)", marginLeft: 10 }}>hours</span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-end", marginTop: "9%" }}>
        <img src={PHOTO} alt="Steven Barchetti" style={{ height: "100%", width: "auto", maxWidth: "90%", objectFit: "contain", objectPosition: "bottom", transform: "scale(1.24)", transformOrigin: "50% 100%" }} />
      </div>
    </div>,
    host
  );
}
