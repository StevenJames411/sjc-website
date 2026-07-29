"use client";
import { useEffect, useState } from "react";
import { FONTS, BRAND_DEFAULTS, type Brand, type BrandFont } from "@/lib/brandShared";

// The one screen that sets a whole site's look. Font + colors, once, and every page follows.
// Plain English labels on purpose — this gets used per client, not per developer.

const SWATCHES: { key: keyof Brand; label: string; help: string }[] = [
  { key: "accent",     label: "Accent",            help: "Links, small labels, number badges — the brand colour" },
  { key: "accentHover",label: "Accent (hover)",    help: "Slightly darker version of the accent" },
  { key: "ink",        label: "Headline text",     help: "Headings and dark body text" },
  { key: "mute",       label: "Body text",         help: "Paragraphs and supporting copy" },
  { key: "line",       label: "Lines & borders",   help: "Hairlines, card edges, dividers" },
  { key: "bandSoft",   label: "Light band",        help: "Background of the pale sections" },
  { key: "bandDark",   label: "Dark band",         help: "Background of the dark sections" },
  { key: "cta",        label: "Button",            help: "The main call-to-action button" },
  { key: "ctaHover",   label: "Button (hover)",    help: "Button colour on hover" },
];

export default function BrandEditor() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ good?: boolean; text: string } | null>(null);
  // Two-step reset instead of a browser confirm(). A native dialog blocks the page for
  // anything driving it, and looks like a browser error rather than part of the tool.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    fetch("/api/brand")
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
      body: JSON.stringify({ brand }),
    }).then((x) => x.json()).catch((e) => ({ ok: false, error: String(e) }));
    setSaving(false);
    setMsg(r.ok ? { good: true, text: "Saved. Not live yet — hit Publish." } : { text: r.error || "Save failed" });
  }

  async function act(action: "publish" | "reset") {
    setArmed(false);
    setSaving(true); setMsg(null);
    const r = await fetch("/api/brand", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
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
      <h1 className="text-2xl font-bold text-[color:var(--color-sjc-ink)]">Brand</h1>
      <p className="mt-2 text-[color:var(--color-sjc-mute)]">
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

      <section className="mt-8">
        <h2 className="text-lg font-bold text-[color:var(--color-sjc-ink)]">Font</h2>
        <div className="mt-3 grid gap-2">
          {FONTS.map((f) => (
            <label key={f.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                brand.font === f.value ? "border-[color:var(--color-sjc-blue)] bg-blue-50" : "border-gray-200"}`}>
              <input type="radio" name="font" checked={brand.font === f.value}
                onChange={() => set("font", f.value as BrandFont)} />
              <span className="flex-1">
                <span className="block text-base font-semibold">{f.label}</span>
                <span className="block text-sm text-[color:var(--color-sjc-mute)]">{f.note}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-[color:var(--color-sjc-ink)]">Colours</h2>
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
                <span className="block text-xs text-[color:var(--color-sjc-mute)]">{s.help}</span>
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
          className="rounded-lg bg-[color:var(--color-sjc-blue)] px-5 py-2 text-sm font-bold text-white">
          Publish to the live site
        </button>
        {armed ? (
          <span className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-[color:var(--color-sjc-ink)]">Put the site back to its original font and colours?</span>
            <button onClick={() => act("reset")} disabled={saving}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 font-semibold text-red-700">
              Yes, reset
            </button>
            <button onClick={() => setArmed(false)} className="underline text-[color:var(--color-sjc-mute)]">
              Cancel
            </button>
          </span>
        ) : (
          <button onClick={() => setArmed(true)} disabled={saving}
            className="ml-auto text-sm text-[color:var(--color-sjc-mute)] underline">
            Reset to original
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-[color:var(--color-sjc-mute)]">
        Reset is the way back — whatever you try here, one click returns the site to how it shipped.
      </p>
    </main>
  );
}
