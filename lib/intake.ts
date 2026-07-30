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
