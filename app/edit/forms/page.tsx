// The form library.
//
// A static segment under /edit, so it wins precedence over app/edit/[site] the same way
// /edit/[site]/settings wins over /edit/[site]/[page]. "forms" is in RESERVED_SITE_IDS for that
// reason — without it a website with that id would be created happily and then be unopenable.
//
// Owner-only for free: middleware.ts protects everything under /edit/.
import type { Metadata } from "next";
import { readForms } from "@/lib/forms";
import FormLibrary from "@/components/edit/FormLibrary";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Forms" };

export default async function FormsPage() {
  return <FormLibrary forms={await readForms()} />;
}
