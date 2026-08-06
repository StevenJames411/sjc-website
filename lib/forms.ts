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
  FORM_FIELD_TYPES,
  SATISFIED_BY_CHOICES,
  mintFieldId,
  type FormDef,
  type FormField,
  type FormFieldType,
  type FormKind,
} from "./formsShared";
import { ONBOARDING_FORM } from "./intakeShared";

export * from "./formsShared";

type FormsBlob = { forms?: FormDef[] };

const store = () => createKvStore(getClient(), FORMS_KEY);

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
  // writeResult, not write: the save guard in lib/pgClient.ts refuses an array that shrinks too
  // far, and deleting a few presets from a small library is exactly that shape. A refused save
  // that reports success is the failure this whole layer exists to prevent, so the reason has to
  // reach the human looking at the save indicator.
  const res = await store().writeResult({ forms });
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
      ...(type === "choice" && Array.isArray(f?.options)
        ? { options: f.options.map((o) => String(o)).filter(Boolean) }
        : {}),
      ...(SATISFIED_BY_CHOICES.some((c) => c.path === satisfiedBy) ? { satisfiedBy } : {}),
      ...(f?.step ? { step: String(f.step) } : {}),
    });
  }
  return out;
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
  if (target.kind === "builtin") {
    return { ok: false, error: "Built-in forms can't be deleted — edit it or make a copy instead." };
  }

  const rows = all.filter((f) => f.kind !== "builtin" && f.id !== key);
  const res = await writeForms(rows);
  return res.ok ? { ok: true } : { ok: false, error: res.reason || "Couldn't save." };
}
