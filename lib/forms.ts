// The form library — reusable sets of questions a website POINTS AT (lib/formPointer.ts).
//
// Server-only (pulls in the store). Types that the browser needs live in ./formsShared, along
// with the long note on what a Form is and why it carries no destination. Read that first.
//
// This mirrors lib/sites.ts deliberately, down to the shape of the return values: one registry
// key, a defensive read, built-in records merged UNDER saved overrides, one private writer for
// the whole array, and create/update/delete that return `{ ok, error }` instead of throwing.
// Copying a proven pattern is worth more here than any improvement I could invent.
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { FORMS_KEY } from "./siteKeys";
import {
  BUILTIN_FORMS,
  CHOICE_TYPES,
  FORM_FIELD_TYPES,
  SATISFIED_BY_CHOICES,
  mergeSections,
  mintFieldId,
  type FormDef,
  type FormField,
  type FormFieldType,
  type FormKind,
  type ScreenEnding,
  type SectionKey,
} from "./formsShared";
import { ONBOARDING_FORM } from "./intakeShared";

export * from "./formsShared";

type FormsBlob = { forms?: FormDef[]; sections?: Partial<Record<SectionKey, string>> };

const store = () => createKvStore(getClient(), FORMS_KEY);

/** What the three groups on the library screen are called. Merged over the code defaults. */
export async function readSections(): Promise<Record<SectionKey, string>> {
  const blob = (await store().read<FormsBlob>()) || {};
  return mergeSections(blob.sections);
}

/**
 * Rename the groups.
 *
 * ⚠️ READ-MODIFY-WRITE ON THE WHOLE BLOB, because `forms` lives in the same document. Writing
 * `{ sections }` on its own would hand the store a document with no forms in it — and while the
 * write guard would refuse that, "renaming a heading emptied the library" is not a failure to
 * leave one missing spread away.
 */
export async function writeSections(
  patch: Partial<Record<SectionKey, string>>
): Promise<{ ok: boolean; error?: string }> {
  const blob = (await store().read<FormsBlob>()) || {};
  const res = await store().writeResult({
    ...blob,
    sections: mergeSections({ ...blob.sections, ...patch }),
  });
  return res.ok ? { ok: true } : { ok: false, error: res.reason || "Couldn't save." };
}

const slugify = (s: string) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Every form in the library.
 *
 * The built-ins are IMPLICIT — they exist whether or not anything has been written, so a cold or
 * unprovisioned store can never make the library come up empty. Anything saved for a built-in id
 * merges on top, so they're editable like any other; `id` and `kind` are re-asserted after the
 * spread so a saved override can't promote itself or rename itself out of existence.
 */
export async function readForms(): Promise<FormDef[]> {
  const blob = (await store().read<FormsBlob>()) || {};
  const saved = (blob.forms || []).filter((f) => f && f.id);

  // ⚠️ ONBOARDING IS A BUILT-IN LIKE ANY OTHER, and being in this list is the whole point: it is
  // the form Steven runs on every client, and until 2026-08-06 it was the one form that could
  // only be changed by editing code. He went looking for it in his own library and it wasn't
  // there. Its floor lives in lib/intakeShared.ts with the questions and the reasoning behind
  // them; it is merged here rather than defined in formsShared so the prose stays with the form.
  const builtins = [...BUILTIN_FORMS, ONBOARDING_FORM].map((b) => {
    const override = saved.find((s) => s.id === b.id);
    return {
      ...b,
      ...(override || {}),
      id: b.id,
      kind: "builtin" as FormKind,
      fields: override?.fields?.length ? override.fields : b.fields,
    };
  });

  // ⚠️ DERIVED FROM `builtins`, NOT FROM BUILTIN_FORMS. Built from the narrower list, a saved
  // onboarding override would pass this filter and the library would show the form TWICE — once
  // merged, once raw — with edits landing on whichever copy was clicked.
  const builtinIds = new Set(builtins.map((b) => b.id));
  return [...builtins, ...saved.filter((s) => !builtinIds.has(s.id))];
}

export async function findForm(id: string): Promise<FormDef | undefined> {
  return (await readForms()).find((f) => f.id === String(id || "").trim());
}

