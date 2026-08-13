"use client";
import { useEffect, useState } from "react";
import { FONTS, BRAND_DEFAULTS, type Brand, type BrandFont, SWATCHES } from "@/lib/brandShared";
import { useNavTitle } from "@/components/edit/navContext";

// The one screen that sets a whole site's look. Font + colors, once, and every page follows.
// Plain English labels on purpose — this gets used per client, not per developer.

// ⚠️ EVERY COLOUR IN `Brand` HAS TO APPEAR HERE, OR IT BECOMES UNCHANGEABLE.
//
// This list used to hold nine of the twelve. `secondary`, `highlight` and `bandDarker` existed in
// the type, were emitted as CSS variables, and were used by real pages — with no field anywhere to
// edit them. On 2026-08-05 that stranded SJC mid-re-skin: the palette went cyan, the buttons and
// bands followed, and every headline stayed green because it reads --color-sjc-secondary and
// nothing on this screen could reach it. It looked like a stuck value on the block; it was a
// control that had never been built.
//
// A missing swatch is worse than an ugly one. Add a colour to `Brand`, add it here.

// ⚠️ THIS SCREEN USES THE EDITOR'S PALETTE (--e-ink / --e-muted / --e-accent), NOT THE PUBLIC
// SITE'S (--color-sjc-*), AND THE DIFFERENCE IS NOT COSMETIC.
//
// It shipped using --color-sjc-ink, which is a fixed dark navy chosen for a WHITE page. In the
// back office's dark mode that put dark-navy text on a dark-navy background: the heading and the
// whole intro paragraph were invisible. Steven found it — every other back-office screen was
// legible and this one wasn't, because every other screen uses the --e-* variables that flip with
// the theme.
//
// The trap is specific to THIS page: it is the screen for editing a client's brand colours, so
// reaching for the brand palette feels right and is wrong. The colours being EDITED here belong
// to the website; the colours this screen is DRAWN in belong to the editor.

