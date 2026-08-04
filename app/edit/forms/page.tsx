// The form library.
//
// A static segment under /edit, so it wins precedence over app/edit/[site] the same way
// /edit/[site]/settings wins over /edit/[site]/[page]. "forms" is in RESERVED_SITE_IDS for that
// reason — without it a website with that id would be created happily and then be unopenable.
//
// Owner-only for free: middleware.ts protects everything under /edit/.
//
// The heading and the browser tab both read the name Steven gave this screen in the rail — one
// screen, one name. See navLabel in lib/editNav.ts.
import { readForms } from "@/lib/forms";
import { navLabel } from "@/lib/editNav";
import FormLibrary from "@/components/edit/FormLibrary";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: await navLabel("forms") };
}

export default async function FormsPage() {
  const [forms, title] = await Promise.all([readForms(), navLabel("forms")]);
  return <FormLibrary forms={forms} title={title} />;
}
