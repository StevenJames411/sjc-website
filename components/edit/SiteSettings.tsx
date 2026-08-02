"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Site } from "@/lib/sitesShared";

// EVERYTHING GLOBAL TO ONE WEBSITE, ON ONE SCREEN.
//
// The card in the gallery carries the company name and nothing else; you open the website and set
// its details here — the same shape GoHighLevel and Landingsite use. Before this, the business's
// phone number and address existed only as text typed inside individual blocks, which is why
// copying a finished site dragged the previous owner's details along with it.
//
// Fill this in once and the whole website can use it: any text on any block can carry a token
// like {{business.phone}} and it resolves at render. Change the number here, every page updates.

type Props = { site: Site; pageCount: number; pages: { slug: string; title: string }[] };

const TOKENS: [string, keyof Site["business"]][] = [
  ["{{business.name}}", "name"],
  ["{{business.phone}}", "phoneDisplay"],
  ["{{business.email}}", "email"],
  ["{{business.address}}", "address"],
  ["{{business.hours}}", "hours"],
];

export default function SiteSettings({ site, pageCount, pages }: Props) {
  const router = useRouter();
  const [s, setS] = useState<Site>(site);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [sweepMsg, setSweepMsg] = useState("");

  /** Catch-up sweep: link every page of this website to the fields above. */
  async function sweep() {
    setBusy(true);
    setSweepMsg("");
    try {
      const post = (slug: string, dryRun: boolean) =>
        fetch("/api/admin/tokenize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, slug, dryRun }),
        }).then((r) => r.json());

      const looks = await Promise.all(pages.map((p) => post(p.slug, true)));
      const total = looks.reduce((n, l) => n + (l?.total || 0), 0);
      if (!total) {
        setSweepMsg("Nothing to link — these pages either match nothing here, or are already linked.");
        return;
      }
      if (!window.confirm(`Link ${total} value${total === 1 ? "" : "s"} across ${pages.length} page(s)?\n\nSaved as drafts — Publish each page when you've looked at it.`))
        return;

      const done = await Promise.all(pages.map((p) => post(p.slug, false)));
      const n = done.reduce((a, d) => a + (d?.total || 0), 0);
      setSweepMsg(`Linked ${n} value${n === 1 ? "" : "s"}. Open each page and Publish to put it live.`);
    } catch {
      setSweepMsg("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const biz = (k: keyof Site["business"], v: string) =>
    setS({ ...s, business: { ...s.business, [k]: v } });
  const seo = (k: keyof Site["seo"], v: string) => setS({ ...s, seo: { ...s.seo, [k]: v } });

  async function save() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const r = await fetch("/api/sites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: s.id,
          name: s.name.trim(),
          description: s.description || "",
          domain: (s.domain || "").trim(),
          leadEmail: (s.leadEmail || "").trim(),
          business: s.business,
          seo: s.seo,
        }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error || "Couldn't save.");
      setMsg("Saved.");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={page}>
      {/* "← All websites" lived here until the rail took over global navigation. */}
      <h1 style={h1}>{s.name}</h1>
      <p style={sub}>
        {pageCount} page{pageCount === 1 ? "" : "s"} · set once here, used across the whole website
      </p>

      <h2 style={sec}>The business</h2>
      <p style={hint}>
        These are the facts about the company. Put a token from the list below into any text on any
        page and it fills itself in from here.
      </p>
      <Field label="Business name" v={s.business.name} on={(v) => biz("name", v)} ph="Your Business Name" />
      <Row>
        <Field label="Phone — as people read it" v={s.business.phoneDisplay} on={(v) => biz("phoneDisplay", v)} ph="(555) 123-4567" />
        <Field label="Phone — as it dials" v={s.business.phone} on={(v) => biz("phone", v)} ph="+15551234567" />
      </Row>
      <Field label="Email" v={s.business.email} on={(v) => biz("email", v)} ph="hello@yourbusiness.com" />
      <Field label="Address" v={s.business.address} on={(v) => biz("address", v)} ph="123 Main Street, Your City, ST 00000" />
      <Field label="Hours" v={s.business.hours} on={(v) => biz("hours", v)} ph="Mon – Fri: 9:00 AM – 5:00 PM" />

      <div style={tokenBox}>
        <strong style={{ fontSize: 13 }}>Tokens you can paste into any text block</strong>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
          {TOKENS.map(([t, k]) => (
            <li key={t}>
              <code style={code}>{t}</code>{" "}
              <span style={{ color: "#6b7280" }}>→ {s.business[k] || <em>not set</em>}</span>
            </li>
          ))}
        </ul>
        <p style={{ ...hint, marginTop: 10 }}>
          The builder shows the token; the live page shows the value. That way editing a page can
          never bake the number in and break the link back to this screen.
        </p>

        {/* An IMPORTED website is wired to these automatically — the importer writes the tokens
            as it parses. This is the catch-up for pages built before that, or where someone typed
            a number in by hand. It lives here, beside the fields it reads, rather than in the page
            toolbar where it would be a one-off task sitting in permanent view. */}
        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 14, paddingTop: 14 }}>
          <button type="button" style={ghost} onClick={sweep} disabled={busy}>
            {busy ? "Working…" : "Apply these to existing pages"}
          </button>
          <p style={{ ...hint, margin: "8px 0 0" }}>
            Finds these values typed into the pages of this website and swaps them for the tokens
            above. New imports arrive already wired, so this is only for older pages.
          </p>
          {sweepMsg ? <p style={{ ...hint, margin: "8px 0 0", color: "#166534" }}>{sweepMsg}</p> : null}
        </div>
      </div>

      <h2 style={sec}>Web address</h2>
      <Field
        label="Custom domain (leave blank until they've bought one)"
        v={s.domain || ""}
        on={(v) => setS({ ...s, domain: v })}
        ph="theirbusiness.com"
      />
      {/* SJC is the domain root; a client site is served under its own id until it has a domain.
          Saying "/sjc" on the site that owns the domain was just wrong. */}
      <p style={hint}>
        {s.kind === "sjc" ? (
          <>
            Served at <code style={code}>/</code> — this is the site the domain belongs to.
          </>
        ) : s.domain ? (
          <>
            Currently reachable at <code style={code}>/{s.id}</code>. Pointing{" "}
            <strong>{s.domain}</strong> at it is a separate step and isn&apos;t wired up yet.
          </>
        ) : (
          <>
            Served at <code style={code}>/{s.id}</code>, and kept out of Google on purpose — it
            carries a real business&apos;s details on our address. Add their domain once they buy.
          </>
        )}
      </p>

      <h2 style={sec}>Where the leads go</h2>
      <p style={hint}>
        Blank means enquiries from this website stay in your own intake — right for a demo, and for
        your own pages. Put the owner&apos;s address in when they buy, and every enquiry goes
        straight to them with reply-to set to the customer, so hitting reply on their phone
        answers the person who asked.{" "}
        <strong>Your copy is kept either way</strong> — that&apos;s the record at renewal and the
        answer to &quot;I never got that lead&quot;.
      </p>
      <Field
        label="Owner's email for leads"
        v={s.leadEmail || ""}
        on={(v) => setS({ ...s, leadEmail: v })}
        ph="the client's own inbox — leave blank while it's a demo"
      />

      <h2 style={sec}>How it looks when the link is shared</h2>
      <p style={hint}>Defaults for every page. A page can override any of these in its own panel.</p>
      <Field label="Preview text" v={s.seo.description} on={(v) => seo("description", v)} ph="What this business does, in one sentence." area />
      <Field label="Preview image URL" v={s.seo.shareImage} on={(v) => seo("shareImage", v)} ph="https://…" />
      <Field label="Title suffix" v={s.seo.titleSuffix} on={(v) => seo("titleSuffix", v)} ph="| Your Business Name" />

      <h2 style={sec}>In your list</h2>
      <Field label="Website name" v={s.name} on={(v) => setS({ ...s, name: v })} ph="What you call it in your list" />
      <Field label="Note to yourself" v={s.description || ""} on={(v) => setS({ ...s, description: v })} ph="Where this one came from, or what it's waiting on" />

      {err ? <p style={errBox}>{err}</p> : null}
      {msg ? <p style={okBox}>{msg}</p> : null}

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button type="button" style={primary} onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
        <button type="button" style={ghost} onClick={() => router.push(`/edit/${s.id}`)} disabled={busy}>
          Back to the pages
        </button>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Field({
  label, v, on, ph, area,
}: { label: string; v: string; on: (v: string) => void; ph?: string; area?: boolean }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={lbl}>{label}</span>
      {area ? (
        <textarea value={v} onChange={(e) => on(e.target.value)} placeholder={ph} style={{ ...input, minHeight: 70 }} />
      ) : (
        <input value={v} onChange={(e) => on(e.target.value)} placeholder={ph} style={input} />
      )}
    </label>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const page: React.CSSProperties = { maxWidth: 680, margin: "0 auto", padding: "32px 24px 100px", fontFamily: font };
const back: React.CSSProperties = { border: "1px solid #d1d5db", background: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" };
const sub: React.CSSProperties = { color: "#6b7280", fontSize: 14, marginTop: 4 };
const sec: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#6b7280", margin: "34px 0 6px", borderTop: "1px solid #e5e7eb", paddingTop: 20 };
const hint: React.CSSProperties = { fontSize: 13, color: "#6b7280", lineHeight: 1.55, margin: "0 0 14px" };
const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 };
const input: React.CSSProperties = { width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: font };
const code: React.CSSProperties = { background: "#f3f4f6", borderRadius: 4, padding: "1px 5px", fontFamily: "ui-monospace,monospace", fontSize: 12 };
const tokenBox: React.CSSProperties = { border: "1px solid #e5e7eb", background: "#fafafa", borderRadius: 10, padding: 14, marginTop: 6 };
const primary: React.CSSProperties = { background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const ghost: React.CSSProperties = { background: "#fff", color: "#111827", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const errBox: React.CSSProperties = { marginTop: 16, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
const okBox: React.CSSProperties = { marginTop: 16, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
