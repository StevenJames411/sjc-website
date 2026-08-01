import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findForm } from "@/lib/forms";
import FormEditor from "@/components/edit/FormEditor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit form" };

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ form: string }>;
}) {
  const { form } = await params;
  const found = await findForm(form);
  if (!found) notFound();
  return <FormEditor form={found} />;
}
