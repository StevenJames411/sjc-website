"use client";
import { useEffect, useId, useRef, useState } from "react";

// Cal.com booking widget, mounted through Cal's OWN embed script instead of a raw <iframe>.
//
// ⛔ WHY THIS EXISTS — A FIXED-HEIGHT IFRAME CANNOT BE RIGHT.
// A raw iframe is a fixed window onto a page whose height genuinely changes: a six-row month is
// taller than a five-row one, a loaded booker is taller than its skeleton, a day with more slots is
// taller than one with fewer, and the phone stacks three columns that sit side by side on a laptop.
// Every number is right for one of those and wrong for the rest — too short grows an inner scrollbar
// (reads as broken), too tall leaves a slab of white. **620 → 760 → 700 → 880 → 700 in one evening,
// each wrong somewhere else.** Cal's script has the framed page measure itself and report its height
// back out, then resizes the iframe to match.
//
// ⛔ THE NAMESPACE IS LOAD-BEARING — THIS IS THE BIT THAT WAS GUESSED WRONG THE FIRST TIME.
// A hand-simplified loader calling the NON-namespaced `Cal("init", {...})` / `Cal("inline", {...})`
// built the iframe and then sat on a spinner forever, live, because the shim never created
// `cal.ns[namespace]` and the queue was never replayed against it. The origin was a red herring —
// `https://app.cal.com` is correct and was right all along. The loader below is Cal's published
// snippet verbatim (from the event type's own `</>` Embed dialog); do not "tidy" it.

type CalApi = ((...args: unknown[]) => void) & {
  q?: unknown[];
  ns?: Record<string, CalApi>;
  loaded?: boolean;
};

const EMBED_JS = "https://app.cal.com/embed/embed.js";

// Cal's published queue shim, transliterated but not simplified. Calls made before embed.js lands
// are queued and replayed once it loads; one script tag no matter how many blocks mount.
function ensureCal(onError: () => void): CalApi {
  const w = window as unknown as { Cal?: CalApi; document: Document };
  if (!w.Cal) {
    const p = (a: CalApi, ar: unknown) => {
      (a.q as unknown[]).push(ar);
    };
    const cal = function (...args: unknown[]) {
      const c = w.Cal as CalApi;
      if (!c.loaded) {
        c.ns = {};
        c.q = c.q || [];
        const s = document.createElement("script");
        s.src = EMBED_JS;
        s.onerror = onError;
        document.head.appendChild(s);
        c.loaded = true;
      }
      if (args[0] === "init") {
        const api = function (...a: unknown[]) {
          p(api as CalApi, a);
        } as CalApi;
        const namespace = args[1];
        api.q = api.q || [];
        if (typeof namespace === "string") {
          (c.ns as Record<string, CalApi>)[namespace] =
            (c.ns as Record<string, CalApi>)[namespace] || api;
          p((c.ns as Record<string, CalApi>)[namespace], args);
          p(c, ["initNamespace", namespace]);
        } else {
          p(c, args);
        }
        return;
      }
      p(c, args);
    } as CalApi;
    w.Cal = cal;
  }
  return w.Cal as CalApi;
}

