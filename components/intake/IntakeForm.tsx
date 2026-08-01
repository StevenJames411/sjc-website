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

  if (done) {
    return (
      <Shell title="Got it — thank you.">
        <P>
          That&apos;s everything we need. We&apos;ll put it together and send you the site to look
          at before anyone else sees it.
        </P>
        <P>If you think of something you forgot, just text me.</P>
        <Phone contact={contact} />
      </Shell>
    );
  }

  if (!q) return <Shell title="All done."><P>Nothing left to answer.</P><Phone contact={contact} /></Shell>;

  const canAdvance = q.type === "photos" ? !q.required || photos.length > 0 : !q.required || !!answer.trim();

  return (
    <Shell
      title={businessName ? `${businessName}` : "Tell us about your business"}
      progress={{ at: i + 1, of: questions.length }}
    >
      <label style={{ display: "block", fontSize: 21, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
        {q.label}
      </label>
      {q.help && <P small>{q.help}</P>}

      <div style={{ marginTop: 16 }}>
        {q.type === "choice" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(q.options || []).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                style={{
                  ...INPUT,
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor: answer === opt ? "#2563eb" : "#d1d5db",
                  borderWidth: answer === opt ? 2 : 1,
                  fontWeight: answer === opt ? 600 : 400,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : q.type === "photos" ? (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={onFiles}
            />
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
        ) : q.type === "textarea" ? (
          <textarea
            value={answer}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            placeholder={q.placeholder}
            rows={5}
            style={{ ...INPUT, resize: "vertical" }}
          />
        ) : (
          <input
            type={q.type === "tel" ? "tel" : q.type === "url" ? "url" : "text"}
            inputMode={q.type === "tel" ? "tel" : undefined}
            value={answer}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            placeholder={q.placeholder}
            style={INPUT}
          />
        )}
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
          {saveState === "saving" ? "Saving…" : i + 1 >= questions.length ? "Send it in" : "Next"}
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
    <main
      style={{
        minHeight: "100dvh",
        background: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "24px 18px 56px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", letterSpacing: ".08em", textTransform: "uppercase" }}>
          {title}
        </div>
        {progress && (
          <>
            <div style={{ height: 5, background: "#e5e7eb", borderRadius: 99, marginTop: 12 }}>
              <div
                style={{
                  height: 5,
                  width: `${(progress.at / progress.of) * 100}%`,
                  background: "#2563eb",
                  borderRadius: 99,
                  transition: "width .2s",
                }}
              />
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              {progress.at} of {progress.of}
            </div>
          </>
        )}
        <div style={{ background: "#fff", borderRadius: 16, padding: 22, marginTop: 16, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          {children}
        </div>
      </div>
    </main>
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