async function writeForms(forms: FormDef[]): Promise<{ ok: boolean; reason?: string }> {
  // ── READ-MODIFY-WRITE ON THE WHOLE BLOB (fix 2026-08-11) ────────────────────────────────────
  //
  // ⚠️ THIS USED TO WRITE `{ forms }` AND NOTHING ELSE, which silently dropped `sections` — the
  // renamed group headings that live in the same document. writeSections() above already carries
  // `forms` through and its comment warns about exactly this mistake in the other direction; this
  // half was never given the same treatment.
  //
  // It stayed invisible until a heading was actually renamed. From that moment `sections` existed,
  // so EVERY form save tried to delete it, the guard refused the write, and the library became
  // read-only: renaming a form returned "top-level keys disappeared: sections" with no way out and
  // nothing wrong with the form. Steven hit it renaming "Manage or Start Running Paid Ads".
  //
  // Spreading the stored blob rather than naming the keys means the next thing added to this
  // document is preserved by default instead of quietly dropped by the write that forgot it.
  const blob = (await store().read<FormsBlob>()) || {};

  // writeResult, not write: the save guard in lib/pgClient.ts refuses an array that shrinks too
  // far, and deleting a few presets from a small library is exactly that shape. A refused save
  // that reports success is the failure this whole layer exists to prevent, so the reason has to
  // reach the human looking at the save indicator.
  const res = await store().writeResult({ ...blob, forms });
  return { ok: res.ok, reason: res.reason };
}

/**
 * Re-mint any field that arrived without a key, and REFUSE any change to one that has a key.
 *
 * This is the single choke point for question identity. Every write goes through it, so no route,
 * no panel and no client payload can rename a sheet column — a `fieldId` supplied by the caller
 * is only trusted when it matches one that already existed on this form.
 */
function normalizeFields(incoming: FormField[], previous: FormField[] = []): FormField[] {
  const known = new Set(previous.map((f) => f.fieldId).filter(Boolean));
  const taken: string[] = [...known];
  const out: FormField[] = [];

  for (const f of incoming || []) {
    const label = String(f?.label || "").trim();
    if (!label) continue;
    let fieldId = String(f?.fieldId || "").trim();
    // A key is kept only if this form already had it. Anything else is minted here.
    if (!fieldId || (!known.has(fieldId) && taken.filter((t) => t === fieldId).length > 0)) {
      fieldId = mintFieldId(label, taken);
    } else if (!known.has(fieldId) && out.some((o) => o.fieldId === fieldId)) {
      fieldId = mintFieldId(label, taken);
    }
    taken.push(fieldId);
    // A type that isn't in the vocabulary becomes a text box rather than being stored as-is.
    // Whatever arrives here ends up in a `type ===` comparison in three renderers; an unknown
    // string matches none of them and draws nothing at all, which is a question that silently
    // isn't asked. Falling back to text asks it badly, which is recoverable.
    const type: FormField["type"] = FORM_FIELD_TYPES.includes(f?.type as FormFieldType)
      ? (f.type as FormFieldType)
      : "text";
    // Only a path we published is honoured. A typo'd path reads as an empty value, which looks
    // exactly like a question that just always gets asked — a silent failure, so it's refused.
    const satisfiedBy = String(f?.satisfiedBy || "").trim();
    out.push({
      fieldId,
      label,
      type,
      ...(f?.help ? { help: String(f.help) } : {}),
      ...(f?.placeholder ? { placeholder: String(f.placeholder) } : {}),
      ...(f?.required ? { required: true } : {}),
      ...(CHOICE_TYPES.includes(type) && Array.isArray(f?.options)
        ? { options: f.options.map((o) => String(o)).filter(Boolean) }
        : {}),
      // ⚠️ WHITELISTED HERE OR IT NEVER REACHES THE PAGE. This sanitiser rebuilds each question
      // from named keys, so a flag that is not listed is dropped on save — silently, and the
      // question quietly falls back to buttons. Only meaningful on a choice question.
      ...(CHOICE_TYPES.includes(type) && f?.dropdown ? { dropdown: true } : {}),
      // ⛔ ROUTES ONLY ON A SINGLE `choice`, and refused everywhere else rather than half-applied.
      // A `multi` answer is a set, so "when === value" has no single truth to test; free text has
      // nothing to match at all. Accepting either would produce a rule that silently never fires,
      // which reads exactly like a form that simply doesn't branch — the failure this whole
      // sanitiser exists to make impossible.
      ...(type === "choice" && Array.isArray(f?.routes)
        ? {
            routes: (f.routes as { when?: unknown; goTo?: unknown }[])
              .map((r) => ({ when: String(r?.when ?? ""), goTo: String(r?.goTo ?? "") }))
              .filter((r) => r.when && r.goTo),
          }
        : {}),
      // Same whitelist trap as `dropdown` above, and it caught me the same way: the screen break
      // was set, saved, and silently vanished on the way through here.
      ...(f?.newScreen ? { newScreen: true } : {}),
      ...(SATISFIED_BY_CHOICES.some((c) => c.path === satisfiedBy) ? { satisfiedBy } : {}),
      ...(f?.step ? { step: String(f.step) } : {}),
    });
  }
  return out;
}

