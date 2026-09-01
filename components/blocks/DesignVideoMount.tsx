"use client";

import { useEffect, useRef } from "react";

// Show OUR poster where the design drew a YouTube embed, and only load YouTube once someone asks.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// Steven, 2026-08-31, on the chain-link icon in the corner of a paused embed: *"I always saw the
// watch on YouTube link, but I never saw that Infinity… what do we have to beat people over the
// head to chase them away from my website."*
//
// ⛔ THAT CHROME IS NOT REMOVABLE FROM THE OUTSIDE. The copy-link button and the "Watch on
// YouTube" bar belong to YouTube's paused-state overlay, inside a cross-origin iframe. No CSS
// reaches it and no embed parameter turns it off — `modestbranding` was retired and never covered
// the overlay anyway. The only way to not show YouTube's overlay is to not show YouTube's player.
//
// ⭐ SO THE PAUSED STATE IS OURS AND THE PLAYING STATE IS THEIRS. A poster plus a play button
// until the click; the real iframe, autoplaying, after it. A visitor who wants YouTube can still
// get there once the player is up — nothing is blocked. What is gone is the invitation to leave
// while they are still deciding whether to watch.
//
// ⚠️ IT ALSO STOPS FIVE PLAYERS LOADING ON A PAGE NOBODY HAS CLICKED YET. Each embed pulls its own
// player bundle; the posters are five images.
//
// ⚠️ DOM SURGERY, NOT JSX, ON PURPOSE. These iframes live inside the sealed section's
// dangerouslySetInnerHTML, so React does not own them and cannot re-render them out from under us
// — the same reason DesignCalMount reaches for the node rather than rendering one.

const ID = /\/embed\/([A-Za-z0-9_-]{6,})/;

export default function DesignVideoMount() {
  // An anchor in the normal flow, so we only touch OUR section — a page can carry several.
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = anchor.current?.parentElement;
    if (!root) return;

    const frames = Array.from(
      root.querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube"], iframe[src*="youtu.be"]'),
    );

    const undo: Array<() => void> = [];

    for (const frame of frames) {
      const src = frame.getAttribute("src") || "";
      const vid = ID.exec(src)?.[1];
      if (!vid) continue;
      const holder = frame.parentElement;
      if (!holder || holder.dataset.sjcFacade === "1") continue;
      holder.dataset.sjcFacade = "1";

      const label = frame.getAttribute("title") || "Play video";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vid__facade";
      btn.setAttribute("aria-label", `Play: ${label}`);

      const img = document.createElement("img");
      img.className = "vid__thumb";
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      // maxres does not exist for every upload; hq always does.
      img.src = `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`;
      img.onerror = () => {
        img.onerror = null;
        img.src = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
      };

      const play = document.createElement("span");
      play.className = "vid__play";
      play.setAttribute("aria-hidden", "true");

      btn.append(img, play);

      btn.addEventListener("click", () => {
        const go = frame.cloneNode(true) as HTMLIFrameElement;
        go.setAttribute("src", src + (src.includes("?") ? "&" : "?") + "autoplay=1");
        go.removeAttribute("loading");
        btn.replaceWith(go);
      });

      frame.replaceWith(btn);
      undo.push(() => {
        btn.replaceWith(frame);
        delete holder.dataset.sjcFacade;
      });
    }

    return () => undo.forEach((fn) => fn());
  }, []);

  return <span ref={anchor} hidden aria-hidden="true" />;
}
