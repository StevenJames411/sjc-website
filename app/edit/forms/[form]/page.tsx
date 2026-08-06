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
 * WHERE THIS FORM RUNS — answered on the screen where you edit it.
 *
 * ⚠️ Steven, editing the onboarding form: *"I don't see anywhere to attach it to a business."*
 * There is nowhere, and there shouldn't be — one form serves every client, and WHICH client is
 * decided by which link you open. But a screen that simply omits the control someone is looking
 * for teaches them it's hidden, not that it doesn't exist. So the editor states where the form
 * runs rather than leaving him hunting for a field that was never going to be there.
 */
async function onboardingFacts() {
  const sites = (await readSites()).filter((s) => s.id !== SJC && !s.deletedAt);
  const summaries = await intakeSummaries(sites.map((s) => ({ id: s.id })));
  return {
    example: onboardUrlFor({ id: sites[0]?.id || "<business>", domain: sites[0]?.domain }),
    openFor: sites.filter((s) => summaries[s.id]?.status === "open").map((s) => s.name),
    total: sites.length,
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
