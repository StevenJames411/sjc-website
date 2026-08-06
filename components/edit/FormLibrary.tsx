"use client";
// The form library — every reusable set of questions, on cards, the way the websites are.
//
// ⚠️ THIS FILE'S OWN HEADER USED TO SAY "there is no used-on list and no blast radius." That was
// true under the copy model and became false the moment pages could POINT at a form (2026-08-06).
// A stale comment at the top of a file is how the next change gets made against a world that no
// longer exists.
//
// A form is now a LIVE source: a page links to it, and editing the questions here updates every
// website using it. So a card DOES show what it is on, and Delete lists the pages that will lose
// it. The builder keeps a copy option for one-off variants.
//
// The one thing a card must never grow is a destination: where a lead goes is decided by which
// WEBSITE it came from, set once in that website's settings — never on the form.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FIELD_TYPE_LABELS, type FormDef } from "@/lib/formsShared";
import { ONBOARDING_FORM_ID } from "@/lib/intakeShared";

type UsageRow = { siteId: string; siteName: string; slug: string; title: string; published: boolean };

/** A page whose questions are still its own — not in this library. */
type Stray = {
  siteId: string;
  siteName: string;
  page: string;
  title: string;
  questions: number;
  from: string[];
};

/** Where the onboarding form runs and who has it open — read live, see app/edit/forms/page.tsx. */
type Onboarding = { example: string; openFor: string[]; total: number };

