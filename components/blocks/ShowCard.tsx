"use client";
// FUNNEL HACK LIVE — THE PLAYER IS NEVER A BLACK BOX (09-27). The show is live on TIKTOK ONLY for now
// (Steven, 10-04; weekdays 3:00–4:00 Central), and TikTok gives a website no live player to embed. So the
// card always covers the player: a countdown outside the show, and "Live now" with a button to his TikTok
// during it. When the show also goes to YouTube, return null while live and the embed underneath plays.
// Next: the latest episode's replay (own player) replaces the card.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SHOW_HOUR = 15; // Central, 24-hour clock. The one place the show time is set.
const SHOW_TIME = "3 p.m. Central";
const TIKTOK_LIVE = "https://www.tiktok.com/@stevenjamesconsulting/live";
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
  if (weekday && c.h === SHOW_HOUR) return { live: true, secs: 0, label: "" };
  // seconds until the next weekday show time, Central
  const nowSecs = c.h * 3600 + c.m * 60 + c.s;
  let add = 0, d = c.day;
  if (!(weekday && nowSecs < SHOW_HOUR * 3600)) { add = 86400 - nowSecs; d = (d + 1) % 7; while (d === 0 || d === 6) { add += 86400; d = (d + 1) % 7; } add += SHOW_HOUR * 3600; }
  else add = SHOW_HOUR * 3600 - nowSecs;
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
  const hh = Math.floor(s.secs / 3600), mm = Math.floor((s.secs % 3600) / 60), ss = s.secs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return createPortal(
    <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", background: "radial-gradient(ellipse at 50% 60%, #ABA18A 0%, #A1967F 45%, #8A7F67 100%)", overflow: "hidden", color: "#1E140A", fontFamily: "var(--font-family-body)", textAlign: "center" }}>
      <div style={{ paddingTop: "5%" }}>
        <div style={{ fontWeight: 700, fontSize: "clamp(18px,1.9vw,28px)" }}>
          <span ref={(el) => { el?.style.setProperty("color", "#47260A", "important"); }} style={{ letterSpacing: ".12em", textTransform: "uppercase", fontSize: "0.7em", marginRight: 14 }}>{s.live ? "Live now" : "Next show"}</span>
          {s.live ? "On TikTok" : `${s.label}, ${SHOW_TIME}`}
        </div>
        {s.live ? (
          <a href={TIKTOK_LIVE} target="_blank" rel="noopener" style={{ display: "inline-block", marginTop: 10, padding: "10px 26px", borderRadius: 9999, fontWeight: 700, fontSize: "clamp(15px,1.3vw,19px)", color: "#1A0E06", border: "1.5px solid #F6C48A", background: "linear-gradient(90deg,#8F4515 0%,#BF7530 31%,#D58A42 50%,#BF7530 69%,#8F4515 100%)", textDecoration: "none" }}>Watch Live On TikTok</a>
        ) : (
          <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: "clamp(26px,3vw,46px)", color: "#1E140A", lineHeight: 1.1, marginTop: 6 }}>
            {hh}:{pad(mm)}:{pad(ss)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-end", marginTop: "9%" }}>
        <img src={PHOTO} alt="Steven Barchetti" style={{ height: "100%", width: "auto", maxWidth: "90%", objectFit: "contain", objectPosition: "bottom", transform: "scale(1.24)", transformOrigin: "50% 100%" }} />
      </div>
    </div>,
    host
  );
}
