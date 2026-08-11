"use client";
import { useSiteId, useBusiness, useSiteUrl } from "@/components/blocks/SiteContext";

import { useLayoutEffect, useRef, useState } from "react";
import { resolveColor } from "@/lib/brandColor";
import { fillTokens } from "@/lib/businessTokens";
import { surveyScreensOf } from "@/lib/formsShared";

// A short lead-capture form, fully driven by props so it can be dropped on ANY page from the
// builder and re-labelled without touching code. Add/remove/reorder the questions, change the
// button, change the thank-you — all fields.
//
// Posts to /api/apply (ordered label/value pairs -> Apps Script -> the SJC Discovery Intake
// sheet + an email to Steven). The "source" value rides along as the first answer so leads from
// different pages stay sortable in the one sheet.

export type LeadFormField = {
  label: string;
  inputType: string;
  /**
   * THE SPREADSHEET COLUMN. Present on any question that came from the form library; absent on
   * blocks built before the library existed.
   *
   * ⚠️ When it's absent we fall back to slugifying the label, which is what the old code always
   * did — and that is the bug: reword the question and the answer starts landing in a NEW column,
   * orphaning everything collected so far. The fallback exists only so published pages keep
   * behaving exactly as they do today. Anything picked from the library carries a real key and
   * can be reworded freely.
   */
  fieldId?: string;
  /** Library questions can be optional. A block without this stays all-or-nothing, as before. */
  required?: boolean;
  /** Present on a `choice` or `multi` question. Drawn as buttons — see where they're rendered. */
  options?: string[];
  /** True for `multi` — more than one answer allowed. Stored comma-separated. */
  multi?: boolean;
};
export type LeadFormProps = {
  source?: string;
  /**
   * The library form this block POINTS AT. Blank = the block owns its own questions, which is how
   * every page built before 2026-08-06 works and still works.
   *
   * ⚠️ Nothing on the render side reads this. lib/formPointer resolves it server-side and fills
   * `fields` in before the page is drawn, so the form stays plain data drawn by our components —
   * not an embed.
   */
  formId?: string;
  fields?: LeadFormField[];
  buttonLabel?: string;
  note?: string;
  successHeading?: string;
  successBody?: string;
  // The submit button was welded to SJC blue — our brand on the client's most important
  // element. Blank keeps the old behaviour exactly.
  buttonColor?: string;
  // Drops the centring + max-width so the form can sit in one half of a two-column layout
  // (contact details on the left, form on the right) instead of always being a centred island.
  inColumn?: boolean;
  // "dark" restyles the card for a dark section (glass panel, light labels) without touching the
  // delivery path. Added for /websites, whose contact band is near-black — a white card sat on it
  // like a patch. Everything else keeps "light", so no existing page changes.
  theme?: "light" | "dark";
  /**
   * A different thank-you for certain answers — the five-star funnel. Set by the library form
   * this block points at, never editable per page (see lib/formPointer.ts for why).
   */
  altSuccess?: {
    fieldId: string;
    values: string[];
    heading: string;
    body: string;
    buttonLabel?: string;
    buttonUrl?: string;
  };
  /**
   * A FULL-WIDTH BAND BEHIND THE FORM — so the white card sits ON something.
   *
   * Steven: *"is it possible that I could add some color to the page so that just the form, which
   * is in the middle of the canvas, is white, and then the rest of that section I could change the
   * background color?"* Yes — and the reason it wasn't already is structural: `Section (band)` is a
   * flat band with no drop zone, so a form can never be placed INSIDE one. The band has to belong
   * to the form block itself.
   *
   * ⚠️ BLANK = NO WRAPPER AT ALL, not a white one. Every form already on a page renders exactly as
   * it does today, sitting straight on whatever is behind it.
   *
   * ⚠️ IGNORED IN COLUMN MODE. `inColumn` means the form is one half of a two-column layout; a
   * full-width band inside a column is not a band, it is a coloured rectangle behind half a row.
   */
  background?: string;
  /**
   * ⛔ SPLIT, BECAUSE EVERY OTHER BLOCK IS SPLIT. This shipped as ONE combined "Space above and
   * below the card" while Heading, Text, Image, HeroImage, Section, DesignSection and the footer
   * all give two. Steven: *"the other places where I adjust the spacing, they're separate, one for
   * the top, one for the bottom… I don't need every section to be different. That's the whole
   * concept of a template."*
   */
  paddingTop?: number | null;
  paddingBottom?: number | null;
  /** @deprecated The old combined dial. Still read so a block saved with it does not jump. */
  bandPadding?: number;
  /**
   * WHAT THE CUSTOMER IS FILLING IN — on the form itself.
   *
   * ⛔ THE FORM HAD NO CUSTOMER-FACING TITLE AT ALL. The library name is internal, so the only way
   * to tell a visitor what this is was to drop a Text block above it — and a Text block has no
   * band, so the colour started BELOW the heading and the section looked broken. Steven hit
   * exactly that. Putting the words on the form means one block to place, one block to colour, and
   * the heading sits inside the band by construction.
   */
  heading?: string;
  subheading?: string;
  headingColor?: string;
};