export default function FormLibrary({
  forms,
  title,
  onboarding,
}: {
  forms: FormDef[];
  title: string;
  onboarding?: Onboarding;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [naming, setNaming] = useState<{ from?: string; name: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [allUsage, setAllUsage] = useState<Record<string, UsageRow[] | null>>({});
  const [usage, setUsage] = useState<{
    loading: boolean;
    rows: { siteName: string; title: string; published: boolean }[] | null;
  }>({ loading: false, rows: [] });
  /** null = couldn't check. Never render that as "all consolidated". */
  const [strays, setStrays] = useState<Stray[] | null>([]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return forms;
    return forms.filter(
      (f) =>
        f.name.toLowerCase().includes(t) ||
        (f.description || "").toLowerCase().includes(t) ||
        f.fields.some((x) => x.label.toLowerCase().includes(t))
    );
  }, [forms, q]);

  // ── THREE GROUPS, NOT TWO ────────────────────────────────────────────────────────────────────
  // "Built in" used to hold the three sample forms and nothing else, and when onboarding moved
  // into the library it landed in the same bucket under the same heading — the real form Steven
  // runs on every client sitting in a row of examples, indistinguishable from them. That is the
  // exact confusion that sent him looking for his own forms and finding samples.
  //
  // Steven kept the samples deliberately: *"it's okay to have some samples in there"* — they're a
  // starting point for a new client's form. Keeping them costs nothing as long as they READ as
  // samples, which is what the separate heading buys.
  const working = shown.filter((f) => f.kind === "builtin" && f.id === ONBOARDING_FORM_ID);
  const samples = shown.filter((f) => f.kind === "builtin" && f.id !== ONBOARDING_FORM_ID);
  const mine = shown.filter((f) => f.kind !== "builtin");

  async function create() {
    if (!naming) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: naming.name, from: naming.from }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't create it.");
      setNaming(null);
      router.push(`/edit/forms/${body.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // ── WHAT IS CONNECTED TO THIS FORM ──────────────────────────────────────────────────────────
  // Loaded the moment Delete is pressed, not after. Steven asked for exactly this: *"when you try
  // to delete something, you see all the dots that are connected to it… so a human sees what's
  // connected before they delete things."* A confirmation box teaches you to click through; a
  // list of the four client pages that are about to lose their form does not.
  async function loadUsage(id: string) {
    setUsage({ loading: true, rows: [] });
    try {
      const r = await fetch(`/api/forms/usage?id=${encodeURIComponent(id)}`, {
        credentials: "same-origin",
      }).then((x) => x.json());
      setUsage({ loading: false, rows: r?.usedBy || [] });
    } catch {
      // ⚠️ UNKNOWN IS NOT ZERO. Failing to load the list must never read as "nothing uses it" —
      // that is the one wrong answer that costs a live customer their form.
      setUsage({ loading: false, rows: null });
    }
  }

  // WHICH WEBSITES EACH FORM IS ON, loaded once for the whole screen.
  //
  // Steven, looking at this page: *"I don't even know what website they're attached to… when I
  // make a new form and I label it that it was for John's website, I know who the hell it's for."*
  // Naming the form after the client is a workaround for the screen not saying it. The screen
  // should say it — a form's connections are a fact we can read, not something to remember in a
  // title.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        forms.map(async (f) => {
          try {
            const r = await fetch(`/api/forms/usage?id=${encodeURIComponent(f.id)}`, {
              credentials: "same-origin",
            }).then((x) => x.json());
            return [f.id, (r?.usedBy || []) as UsageRow[]] as const;
          } catch {
            // ⚠️ null means UNKNOWN, never "used nowhere". The card says so rather than implying
            // the form is safe to change.
            return [f.id, null] as const;
          }
        })
      );
      if (!cancelled) setAllUsage(Object.fromEntries(pairs));
    })();
    return () => {
      cancelled = true;
    };
  }, [forms]);

  // ── PAGES WHOSE QUESTIONS AREN'T IN HERE YET ─────────────────────────────────────────────────
  // The whole reason this library felt empty: Steven's real forms were each built their own way,
  // on their own pages, and nothing on any screen said so — he came here looking for his own
  // intake forms and found three samples. The machine can see which pages those are, so it says
  // so, with the button right there.
  //
  // ⚠️ THE BUTTON COPIES; IT DOES NOT MIGRATE. Those pages work. Copying puts the questions where
  // they can be read and edited in one place and changes nothing that is currently collecting.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/forms/adopt?scan=1", { credentials: "same-origin" }).then(
          (x) => x.json()
        );
        if (!cancelled) setStrays(r?.notInTheLibrary || []);
      } catch {
        // Unknown, not zero — say nothing rather than imply everything is already in here.
        if (!cancelled) setStrays(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forms]);

  async function adopt(row: Stray) {
    const name = window.prompt(
      `Name this copy — it's the ${row.questions} questions on ${row.siteName} · ${row.title}.`,
      `${row.title} form`
    );
    if (!name) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/forms/adopt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ site: row.siteId, page: row.page, name }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't copy it in.");
      // ⚠️ NEVER SILENT. If a key came out different the library copy has different spreadsheet
      // columns from the page it was copied from — a lookalike, not a copy.
      if (body.keysThatDiffer?.length) {
        setErr(
          `Copied, but these columns came out different: ${body.keysThatDiffer.join(", ")}. ` +
            `The page is unaffected — but this copy isn't an exact one.`
        );
        router.refresh();
        return;
      }
      // ⚠️ LAND ON THE THING YOU JUST MADE. Refreshing in place left Steven staring at the same
      // screen: the count went 5 → 4, and his new form was real but sitting below the fold under
      // a heading he had to scroll to find — so "it worked" and "I can't see it" were both true.
      // "+ New form" has always opened the form it created; a copy is the same act and now does
      // the same thing.
      if (body.formId) router.push(`/edit/forms/${body.formId}`);
      else router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/forms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't delete it.");
      setConfirming(null);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const Card = (f: FormDef) => (
    <div key={f.id} style={f.kind === "builtin" ? { ...card, borderStyle: "dashed" } : card}>
      <div style={badgeRow}>
        {f.kind === "builtin" ? <span style={chip}>Built in</span> : null}
        <span style={countChip}>
          {f.fields.length} question{f.fields.length === 1 ? "" : "s"}
        </span>
        {(() => {
          // ⚠️ ONBOARDING IS USED BY EVERY CLIENT AND APPEARS ON NO PAGE. Usage is found by
          // walking saved page data for a `formId`; this form is served by a route
          // (/<business>/onboard) instead, so the honest-looking "not on any site" chip would be
          // flatly false about the one form that runs on every single client.
          if (f.id === ONBOARDING_FORM_ID) {
            const open = onboarding?.openFor.length || 0;
            return (
              <span
                style={{
                  ...countChip,
                  background: open ? "#ecfdf5" : "var(--e-line-soft)",
                  color: open ? "#065f46" : "var(--e-muted)",
                }}
              >
                {open
                  ? `open for ${onboarding!.openFor.join(", ")}`
                  : "not open for anyone right now"}
              </span>
            );
          }
          const rows = allUsage[f.id];
          if (rows === undefined) return null;
          if (rows === null) return <span style={chip}>usage unknown</span>;
          if (!rows.length) return <span style={chip}>not on any site</span>;
          const sites = [...new Set(rows.map((r) => r.siteName))];
          return (
            <span style={{ ...countChip, background: "#ecfdf5", color: "#065f46" }}>
              on {sites.join(", ")}
            </span>
          );
        })()}
      </div>

      <h2 style={cardName}>{f.name}</h2>
      {f.description ? <p style={cardDesc}>{f.description}</p> : null}

      {/* ⚠️ THE ADDRESS, ON THE CARD. Onboarding is the one form that isn't on a page — it's a
          link per business — so "which website is this on?" has no answer anywhere else on this
          screen. Without it, this nine-question intake and Consulting's thirteen-question /apply
          survey are two similar forms with no way to tell which is which, which is exactly the
          mix-up that sent Steven looking for the wrong one.

          ⚠️ AND "DOES IT CREATE A PAGE?" — his next question, which deserves a direct answer on
          the card rather than a conversation. Every other form needs a page built and a form
          block placed on it. This one already HAS a page: a generated route, one per business,
          that exists from the moment the site record does. Nothing is created, nothing is
          published. Switching it on unlocks a door that was always there. */}
      {f.id === ONBOARDING_FORM_ID && onboarding ? (
        <p style={whereBox}>
          {"Every business already has its own onboarding page, at its own address:"}
          <br />
          <code style={addr}>{onboarding.example}</code>
          <br />
          {"Nothing to build and nothing to publish — switching it on unlocks it, and you text them the link. Open or close one per business on the Websites screen."}
          {onboarding.total
            ? ` ${onboarding.openFor.length} of ${onboarding.total} open now.`
            : null}
        </p>
      ) : null}

      <ul style={list}>
        {f.fields.map((x) => (
          <li key={x.fieldId} style={li}>
            <span>{x.label}</span>
            <span style={typeTag}>{FIELD_TYPE_LABELS[x.type] || x.type}</span>
          </li>
        ))}
        {f.fields.length === 0 ? <li style={{ ...li, color: "var(--e-muted)" }}>No questions yet</li> : null}
      </ul>

      <p style={btnLine}>Button: “{f.buttonLabel}”</p>

      {confirming === f.id ? (
        <div style={delPanel}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>Delete “{f.name}”?</p>
          {usage.loading ? (
            <p style={{ margin: "0 0 10px", fontSize: 13 }}>Checking what uses it…</p>
          ) : usage.rows === null ? (
            <p style={{ margin: "0 0 10px", fontSize: 13 }}>
              Couldn&apos;t check what uses this form. Don&apos;t delete it until you can.
            </p>
          ) : usage.rows.length === 0 ? (
            <p style={{ margin: "0 0 10px", fontSize: 13 }}>Nothing is linked to it.</p>
          ) : (
            <div style={{ margin: "0 0 10px", fontSize: 13 }}>
              <p style={{ margin: "0 0 6px" }}>
                <strong>{usage.rows.length}</strong>{" "}
                {usage.rows.length === 1 ? "page is" : "pages are"} linked to it and will lose their
                questions:
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {usage.rows.map((u, i) => (
                  <li key={i}>
                    {u.siteName} — {u.title}
                    {u.published ? (
                      <strong style={{ color: "#b91c1c" }}> · live</strong>
                    ) : (
                      <span style={{ color: "#6b7280" }}> · draft</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={dangerBtn} onClick={() => remove(f.id)} disabled={busy}>
              {busy ? "Deleting…" : "Delete it"}
            </button>
            <button type="button" style={smallGhost} onClick={() => setConfirming(null)}>
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <div style={cardFoot}>
          <button type="button" style={smallGhost} onClick={() => router.push(`/edit/forms/${f.id}`)}>
            Edit
          </button>
          <button
            type="button"
            style={smallGhost}
            onClick={() => setNaming({ from: f.id, name: `${f.name} copy` })}
          >
            Make a copy
          </button>
          {f.kind !== "builtin" ? (
            <button type="button" style={iconBtn} title="Delete" onClick={() => { setConfirming(f.id); void loadUsage(f.id); }}>
              🗑
            </button>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <div style={page}>
      {/* "← All websites" lived here until the rail took over global navigation. */}

      <div style={head}>
        <div>
          <h1 style={h1}>{title}</h1>
          <p style={sub}>Question sets you can drop onto any website</p>
        </div>
        <button type="button" style={primaryBtn} onClick={() => setNaming({ name: "" })}>
          + New form
        </button>
      </div>

      {/* ⚠️ THIS PARAGRAPH DESCRIBED THE OLD BEHAVIOUR AND SAT ON A LIVE SCREEN AFTER THE POINTER
          CHANGE SHIPPED — it told Steven that editing a form here never touches a website, the
          exact opposite of what now happens. Screen copy is part of the change, not a follow-up:
          wrong instructions are worse than none, because they get believed. */}
      <p style={hint}>
        Link a form to a page in the builder and the link stays <strong>live</strong> — edit the
        questions here and every website using it updates. Each card says which sites it is on.
        The builder also has a &ldquo;start from a preset&rdquo; option that takes a one-off copy
        instead, for when a single page needs its own variant.
      </p>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search forms…" style={search} />

      {err ? <p style={errBox}>{err}</p> : null}

      {strays === null ? (
        <p style={strayBox}>
          Couldn&apos;t check which pages have questions that aren&apos;t in here. Nothing is wrong
          with the forms below — this one check didn&apos;t answer.
        </p>
      ) : strays.length ? (
        <div style={strayBox}>
          {/* ⚠️ BUILT AS ONE STRING, NOT AS JSX AROUND AN EXPRESSION. Written inline it rendered
              as "5 pagesask questions" on the live screen — the space between the expression and
              the next word was lost. A heading that reads as a typo makes the whole panel look
              unfinished, and it's the first thing on the screen. */}
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14 }}>
            {`${strays.length} ${strays.length === 1 ? "page asks" : "pages ask"} questions that aren't in here yet`}
          </p>
          <p style={{ ...hint, margin: "0 0 12px" }}>
            Those pages work fine and nothing about them changes. This just puts a copy of their
            questions in your library — same wording, same spreadsheet columns — so you can read
            and edit them in one place instead of opening each page.
          </p>
          {strays.map((s) => (
            <div key={`${s.siteId}/${s.page}`} style={strayRow}>
              <span>
                <strong>{s.siteName}</strong> · {s.title}{" "}
                <span style={{ color: "var(--e-muted)" }}>
                  — {s.questions} question{s.questions === 1 ? "" : "s"}
                </span>
              </span>
              <button type="button" style={smallBtn} disabled={busy} onClick={() => adopt(s)}>
                Copy into the library
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* ⚠️ YOURS COMES FIRST, DIRECTLY UNDER THE PANEL THAT MAKES THEM. The panel above says
          "copy these in"; the copies then appeared two sections down, below the fold, under a
          heading you had to go looking for — so Steven copied one, watched the count drop 5 → 4,
          and reported that it hadn't arrived. It had. The result of an action belongs next to the
          action. */}
      {mine.length ? (
        <>
          <h2 style={sec}>Yours</h2>
          <div style={grid}>{mine.map(Card)}</div>
        </>
      ) : null}

      {working.length ? (
        <>
          <h2 style={sec}>In use — running right now</h2>
          <div style={grid}>{working.map(Card)}</div>
        </>
      ) : null}

      <h2 style={sec}>Samples to start from</h2>
      <p style={{ ...hint, marginTop: -2 }}>
        Not used by anything. Copy one when a new client needs a form, or edit it in place.
      </p>
      <div style={grid}>{samples.map(Card)}</div>

      <p style={footNote}>
        Leads land in each client&apos;s own Google Sheet and inbox. This is where the{" "}
        <strong>questions</strong> live — not the answers. Where a client&apos;s leads go is set
        once, in that website&apos;s settings.
      </p>

      {naming ? (
        <div style={scrim} onClick={() => setNaming(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
              {naming.from ? "Copy this form" : "New form"}
            </h2>
            <p style={{ ...hint, marginTop: 6 }}>
              {naming.from
                ? "The copy keeps the same questions and the same spreadsheet columns."
                : "Give it a name you'll recognise in the builder."}
            </p>
            <input
              autoFocus
              value={naming.name}
              onChange={(e) => setNaming({ ...naming, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && naming.name.trim()) create();
              }}
              placeholder="Quote request"
              style={input}
            />
            {err ? <p style={errBox}>{err}</p> : null}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="button" style={primary} onClick={create} disabled={busy || !naming.name.trim()}>
                {busy ? "Creating…" : "Create it"}
              </button>
              <button type="button" style={ghost} onClick={() => setNaming(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const page: React.CSSProperties = { maxWidth: 1080, margin: "0 auto", padding: "32px 24px 100px", fontFamily: font };
const back: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 };
const head: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const hint: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", lineHeight: 1.55, margin: "16px 0 0", maxWidth: 720 };
const sec: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--e-muted)", margin: "34px 0 12px", borderTop: "1px solid var(--e-line)", paddingTop: 20 };
const search: React.CSSProperties = { width: "100%", maxWidth: 340, border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: font, margin: "18px 0 22px" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 };
const card: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 18, background: "var(--e-panel)", display: "flex", flexDirection: "column" };
const badgeRow: React.CSSProperties = { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" };
const chip: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", background: "var(--e-line-soft)", color: "var(--e-muted)", borderRadius: 999, padding: "3px 9px" };
const countChip: React.CSSProperties = { ...chip, background: "var(--e-info-bg)", color: "var(--e-info-ink)" };
const cardName: React.CSSProperties = { fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" };
const cardDesc: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", margin: "6px 0 0", lineHeight: 1.5 };
const list: React.CSSProperties = { listStyle: "none", padding: 0, margin: "14px 0 0", borderTop: "1px solid var(--e-line-soft)" };
const li: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13, padding: "7px 0", borderBottom: "1px solid var(--e-panel-2)" };
const typeTag: React.CSSProperties = { fontSize: 11, color: "var(--e-muted)", whiteSpace: "nowrap" };
const btnLine: React.CSSProperties = { fontSize: 12, color: "var(--e-muted)", margin: "12px 0 0" };
const cardFoot: React.CSSProperties = { display: "flex", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--e-line-soft)" };
const smallGhost: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const iconBtn: React.CSSProperties = { ...smallGhost, marginLeft: "auto", padding: "6px 10px" };
const delPanel: React.CSSProperties = { marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--e-bad-line)", background: "var(--e-bad-bg)", borderRadius: 8, padding: 12 };
const dangerBtn: React.CSSProperties = { background: "var(--e-danger)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const primaryBtn: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
const primary: React.CSSProperties = primaryBtn;
const ghost: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: font, marginTop: 10 };
const errBox: React.CSSProperties = { marginTop: 16, background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
const strayBox: React.CSSProperties = { marginTop: 18, border: "1px solid var(--e-line)", background: "var(--e-panel-2)", borderRadius: 12, padding: "14px 16px", fontSize: 13 };
const whereBox: React.CSSProperties = { margin: "10px 0 0", fontSize: 12, lineHeight: 1.7, color: "var(--e-muted)", borderLeft: "3px solid var(--e-line)", paddingLeft: 10 };
const addr: React.CSSProperties = { fontFamily: "ui-monospace,monospace", fontSize: 11, background: "var(--e-line-soft)", borderRadius: 4, padding: "2px 5px", wordBreak: "break-all" };
const strayRow: React.CSSProperties = { display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", padding: "8px 0", borderTop: "1px solid var(--e-line)" };
const smallBtn: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "7px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
const footNote: React.CSSProperties = { fontSize: 12, color: "var(--e-muted)", lineHeight: 1.6, marginTop: 34, borderTop: "1px solid var(--e-line)", paddingTop: 16, maxWidth: 720 };
const scrim: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(17,24,39,.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const modal: React.CSSProperties = { background: "var(--e-panel)", borderRadius: 14, padding: 24, width: "100%", maxWidth: 440, fontFamily: font };
