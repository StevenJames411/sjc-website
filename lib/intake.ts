// Storage for what a business owner fills in on her intake link. SERVER ONLY.
//
// Rides the same durable store as everything else (Neon, append-only `state_rev`), which is what
// makes the form resumable: every answer is written the moment it's given, so a half-finished
// form survives a closed tab, a dead battery, or a phone call in the middle of it. Half of these
// owners are filling this in on a phone between jobs — a form that loses its work on interruption
// is a form that never gets finished.

import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { siteKeys } from "./siteKeys";
import type { IntakeAnswers } from "./intakeShared";

export type IntakeRecord = {
  answers: IntakeAnswers;
  /** Blob URLs of the photos she's sent so far. */
  photos: string[];
  /** Set once she presses the final button, so Steven can tell "still going" from "done". */
  submittedAt?: string;
  updatedAt?: string;
  /** Set when a disqualifying answer ended the flow — a record of why, not a deletion. */
  stoppedBecause?: string;
};

const empty = (): IntakeRecord => ({ answers: {}, photos: [] });

const store = (siteId: string) => createKvStore(getClient(), siteKeys(siteId).intake);

export async function readIntake(siteId: string): Promise<IntakeRecord> {
  const v = await store(siteId).read<IntakeRecord>();
  return { ...empty(), ...(v || {}) };
}

/**
 * Merge and save. Merging rather than replacing matters because the form saves per answer: two
 * fields answered in quick succession must not have the second overwrite the first with a
 * document that doesn't know about it.
 */
export async function patchIntake(
  siteId: string,
  patch: Partial<IntakeRecord>
): Promise<{ ok: boolean; reason?: string; record: IntakeRecord }> {
  const current = await readIntake(siteId);
  const next: IntakeRecord = {
    ...current,
    ...patch,
    answers: { ...current.answers, ...(patch.answers || {}) },
    photos: patch.photos ? patch.photos : current.photos,
    updatedAt: new Date().toISOString(),
  };
  const res = await store(siteId).writeResult(next);
  return { ok: res.ok, reason: res.reason, record: next };
}

/** Add photos without needing to know the ones already there — the client is on a phone. */
export async function addIntakePhotos(siteId: string, urls: string[]) {
  const current = await readIntake(siteId);
  return patchIntake(siteId, { photos: [...current.photos, ...urls] });
}

/** How many photos one client may send. Past this it isn't onboarding, it's a file host. */
export const MAX_INTAKE_PHOTOS = 40;

/**
 * One row in the CLIENT'S OWN sheet when she finishes, so she and Steven can both read it.
 *
 * ⚠️ NOT SJC's intake sheet (2026-07-30). The first version pointed this at `APPLY_WEBHOOK_URL`,
 * which is Steven's own three-tab operations sheet. Wrong, and against a rule already written
 * into scripts/apply-webhook.gs: a client is a different shape — one website, one form, and
 * their OWN sheet, which Steven owns and shares with them view-only. Her onboarding answers
 * belong beside her leads, on the sheet she can open, not filed inside Steven's operations.
 *
 * The store stays the record of truth either way — the form saves per answer and the builder
 * reads from it, and a sheet can do neither. This is a CARBON COPY.
 *
 * Deliberately NOT deliverLead(): that emails the site's `leadEmail`, which on a client site is
 * the client — she'd receive her own onboarding answers back by email.
 *
 * Never throws. A sheet that's down must not fail her submission; her answers are already stored.
 */
export async function copyIntakeToSheet(
  siteId: string,
  businessName: string,
  /** Which spreadsheet is hers. Absent until one has been created for her. */
  spreadsheetId?: string
): Promise<string | null> {
  if (!spreadsheetId) {
    return `no sheet for '${siteId}' yet — answers are stored, nothing was copied`;
  }

  const { INTAKE_QUESTIONS } = await import("./intakeShared");
  const { writeSheetRow } = await import("./sheets");
  const record = await readIntake(siteId);

  const answers = [
    { key: "business", label: "Business", value: businessName || siteId },
    ...INTAKE_QUESTIONS.filter((q) => q.type !== "photos" && record.answers[q.id]).map((q) => ({
      key: q.id,
      label: q.label,
      value: String(record.answers[q.id]),
    })),
    { key: "photoCount", label: "Photos", value: String(record.photos.length) },
    // The URLs themselves, so the photos are one click away from the row.
    { key: "photoUrls", label: "Photo links", value: record.photos.join("\n") },
  ];

  const res = await writeSheetRow({
    spreadsheetId,
    tab: "Onboarding",
    answers,
    submittedAt: record.submittedAt || new Date().toISOString(),
  });
  return res.ok ? null : res.error;
}

/**
 * Onboarding state for every site, for the builder's gallery.
 *
 * THE QUESTION THIS ANSWERS is never "what's the state of this one business" — you already know
 * that, you're standing in her site. It's "WHICH OF MY CLIENTS STILL OWE ME THEIR INFORMATION",
 * which is a question across all of them at once. That's why this is a batch read feeding the
 * gallery, and why the count matters: "open · 1 of 9" for four days is a client who needs a nudge,
 * and you can see it without opening anything.
 */
export async function intakeSummaries(
  sites: { id: string }[]
): Promise<Record<string, import("./intakeShared").IntakeSummary>> {
  const { intakeAccess } = await import("./intakeLinks");
  const { questionsFor } = await import("./intakeShared");
  const { findSite } = await import("./sites");

  const out: Record<string, import("./intakeShared").IntakeSummary> = {};
  await Promise.all(
    sites.map(async (s) => {
      const [access, record, site] = await Promise.all([
        intakeAccess(s.id),
        readIntake(s.id),
        findSite(s.id),
      ]);
      const asked = questionsFor(site || null);
      out[s.id] = {
        status: !access ? "never opened" : access.status === "open" ? "open" : "closed",
        answered: asked.filter((q) =>
          q.type === "photos" ? record.photos.length > 0 : Boolean(record.answers[q.id])
        ).length,
        asked: asked.length,
        photos: record.photos.length,
        submitted: Boolean(record.submittedAt),
      };
    })
  );
  return out;
}
