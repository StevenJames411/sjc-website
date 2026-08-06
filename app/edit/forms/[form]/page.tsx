import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findForm } from "@/lib/forms";
import { readSites } from "@/lib/sites";
import { intakeSummaries } from "@/lib/intake";
import { onboardUrlFor } from "@/lib/hostShared";
import { SJC } from "@/lib/siteKeys";
import { ONBOARDING_FORM_ID } from "@/lib/intakeShared";
import FormEditor from "@/components/edit/FormEditor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit form" };

/**
 * WHO THIS FORM IS SWITCHED ON FOR — and the switches themselves, on this screen.
 *
 * ── THE MISTAKE THIS FIXES ───────────────────────────────────────────────────────────────────
 * Steven, editing the onboarding form: *"I don't see anywhere to attach it to a business."* My
 * first two answers explained that the switch lives on the Websites screen. Both were correct and
 * both were wrong, because his actual reply was the real finding: *"this is turning into a hot
 * mess. I need to go to the websites to mess with the forms instead of being in the forms
 * library. Is that step one?"*
 *
 * No. Explaining a split is not the same as justifying it. A form's questions were here and the
 * one control that makes the form REACH anybody was two screens away, so the answer to "how do I
 * use this form" was never on the page where you use it. The controls come here.
 *
 * ⚠️ THE WEBSITES SCREEN KEEPS ITS COPY. Not a move — the same switches in both places, because
 * the chase list ("open · 4 of 9 for four days") belongs beside the business, and turning a form
 * on belongs beside the form. Both are the same one call to /api/admin/intake.
 */
async function onboardingFacts() {
  const sites = (await readSites()).filter((s) => s.id !== SJC && !s.deletedAt);
  const summaries = await intakeSummaries(sites.map((s) => ({ id: s.id })));
  return {
    businesses: sites.map((s) => {
      const it = summaries[s.id];
      return {
        id: s.id,
        name: s.name,
        url: onboardUrlFor({ id: s.id, domain: s.domain }),
        status: it?.status || "never opened",
        answered: it?.answered || 0,
        asked: it?.asked || 0,
        submitted: Boolean(it?.submitted),
      };
    }),
  };
}

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ form: string }>;
}) {
  const { form } = await params;
  const found = await findForm(form);
  if (!found) notFound();

  // Paid for only on the one form that needs it. Every other form's "where" is a page or three,
  // and the editor asks the usage API for those.
  const onboarding = found.id === ONBOARDING_FORM_ID ? await onboardingFacts() : undefined;

  return <FormEditor form={found} onboarding={onboarding} />;
}
