"use client";
// The intake form a business owner actually fills in — on a phone, between jobs.
//
// THREE THINGS DRIVE EVERY DECISION HERE:
//
// 1. ONE QUESTION PER SCREEN. Fifteen fields on a phone is a wall; one question with a big box is
//    a conversation. It also makes "where was I" trivial to answer when she comes back.
// 2. IT SAVES AS SHE GOES. Every answer is written when she moves on, not at the end. A call
//    comes in, she closes the tab, she reopens the same link that night and lands exactly where
//    she stopped. A form that loses work on interruption is a form that never gets finished, and
//    then Steven is chasing her by text.
// 3. PHOTOS GET SHRUNK BEFORE THEY LEAVE HER PHONE. Ten photos off a camera roll over cell data
//    is the slowest part of this; lib/imagePrep turns 4 MB into ~300 KB first, and strips the GPS
//    out of them on the way past.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { prepareImage } from "@/lib/imagePrep";
import type { IntakeAnswers, IntakeQuestion } from "@/lib/intakeShared";

export default function IntakeForm({
  site,
  contact,
  businessName,
  questions,
  initialAnswers,
  initialPhotos,
  alreadySubmitted,
  oneQuestionPerScreen = true,
  buttonLabel,
  successHeading,
  successBody,
}: {
  /** Which business this form belongs to. The server checks it's open on every call. */
  site: string;
  /** SJC's number, read from the site record — never hardcoded here. See lib/sites.ts. */
  contact: { display: string; dial: string };
  businessName: string;
  questions: IntakeQuestion[];
  initialAnswers: IntakeAnswers;
  initialPhotos: string[];
  alreadySubmitted: boolean;
  /**
   * The library's layout switch (FormDef.oneQuestionPerScreen).
   *
   * ⚠️ DEFAULTS TO TRUE, and the default is the one that matters: this component is the reason
   * the setting exists, and a missing prop must not quietly turn a nine-question phone form back
   * into the wall it was designed not to be.
   *
   * All-on-one-screen keeps the save-as-you-go behaviour — it saves on leaving each box instead
   * of on pressing Next. Losing that with the layout would trade a real protection for a
   * cosmetic choice.
   */
  oneQuestionPerScreen?: boolean;
  /** From the library form; each falls back to the wording this component always used. */
  buttonLabel?: string;
  successHeading?: string;
  successBody?: string;
}) {
  const [answers, setAnswers] = useState<IntakeAnswers>(initialAnswers || {});
  const [photos, setPhotos] = useState<string[]>(initialPhotos || []);
  const [done, setDone] = useState(alreadySubmitted);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // RESUME: open on the first thing she hasn't answered, not back at question one. Being made to
  // scroll past your own answers to find your place is how a second session becomes no second
  // session.
  const firstUnanswered = questions.findIndex((q) => {
    if (q.type === "photos") return (initialPhotos || []).length === 0;
    return !initialAnswers?.[q.id];
  });
  const [i, setI] = useState(firstUnanswered < 0 ? 0 : firstUnanswered);

  const q = questions[i];
  const answer = (q && (answers[q.id] as string)) || "";

  const save = useCallback(
    async (patch: Partial<{ answers: IntakeAnswers; submittedAt: string }>) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/intake?site=${encodeURIComponent(site)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) throw new Error(body?.reason || `HTTP ${res.status}`);
        setSaveState("saved");
        setSaveError("");
        return true;
      } catch (e) {
        // Same lesson as the page editor: never claim it saved when it didn't. If this goes wrong
        // she must not close the tab believing her work is safe.
        setSaveError(e instanceof Error ? e.message : "could not save");
        setSaveState("failed");
        return false;
      }
    },
    [site]
  );

  // A last-ditch save if she closes the tab mid-answer.
  useEffect(() => {
    const onHide = () => {
      if (saveState === "saving") return;
      navigator.sendBeacon?.(
        `/api/intake?site=${encodeURIComponent(site)}`,
        new Blob([JSON.stringify({ answers })], { type: "application/json" })
      );
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [answers, site, saveState]);

  async function next() {
    if (!q) return;
    if (q.required && q.type !== "photos" && !answer.trim()) return;
    if (q.required && q.type === "photos" && photos.length === 0) return;

    const ok = await save({ answers });
    if (!ok) return; // don't advance past work that isn't stored
    if (i + 1 >= questions.length) {
      const when = new Date().toISOString();
      if (await save({ answers, submittedAt: when })) setDone(true);
      return;
    }
    setI(i + 1);
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (let n = 0; n < files.length; n++) {
      setBusy(`Photo ${n + 1} of ${files.length}…`);
      try {
        const { file } = await prepareImage(files[n]);
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`/api/intake/upload?site=${encodeURIComponent(site)}`, {
          method: "POST",
          body: form,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.url) throw new Error(body?.error || `Upload failed`);
        setPhotos((p) => [...p, body.url]);
      } catch (err) {
        setBusy("");
        setSaveError(err instanceof Error ? err.message : "That photo didn't go through.");
        setSaveState("failed");
        break;
      }
    }
    setBusy("");
    if (fileRef.current) fileRef.current.value = "";
  }

  /** Everything answered that has to be. Used by the all-on-one-screen submit. */
  function unanswered(): IntakeQuestion[] {
    return questions.filter((x) => {
      if (!x.required) return false;
      if (x.type === "photos") return photos.length === 0;
      return !String(answers[x.id] || "").trim();
    });
  }

  async function submitAll() {
    if (unanswered().length) {
      setSaveError("Fill in the ones marked required and try again.");
      setSaveState("failed");
      return;
    }
    const when = new Date().toISOString();
    if (await save({ answers, submittedAt: when })) setDone(true);
  }

  if (done) {
    return (
      <Shell title={successHeading || "Got it — thank you."}>
        <P>
          {successBody ||
            "That's everything we need. We'll put it together and send you the site to look at before anyone else sees it."}
        </P>
        <P>If you think of something you forgot, just text me.</P>
        <Phone contact={contact} />
      </Shell>
    );
  }

  if (!questions.length) {
    return <Shell title="All done."><P>Nothing left to answer.</P><Phone contact={contact} /></Shell>;
  }

  const sendLabel = buttonLabel || "Send it in";

  // ── ALL ON ONE SCREEN ────────────────────────────────────────────────────────────────────────
  // Correct for a short form. Still saves per answer (onBlur) rather than only at the end, so the
  // resumability that makes this form finishable doesn't depend on which layout is chosen.
  if (!oneQuestionPerScreen) {
    return (
      <Shell title={businessName || "Tell us about your business"}>
        {questions.map((qq) => (
          <div key={qq.id} style={{ marginBottom: 26 }}>
            <label style={QLABEL}>
              {qq.label}
              {qq.required ? null : <span style={{ fontWeight: 400, color: "#6b7280" }}> (optional)</span>}
            </label>
            {qq.help && <P small>{qq.help}</P>}
            <div style={{ marginTop: 12 }} onBlur={() => save({ answers })}>
              <QuestionInput
                q={qq}
                value={String(answers[qq.id] || "")}
                onChange={(v) => setAnswers((a) => ({ ...a, [qq.id]: v }))}
                photos={photos}
                fileRef={fileRef}
                onFiles={onFiles}
                busy={busy}
              />
            </div>
          </div>
        ))}

        {saveState === "failed" && (
          <P small danger>{saveError || "Didn't save."} Check your signal and try again.</P>
        )}

        <button
          type="button"
          onClick={submitAll}
          disabled={saveState === "saving" || !!busy}
          style={{ ...BTN, ...PRIMARY, marginTop: 8 }}
        >
          {saveState === "saving" ? "Saving…" : sendLabel}
        </button>
        <P small>Your answers save as you go — you can close this and come back to the same link.</P>
      </Shell>
    );
  }

  // ── ONE QUESTION AT A TIME ───────────────────────────────────────────────────────────────────
  if (!q) return <Shell title="All done."><P>Nothing left to answer.</P><Phone contact={contact} /></Shell>;

  const canAdvance = q.type === "photos" ? !q.required || photos.length > 0 : !q.required || !!answer.trim();

  return (
    <Shell
      title={businessName ? `${businessName}` : "Tell us about your business"}
      progress={{ at: i + 1, of: questions.length }}
    >
      <label style={QLABEL}>{q.label}</label>
      {q.help && <P small>{q.help}</P>}

      <div style={{ marginTop: 16 }}>
        <QuestionInput
          q={q}
          value={answer}
          onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
          photos={photos}
          fileRef={fileRef}
          onFiles={onFiles}
          busy={busy}
        />
      </div>

      {saveState === "failed" && (
        <P small danger>Didn&apos;t save — {saveError}. Check your signal and try again.</P>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 22, alignItems: "center" }}>
        {i > 0 && (
          <button type="button" onClick={() => setI(i - 1)} style={{ ...BTN, ...GHOST }}>
            Back
          </button>
        )}
        <button
          type="button"
          onClick={next}
          disabled={!canAdvance || saveState === "saving" || !!busy}
          style={{ ...BTN, ...PRIMARY, opacity: canAdvance && !busy ? 1 : 0.5, flex: 1 }}
        >
          {saveState === "saving" ? "Saving…" : i + 1 >= questions.length ? sendLabel : "Next"}
        </button>
      </div>

      {!q.required && (
        <button type="button" onClick={next} style={SKIP}>
          Skip this one
        </button>
      )}

      <P small>Your answers save as you go — you can close this and come back to the same link.</P>
    </Shell>
  );
}

/**
 * ONE renderer per question type, shared by both layouts.
 *
 * ⚠️ SHARED ON PURPOSE. Two copies is how a `choice` question ends up drawn as buttons on one
 * layout and as a text box on the other, and how a question type added later gets wired into one
 * of them and silently renders nothing on the other.
 */
function QuestionInput({
  q,
  value,
  onChange,
  photos,
  fileRef,
  onFiles,
  busy,
}: {
  q: IntakeQuestion;
  value: string;
  onChange: (v: string) => void;
  photos: string[];
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  busy: string;
}) {
  if (q.type === "choice") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(q.options || []).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              ...INPUT,
              textAlign: "left",
              cursor: "pointer",
              borderColor: value === opt ? "#2563eb" : "#d1d5db",
              borderWidth: value === opt ? 2 : 1,
              fontWeight: value === opt ? 600 : 400,
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (q.type === "photos") {
    return (
      <div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onFiles} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={!!busy} style={BTN}>
          {busy || (photos.length ? "Add more photos" : "Choose photos")}
        </button>
        {photos.length > 0 && (
          <>
            <P small>{photos.length} sent</P>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
              {photos.map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8 }} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (q.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={q.placeholder}
        rows={5}
        style={{ ...INPUT, resize: "vertical" }}
      />
    );
  }

  return (
    <input
      type={q.type === "tel" ? "tel" : q.type === "url" ? "url" : q.type === "email" ? "email" : "text"}
      inputMode={q.type === "tel" ? "tel" : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={q.placeholder}
      style={INPUT}
    />
  );
}

/**
 * The column this form sits in.
 *
 * It renders NO page background and no <main> of its own: the page around it (BrandShell) owns
 * the branding, so this was the grey slab that made an onboarding link look like it came from
 * nobody. What's left is the part that has to live here — the progress bar, which moves as she
 * answers and so can't be server-rendered up in the header.
 *
 * Narrow on purpose. She is filling this in on a phone, between jobs.
 */
function Shell({
  title,
  progress,
  children,
}: {
  title: string;
  progress?: { at: number; of: number };
  children: React.ReactNode;
}) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#7fe3ff", letterSpacing: ".08em", textTransform: "uppercase" }}>
        {title}
      </div>
      {progress && (
        <>
          <div style={{ height: 5, background: "rgba(255,255,255,.14)", borderRadius: 99, marginTop: 12 }}>
            <div
              style={{
                height: 5,
                width: `${(progress.at / progress.of) * 100}%`,
                background: "#4fd2f7",
                borderRadius: 99,
                transition: "width .2s",
              }}
            />
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
            {progress.at} of {progress.of}
          </div>
        </>
      )}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 22,
          marginTop: 16,
          boxShadow: "0 18px 46px rgba(0,0,0,.34)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const P = ({ children, small, danger }: { children: React.ReactNode; small?: boolean; danger?: boolean }) => (
  <p
    style={{
      fontSize: small ? 15 : 17,
      lineHeight: 1.55,
      color: danger ? "#dc2626" : "#4b5563",
      marginTop: 10,
    }}
  >
    {children}
  </p>
);

const Phone = ({ contact }: { contact: { display: string; dial: string } }) => (
  <p style={{ marginTop: 18, fontSize: 17 }}>
    <a href={`tel:${contact.dial}`} style={{ color: "#2563eb", fontWeight: 600 }}>
      {contact.display}
    </a>
  </p>
);

const QLABEL: React.CSSProperties = {
  display: "block",
  fontSize: 21,
  fontWeight: 700,
  color: "#111827",
  lineHeight: 1.3,
};

// 17px minimum on inputs: anything smaller makes iOS Safari zoom the whole page on focus, and she
// then has to pinch back out for every single question.
const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "14px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 17,
  color: "#111827",
  background: "#fff",
  fontFamily: "inherit",
};

const BTN: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#fff",
  fontSize: 17,
  fontWeight: 600,
  color: "#111827",
  cursor: "pointer",
  width: "100%",
};

const PRIMARY: React.CSSProperties = { background: "#2563eb", borderColor: "#2563eb", color: "#fff" };
const GHOST: React.CSSProperties = { width: "auto", flex: "0 0 auto", color: "#4b5563" };
const SKIP: React.CSSProperties = {
  marginTop: 12,
  background: "none",
  border: "none",
  color: "#6b7280",
  fontSize: 15,
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
};
