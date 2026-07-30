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
 * One row in the Google Sheet when she finishes, so Steven and a VA can read what she said
 * without touching the builder or an admin URL.
 *
 * The store stays the record of truth — the form saves per answer and the builder reads from it,
 * and a sheet can do neither. This is a CARBON COPY, the same split already used for leads.
 *
 * Deliberately NOT deliverLead(): that also emails the site's `leadEmail`, which for a client
 * site is the client — who would receive her own onboarding answers back by email.
 *
 * Never throws. A sheet that's down must not make her submission fail; her answers are already
 * safely stored by the time this runs.
 */
export async function copyIntakeToSheet(
  siteId: string,
  businessName: string
): Promise<string | null> {
  const webhook = process.env.APPLY_WEBHOOK_URL;
  if (!webhook) return "APPLY_WEBHOOK_URL not set — no sheet row written";

  const { INTAKE_QUESTIONS } = await import("./intakeShared");
  const record = await readIntake(siteId);

  const answers = [
    // Routes the row to its own tab. The script picks the tab from this, never from free text.
    { key: "source", label: "Source", value: "onboarding" },
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

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submittedAt: record.submittedAt || new Date().toISOString(),
        answers,
        site: businessName || siteId,
        siteId,
      }),
    });
    // ⚠️ Apps Script replies 200 even when it throws — it catches its own exception and puts the
    // failure in the BODY. Reading the status alone would call every failure a success.
    const text = (await res.text()).trim();
    if (!res.ok) return `sheet webhook HTTP ${res.status}`;
    if (!/^ok\b/i.test(text)) return `sheet webhook said: ${text.slice(0, 200)}`;
    return null;
  } catch (e) {
    return `sheet webhook unreachable: ${e instanceof Error ? e.message : String(e)}`;
  }
}