export default function BrandEditor({ siteId = "", siteLabel = "" }: { siteId?: string; siteLabel?: string } = {}) {
  // Blank = SJC, which is what /edit/brand has always meant. A client site passes its own id and
  // the same screen edits that site's palette instead — the route was the only thing missing.
  const q = siteId ? `?site=${encodeURIComponent(siteId)}` : "";
  // Whatever this screen is called in the rail — see components/edit/navContext.tsx.
  const title = useNavTitle("brand");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ good?: boolean; text: string } | null>(null);
  // Two-step reset instead of a browser confirm(). A native dialog blocks the page for
  // anything driving it, and looks like a browser error rather than part of the tool.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    fetch(`/api/brand${q}`)
      .then((r) => r.json())
      .then((d) => setBrand(d.brand))
      .catch(() => setBrand(BRAND_DEFAULTS));
  }, []);

  const set = (k: keyof Brand, v: string) =>
    setBrand((b) => (b ? { ...b, [k]: v } as Brand : b));

  async function saveDraft() {
    if (!brand) return;
    setSaving(true); setMsg(null);
    const r = await fetch("/api/brand", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, site: siteId || undefined }),
    }).then((x) => x.json()).catch((e) => ({ ok: false, error: String(e) }));
    setSaving(false);
    setMsg(r.ok ? { good: true, text: "Saved. Not live yet — hit Publish." } : { text: r.error || "Save failed" });
  }

  async function act(action: "publish" | "reset") {
    setArmed(false);
    setSaving(true); setMsg(null);
    const r = await fetch("/api/brand", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, site: siteId || undefined }),
    }).then((x) => x.json()).catch((e) => ({ ok: false, error: String(e) }));
    setSaving(false);
    if (r.brand) setBrand(r.brand);
    setMsg(r.ok
      ? { good: true, text: action === "publish" ? "Published — the live site is using this now." : "Reset. The site is back to its original look." }
      : { text: r.error || "Failed" });
  }

  if (!brand) return <main className="p-10 text-sm text-gray-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-[color:var(--e-ink)]">{title}</h1>
      {/* WHOSE colours these are. Without it the screen looks identical for every website and the
          only way to know which one you are about to repaint is the address bar. */}
      {siteLabel ? (
        <p className="mt-1 text-sm font-semibold text-[color:var(--e-accent)]">{siteLabel}</p>
      ) : null}
      <p className="mt-2 text-[color:var(--e-muted)]">
        Set the font and colours once. Every page on this site follows them — you never set a
        colour on an individual block again. Changes are saved as a draft; nothing reaches the
        live site until you press Publish.
      </p>

      {msg && (
        <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${msg.good
          ? "border-green-300 bg-green-50 text-green-800"
          : "border-red-300 bg-red-50 text-red-800"}`}>
          {msg.text}
        </div>
      )}

      {/* TWO FONTS, BECAUSE A WEBSITE HAS TWO.
          One face for the headlines, one for everything you read. The site has rendered both since
          design import landed — BrandStyle emits --font-heading and applies it to h1–h4 — but this
          screen only ever showed the body one. So an imported design could be running Space Grotesk
          headlines over Inter body while this page said "Lexend — current", describing half of it.
          Not wrong behaviour: hidden behaviour, which is worse, because there was nothing to click. */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-[color:var(--e-ink)]">Headlines</h2>
        <p className="mt-1 text-sm text-[color:var(--e-muted)]">
          The big text at the top of each section. Bought designs usually pair a second face here.
        </p>
        <div className="mt-3 grid gap-2">
          {/* ⛔ "Same as body text" is the EMPTY STRING, never a copy of the body font's value.
              Copying it in would freeze the headlines the first time the body font changes — pick a
              new body face and the headlines silently stay behind. Blank means FOLLOW, and blank is
              also what every brand saved before today already holds, so nothing existing shifts. */}
          <FontChoice
            name="headingFont"
            label="Same as body text"
            note="One face for the whole site — how it worked before"
            checked={!brand.headingFont}
            onPick={() => set("headingFont", "")}
          />
          {FONTS.map((f) => (
            <FontChoice
              key={f.value}
              name="headingFont"
              label={f.label}
              note={f.note}
              checked={brand.headingFont === f.value}
              onPick={() => set("headingFont", f.value as BrandFont)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-[color:var(--e-ink)]">Body text</h2>
        <p className="mt-1 text-sm text-[color:var(--e-muted)]">
          Paragraphs, buttons, labels — everything that isn&apos;t a headline.
        </p>
        <div className="mt-3 grid gap-2">
          {FONTS.map((f) => (
            <FontChoice
              key={f.value}
              name="font"
              label={f.label}
              note={f.note}
              checked={brand.font === f.value}
              onPick={() => set("font", f.value as BrandFont)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-[color:var(--e-ink)]">Colours</h2>
        <div className="mt-3 grid gap-3">
          {SWATCHES.map((s) => (
            <div key={s.key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <input type="color" value={String(brand[s.key])}
                onChange={(e) => set(s.key, e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300" />
              <input type="text" value={String(brand[s.key])}
                onChange={(e) => set(s.key, e.target.value)}
                className="w-24 rounded border border-gray-300 px-2 py-1 text-center text-sm" />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{s.label}</span>
                <span className="block text-xs text-[color:var(--e-muted)]">{s.help}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6">
        <button onClick={saveDraft} disabled={saving}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold">
          Save draft
        </button>
        <button onClick={() => act("publish")} disabled={saving}
          className="rounded-lg bg-[color:var(--e-accent)] px-5 py-2 text-sm font-bold text-white">
          Publish to the live site
        </button>
        {armed ? (
          <span className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-[color:var(--e-ink)]">Put the site back to its original font and colours?</span>
            <button onClick={() => act("reset")} disabled={saving}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 font-semibold text-red-700">
              Yes, reset
            </button>
            <button onClick={() => setArmed(false)} className="underline text-[color:var(--e-muted)]">
              Cancel
            </button>
          </span>
        ) : (
          <button onClick={() => setArmed(true)} disabled={saving}
            className="ml-auto text-sm text-[color:var(--e-muted)] underline">
            Reset to original
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-[color:var(--e-muted)]">
        Reset is the way back — whatever you try here, one click returns the site to how it shipped.
      </p>
    </main>
  );
}

/**
 * One row in a font list.
 *
 * Lifted out of the two `FONTS.map`s so the body picker and the headline picker cannot drift apart
 * — a difference in padding or highlight between two lists of the same eight names reads as a bug
 * in the list rather than a style slip.
 */
function FontChoice({
  name,
  label,
  note,
  checked,
  onPick,
}: {
  name: string;
  label: string;
  note: string;
  checked: boolean;
  onPick: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
        checked ? "border-[color:var(--e-accent)] bg-[color:var(--e-info-bg)]" : "border-[color:var(--e-line)]"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onPick} />
      <span className="flex-1">
        <span className="block text-base font-semibold">{label}</span>
        <span className="block text-sm text-[color:var(--e-muted)]">{note}</span>
      </span>
    </label>
  );
}
