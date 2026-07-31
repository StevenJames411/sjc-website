"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Site } from "@/lib/sitesShared";
import type { IntakeSummary } from "@/lib/intakeShared";
import IntakeAnswers from "./IntakeAnswers";

// The way into the builder: a wall of website cards, not a dropdown.
//
// A dropdown was fine for one site. At a hundred it is a four-hundred-entry list holding every
// client's pages in one drawer — which is also how one client's work ends up visible while editing
// another's. Every builder that does this at scale (GoHighLevel, Landingsite, SiteDrop) opens on a
// gallery with search and a New-website button, and the page switcher lives INSIDE a site.

type Props = { sites: Site[]; intake: Record<string, IntakeSummary> };
type Mode = "blank" | "template" | "import";

export default function SiteGallery({ sites, intake }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // Which card's onboarding button is mid-flight, so it can't be double-clicked.
  const [flip, setFlip] = useState("");
  const [copied, setCopied] = useState("");
  // Which business's answers are on screen. Fetched when opened, not shipped with the gallery.
  const [reading, setReading] = useState<{ id: string; name: string } | null>(null);
  // Which card is asking "are you sure", what's been typed to confirm it, and what's mid-delete.
  const [confirmDel, setConfirmDel] = useState("");
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState("");
  const [delErr, setDelErr] = useState("");

  /**
   * Delete a website and everything under it.
   *
   * ⚠️ THERE IS NO UNDO. lib/sites.ts deleteSite() purges the page registry, every page's draft
   * and published content, its imported design stylesheet and its brand before removing the
   * registry row. That is the correct order — a failed registry write must not strand live pages
   * at a URL — but it also means a mis-click costs a client's entire website.
   *
   * So the confirmation scales with what's at stake: a demo needs one deliberate second click; a
   * site with a domain on it is a real business's live address, and needs its name typed.
   */
  async function removeSite(s: Site) {
    setDeleting(s.id);
    setDelErr("");
    try {
      const r = await fetch("/api/sites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: s.id }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error || "Couldn't delete it.");
      setConfirmDel("");
      setTyped("");
      router.refresh();
    } catch (e) {
      setDelErr((e as Error).message);
    } finally {
      setDeleting("");
    }
  }

  // Open or close a business's onboarding form. The state IS the guard — the URL is her business
  // name and deliberately guessable, so this switch is the only thing standing between a stranger
  // and her record. See lib/intakeLinks.ts.
  async function setIntake(siteId: string, action: "open" | "close") {
    setFlip(siteId);
    try {
      await fetch(`/api/admin/intake?site=${encodeURIComponent(siteId)}&action=${action}`, {
        method: "POST",
        credentials: "same-origin",
      });
      router.refresh();
    } finally {
      setFlip("");
    }
  }

  async function copyLink(siteId: string) {
    await navigator.clipboard?.writeText(`${window.location.origin}/${siteId}/onboard`);
    setCopied(siteId);
    setTimeout(() => setCopied(""), 1800);
  }

  const templates = useMemo(() => sites.filter((s) => s.kind === "template"), [sites]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const live = sites.filter((s) => s.kind !== "template");
    if (!needle) return live;
    return live.filter((s) =>
      [s.name, s.description, s.domain, s.business?.name].filter(Boolean).join(" ").toLowerCase().includes(needle)
    );
  }, [sites, q]);

  return (
    <div style={page}>
      {reading ? (
        <IntakeAnswers
          siteId={reading.id}
          businessName={reading.name}
          onClose={() => setReading(null)}
        />
      ) : null}
      <div style={head}>
        <div>
          <h1 style={h1}>Websites</h1>
          <p style={sub}>Create and manage your websites</p>
        </div>
        <button type="button" style={primaryBtn} onClick={() => setOpen(true)}>
          + New website
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search websites…"
        style={search}
      />

      <div style={grid}>
        {shown.map((s) => (
          <div key={s.id} style={card}>
            <div style={cardTop}>
              {/* The badge says what the SITE is, not what a field is missing. "No domain yet"
                  described the record; "Demo" describes the thing you actually need to know when
                  scanning a hundred of these — is this out with a prospect, or is it a paying
                  client pointed at their own domain? */}
              <div style={badgeRow}>
                {s.kind === "sjc" ? <span style={chip}>Yours</span> : null}
                {s.domain ? (
                  <span style={chipLive}>{s.domain}</span>
                ) : (
                  <span style={chipDemo} title="No domain yet — served from our address and kept out of Google">
                    Demo
                  </span>
                )}
              </div>
              <h2 style={cardName}>{s.name}</h2>
              {s.description ? <p style={cardDesc}>{s.description}</p> : null}
              {/* The live address, so you can look at a site without opening the builder. Once a
                  domain is attached that becomes the real address; until then it's our path. */}
              <a
                href={s.domain ? `https://${s.domain}` : `/${s.id}`}
                target="_blank"
                rel="noreferrer"
                style={cardLink}
                onClick={(e) => e.stopPropagation()}
              >
                {s.domain ? s.domain : `/${s.id}`} ↗
              </a>
            </div>

            {/* ONBOARDING — the chase list.
                One control whose label follows the state, because there is only ever one sensible
                next move: switch it on, send her the link, or open it again when you need more.
                The count is the point — "open · 1 of 9" for four days is a client who needs a
                nudge, visible without opening anything.
                Not shown for SJC's own site, which has nobody to onboard. */}
            {s.kind !== "sjc" ? (
              <div style={intakeRow}>
                <span style={intakeLabel}>
                  {(() => {
                    const it = intake[s.id];
                    if (!it || it.status === "never opened") return "Onboarding: not started";
                    if (it.submitted) return `Onboarding: done · ${it.photos} photos`;
                    if (it.status === "closed") return "Onboarding: closed";
                    return `Onboarding: open · ${it.answered} of ${it.asked}`;
                  })()}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {(intake[s.id]?.answered || 0) > 0 || intake[s.id]?.submitted ? (
                    <button
                      type="button"
                      style={linkBtn}
                      title="Read what she's told us so far"
                      onClick={() => setReading({ id: s.id, name: s.name })}
                    >
                      View answers
                    </button>
                  ) : null}
                  {intake[s.id]?.status === "open" ? (
                    <>
                      <button
                        type="button"
                        style={linkBtn}
                        title="Copy her link, ready to text or email"
                        onClick={() => copyLink(s.id)}
                      >
                        {copied === s.id ? "Copied" : "Copy link"}
                      </button>
                      <button
                        type="button"
                        style={linkBtn}
                        disabled={flip === s.id}
                        onClick={() => setIntake(s.id, "close")}
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      style={openBtn}
                      disabled={flip === s.id}
                      title="Switch her form on so she can fill it in"
                      onClick={() => setIntake(s.id, "open")}
                    >
                      {flip === s.id
                        ? "…"
                        : intake[s.id]?.submitted
                          ? "Reopen"
                          : "Open it"}
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {confirmDel === s.id ? (
              /* The confirm REPLACES the row rather than opening a dialog, so the thing being
                 deleted stays on screen underneath the question. */
              <div style={delPanel}>
                <p style={delWarn}>
                  Delete <strong>{s.name}</strong> and everything in it — every page, its content
                  and its design. This can&rsquo;t be undone.
                </p>
                {s.domain ? (
                  <>
                    <p style={delTypeHint}>
                      This one is live at <strong>{s.domain}</strong>. Type its name to confirm.
                    </p>
                    <input
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      placeholder={s.name}
                      style={delInput}
                      autoFocus
                    />
                  </>
                ) : null}
                {delErr ? <p style={delErrText}>{delErr}</p> : null}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={{ ...ghostBtn, flex: 1 }}
                    onClick={() => {
                      setConfirmDel("");
                      setTyped("");
                      setDelErr("");
                    }}
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    style={{ ...dangerBtn, flex: 1 }}
                    disabled={deleting === s.id || (!!s.domain && typed.trim() !== s.name)}
                    onClick={() => removeSite(s)}
                  >
                    {deleting === s.id ? "Deleting…" : "Delete for good"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={{ ...editBtn, flex: 1 }}
                  onClick={() => router.push(`/edit/${s.id}/home`)}
                >
                  Edit
                </button>
                {/* The card carries the company name; everything else about the business lives one
                    click in — same as Landingsite and GHL. */}
                <button
                  type="button"
                  style={gearBtn}
                  title="Website settings — name, phone, address, domain"
                  onClick={() => router.push(`/edit/${s.id}/settings`)}
                >
                  ⚙
                </button>
                {/* Not offered for SJC's own site — deleteSite() refuses it anyway, and a button
                    that always fails is worse than no button. */}
                {s.kind !== "sjc" ? (
                  <button
                    type="button"
                    style={trashBtn}
                    title={`Delete ${s.name}`}
                    aria-label={`Delete ${s.name}`}
                    onClick={() => {
                      setConfirmDel(s.id);
                      setTyped("");
                      setDelErr("");
                    }}
                  >
                    🗑
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ))}
        {!shown.length ? (
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            {q ? "No websites match that." : "No websites yet."}
          </p>
        ) : null}
      </div>

      {templates.length ? (
        <>
          <h3 style={sectionH}>Templates</h3>
          <div style={grid}>
            {templates.map((t) => (
              <div key={t.id} style={{ ...card, borderStyle: "dashed" }}>
                <div style={cardTop}>
                  <span style={chip}>Template</span>
                  <h2 style={cardName}>{t.name}</h2>
                  {t.description ? <p style={cardDesc}>{t.description}</p> : null}
                </div>
                <button type="button" style={editBtn} onClick={() => router.push(`/edit/${t.id}/home`)}>
                  Edit template
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {open ? (
        <NewWebsite
          templates={templates}
          busy={busy}
          setBusy={setBusy}
          onClose={() => setOpen(false)}
          onDone={(id) => router.push(`/edit/${id}/home`)}
        />
      ) : null}
    </div>
  );
}

// Three ways to start, the same three these platforms offer. Import is first because it is the
// one that saves the most time: the design already exists somewhere else.
function NewWebsite({
  templates,
  busy,
  setBusy,
  onClose,
  onDone,
}: {
  templates: Site[];
  busy: boolean;
  setBusy: (b: boolean) => void;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("import");
  const [name, setName] = useState("");
  const [from, setFrom] = useState(templates[0]?.id || "");
  const [source, setSource] = useState("");
  // How a bought design comes in. "editable" maps it onto real blocks — drag, drop, restructure,
  // at roughly 95% of the original. "design" keeps the markup sealed: pixel-exact, but only the
  // words and photos can be changed. Neither is right for every design, so it's a choice.
  const [importAs, setImportAs] = useState<"editable" | "design">("design");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const looksLikeHtml = /<\s*(html|head|body|section|header|div)/i.test(source);

  async function go() {
    setErr("");
    setBusy(true);
    try {
      if (mode === "import") {
        if (!source.trim()) throw new Error("Paste the website's address, or its HTML.");
        setNote("Fetching and parsing… this can take up to a minute.");
        const r = await fetch("/api/import-html", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(
            looksLikeHtml
              ? { html: source, businessName: name.trim(), mode: importAs }
              : { url: source.trim(), businessName: name.trim(), mode: importAs }
          ),
        }).then((x) => x.json());
        if (!r.ok) throw new Error(r.error || "Import failed.");
        return onDone(r.siteId);
      }

      if (!name.trim()) throw new Error("A website name is required.");
      const r = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name.trim(), ...(mode === "template" ? { from } : {}) }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error || "Couldn't create it.");
      onDone(r.id);
    } catch (e) {
      setErr((e as Error).message);
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={scrim} onClick={busy ? undefined : onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Create new website</h2>
        <p style={{ ...sub, marginBottom: 18 }}>Start from an existing design, a template, or nothing.</p>

        <div style={tabs}>
          {(
            [
              ["import", "From import", "Pull in a design from SiteDrop or anywhere else"],
              ["template", "From template", "Start with a prebuilt layout"],
              ["blank", "From blank", "An empty website"],
            ] as [Mode, string, string][]
          ).map(([m, label, hint]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              disabled={m === "template" && !templates.length}
              style={{
                ...tab,
                ...(mode === m ? tabOn : {}),
                ...(m === "template" && !templates.length ? { opacity: 0.45, cursor: "not-allowed" } : {}),
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {m === "template" && !templates.length ? "No templates yet" : hint}
              </span>
            </button>
          ))}
        </div>

        {mode === "import" ? (
          <>
            <label style={lbl}>Website address, or paste its HTML</label>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="best-in-show-grooming.sitedrop.ai"
              style={{ ...input, minHeight: 78, fontFamily: "ui-monospace,monospace", fontSize: 12 }}
            />
            <label style={lbl}>How should it come in?</label>
            <div style={{ display: "grid", gap: 8, marginBottom: 4 }}>
              {([
                ["design", "Exactly as designed (recommended)", "Pixel-perfect. Edit every word, photo, link and colour, resize things, and your real contact form goes in. You just can't move elements around."],
                ["editable", "Rebuilt as blocks", "Full drag-and-drop, but about 95% of the original look — some detail is lost in translation."],
              ] as const).map(([v, title, why]) => (
                <label
                  key={v}
                  style={{
                    ...pickBox,
                    borderColor: importAs === v ? "#111827" : "#e5e7eb",
                    background: importAs === v ? "#f9fafb" : "#fff",
                  }}
                >
                  <input
                    type="radio"
                    name="importAs"
                    checked={importAs === v}
                    onChange={() => setImportAs(v)}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    <strong style={{ display: "block", fontSize: 14 }}>{title}</strong>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{why}</span>
                  </span>
                </label>
              ))}
            </div>
            <label style={lbl}>Business name (optional — taken from the address if blank)</label>
          </>
        ) : (
          <label style={lbl}>Website name</label>
        )}

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lucky Dog Wash House"
          style={input}
        />

        {mode === "template" ? (
          <>
            <label style={lbl}>Template</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} style={input}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {err ? <p style={errBox}>{err}</p> : null}
        {busy && note ? <p style={{ ...sub, marginTop: 10 }}>{note}</p> : null}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" style={ghostBtn} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" style={primaryBtn} onClick={go} disabled={busy}>
            {busy ? "Working…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const page: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px", fontFamily: font };
const head: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" };
const sub: React.CSSProperties = { color: "#6b7280", fontSize: 14, marginTop: 4 };
const sectionH: React.CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#6b7280", margin: "36px 0 12px" };
const search: React.CSSProperties = { width: "100%", maxWidth: 340, margin: "24px 0", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 };
const card: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, minHeight: 190, background: "#fff" };
const cardTop: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };
const badgeRow: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
const chip: React.CSSProperties = { fontSize: 11, fontWeight: 700, background: "#eef2ff", color: "#3730a3", borderRadius: 999, padding: "3px 9px" };
const chipMuted: React.CSSProperties = { ...chip, background: "#f3f4f6", color: "#6b7280" };
const chipLive: React.CSSProperties = { ...chip, background: "#f0fdf4", color: "#166534" };
const chipDemo: React.CSSProperties = { ...chip, background: "#fffbeb", color: "#92400e" };
const cardName: React.CSSProperties = { fontSize: 17, fontWeight: 700, lineHeight: 1.25 };
const cardDesc: React.CSSProperties = { fontSize: 13, color: "#6b7280", lineHeight: 1.45 };
const cardLink: React.CSSProperties = { fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 600 };
const primaryBtn: React.CSSProperties = { background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { background: "#fff", color: "#111827", border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const editBtn: React.CSSProperties = { ...primaryBtn, width: "100%", textAlign: "center" };
const pickBox: React.CSSProperties = { display: "flex", gap: 10, alignItems: "flex-start", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", cursor: "pointer" };
const gearBtn: React.CSSProperties = { ...ghostBtn, padding: "10px 13px", fontSize: 15, lineHeight: 1 };
// Quiet by default and red only once you've committed to it — a destructive control shouldn't
// compete with Edit for attention on a card you open twenty times a day.
const trashBtn: React.CSSProperties = { ...gearBtn, color: "#b91c1c", borderColor: "#e5e7eb" };
const dangerBtn: React.CSSProperties = { background: "#b91c1c", color: "#fff", border: "1px solid #b91c1c", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const delPanel: React.CSSProperties = { border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 10, padding: 12, display: "grid", gap: 10 };
const delWarn: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.45, color: "#7f1d1d" };
const delTypeHint: React.CSSProperties = { margin: 0, fontSize: 12, color: "#7f1d1d" };
const delErrText: React.CSSProperties = { margin: 0, fontSize: 13, fontWeight: 600, color: "#b91c1c" };
const delInput: React.CSSProperties = { width: "100%", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 11px", fontSize: 14 };
const scrim: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(17,24,39,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 };
const modal: React.CSSProperties = { background: "#fff", borderRadius: 14, padding: 26, width: "100%", maxWidth: 520, fontFamily: font, maxHeight: "90vh", overflowY: "auto" };
const tabs: React.CSSProperties = { display: "grid", gap: 8, marginBottom: 18 };
const tab: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, textAlign: "left", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", background: "#fff", cursor: "pointer" };
const tabOn: React.CSSProperties = { borderColor: "#111827", boxShadow: "inset 0 0 0 1px #111827" };
const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, marginTop: 12 };
const input: React.CSSProperties = { width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none" };
const errBox: React.CSSProperties = { marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "9px 12px", fontSize: 13 };

// Onboarding row. Sits between the card body and the Edit button because it's status you SCAN,
// not an action you go looking for — the eye should hit it on the way past.
const intakeRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 0 10px",
  borderTop: "1px solid #f1f5f9",
  marginTop: 10,
};

const intakeLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 600,
};

const linkBtn: React.CSSProperties = {
  padding: "5px 9px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  cursor: "pointer",
};

const openBtn: React.CSSProperties = {
  ...linkBtn,
  borderColor: "#2563eb",
  color: "#2563eb",
};
