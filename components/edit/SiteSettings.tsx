"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { reachability, type Site } from "@/lib/sitesShared";
import { FONTS, FONT_VAR, type Brand, type BrandFont } from "@/lib/brandShared";
import { publicUrlFor } from "@/lib/hostShared";

// EVERYTHING GLOBAL TO ONE WEBSITE, ON ONE SCREEN.
//
// The card in the gallery carries the company name and nothing else; you open the website and set
// its details here — the same shape GoHighLevel and Landingsite use. Before this, the business's
// phone number and address existed only as text typed inside individual blocks, which is why
// copying a finished site dragged the previous owner's details along with it.
//
// Fill this in once and the whole website can use it: any text on any block can carry a token
// like {{business.phone}} and it resolves at render. Change the number here, every page updates.

type Props = {
  site: Site;
  pageCount: number;
  pages: { slug: string; title: string }[];
  brand: Brand;
};

const TOKENS: [string, keyof Site["business"]][] = [
  ["{{business.name}}", "name"],
  ["{{business.phone}}", "phoneDisplay"],
  ["{{business.email}}", "email"],
  ["{{business.address}}", "address"],
  ["{{business.hours}}", "hours"],
  // Listed like the rest so the review form's button reads as a normal reference rather than
  // machinery — it is the one token that resolves to a LINK instead of words.
  ["{{business.reviewUrl}}", "reviewUrl"],
];

