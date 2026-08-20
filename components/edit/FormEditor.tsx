"use client";
// Edit one form. Built for speed: everything is on one screen, nothing opens a dialog, and a
// question is added in one click from the standard list.
//
// ── THE ONE THING THAT IS NOT EDITABLE, AND WHY ───────────────────────────────────────────────
// Every question carries a `fieldId`. That string IS the column in the client's Google Sheet —
// the Apps Script matches columns by it (kept in the header cell's note), which is exactly what
// lets you reword a question and keep its history. So the label is freely editable forever and
// the key never changes. Deriving the key from the label is the bug this replaces: rewording
// "Best phone number" to "Cell" used to orphan the column and silently start a new one.
//
// The key is shown, greyed, under each question. It is shown rather than hidden so that when
// Steven is looking at a spreadsheet header note trying to work out which column is which, the
// answer is on this screen. It is not editable, and the server refuses to change it either way.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ONBOARDING_FORM_ID } from "@/lib/intakeShared";
import {
  CHOICE_TYPES,
  FIELD_TYPE_LABELS,
  FIELD_TYPE_ONBOARDING_ONLY,
  SATISFIED_BY_CHOICES,
  STANDARD_FIELDS,
  stepsOf,
  surveyScreensOf,
  type FormDef,
  type FormField,
  type FormFieldType,
} from "@/lib/formsShared";

const TYPES = Object.keys(FIELD_TYPE_LABELS) as FormFieldType[];

type UsageRow = { siteName: string; title: string; published: boolean };
type Business = {
  id: string;
  name: string;
  url: string;
  status: "open" | "closed" | "never opened";
  answered: number;
  asked: number;
  submitted: boolean;
  /** "submitted" · "not a fit" · "no activity" · "closed by Steven". Shown, never swallowed. */
  closedBecause: string;
};
type Onboarding = {
  businesses: Business[];
  /** Websites deliberately left off the list — SJC's own. Named, never silently dropped. */
  excluded: string[];
};