/**
 * Clean an alternate thank-you rule before it's stored.
 *
 * ⚠️ THE RULE IS NOT FREELY EDITABLE — only its WORDS AND ITS LINK are. `fieldId` and `values`
 * are taken from what's already saved, never from the request. They decide who gets sent to
 * Google, and a rule that can be retargeted from a JSON body is a rule that can be pointed at the
 * wrong question by anything that PATCHes this form. The editor only ever offers the wording and
 * the client's review link, which is the whole of what changes per client.
 */
function normalizeAltSuccess(
  incoming: FormDef["altSuccess"],
  current: FormDef
): FormDef["altSuccess"] {
  const base = current.altSuccess;
  if (!base) return undefined; // A form without a rule can't grow one from a request.
  if (!incoming) return base;
  return {
    fieldId: base.fieldId,
    values: base.values,
    heading: String(incoming.heading ?? base.heading),
    body: String(incoming.body ?? base.body),
    buttonLabel: String(incoming.buttonLabel ?? base.buttonLabel ?? ""),
    // ⛔ NO buttonUrl. It is not a field on a form any more — see FormDef.altSuccess. This used to
    // read `/^https?:\/\//.test(url) ? url : ""`, which let a literal link through and destroyed
    // the `{{business.reviewUrl}}` token seeded in code, because a token is not an http URL. The
    // XSS concern that rule existed for is gone with the field: nothing here becomes an href.
  };
}

/**
 * Make a new form, optionally starting from an existing one.
 *
 * A clone KEEPS every fieldId. That is what makes a preset a preset: use "Quote request" on ten
 * clients and all ten Leads tabs have the same columns. Contrast with createSite, which must
 * never inherit the source's business facts — a form has none to inherit, no phone, no email, no
 * spreadsheet id, which is why cloning is safe here by construction rather than by care.
 */