export default function SiteSettings({ site, pageCount, pages, brand }: Props) {
  const router = useRouter();
  const [s, setS] = useState<Site>(site);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [sweepMsg, setSweepMsg] = useState("");
  const [fonts, setFonts] = useState<Brand>(brand);
  const [fontMsg, setFontMsg] = useState("");

  /**
   * ONE CLICK. Pick a face and the live website is wearing it — no draft, no second Publish.
   *
   * ⛔ THE THREE SIDESTEPS THIS DELETES, AND WHY EACH ONE HAD TO GO (Steven, 2026-08-13:
   * *"just like a customer, I set my own website to what I like and I'm done with it… with one
   * click they change the damn font family. We don't have to do three side steps in between."*)
   *
   *   1. A SEPARATE SCREEN AT A URL WITH NO LINK TO IT. The picker lived at /edit/<site>/brand and
   *      nothing in the studio pointed there, so the honest summary was that it did not exist:
   *      *"obviously I can't get to something I can't see."*
   *   2. A DRAFT THAT LOOKED SAVED. Picking wrote a draft; publishing was a separate button on
   *      that same invisible screen. sjc-2026 sat with Space Grotesk saved and Lexend live for
   *      weeks — the screen agreed with him and the website disagreed, with nothing on either to
   *      say so.
   *   3. AN IMPORTED SECTION IGNORING THE ANSWER ANYWAY, until stripFontFamily (lib/designCss)
   *      stopped the design's compiled sheet from out-ranking the brand.
   *
   * So this writes the draft and publishes in the same click. The rest of this screen already
   * behaves that way — a phone number typed here is live when it saves — and a control that
   * behaves differently from its neighbours is the thing that teaches nobody to trust it.
   */
  async function pickFont(next: Brand) {
    const before = fonts;
    setFonts(next); // optimistic: the sample text below re-renders in the new face immediately
    setFontMsg("Saving…");
    try {
      const put = await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ site: s.id, brand: next }),
      }).then((x) => x.json());
      if (!put.ok) throw new Error(put.error || "Couldn't save the font.");
      const pub = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ site: s.id, action: "publish" }),
      }).then((x) => x.json());
      if (!pub.ok) throw new Error("Saved, but couldn't put it live.");
      setFontMsg("Live on the website.");
      router.refresh();
    } catch (e) {
      // ⚠️ PUT THE PICKER BACK. Leaving it on the face that failed to save is the same lie as #2.
      setFonts(before);
      setFontMsg((e as Error).message);
    }
  }

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
          holdIndexing: !!s.holdIndexing,
          leadEmail: (s.leadEmail || "").trim(),
          sheetId: (s.sheetId || "").trim(),
          // ⚠️ MISSING FROM THIS PAYLOAD UNTIL 2026-08-12 — the third lead destination, and the one
          // the offer is sold on. Without it here the new field would type, look saved, and drop
          // the value on the floor: the worst version of a bug, because the screen agrees with you.
          ghlWebhookUrl: (s.ghlWebhookUrl || "").trim(),
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
      {/* A DESTINATION, so it lives on the business and not on the shared review form — see
          BusinessFacts.reviewUrl. Blank simply hides the button on the thank-you screen. */}
      <Field
        label="Google review link — where a happy customer is sent"
        v={s.business.reviewUrl || ""}
        on={(v) => biz("reviewUrl", v)}
        ph="https://g.page/r/…/review — blank hides the button"
      />

      <div style={tokenBox}>
        <strong style={{ fontSize: 13 }}>Tokens you can paste into any text block</strong>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
          {TOKENS.map(([t, k]) => (
            <li key={t}>
              <code style={code}>{t}</code>{" "}
              <span style={{ color: "var(--e-muted)" }}>→ {s.business[k] || <em>not set</em>}</span>
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
        <div style={{ borderTop: "1px solid var(--e-line)", marginTop: 14, paddingTop: 14 }}>
          <button type="button" style={ghost} onClick={sweep} disabled={busy}>
            {busy ? "Working…" : "Apply these to existing pages"}
          </button>
          <p style={{ ...hint, margin: "8px 0 0" }}>
            Finds these values typed into the pages of this website and swaps them for the tokens
            above. New imports arrive already wired, so this is only for older pages.
          </p>
          {sweepMsg ? <p style={{ ...hint, margin: "8px 0 0", color: "var(--e-ok-ink)" }}>{sweepMsg}</p> : null}
        </div>
      </div>

      <h2 style={sec}>Web address</h2>
      <Field
        label="Custom domain (leave blank until they've bought one)"
        v={s.domain || ""}
        on={(v) => setS({ ...s, domain: v })}
        ph="theirbusiness.com"
      />
      {/* ⛔ THIS USED TO ASSUME `kind === "sjc"` MEANT "OWNS THE DOMAIN", AND IT LIED (fixed
          2026-08-12). sjc-2026 is kind `client` and serves stevenjamesconsulting.com — so this
          panel told Steven, on the site that IS the live site, that pointing the domain at it "is
          a separate step and isn't wired up yet".

          It also said a site is reachable at `/<id>`, which predates demos moving to their own
          subdomain. Both are now derived from the same helpers the server actually routes with, so
          this panel cannot disagree with what is being served. */}
      <p style={hint}>
        {(() => {
          const r = reachability(s);
          const url = publicUrlFor(s).replace(/^https:\/\//, "");
          if (r.onDomain) {
            return (
              <>
                Serving <strong>{url}</strong> right now
                {r.indexable ? "" : ", and kept out of Google by the box below"}.
              </>
            );
          }
          if (r.status === "published") {
            return (
              <>
                Published, but no domain is pointed at it yet — so it is still answering at{" "}
                <code style={code}>{url}</code>.
              </>
            );
          }
          if (r.status === "demo") {
            return (
              <>
                Served at <code style={code}>{url}</code>, and kept out of Google on purpose — it
                carries a real business&apos;s details on our address. Add their domain once they buy.
              </>
            );
          }
          if (r.status === "archived") {
            return <>Archived — its address returns 404 for everyone. Put it back to Draft to work on it.</>;
          }
          return (
            <>
              Draft — <strong>only you</strong> can open it. Its address returns 404 for everyone
              else. Set it to Demo in the Design Library when you want to send someone the link.
            </>
          );
        })()}
      </p>

      {/* ⛔ DOMAIN AND VISIBILITY ARE TWO DIFFERENT DECISIONS. Being out of Google used to be a
          side effect of having no domain, so pointing a client's real domain at a half-finished
          build made it indexable the same second — the only way to stay hidden was to keep the
          domain off, which is the opposite of what you want while you finish it. Launch day is
          unticking this box. */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 12 }}>
        <input
          type="checkbox"
          checked={!!s.holdIndexing}
          onChange={(e) => setS({ ...s, holdIndexing: e.target.checked })}
          style={{ marginTop: 3 }}
        />
        <span>
          <strong>Not indexed until launch</strong>
          <span style={{ display: "block", ...hint, marginBottom: 0, marginTop: 3 }}>
            Point the domain now, let the world in later. While this is on, the site tells search
            engines and AI crawlers to stay away and publishes no sitemap — even on its own domain.
          </span>
        </span>
      </label>

      <h2 style={sec}>Where the leads go</h2>
      <p style={hint}>
        Blank means enquiries from this website stay in your own intake — right for a demo, and for
        your own pages. Put the client&apos;s address in when they buy, and every enquiry goes
        straight to them with reply-to set to the customer, so hitting reply on their phone
        answers the person who asked.{" "}
        <strong>Your copy is kept either way</strong> — that&apos;s the record at renewal and the
        answer to &quot;I never got that lead&quot;.
      </p>
      <Field
        label="Client's inbox — where their leads land"
        v={s.leadEmail || ""}
        on={(v) => setS({ ...s, leadEmail: v })}
        ph="the client's own inbox — leave blank while it's a demo"
      />
      {/* Until now this could ONLY be set by the onboard-client route, which also CREATES a site
          if the name doesn't match an existing slug — so pointing an existing website at a
          spreadsheet meant risking a duplicate site, or an admin call with a bearer token. Every
          business ends up wanting its own sheet eventually, including Steven's own; that makes it
          a setting, not a one-shot side effect of onboarding. */}
      <Field
        label="Leads spreadsheet ID — this business's own sheet"
        v={s.sheetId || ""}
        on={(v) => setS({ ...s, sheetId: v })}
        ph="the long id out of the sheet's URL — blank means it has no sheet of its own yet"
      />
      <p style={hint}>
        From the spreadsheet&apos;s address:
        docs.google.com/spreadsheets/d/<strong>THIS-PART</strong>/edit. Every lead from this
        website also writes a row here, which is what a business looks at when it wants its own
        record rather than an inbox.
      </p>

      {/* ⛔ THIS FIELD DID NOT EXIST UNTIL 2026-08-12, AND THE VALUE HAS BEEN LOAD-BEARING ALL ALONG.
          `ghlWebhookUrl` is read by lead delivery and checked by the heartbeat board — it is the
          third leg of "where the leads go", and the one the $97 offer actually sells: every lead in
          one inbox. It could only ever be set by an admin route with a bearer token.
          
          So the card's GoHighLevel light could never come on by anything Steven could do on screen,
          and the board's warning about it named a fix that existed nowhere. A setting that only
          code can write makes the person who writes code a single point of failure. */}
      <Field
        label="GoHighLevel inbound webhook — their CRM"
        v={s.ghlWebhookUrl || ""}
        on={(v) => setS({ ...s, ghlWebhookUrl: v })}
        ph="https://services.leadconnectorhq.com/hooks/… — blank means no CRM for this one"
      />
      <p style={hint}>
        In GoHighLevel: <strong>Automation &rarr; Workflows &rarr; Inbound Webhook</strong>, then
        copy the URL it gives you. Every enquiry from this website is posted there as a contact, so
        it lands in the same inbox as their calls and texts. Blank is right for a demo and for the
        tier without a CRM &mdash; the email and the sheet still get the lead.
      </p>

      <h2 style={sec}>Fonts</h2>
      <p style={hint}>
        Pick a face and the website is wearing it — every page, every section, including the
        imported ones. There is nothing else to press.
      </p>
      <FontPicker
        label="Headlines"
        value={fonts.headingFont || ""}
        follow="Same as body text"
        onPick={(v) => pickFont({ ...fonts, headingFont: v as BrandFont | "" })}
      />
      <FontPicker
        label="Body text"
        value={fonts.font}
        onPick={(v) => pickFont({ ...fonts, font: v as BrandFont })}
      />
      {fontMsg ? <p style={{ ...hint, margin: "2px 0 0" }}>{fontMsg}</p> : null}

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

/**
 * The eight faces, each drawn in ITSELF.
 *
 * ⚠️ A FONT NAME IS NOT A FONT. "Merriweather" set in the UI's own face tells you nothing about
 * what the website will look like, so every option renders in the family it names — the decision
 * is visual and the control has to be too. The families are already loaded by app/layout, so this
 * costs no extra request.
 *
 * ⛔ "Same as body text" IS THE EMPTY STRING, NEVER A COPY OF THE BODY FONT'S VALUE. Copying it in
 * freezes the headlines the first time the body face changes — pick a new body font and the
 * headlines silently stay behind. Blank means FOLLOW, which is what BrandStyle already treats it
 * as, and blank is what every brand saved before today holds.
 */
function FontPicker({
  label,
  value,
  follow,
  onPick,
}: {
  label: string;
  value: string;
  follow?: string;
  onPick: (v: string) => void;
}) {
  const opts = follow ? [{ value: "", label: follow, note: "" }, ...FONTS] : FONTS;
  return (
    <div style={{ margin: "0 0 18px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {opts.map((f) => {
          const on = value === f.value;
          return (
            <button
              key={f.value || "follow"}
              type="button"
              onClick={() => onPick(f.value)}
              title={f.note}
              style={{
                fontFamily: f.value ? `var(${FONT_VAR[f.value as BrandFont]})` : "inherit",
                fontSize: 15,
                padding: "9px 14px",
                borderRadius: 8,
                cursor: "pointer",
                border: `1px solid ${on ? "var(--e-accent, #3b82f6)" : "var(--e-line)"}`,
                background: on ? "var(--e-accent, #3b82f6)" : "transparent",
                color: on ? "#fff" : "inherit",
                fontWeight: on ? 700 : 500,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const page: React.CSSProperties = { maxWidth: 680, margin: "0 auto", padding: "32px 24px 100px", fontFamily: font };
const back: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const sec: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--e-muted)", margin: "34px 0 6px", borderTop: "1px solid var(--e-line)", paddingTop: 20 };
const hint: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", lineHeight: 1.55, margin: "0 0 14px" };
const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: font };
const code: React.CSSProperties = { background: "var(--e-line-soft)", borderRadius: 4, padding: "1px 5px", fontFamily: "ui-monospace,monospace", fontSize: 12 };
const tokenBox: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel-2)", borderRadius: 10, padding: 14, marginTop: 6 };
const primary: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const ghost: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const errBox: React.CSSProperties = { marginTop: 16, background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
const okBox: React.CSSProperties = { marginTop: 16, background: "var(--e-ok-bg)", border: "1px solid var(--e-ok-line)", color: "var(--e-ok-ink)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