export default function FormEditor({
  form,
  onboarding,
}: {
  form: FormDef;
  /** Present only on the onboarding form — see app/edit/forms/[form]/page.tsx. */
  onboarding?: Onboarding;
}) {
  const router = useRouter();
  const [f, setF] = useState<FormDef>(form);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  /** null = couldn't check. ⚠️ Never render unknown as "used nowhere". */
  const [usage, setUsage] = useState<UsageRow[] | null | undefined>(undefined);
  /** Which business's switch is mid-flight, so it can't be double-clicked. */
  const [flip, setFlip] = useState("");
  const [copied, setCopied] = useState("");

  /**
   * Switch one business's onboarding link on or off, from here.
   *
   * ⚠️ THE SAME ONE CALL THE WEBSITES SCREEN MAKES. Two screens, one endpoint — a second way to
   * change this state would be a second thing that can disagree with the first, and "her form
   * says open here and closed there" is unanswerable.
   */
  async function setIntake(siteId: string, action: "open" | "close") {
    setFlip(siteId);
    setErr("");
    try {
      const res = await fetch(
        `/api/admin/intake?site=${encodeURIComponent(siteId)}&action=${action}`,
        { method: "POST", credentials: "same-origin" }
      );
      const body = await res.json().catch(() => ({}));
      if (!body?.ok) throw new Error(body?.error || "Couldn't change it.");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setFlip("");
    }
  }

  // WHERE THIS FORM RUNS. The library cards say it; this screen didn't, and this is the screen
  // you're on when you're about to change a question — the exact moment the blast radius matters.
  useEffect(() => {
    if (form.id === ONBOARDING_FORM_ID) return; // its "where" is a link, handed in as a prop
    let cancelled = false;
    fetch(`/api/forms/usage?id=${encodeURIComponent(form.id)}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => !cancelled && setUsage(d?.usedBy || []))
      .catch(() => !cancelled && setUsage(null));
    return () => {
      cancelled = true;
    };
  }, [form.id]);

  const dirty = JSON.stringify(f) !== JSON.stringify(form);

  function fields(next: FormField[]) {
    setF({ ...f, fields: next });
    setMsg("");
  }
  function patchField(i: number, patch: Partial<FormField>) {
    fields(f.fields.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  }
  function move(i: number, by: number) {
    const to = i + by;
    if (to < 0 || to >= f.fields.length) return;
    const next = f.fields.slice();
    const [row] = next.splice(i, 1);
    next.splice(to, 0, row);
    fields(next);
  }
  function addStandard(std: FormField) {
    if (f.fields.some((x) => x.fieldId === std.fieldId)) return;
    fields([...f.fields, { ...std }]);
  }
  function addCustom() {
    // No fieldId — the server mints one. Sending a guess from the browser is how a key could be
    // forged onto somebody else's column, so normalizeFields ignores unknown ones anyway.
    fields([...f.fields, { fieldId: "", label: "New question", type: "text" } as FormField]);
  }

  async function save() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/forms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: f.id,
          name: f.name,
          description: f.description,
          fields: f.fields,
          buttonLabel: f.buttonLabel,
          note: f.note,
          successHeading: f.successHeading,
          successBody: f.successBody,
          oneQuestionPerScreen: !!f.oneQuestionPerScreen,
          altSuccess: f.altSuccess,
        }),
      });
      const body = await res.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't save.");
      setMsg("Saved.");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const unused = STANDARD_FIELDS.filter((s) => !f.fields.some((x) => x.fieldId === s.fieldId));
  // A form built out of titled screens — /apply is the one that is. Everything else is a flat
  // list and shouldn't grow a heading box on every row it will never use.
  const usesSteps = f.fields.some((x) => !!x.step);

  // Where the LIVE form will break, computed with its own function so the two can never
  // disagree. Steven, looking at this screen: *"there's nowhere on the form that I could tell
  // what page it shows up on."* He could reorder questions but not see the consequence, which
  // makes the split feel arbitrary. A second implementation of the rule here would drift and lie.
  const screens = surveyScreensOf(f.fields || []);
  const screenCount = screens.length;
  const pageStarts = new Map<number, number>();
  if (screenCount > 1) {
    let n = 0;
    screens.forEach((sc, si) => {
      pageStarts.set(n, si);
      n += sc.fields.length;
    });
  }

  return (
    <div style={page}>
      <button type="button" style={back} onClick={() => router.push("/edit/forms")}>
        ← All forms
      </button>

      <h1 style={h1}>{f.name || "Untitled form"}</h1>
      <p style={sub}>
        {f.kind === "builtin" ? "Built in — your edits are kept on top of it." : "Your form."}
      </p>

      {/* ── WHERE THIS RUNS ────────────────────────────────────────────────────────────────────
          ⚠️ Steven, on this screen: *"I don't see anywhere to attach it to a business."* For
          onboarding there is nothing to attach — one form serves every client and the LINK picks
          the client. A screen that just omits the control he's hunting for teaches him it's
          hidden, so it says so out loud instead. For every other form, "where" is a page, and a
          question is about to be changed on all of them at once. */}
      {onboarding ? (
        <div style={whereBox}>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--e-ink)", fontSize: 14 }}>
            Who this form is switched on for
          </p>
          <p style={{ margin: "4px 0 12px" }}>
            {"One form, every client. Each business already has its own onboarding page waiting at its own address — there's no page to build and nothing to publish. Switching it on unlocks it, then you text them the link. The questions below are the same for everyone, and changing one shows up in every open link straight away."}
          </p>

          {onboarding.businesses.length === 0 ? (
            <p style={{ margin: 0 }}>No client websites yet.</p>
          ) : null}

          {onboarding.businesses.map((b) => (
            <div key={b.id} style={bizRow}>
              <span>
                <strong style={{ color: "var(--e-ink)" }}>{b.name}</strong>
                <span style={{ marginLeft: 8 }}>
                  {b.status === "never opened"
                    ? "not started"
                    : b.submitted
                      ? "done — she's sent it in"
                      : b.status === "closed"
                        ? // ⚠️ NAME THE REASON. "Closed" on its own sent Steven back to the code
                          // to work out what had shut a link he'd just opened. The record has
                          // carried the reason all along; it had simply never reached a screen.
                          `closed — ${b.closedBecause || "reason not recorded"}`
                        : `open · ${b.answered} of ${b.asked} answered`}
                </span>
                {/* ⚠️ IT HAS TO LOOK LIKE A LINK, NOT JUST BE ONE. The first version was a real
                    <a href> styled as grey monospace, so Steven — looking straight at it — asked
                    again for a clickable link: *"I don't want to copy and paste the URL into a
                    browser. I just want to click a link and have it open in another tab."*
                    A control nobody can recognise is the same as a control that isn't there.
                    Same style as the website cards on the Websites screen, arrow included,
                    because that is the thing he pointed at and said "like that". */}
                {b.status === "open" ? (
                  <span style={{ display: "block", marginTop: 3 }}>
                    <a href={b.url} target="_blank" rel="noopener noreferrer" style={cardLink}>
                      {`${b.url.replace(/^https:\/\//, "")} ↗`}
                    </a>
                  </span>
                ) : null}
              </span>
              <span style={{ display: "flex", gap: 6 }}>
                {b.status === "open" ? (
                  <>
                    <button
                      type="button"
                      style={smallGhost}
                      onClick={() => {
                        navigator.clipboard?.writeText(b.url);
                        setCopied(b.id);
                        setTimeout(() => setCopied(""), 1800);
                      }}
                      title="Copy her link, ready to text"
                    >
                      {/* ⚠️ "Copy link" ON A FORMS SCREEN READS AS "copy into the library",
                          which is a button in the panel above doing something completely
                          different. Steven read it exactly that way. Say what lands on the
                          clipboard: a web address to text her. */}
                      {copied === b.id ? "Address copied" : "Copy her web address"}
                    </button>
                    <button
                      type="button"
                      style={smallGhost}
                      disabled={flip === b.id}
                      onClick={() => setIntake(b.id, "close")}
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    style={primary}
                    disabled={flip === b.id}
                    title="Switch her form on so she can fill it in"
                    onClick={() => setIntake(b.id, "open")}
                  >
                    {flip === b.id ? "…" : b.submitted ? "Reopen" : "Open it"}
                  </button>
                )}
              </span>
            </div>
          ))}

          {/* ⚠️ SAY WHAT ISN'T ON THE LIST. Steven counted five websites, saw four rows, and read
              it as a bug — reasonably, because a list that quietly drops a row teaches you not to
              trust the list. Nothing was missing; you don't onboard yourself. An omission you can
              see is fine, a silent one isn't. */}
          {onboarding.excluded.length ? (
            <p style={{ margin: "10px 0 0", fontSize: 12 }}>
              {`${onboarding.excluded.join(" and ")} ${
                onboarding.excluded.length === 1 ? "isn't" : "aren't"
              } listed — that's your own business, with nobody to onboard. To ask these questions on one of your own pages, copy this form and link the copy to a form on that page.`}
            </p>
          ) : null}

          {/* Same lesson as the library heading: one string, no JSX seams to lose a space in.
              It rendered as "Websitesscreen" on the live page. */}
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>
            {"Same switches as the Websites screen — whichever one you're standing on."}
          </p>
        </div>
      ) : usage === undefined ? null : usage === null ? (
        <div style={whereBox}>
          Couldn&apos;t check which pages use this form. Worth knowing before you reword a
          question — an edit here changes every page linked to it.
        </div>
      ) : usage.length ? (
        <div style={whereBox}>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--e-ink)" }}>
            Editing this changes {usage.length} live {usage.length === 1 ? "page" : "pages"}:
          </p>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {usage.map((u, i) => (
              <li key={i}>
                {u.siteName} — {u.title}
                {u.published ? (
                  <strong style={{ color: "var(--e-danger)" }}> · live</strong>
                ) : (
                  <span> · draft</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={whereBox}>
          Not linked to any page yet. To use it, open a page in the builder, click its form, and
          pick this one under <strong>&ldquo;Linked to a form in your library&rdquo;</strong>.
        </div>
      )}

      <h2 style={sec}>Questions</h2>
      <p style={hint}>
        Reword anything you like — the spreadsheet column stays with its answers. Drag order with
        the arrows; the order here is the order on the page.
      </p>

      {f.fields.map((x, i) => (
        <div key={`${x.fieldId || "new"}-${i}`}>
        {pageStarts.has(i) ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "26px 0 14px" }}>
            <div style={{ flex: 1, height: 1, background: "#2a3140" }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#7f8ea3", whiteSpace: "nowrap" }}>
              Screen {(pageStarts.get(i) ?? 0) + 1} of {screenCount}
            </span>
            <div style={{ flex: 1, height: 1, background: "#2a3140" }} />
          </div>
        ) : null}
        <div style={row}>
          <div style={rowHead}>
            <input
              value={x.label}
              onChange={(e) => patchField(i, { label: e.target.value })}
              placeholder="The question, in their words"
              style={{ ...input, fontWeight: 600 }}
            />
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" style={tiny} onClick={() => move(i, -1)} disabled={i === 0} title="Up">
                ↑
              </button>
              <button
                type="button"
                style={tiny}
                onClick={() => move(i, 1)}
                disabled={i === f.fields.length - 1}
                title="Down"
              >
                ↓
              </button>
              <button
                type="button"
                style={tiny}
                onClick={() => fields(f.fields.filter((_, n) => n !== i))}
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>

          <div style={rowMeta}>
            <select
              value={x.type}
              onChange={(e) => patchField(i, { type: e.target.value as FormFieldType })}
              style={select}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {FIELD_TYPE_LABELS[t]}
                </option>
              ))}
            </select>

            {i > 0 ? (
              /* An AUTHORED break, which stops the weight-balancer guessing. Without it the
                 divider follows the content — move a question up and the boundary comes with it,
                 so a fourth question can never reach screen one however many times you press the
                 arrow. */
              <label style={checkLbl} title="Push this question, and everything after it, onto a new screen">
                <input
                  type="checkbox"
                  checked={!!x.newScreen}
                  onChange={(e) => patchField(i, { newScreen: e.target.checked })}
                />
                Start a new screen here
              </label>
            ) : null}

            <label style={checkLbl}>
              <input
                type="checkbox"
                checked={!!x.required}
                onChange={(e) => patchField(i, { required: e.target.checked })}
              />
              Must be filled in
            </label>

            <span style={keyTag} title="The column this answer lands in. Fixed on purpose.">
              column: {x.fieldId || "made when you save"}
            </span>
          </div>

          <input
            value={x.help || ""}
            onChange={(e) => patchField(i, { help: e.target.value })}
            placeholder="Helper line under the question (optional)"
            style={{ ...input, marginTop: 8, fontSize: 13 }}
          />

          {CHOICE_TYPES.includes(x.type) ? (
            <input
              value={(x.options || []).join(", ")}
              onChange={(e) =>
                patchField(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })
              }
              placeholder="The choices, separated by commas"
              style={{ ...input, marginTop: 8, fontSize: 13 }}
            />
          ) : null}

          {/* The trade named where the question is chosen, not just true somewhere in the code. */}
          {FIELD_TYPE_ONBOARDING_ONLY.includes(x.type) ? (
            <p style={warnLine}>
              Photos only work on an onboarding form. On a website&apos;s own contact form this
              question is skipped — there&apos;s nowhere for a stranger&apos;s pictures to go.
            </p>
          ) : null}

          {/* WHICH SCREEN THIS QUESTION IS ON. Only shown once a form actually uses screens —
              a heading box on every question of a four-box contact form is clutter that invites
              somebody to fill it in and accidentally split the form in two. */}
          {usesSteps ? (
            <label style={skipRow}>
              <span style={{ fontSize: 12, color: "var(--e-muted)" }}>Screen heading</span>
              <input
                value={x.step || ""}
                onChange={(e) => patchField(i, { step: e.target.value || undefined })}
                placeholder="Same as the one above"
                style={{ ...input, width: 260, fontSize: 13, padding: "6px 9px" }}
              />
            </label>
          ) : null}

          {/* SKIP-WHAT-WE-ALREADY-KNOW. A dropdown, never a typed path: a wrong path reads as an
              empty value, which looks identical to a question that simply always gets asked. */}
          <label style={skipRow}>
            <span style={{ fontSize: 12, color: "var(--e-muted)" }}>Don&apos;t ask if we know</span>
            <select
              value={x.satisfiedBy || ""}
              onChange={(e) => patchField(i, { satisfiedBy: e.target.value || undefined })}
              style={select}
            >
              <option value="">Always ask this</option>
              {SATISFIED_BY_CHOICES.map((c) => (
                <option key={c.path} value={c.path}>
                  their {c.label.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
        </div>
      ))}

      {f.fields.length === 0 ? <p style={hint}>No questions yet — add one below.</p> : null}

      <div style={addBar}>
        <button type="button" style={primary} onClick={addCustom}>
          + Add a question
        </button>
        {unused.length ? (
          <>
            <span style={{ fontSize: 12, color: "var(--e-muted)", alignSelf: "center" }}>or the usual ones:</span>
            {unused.map((s) => (
              <button key={s.fieldId} type="button" style={smallGhost} onClick={() => addStandard(s)}>
                + {s.label}
              </button>
            ))}
          </>
        ) : null}
      </div>

      <h2 style={sec}>How it&apos;s laid out</h2>
      {usesSteps ? (
        <p style={hint}>
          This form moves a <strong>screen</strong> at a time. Its screens, in order:{" "}
          {stepsOf(f.fields)
            .map((s) => `${s.title || "(untitled)"} (${s.fields.length})`)
            .join(" → ")}
          . Change a question&apos;s screen heading above to move it; questions next to each other
          with the same heading share a screen.
        </p>
      ) : null}
      <label style={{ ...checkLbl, alignItems: "flex-start", gap: 9 }}>
        <input
          type="checkbox"
          checked={!!f.oneQuestionPerScreen}
          onChange={(e) => setF({ ...f, oneQuestionPerScreen: e.target.checked })}
          style={{ marginTop: 3 }}
        />
        <span>
          <strong>One question at a time — onboarding link only</strong>
          {/* ⚠️ THE LABEL NOW SAYS WHERE IT APPLIES, BECAUSE IT DOESN'T APPLY EVERYWHERE. This
              switch only ever reached the onboarding link and the older step-by-step pages — the
              form block on a website has never read it. Reading as a general layout choice is what
              made it look like the on-page form was ignoring a setting that was switched on. */}
          <span style={{ display: "block", ...hint, marginBottom: 0, marginTop: 3 }}>
            Only changes the onboarding link, where answers save as they go so a client can come
            back to it. On a website this does nothing: a form dropped on a page decides its own
            shape — under five questions it sits in its section, five or more and it becomes a
            survey, a few questions at a time.
          </span>
        </span>
      </label>

      <h2 style={sec}>The button and the thank-you</h2>
      <Field label="Button text" v={f.buttonLabel} on={(v) => setF({ ...f, buttonLabel: v })} ph="Send it" />
      <Field
        label="Small line under the button"
        v={f.note}
        on={(v) => setF({ ...f, note: v })}
        ph="No obligation. We'll call you back to talk it through."
        area
      />
      <Field
        label="Thank-you heading"
        v={f.successHeading}
        on={(v) => setF({ ...f, successHeading: v })}
        ph="Got it — thank you."
      />
      <Field
        label="Thank-you body"
        v={f.successBody}
        on={(v) => setF({ ...f, successBody: v })}
        ph="We'll be in touch shortly."
        area
      />

      {/* ── THE FIVE-STAR FUNNEL, WHERE IT'S USED ────────────────────────────────────────────
          Only shown on a form that has one, so a plain contact form doesn't grow a panel about
          Google reviews. It's set in code on the Review survey and travels with a copy of it. */}
      {f.altSuccess ? (
        <>
          <h2 style={sec}>When they&apos;re happy</h2>
          <p style={hint}>
            Answer <strong>{f.altSuccess.values.join("</strong> or <strong>")}</strong> to
            &ldquo;{f.fields.find((x) => x.fieldId === f.altSuccess?.fieldId)?.label || f.altSuccess.fieldId}
            &rdquo; and they get this ending instead, with the review button. Everyone else gets the
            one above — and every answer reaches the sheet either way.
          </p>
          <Field
            label="Heading"
            v={f.altSuccess.heading}
            on={(v) => setF({ ...f, altSuccess: { ...f.altSuccess!, heading: v } })}
          />
          <Field
            label="Body"
            v={f.altSuccess.body}
            on={(v) => setF({ ...f, altSuccess: { ...f.altSuccess!, body: v } })}
            area
          />
          <Field
            label="Button text"
            v={f.altSuccess.buttonLabel || ""}
            on={(v) => setF({ ...f, altSuccess: { ...f.altSuccess!, buttonLabel: v } })}
            ph="Leave a Google review"
          />
          {/* ⛔ THE REVIEW LINK IS NOT A FIELD HERE ANY MORE, AND THIS PANEL IS WHY.
              It used to be, labelled "THIS CLIENT'S Google review link" — on a form that several
              websites point at. Whichever link got typed in first was shown to every one of those
              businesses' happy customers. The fix wasn't a better warning; it was moving the
              destination to the only place that has a client: the website. */}
          <p style={hint}>
            The button goes to <strong>whichever website the form is on</strong> — each one carries
            its own Google review link in <strong>Website settings</strong>. One review form serves
            every client, and nobody&apos;s customers can be sent to somebody else&apos;s page.
          </p>
          {!f.altSuccess.buttonLabel?.trim() ? (
            <p style={warnLine}>
              No button text, so no button shows — they just get the thank-you.
            </p>
          ) : null}
        </>
      ) : null}

      <div style={tokenBox}>
        <p style={{ ...hint, margin: 0 }}>
          Write <code style={code}>{"{{business.phone}}"}</code> or{" "}
          <code style={code}>{"{{business.name}}"}</code> anywhere above and it fills in from that
          website&apos;s own settings. Type a real phone number instead and every client who uses
          this form gets that number.
        </p>
      </div>

      <h2 style={sec}>In your list</h2>
      <Field label="Form name" v={f.name} on={(v) => setF({ ...f, name: v })} ph="Quote request" />
      <Field
        label="Note to yourself"
        v={f.description || ""}
        on={(v) => setF({ ...f, description: v })}
        ph="Who this one is for"
      />

      {err ? <p style={errBox}>{err}</p> : null}
      {msg ? <p style={okBox}>{msg}</p> : null}

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button type="button" style={primary} onClick={save} disabled={busy || !dirty}>
          {busy ? "Saving…" : dirty ? "Save this form" : "Saved"}
        </button>
        <button type="button" style={ghost} onClick={() => router.push("/edit/forms")}>
          Back to all forms
        </button>
      </div>

      {/* ⚠️ This paragraph said the exact opposite of the truth for hours after forms became live
          pointers, and Steven read it. Screen copy is part of the change, not a follow-up. */}
      <p style={footNote}>
        Saving changes this form everywhere it&apos;s used. Every website pointing at it picks up
        the new wording straight away — that&apos;s the point of keeping questions in one place.
        Reword freely: the spreadsheet column stays with its answers.
      </p>
    </div>
  );
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
const page: React.CSSProperties = { maxWidth: 720, margin: "0 auto", padding: "32px 24px 100px", fontFamily: font };
const back: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const sec: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--e-muted)", margin: "34px 0 6px", borderTop: "1px solid var(--e-line)", paddingTop: 20 };
const hint: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", lineHeight: 1.55, margin: "0 0 14px" };
const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: font };
const select: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 8, padding: "6px 9px", fontSize: 13, fontFamily: font, background: "var(--e-panel)" };
const row: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 10, padding: 14, marginBottom: 10, background: "var(--e-panel)" };
const rowHead: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
const rowMeta: React.CSSProperties = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 10 };
const checkLbl: React.CSSProperties = { display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: "var(--e-ink)" };
const keyTag: React.CSSProperties = { fontSize: 11, color: "var(--e-muted)", fontFamily: "ui-monospace,monospace", marginLeft: "auto" };
const skipRow: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" };
const whereBox: React.CSSProperties = { marginTop: 16, border: "1px solid var(--e-line)", background: "var(--e-panel-2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, lineHeight: 1.65, color: "var(--e-muted)" };
const addr: React.CSSProperties = { fontFamily: "ui-monospace,monospace", fontSize: 11, background: "var(--e-line-soft)", borderRadius: 4, padding: "2px 5px", wordBreak: "break-all" };
// ⚠️ COPIED FROM components/edit/SiteGallery.tsx ON PURPOSE. A link that opens a page in a new
// tab should look identical everywhere in the back office — the website cards taught Steven what
// a clickable address looks like here, so anything else reads as text.
const cardLink: React.CSSProperties = { fontSize: 12, color: "var(--e-accent)", textDecoration: "none", fontWeight: 600 };
const bizRow: React.CSSProperties = { display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", padding: "9px 0", borderTop: "1px solid var(--e-line)" };
const warnLine: React.CSSProperties = { fontSize: 12, color: "var(--e-muted)", lineHeight: 1.5, margin: "10px 0 0", borderLeft: "3px solid var(--e-line)", paddingLeft: 10 };
const tiny: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", borderRadius: 6, width: 30, height: 30, fontSize: 13, cursor: "pointer", flexShrink: 0 };
const addBar: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 };
const smallGhost: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const code: React.CSSProperties = { background: "var(--e-line-soft)", borderRadius: 4, padding: "1px 5px", fontFamily: "ui-monospace,monospace", fontSize: 12 };
const tokenBox: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel-2)", borderRadius: 10, padding: 14, marginTop: 6 };
const primary: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const ghost: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const errBox: React.CSSProperties = { marginTop: 16, background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
const okBox: React.CSSProperties = { marginTop: 16, background: "var(--e-ok-bg)", border: "1px solid var(--e-ok-line)", color: "var(--e-ok-ink)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
const footNote: React.CSSProperties = { fontSize: 12, color: "var(--e-muted)", lineHeight: 1.6, marginTop: 30, borderTop: "1px solid var(--e-line)", paddingTop: 16 };