export default function CalEmbed({
  calLink,
  minHeight = 570,
}: {
  calLink: string;
  minHeight?: number;
}) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const elId = `cal-inline-${reactId}`;
  // The namespace Cal's own dialog uses is the event slug ("discovery"). Keep it stable per link.
  const ns = (calLink.split("/").pop() || "booking").replace(/[^a-zA-Z0-9]/g, "") || "booking";
  const mounted = useRef(false);
  // ⚠️ If Cal's script is blocked — ad blocker, locked-down network, CDN blip — a bare div renders
  // an EMPTY BOOKING SECTION, the worst failure on the page whose job is taking appointments. A
  // script error falls back to the plain iframe, which needs nothing but the URL.
  const [failed, setFailed] = useState(false);
  // Holds space only until Cal's iframe mounts; released below.
  const [reserved, setReserved] = useState(true);

  // ⛔ CAL SCROLLS THE PAGE TO ITSELF, AND THAT IS THE ANCHOR BUG. THIS STOPS IT.
  //
  // From Cal's own shipped embed.js:
  //     this.actionManager.on("__routeChanged", () => {
  //       const { top: r, height: o } = this.inlineEl.getBoundingClientRect();
  //       r < 0 && Math.abs(r / o) >= 0.25 && this.inlineEl.scrollIntoView({ behavior: "smooth" });
  //     });
  // When its own box is scrolled more than a quarter of its height above the fold, it drags the
  // page back to put itself at the top. `__routeChanged` fires while the booker boots, on every
  // load, hash or not.
  //
  // ⚠️ WHAT THAT DID HERE. Landing on `/#sl6o1yj` the browser scrolls CORRECTLY to 8268. The
  // calendar sits above that section, so its top is then −566 and |−566|/570 = 0.99 — well past the
  // 0.25 trigger — so Cal scrolled itself flush to the top and the visitor landed on the calendar
  // instead of Pricing. `scrollIntoView` moves by exactly `rect.top`, which is why the miss was
  // EXACTLY 566px on every single load, warm or cold: the miss IS the trigger distance, by
  // construction. Steven's words were literally accurate — *"it goes to the pricing section, and
  // then jumps up into the calendar."*
  //
  // ⛔ WHY THIS SHAPE. `this.inlineEl` is a wrapper Cal injects INSIDE our host, so it does not
  // exist yet and cannot be patched directly. Patching the prototype and refusing only calls whose
  // target is inside a Cal container is the narrowest interception available: every other
  // `scrollIntoView` on the page is untouched.
  // ⚠️ It never runs on the server (inside an effect) and is restored on unmount.
  useEffect(() => {
    const proto = Element.prototype;
    const original = proto.scrollIntoView;
    // Guard against double-patching when two calendars are on one page.
    if ((proto.scrollIntoView as { __sjcCalGuard?: boolean }).__sjcCalGuard) return;
    function patched(this: Element, ...args: unknown[]) {
      if (this.closest?.("[data-sjc-cal], [id^='cal-inline'], [id^='my-cal-inline']")) return;
      return (original as (...a: unknown[]) => void).apply(this, args);
    }
    (patched as { __sjcCalGuard?: boolean }).__sjcCalGuard = true;
    proto.scrollIntoView = patched as typeof proto.scrollIntoView;
    return () => {
      proto.scrollIntoView = original;
    };
  }, []);

  useEffect(() => {
    if (failed || mounted.current) return;
    try {
      const Cal = ensureCal(() => setFailed(true));
      Cal("init", ns, { origin: "https://app.cal.com" });
      const nsApi = Cal.ns?.[ns];
      if (!nsApi) {
        setFailed(true);
        return;
      }
      nsApi("inline", {
        elementOrSelector: `#${elId}`,
        config: { layout: "month_view" },
        calLink,
      });
      mounted.current = true;
    } catch {
      setFailed(true);
    }
  }, [calLink, elId, ns, failed]);

  // ⛔ THE RESERVED HEIGHT HAS TO BE HANDED BACK, OR IT BECOMES THE BUG IT WAS MEANT TO PREVENT.
  // Cal resized its own iframe to its content (570px on the first live check) while this wrapper was
  // still holding 700px open underneath it — the exact slab of white the whole change was made to
  // kill. So the moment Cal's iframe appears, drop the floor and let the content set the height.
  useEffect(() => {
    if (failed) return;
    const el = document.getElementById(elId);
    if (!el) return;
    // ⛔ RELEASE ON A SIZED IFRAME, NOT ON AN IFRAME EXISTING. THIS EXACT LINE WAS THE BUG.
    // Cal mounts the <iframe> EMPTY, then loads its own app inside it, then that app postMessages
    // its real height out and only THEN does Cal set the frame's height. Testing for mere presence
    // fired on the empty frame: the floor dropped, the box collapsed to 0, and ~600px later the
    // real height arrived and shoved everything below back down. Proved on the live page —
    // inserting a zero-height iframe into the box takes it from 620px to 0px instantly.
    //
    // That collapse-then-regrow is what threw every `#section` link that lands below the calendar,
    // and it is why the page visibly "jumps around before it settles."
    const READY = 100; // px. Above any empty/placeholder frame, far below a real month view.
    const release = () => {
      const frame = el.querySelector("iframe");
      if (!frame || frame.getBoundingClientRect().height <= READY) return false;
      setReserved(false);
      // The CSS floor is on the PORTAL HOST, one level up, and it needs the same signal — see the
      // `[data-sjc-cal]` rule in globals.css. Marking the element keeps the two in step instead of
      // letting each guess separately.
      el.closest("[data-sjc-cal]")?.setAttribute("data-cal-ready", "1");
      return true;
    };
    if (release()) return;
    // ⚠️ `attributes: true` IS LOAD-BEARING. Cal resizes by setting `style.height` ON the iframe —
    // an ATTRIBUTE change. Watching childList alone fired once, on insertion, at exactly the wrong
    // moment, and then never again.
    const obs = new MutationObserver(() => {
      if (release()) obs.disconnect();
    });
    obs.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "height"] });
    return () => obs.disconnect();
  }, [elId, failed]);

  if (failed) {
    return (
      <iframe
        src={`https://cal.com/${calLink}`}
        style={{ height: `${minHeight}px` }}
        className="w-full border-0"
        title="Book a call"
        loading="lazy"
      />
    );
  }

  // ⚠️ minHeight is NOT the height any more — it only reserves space so the page does not collapse
  // while the script loads. Cal overrides it the moment the framed page reports its real height.
  return <div id={elId} style={{ width: "100%", minHeight: reserved ? `${minHeight}px` : undefined }} />;
}
