"use client";

import { useBusiness } from "@/components/blocks/SiteContext";

/**
 * Steven's ruling, 2026-09-18: booking an appointment or sending a form IS the consent to be
 * contacted about it, by any channel, including AI-assisted calls. One sentence goes under every
 * visitor-facing form's submit button and under every booking calendar — no checkbox, no link,
 * no modal.
 *
 * The business name comes from THIS site's own record (`useBusiness()`), never hardcoded — a
 * client site shows its own name, SJC's own pages show SJC's. `businessName` is an explicit
 * override for a caller that already resolved it server-side (SJC's hand-written /apply and
 * /guest pages, wrapped in a SiteProvider). No name on record falls back to "we".
 *
 * `className` is caller-supplied on purpose: an imported design's own text colour, a dark hero
 * card and a plain white card all mute text differently, and this has no ambient style of its
 * own to fall back on. The default relies on INHERITED colour + opacity rather than a hardcoded
 * shade — the only version that reads on both a white section and a dark one with no caller effort.
 */
/**
 * WHY we will contact them is spelled out, never "about your request" (Steven, 2026-09-18: "they
 * don't know what a request is… spell it out, you get less friction… and instead of saying we may
 * reach out, say we're GOING to"). `why` picks the reason: a booking says "to confirm your
 * appointment" (the default — most mounts sit on a calendar or a funnel that ends in one); a plain
 * form says "to follow up"; anything else (a job application) passes its own words.
 */
const WHY = {
  appointment: { lead: "By booking", reason: "to confirm your appointment" },
  form: { lead: "By sending this form", reason: "to follow up" },
} as const;

export default function ConsentLine({
  businessName,
  why = "appointment",
  reason,
  className = "mt-3 text-center text-xs opacity-70",
  id,
}: {
  businessName?: string;
  /** Which sentence: a booking (default) or a plain form. */
  why?: keyof typeof WHY;
  /** Overrides the reason on a plain form, e.g. "to follow up on your application". */
  reason?: string;
  className?: string;
  /** Lets a submit button carry `aria-describedby={id}` without restructuring the form. */
  id?: string;
}) {
  const business = useBusiness();
  const who = (businessName || business?.name || "").trim() || "we";
  return (
    <p id={id} className={className}>
      {WHY[why].lead}, you agree that {who} will call, text or email you {reason || WHY[why].reason},
      including AI-assisted calls and messages, at the number and email you provide.
    </p>
  );
}