export async function createForm(opts: {
  name: string;
  from?: string;
  description?: string;
  fields?: FormField[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const name = String(opts?.name || "").trim();
  if (!name) return { ok: false, error: "A form name is required." };

  const base = slugify(name);
  if (!base) return { ok: false, error: "That name has no usable letters or numbers." };

  const existing = await readForms();
  const taken = new Set(existing.map((f) => f.id));
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;

  const source = opts?.from ? existing.find((f) => f.id === opts.from) : undefined;
  if (opts?.from && !source) return { ok: false, error: "That form no longer exists." };

  const form: FormDef = {
    id,
    name,
    kind: "preset",
    description: opts?.description ?? source?.description ?? "",
    fields: normalizeFields(opts?.fields || source?.fields || []),
    buttonLabel: source?.buttonLabel || "Send it",
    note: source?.note || "",
    successHeading: source?.successHeading || "Got it — thank you.",
    successBody: source?.successBody || "We'll be in touch shortly.",
    // Carried like the questions are: copying a long one-question-per-screen form and getting
    // back a fifteen-field wall is not what "make a copy" means.
    ...(source?.oneQuestionPerScreen ? { oneQuestionPerScreen: true } : {}),
    // The rule copies whole. There is no link left on it to leak — the destination moved to each
    // website's own settings, so a copy is safe by construction rather than by this line
    // remembering to blank a field.
    ...(source?.altSuccess ? { altSuccess: { ...source.altSuccess } } : {}),
  };

  // Saved presets only. A built-in is implicit and must never be written as a plain row, or
  // readForms would list it twice.
  const saved = existing.filter((f) => f.kind !== "builtin");
  const res = await writeForms([...saved, form]);
  if (!res.ok) return { ok: false, error: res.reason || "Couldn't save — storage is unavailable." };

  return { ok: true, id };
}

export async function updateForm(
  id: string,
  patch: Partial<FormDef>
): Promise<{ ok: boolean; error?: string }> {
  const key = String(id || "").trim();
  if (!key) return { ok: false, error: "Which form?" };

  const all = await readForms();
  const current = all.find((f) => f.id === key);
  if (!current) return { ok: false, error: "That form no longer exists." };

  const next: FormDef = {
    ...current,
    ...patch,
    // Not patchable. The id is the reference; the kind decides whether it can be deleted.
    id: current.id,
    kind: current.kind,
    fields: patch.fields ? normalizeFields(patch.fields, current.fields) : current.fields,
    // The route hands this through from raw JSON, so coerce rather than trust. A stored
    // "false"/"" would be truthy everywhere it's read and the toggle would look broken.
    oneQuestionPerScreen:
      "oneQuestionPerScreen" in patch
        ? patch.oneQuestionPerScreen === true
        : !!current.oneQuestionPerScreen,
    altSuccess: "altSuccess" in patch ? normalizeAltSuccess(patch.altSuccess, current) : current.altSuccess,
    // ⛔ REBUILT FROM NAMED KEYS, same as every question above, and for the same reason: a shape
    // that arrives from raw JSON and is stored as-is is a shape nobody validated. An ending with a
    // junk `action` would fall through every branch in LeadForm and render a button that does
    // nothing — the exact silent failure `dropdown` and `newScreen` were both bitten by.
    endings: "endings" in patch ? normalizeEndings(patch.endings) : current.endings,
  };

  // Built-ins are persisted as an override row the first time one is edited, then merged back
  // over the code copy by readForms. The code copy stays the floor.
  const saved = all.filter((f) => f.kind !== "builtin" || f.id === key);
  const rows = saved.map((f) => (f.id === key ? next : f));
  if (!rows.some((f) => f.id === key)) rows.push(next);

  const res = await writeForms(rows);
  return res.ok ? { ok: true } : { ok: false, error: res.reason || "Couldn't save." };
}

/**
 * Delete a preset.
 *
 * Built-ins refuse — they live in code, so "deleting" one would only drop the override and it
 * would reappear on the next read, which reads as a bug.
 *
 * ⚠️ A DELETED FORM CAN LEAVE PUBLISHED PAGES POINTING AT NOTHING. That is the price of the
 * pointer architecture, and it is paid in two places rather than by forbidding deletion:
 * lib/formPointer.ts LEAVES a dangling block's last-known questions alone instead of blanking it,
 * so the worst case is a stale form on a live site and never an empty box; and the delete screen
 * shows every website and page connected to this form BEFORE the button — Steven asked for that
 * by name. Show the connections, then let the human decide.
 */
export async function deleteForm(id: string): Promise<{ ok: boolean; error?: string }> {
  const key = String(id || "").trim();
  const all = await readForms();
  const target = all.find((f) => f.id === key);
  if (!target) return { ok: false, error: "That form no longer exists." };
  // ── A BUILT-IN IS HIDDEN, NOT DELETED ────────────────────────────────────────────────────────
  // Steven: *"I don't see a delete button on all of them, just some of them."* Right — built-ins
  // had none, because their questions live in code: dropping the saved row would only remove the
  // override and the form would be back on the next read, which reads as the button being broken.
  //
  // So the trash can works on all of them now, and on a built-in it puts the form AWAY. The screen
  // says "hidden" rather than "deleted" and offers it back — a control that lies about what it did
  // is worse than one that isn't there.
  //
  // ⚠️ HIDING NEVER BREAKS A PAGE. `hidden` filters the library SCREEN; findForm still resolves the
  // form, so a page pointing at one you tidied away keeps working exactly as it did.
  if (target.kind === "builtin") {
    const rows = all
      .filter((f) => f.kind !== "builtin" || f.id === key)
      .map((f) => (f.id === key ? { ...f, hidden: true } : f));
    if (!rows.some((f) => f.id === key)) rows.push({ ...target, hidden: true });
    const res = await writeForms(rows);
    return res.ok ? { ok: true } : { ok: false, error: res.reason || "Couldn't save." };
  }

  const rows = all.filter((f) => f.kind !== "builtin" && f.id !== key);
  const res = await writeForms(rows);
  return res.ok ? { ok: true } : { ok: false, error: res.reason || "Couldn't save." };
}

/** Put a hidden built-in back on the library screen. */
export async function unhideForm(id: string): Promise<{ ok: boolean; error?: string }> {
  const key = String(id || "").trim();
  const all = await readForms();
  if (!all.some((f) => f.id === key)) return { ok: false, error: "That form no longer exists." };
  const rows = all
    .filter((f) => f.kind !== "builtin" || f.id === key)
    .map((f) => (f.id === key ? { ...f, hidden: false } : f));
  const res = await writeForms(rows);
  return res.ok ? { ok: true } : { ok: false, error: res.reason || "Couldn't save." };
}

/** Rebuild the per-screen endings from raw JSON. Unknown actions are dropped, not stored. */
function normalizeEndings(raw: unknown): Record<string, ScreenEnding> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const ACTIONS = ["submit", "redirect", "tel", "book"] as const;
  const out: Record<string, ScreenEnding> = {};
  for (const [screen, v] of Object.entries(raw as Record<string, unknown>)) {
    const e = (v || {}) as Record<string, unknown>;
    const action = String(e.action || "");
    if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) continue;
    // ⛔ A redirect with no destination is the worst of the three states — it looks configured,
    // passes review, and dead-ends the customer at the moment you were sending them to Google.
    const url = String(e.url || "").trim();
    if (action === "redirect" && !url) continue;
    out[screen] = {
      action: action as ScreenEnding["action"],
      ...(url ? { url } : {}),
      ...(e.label ? { label: String(e.label) } : {}),
      ...(e.heading ? { heading: String(e.heading) } : {}),
      ...(e.body ? { body: String(e.body) } : {}),
    };
  }
  return Object.keys(out).length ? out : undefined;
}
