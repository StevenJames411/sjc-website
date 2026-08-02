"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Paste a generated design's HTML → get it as editable blocks.
//
// The whole point of the tool: rent the design generation (it's $2.50 and genuinely good), own
// the editing (which is what they actually charge for). This is the doorway between the two.
//
// "Check it first" is the default on purpose — it reports the palette guess and the section
// breakdown without creating anything, so a wrong read is caught before there's a page to clean up.

type Palette = {
  accent?: string; secondary?: string; highlight?: string;
  ink?: string; mute?: string; bandSoft?: string; bandDark?: string;
  ranked: { hex: string; count: number }[];
};
type Result = { ok: boolean; error?: string; slug?: string; siteId?: string; dryRun?: boolean; palette?: Palette; report?: string[]; blocks?: number;
  images?: { adopted?: number; failures?: { url: string; why: string }[]; error?: string } };

const ROLE_ROWS: { key: keyof Palette; label: string; why: string }[] = [
  { key: "accent",    label: "Accent",    why: "the brand colour — buttons, links, highlights" },
  { key: "secondary", label: "Secondary", why: "the second accent — status pills, softer buttons" },
  { key: "highlight", label: "Highlight", why: "warm third — star ratings, underline swipes" },
  { key: "ink",       label: "Ink",       why: "headings and body text" },
  { key: "mute",      label: "Muted",     why: "supporting text" },
  { key: "bandSoft",  label: "Soft band", why: "the light section background" },
  { key: "bandDark",  label: "Dark band", why: "the dark section background" },
];

export default function ImportPage() {
  const router = useRouter();
  const [html, setHtml] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);

  const run = async (dryRun: boolean) => {
    setBusy(true);
    setRes(null);
    try {
      const r = await fetch("/api/import-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        // A URL is fetched server-side; anything with tags in it is treated as pasted markup.
        body: JSON.stringify(
          /<\s*(html|head|body|section|header|div)/i.test(html)
            ? { html, businessName: name, dryRun }
            : { url: html.trim(), businessName: name, dryRun }
        ),
      });
      const j: Result = await r.json();
      setRes(j);
      // An import now creates a WEBSITE of its own, so the builder link needs both ids.
      if (j.ok && !dryRun && j.siteId)
        setTimeout(() => router.push(`/edit/${j.siteId}/${j.slug || "home"}`), 1200);
    } catch {
      setRes({ ok: false, error: "Couldn't reach the server." });
    } finally {
      setBusy(false);
    }
  };

  const box: React.CSSProperties = {
    width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 12px", fontSize: 14,
  };
  const btn: React.CSSProperties = {
    padding: "10px 18px", borderRadius: 8, border: "1px solid var(--e-line)", background: "var(--e-panel)",
    fontWeight: 600, cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1,
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 80px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Import a design</h1>
      <p style={{ color: "var(--e-muted)", marginTop: 8, lineHeight: 1.6 }}>
        Paste a published web address (best-in-show-grooming.sitedrop.ai) or the full HTML of a
        generated one-page site. It arrives as its own website — real blocks,
        every padding, colour and icon editable — with the colours mapped to brand roles so the
        whole thing can be re-skinned from one screen, and every photo copied onto our storage.
      </p>

      <label style={{ display: "block", fontWeight: 600, marginTop: 24, marginBottom: 6 }}>
        Business name <span style={{ fontWeight: 400, color: "var(--e-muted)" }}>— becomes the web address</span>
      </label>
      <input style={box} value={name} onChange={(e) => setName(e.target.value)} placeholder="Best In Show Grooming" />

      <label style={{ display: "block", fontWeight: 600, marginTop: 20, marginBottom: 6 }}>
        Their HTML
      </label>
      <textarea
        style={{ ...box, height: 220, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        placeholder="Paste the whole page — <!DOCTYPE html> down to </html>"
      />

      <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
        <button type="button" style={btn} disabled={busy} onClick={() => run(true)}>
          Check it first
        </button>
        <button
          type="button"
          style={{ ...btn, background: "var(--e-ink)", color: "var(--e-panel)", border: "1px solid var(--e-ink)" }}
          disabled={busy}
          onClick={() => run(false)}
        >
          Import as a new page
        </button>
        {busy ? <span style={{ color: "var(--e-muted)", fontSize: 14 }}>working…</span> : null}
      </div>

      {res && !res.ok ? (
        <p style={{ marginTop: 20, color: "var(--e-danger)", fontWeight: 600 }}>{res.error}</p>
      ) : null}

      {res?.ok ? (
        <div style={{ marginTop: 28 }}>
          {res.siteId ? (
            <>
              <p style={{ color: "var(--e-ok-ink)", fontWeight: 700 }}>
                Imported as its own website, /{res.siteId} — opening the builder…{" "}
                <span style={{ fontWeight: 400, color: "var(--e-muted)" }}>(saved as a draft, not published)</span>
              </p>
              {res.images ? (
                <p style={{ fontSize: 13, color: res.images.failures?.length || res.images.error ? "var(--e-warn-ink)" : "var(--e-ok-ink)" }}>
                  {res.images.error
                    ? `Images could NOT be copied (${res.images.error}) — they still point at the original host. Use "Adopt images" in the builder.`
                    : res.images.failures?.length
                      ? `${res.images.adopted ?? 0} images copied to our storage, ${res.images.failures.length} failed — those still point at the original host.`
                      : `${res.images.adopted ?? 0} images copied onto our own storage — nothing on this page depends on the tool that made it.`}
                </p>
              ) : null}
            </>
          ) : (
            <p style={{ color: "var(--e-ink)", fontWeight: 700 }}>
              Nothing created — this is just the read. {res.blocks} top-level blocks found.
            </p>
          )}

          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 22 }}>Colours it worked out</h3>
          <p style={{ color: "var(--e-muted)", fontSize: 13, marginTop: 4 }}>
            If any of these are wrong, fix them in the brand panel afterwards — every block points
            at the role, not the colour.
          </p>
          <table style={{ borderCollapse: "collapse", marginTop: 10, fontSize: 13 }}>
            <tbody>
              {ROLE_ROWS.map((r) => {
                const hex = res.palette?.[r.key] as string | undefined;
                return (
                  <tr key={r.key}>
                    <td style={{ padding: "4px 10px 4px 0", fontWeight: 600 }}>{r.label}</td>
                    <td style={{ padding: "4px 10px" }}>
                      {hex ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 18, height: 18, borderRadius: 4, background: hex, border: "1px solid var(--e-line)" }} />
                          <code>{hex}</code>
                        </span>
                      ) : (
                        <span style={{ color: "var(--e-muted)" }}>not found</span>
                      )}
                    </td>
                    <td style={{ padding: "4px 0", color: "var(--e-muted)" }}>{r.why}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 24 }}>What it found</h3>
          <ul style={{ marginTop: 8, color: "var(--e-ink)", fontSize: 13, lineHeight: 1.7 }}>
            {(res.report || []).map((line, i) => (
              <li key={i} style={{ color: line.includes("SKIPPED") ? "var(--e-warn-ink)" : undefined }}>{line}</li>
            ))}
          </ul>
          <p style={{ color: "var(--e-muted)", fontSize: 13, marginTop: 14 }}>
            Expect roughly 80% — anything unusual in their layout needs a tidy-up in the builder.
            That&apos;s still minutes instead of an evening.
          </p>
        </div>
      ) : null}
    </div>
  );
}