export const LEADFORM_DEFAULTS: LeadFormProps = {
  // ⚠️ BLANK, NOT SJC'S OWN OFFER. This used to default to "/websites — $795 website offer", so
  // every lead form dropped onto a CLIENT's site labelled that client's enquiries as SJC's
  // website offer until somebody remembered to retype it. Blank means the form derives the label
  // from the business and the page it's on — correct the first time, on every build.
  source: "",
  fields: [
    { label: "Your name", inputType: "text" },
    { label: "Business name", inputType: "text" },
    { label: "Best phone number", inputType: "tel" },
    { label: "What kind of work do you do?", inputType: "text" },
  ],
  buttonLabel: "Send Me My Website",
  note: "No obligation, and nothing gets built until you say so. Rather just talk? Call (210) 851-4906.",
  successHeading: "Got it. I'll call you today.",
  buttonColor: "",
  inColumn: false,
  theme: "light",
  // ⚠️ BLANK, so no form already on a page grows a band it never had.
  background: "",
  paddingTop: 64,
  paddingBottom: 64,
  heading: "",
  subheading: "",
  headingColor: "",
  successBody:
    "Ten minutes on the phone is all I need. If you'd rather not wait, call me straight out at (210) 851-4906.",
};

// The stored key wins. Only fall back to the label when a block predates the form library —
// see the note on LeadFormField.fieldId.
const keyFor = (f: LeadFormField | undefined, i: number) => {
  const stored = String(f?.fieldId || "").trim();
  if (stored) return stored;
  return (
    String(f?.label || `q${i + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `q${i + 1}`
  );
};

// A question is mandatory unless the library explicitly marked it optional. Blocks from before
// the library have no `required` on any field, so they stay all-or-nothing exactly as before.
const isRequired = (f: LeadFormField | undefined, list: LeadFormField[]) =>
  list.some((x) => typeof x?.required === "boolean") ? !!f?.required : true;

export default function LeadForm(props: LeadFormProps) {
  const {
    source = LEADFORM_DEFAULTS.source,
    fields,
    buttonLabel = LEADFORM_DEFAULTS.buttonLabel,
    note = LEADFORM_DEFAULTS.note,
    successHeading = LEADFORM_DEFAULTS.successHeading,
    successBody = LEADFORM_DEFAULTS.successBody,
    buttonColor,
    inColumn,
    theme = "light",
    altSuccess,
    background = "",
    bandPadding,
    paddingTop,
    paddingBottom,
    heading = "",
    subheading = "",
    headingColor = "",
  } = props;

  /**
   * Wrap the card in its band — or hand it straight back when there is no band to draw.
   *
   * ⚠️ APPLIED TO THE THANK-YOU TOO. Banding only the questions means the band vanishes the instant
   * someone submits, so the page flashes from a coloured section to a white one at the exact moment
   * you most want it to look deliberate.
   */
  // ⚠️ `withTitle` IS FALSE ON THE THANK-YOU. The heading asks someone to fill the form in; leaving
  // it above the confirmation tells a person who just submitted to submit again.
  const banded = (card: React.ReactNode, withTitle = true) => {
    // ⚠️ THE OLD COMBINED DIAL IS THE FALLBACK, not a second setting. A block saved before the
    // split keeps the spacing it had; a block saved after ignores it entirely.
    const legacy = typeof bandPadding === "number" && bandPadding >= 0 ? bandPadding : 64;
    const top = typeof paddingTop === "number" ? paddingTop : legacy;
    const bottom = typeof paddingBottom === "number" ? paddingBottom : legacy;

    // The heading belongs to the form, so it rides INSIDE the band — that is the whole reason it
    // exists. Rendered even without a band, where it simply sits above the card.
    const titled = (
      <>
        {withTitle && (heading || subheading) ? (
          <div
            className={`mb-8 ${inColumn ? "text-left" : "mx-auto max-w-xl text-center"}`}
            style={headingColor ? { color: resolveColor(headingColor) } : undefined}
          >
            {heading ? (
              <h2 className="text-2xl font-bold leading-tight md:text-3xl">{fill(heading)}</h2>
            ) : null}
            {subheading ? (
              <p className={`text-base leading-relaxed opacity-80${heading ? " mt-3" : ""}`}>
                {fill(subheading)}
              </p>
            ) : null}
          </div>
        ) : null}
        {card}
      </>
    );

    if (!background || inColumn) return titled;
    return (
      <div
        className="w-full"
        style={{ backgroundColor: resolveColor(background), paddingTop: top, paddingBottom: bottom }}
      >
        {/* px-6 so the card never touches the screen edge on a phone. */}
        <div className="mx-auto w-full px-6">{titled}</div>
      </div>
    );
  };

  // ⚠️ THE THANK-YOU COPY RESOLVES ITS OWN TOKENS, AND HAS TO.
  //
  // `fillBusinessTokens` resolves {{business.*}} by walking SAVED PAGE DATA. The imported-design
  // form passes this copy as a JSX LITERAL (DesignSection), and a literal is never in that data —
  // so it was handed straight to the customer unresolved. A real visitor to stevenjamesdesigns.com
  // submitted the form on 2026-08-05 and was told to "Call {{business.phone}}".
  //
  // Resolving here covers both routes: props that came from saved data are already filled and pass
  // through untouched, and literals get filled from the site being served.
  const business = useBusiness();
  const siteUrl = useSiteUrl();
  const fill = (s?: string) => (s && s.includes("{{") ? fillTokens(s, business, siteUrl) : s);

  const dark = theme === "dark";
  const cardCls = dark
    ? "rounded-3xl border border-white/20 bg-white/[0.07] p-8 text-left shadow-2xl backdrop-blur-2xl md:p-10"
    : "rounded-2xl bg-white p-8 text-left shadow-sm md:p-10";
  const labelCls = dark
    ? "mb-2 block text-xs font-medium uppercase tracking-wider text-slate-300"
    : "mb-2 block text-sm font-semibold text-[color:var(--color-sjc-ink)]";
  const inputCls = dark
    ? "w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-[#00D9FF]"
    : "w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-[color:var(--color-sjc-ink)] outline-none transition focus:border-[color:var(--color-sjc-blue)] focus:ring-2 focus:ring-[color:var(--color-sjc-blue)]/20";
  const noteCls = dark
    ? "mt-5 text-center text-sm text-slate-400"
    : "mt-5 text-center text-sm text-[color:var(--color-sjc-mute)]";

  // Comes from the route this page is served under, not from anything editable on the block.
  const siteId = useSiteId();

  // ── WHAT GOES IN THE "SOURCE" COLUMN WHEN NOBODY TYPED ONE ──────────────────────────────────
  //
  // `source` is a per-block text field, filled in by hand, and blank is its normal state on any
  // section cloned from a template or dropped in from the library. A blank Source column is bad
  // enough — several sites' enquiries arriving as a column of empties, with no way to tell which
  // build produced which. A STALE one is worse: a section copied from another client arrives
  // still labelled with that client's offer, so the row looks authoritative and is wrong.
  //
  // ⚠️ THIS IS A LABEL, NOT ROUTING, and the distinction is the whole safety story. Which sheet
  // and which inbox a lead reaches is decided server-side from `siteId` above — taken from the
  // route the page is served under, which nobody can mistype. If this fallback is ever wrong the
  // worst case is a confusing word in a spreadsheet cell, never a lead in the wrong pile.
  //
  // Derived rather than defaulted: the business's own name plus the page it was filled in on, so
  // "Marbleford Pet Wash — /contact" reads correctly the very first time without anyone
  // remembering to set it.
  const derivedSource = [
    business?.name || siteId,
    typeof window !== "undefined" ? window.location.pathname : "",
  ]
    .filter(Boolean)
    .join(" — ");

  const list = (Array.isArray(fields) && fields.length ? fields : LEADFORM_DEFAULTS.fields) || [];

  const [values, setValues] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [trap, setTrap] = useState("");

  const missing = list.filter(
    (f, i) => isRequired(f, list) && !(values[keyFor(f, i)] || "").trim()
  );

  // ── THE SURVEY ──────────────────────────────────────────────────────────────────────────────
  // Steven: *"nobody wants to see a wall of fifteen questions and nobody wants to do one at a
  // time."* So a long form becomes a few screens INSIDE ITS OWN SECTION — the page never
  // navigates, nothing reloads, the header and footer never move.
  //
  // ⚠️ THE SUBMITTED PAYLOAD IS UNCHANGED, AND THAT IS THE WHOLE SAFETY STORY. Every answer is
  // still built from `list` below, in the same order, under the same keys — which ARE the columns
  // in the client's Google Sheet. This splits which questions are ON SCREEN and nothing else. A
  // layout change that quietly reshaped the sheet would orphan every row collected so far.
  const screens = surveyScreensOf(list);
  const stepped = screens.length > 1;
  const [screen, setScreen] = useState(0);
  const at = Math.min(screen, Math.max(0, screens.length - 1));
  const shown = stepped ? screens[at]?.fields || [] : list;
  const lastScreen = !stepped || at >= screens.length - 1;

  // Answered-or-not for the questions ON THIS SCREEN. Checked on Next, because being told on the
  // last screen about a blank on the first is the version people abandon.
  const missingHere = shown.filter(
    (f) => isRequired(f, list) && !(values[keyFor(f, list.indexOf(f))] || "").trim()
  );

  // ── THE SECTION HOLDS ITS OWN HEIGHT ────────────────────────────────────────────────────────
  // Steven: *"the page doesn't look like it goes anywhere."* If screen 2 is shorter than screen 1
  // the whole page — footer included — jumps up the instant you press Next, which reads as broken
  // every single time. So the questions area never gets shorter than the tallest screen already
  // seen. Screens are balanced by weight, so in practice they start out near-identical and this
  // only absorbs the remainder.
  const bodyRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [minH, setMinH] = useState(0);
  useLayoutEffect(() => {
    const h = bodyRef.current?.offsetHeight || 0;
    if (h > minH) setMinH(h);
  }, [at, minH, values]);

  /**
   * Move a screen without losing the visitor.
   *
   * ⚠️ NEVER scrollIntoView UNCONDITIONALLY — on a short form that yanks a page that was already
   * perfectly readable. Only when the top of the card has gone above the fold, which is exactly
   * what happens on a phone after tapping Next at the bottom of a tall screen.
   */
  function go(next: number) {
    setScreen(next);
    setState("idle");
    requestAnimationFrame(() => {
      const el = formRef.current;
      if (el && el.getBoundingClientRect().top < 0) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (trap) return; // honeypot caught a bot — silently do nothing

    // Mid-survey the button is Next, not Send. Only this screen's answers are checked, so nobody
    // is blocked by a question they haven't been shown yet.
    if (!lastScreen) {
      if (missingHere.length) {
        setState("error");
        return;
      }
      go(at + 1);
      return;
    }

    if (missing.length) {
      // ⚠️ TAKE THEM TO THE BLANK, don't just say there is one. On a survey the offending box is
      // usually on a screen that isn't showing, so "fill in every box and try again" would point
      // at a screen where every box is already filled.
      const first = list.indexOf(missing[0]);
      const idx = screens.findIndex((s) => s.fields.includes(list[first]));
      if (stepped && idx >= 0 && idx !== at) go(idx);
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submittedAt: new Date().toISOString(),
          // Which WEBSITE this came from, taken from the route rather than a typed field. The
          // server decides the destination from it — see app/api/apply. `source` stays as a
          // human label only; it must never be the thing that routes a lead.
          siteId,
          answers: [
            { key: "source", label: "Source", value: (source || "").trim() || derivedSource },
            ...list.map((f, i) => ({
              key: keyFor(f, i),
              label: f?.label || `Question ${i + 1}`,
              value: (values[keyFor(f, i)] || "").trim(),
            })),
          ],
        }),
      });
      if (!res.ok) throw new Error(String(res.status));

      // ⚠️ A 200 HERE DOES NOT MEAN THE LEAD GOT EVERYWHERE IT WAS OWED.
      //
      // /api/apply deliberately answers 200 when ANY destination landed, because a visitor must
      // never be punished for our plumbing — she typed her name in good faith and the enquiry does
      // exist somewhere. But this component used to stop reading at res.ok, so a lead that reached
      // SJC's intake and never reached the client's inbox or sheet rendered a green thank-you and
      // nobody anywhere was told. The one failure lib/leadDelivery.ts exists to prevent, reported
      // as a success by the last component in the chain.
      //
      // deliverLead already returns per-leg truth and the route already puts it on the wire, so the
      // fix is to READ it. She still sees success — that part was right. The difference is that a
      // partial delivery now leaves a trace instead of looking identical to a clean one.
      const body = await res.json().catch(() => null);
      const problems: string[] = Array.isArray(body?.problems) ? body.problems : [];
      if (problems.length) {
        // Console first: it costs nothing, it's visible in Vercel's logs against this request, and
        // it works even if the beacon below is blocked.
        console.error(`[lead] partial delivery for ${siteId}: ${problems.join(" | ")}`);
        // Fire-and-forget. `sendBeacon` survives the page being closed a moment later, which a
        // fetch does not — and a visitor who submits and immediately navigates away is exactly the
        // case where losing the report would matter most.
        try {
          navigator.sendBeacon?.(
            "/api/lead-problem",
            new Blob([JSON.stringify({ siteId, problems, at: new Date().toISOString() })], {
              type: "application/json",
            })
          );
        } catch {
          /* reporting must never break the thank-you screen */
        }
      }

      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    // ⚠️ READ OFF THE SUBMITTED ANSWER, not off anything the visitor could set. The rule names a
    // fieldId and the values that trigger it; everything else falls to the ordinary thank-you.
    // Defaulting to the ORDINARY one matters: a review form whose rule is mistyped must send
    // nobody to Google rather than everybody, including the person who just gave it one star.
    const alt =
      altSuccess?.fieldId &&
      Array.isArray(altSuccess.values) &&
      altSuccess.values.includes((values[altSuccess.fieldId] || "").trim())
        ? altSuccess
        : null;

    return banded(
      <div className={`${cardCls} text-center${inColumn ? "" : " mx-auto max-w-xl"}`}>
        <h3
          className={`text-2xl font-bold md:text-3xl ${
            dark ? "text-white" : "text-[color:var(--color-sjc-ink)]"
          }`}
        >
          {fill(alt ? alt.heading : successHeading)}
        </h3>
        <p
          className={`mt-4 text-lg leading-relaxed ${
            dark ? "text-slate-300" : "text-[color:var(--color-sjc-mute)]"
          }`}
        >
          {fill(alt ? alt.body : successBody)}
        </p>
        {/* No link, no button. An empty href on a review form is a dead end that reads as broken;
            saying nothing reads as a thank-you, which it still is. */}
        {alt?.buttonUrl && alt.buttonLabel ? (
          <a
            href={alt.buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={
              dark
                ? "mt-6 inline-block rounded-xl bg-[#00D9FF] px-6 py-4 text-lg font-bold text-[#0A0E27] shadow-lg"
                : "mt-6 inline-block rounded-lg bg-[color:var(--color-sjc-blue)] px-6 py-4 text-lg font-bold text-white shadow-sm hover:bg-[color:var(--color-sjc-green)]"
            }
            style={!dark && buttonColor ? { backgroundColor: resolveColor(buttonColor) } : undefined}
          >
            {alt.buttonLabel}
          </a>
        ) : null}
      </div>,
      false
    );
  }

  return banded(
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className={`${cardCls}${inColumn ? "" : " mx-auto max-w-xl"}`}
    >
      {/* ── WHERE YOU ARE ────────────────────────────────────────────────────────────────────
          A survey with no end in sight is one people quit. The bar and the count are the whole
          reason a five-screen form gets finished, and they cost one row. Only drawn when the form
          actually steps — a four-question contact form with a progress bar looks bureaucratic. */}
      {stepped ? (
        <div className="mb-6">
          <div
            className={`h-1.5 w-full overflow-hidden rounded-full ${
              dark ? "bg-white/10" : "bg-gray-200"
            }`}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((at + 1) / screens.length) * 100}%`,
                backgroundColor: dark
                  ? "#00D9FF"
                  : buttonColor
                    ? resolveColor(buttonColor)
                    : "var(--color-sjc-blue)",
              }}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            {/* An authored step keeps its heading (/apply); an auto-split one has none, and an
                empty <h4> would just add a blank line. */}
            <span
              className={`text-sm font-semibold ${
                dark ? "text-slate-200" : "text-[color:var(--color-sjc-ink)]"
              }`}
            >
              {screens[at]?.title || ""}
            </span>
            <span className={`text-xs ${dark ? "text-slate-400" : "text-[color:var(--color-sjc-mute)]"}`}>
              Step {at + 1} of {screens.length}
            </span>
          </div>
        </div>
      ) : null}

      {/* `minHeight` is what stops the page jumping between screens — see the note on minH. */}
      <div
        ref={bodyRef}
        className="space-y-5"
        style={stepped && minH ? { minHeight: minH } : undefined}
      >
        {shown.map((f) => {
          // ⚠️ THE INDEX MUST BE THE ONE IN THE FULL LIST, NOT IN THIS SCREEN. keyFor() falls back
          // to the position when a block predates the form library, so numbering a screen's fields
          // from zero would file screen two's answers under screen one's columns.
          const i = list.indexOf(f);
          const k = keyFor(f, i);
          return (
            <div key={k}>
              <label htmlFor={`lf-${k}`} className={labelCls}>
                {f?.label}
                {isRequired(f, list) ? null : (
                  <span className="ml-1 font-normal opacity-60">(optional)</span>
                )}
              </label>
              {/* BUTTONS, NOT A DROPDOWN. This is answered on a phone, and a five-option rating
                  behind a tap-and-scroll picker is the difference between a review and a closed
                  tab. It also puts the whole scale on screen, which is the question. */}
              {f?.options?.length ? (
                <div className="flex flex-col gap-2">
                  {f.options.map((opt) => {
                    // ⚠️ MULTI STORES A COMMA-SEPARATED LIST IN ONE CELL, which is what a "pick
                    // all that apply" answer has always looked like in the sheet. One column per
                    // question stays true whether it takes one answer or four.
                    const picked = (values[k] || "").split(", ").filter(Boolean);
                    const on = f.multi ? picked.includes(opt) : (values[k] || "") === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setValues((prev) => {
                            if (!f.multi) return { ...prev, [k]: opt };
                            const now = (prev[k] || "").split(", ").filter(Boolean);
                            const next = now.includes(opt)
                              ? now.filter((x) => x !== opt)
                              : [...now, opt];
                            return { ...prev, [k]: next.join(", ") };
                          })
                        }
                        aria-pressed={on}
                        className={`${inputCls} text-left ${
                          on
                            ? "font-semibold ring-2 ring-[color:var(--color-sjc-blue)]"
                            : "hover:opacity-90"
                        }`}
                      >
                        {f.multi ? `${on ? "☑" : "☐"} ${opt}` : opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  id={`lf-${k}`}
                  type={f?.inputType || "text"}
                  value={values[k] || ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [k]: e.target.value }))}
                  className={inputCls}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* honeypot — off-screen for people, irresistible to bots */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        className="absolute left-[-9999px]"
      />

      {/* ⚠️ BACK IS A BUTTON, NEVER THE BROWSER'S. The survey is state inside this block — the URL
          never changes — so a visitor reaching for the browser's back arrow would leave the page
          entirely and lose every answer. Giving Back its own obvious control is what stops that
          reach happening. It also never submits: type="button" on a form is load-bearing. */}
      <div className={stepped && at > 0 ? "mt-8 flex gap-3" : "mt-8"}>
        {stepped && at > 0 ? (
          <button
            type="button"
            onClick={() => go(at - 1)}
            className={
              dark
                ? "shrink-0 rounded-xl border border-white/20 px-5 py-4 text-lg font-semibold text-slate-200 transition hover:bg-white/10"
                : "shrink-0 rounded-lg border border-gray-300 px-5 py-4 text-lg font-semibold text-[color:var(--color-sjc-mute)] transition hover:bg-gray-50"
            }
          >
            ← Back
          </button>
        ) : null}
        <button
          type="submit"
          disabled={state === "sending"}
          className={
            dark
              ? "w-full rounded-xl bg-[#00D9FF] px-6 py-4 text-lg font-bold text-[#0A0E27] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-[#00D9FF]/50 disabled:opacity-60"
              : `w-full rounded-lg px-6 py-4 text-lg font-bold text-white shadow-sm transition disabled:opacity-60${
                  buttonColor
                    ? " hover:opacity-90"
                    : " bg-[color:var(--color-sjc-blue)] hover:bg-[color:var(--color-sjc-green)]"
                }`
          }
          style={!dark && buttonColor ? { backgroundColor: resolveColor(buttonColor) } : undefined}
        >
          {state === "sending" ? "Sending…" : lastScreen ? buttonLabel : "Next →"}
        </button>
      </div>

      {state === "error" ? (
        <p
          className={`mt-4 text-center text-base font-semibold ${
            dark ? "text-red-400" : "text-red-600"
          }`}
        >
          {!lastScreen
            ? "Fill in every box to carry on."
            : missing.length
              ? "Fill in every box and try again."
              : "That didn't go through — give it another try, or just call."}
        </p>
      ) : null}

      {note ? <p className={noteCls}>{note}</p> : null}
    </form>
  );
}
