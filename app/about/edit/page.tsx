import { redirect } from "next/navigation";

// The builder moved to the unified /edit/<page> route. Keep the old link working.
export default function AboutEditRedirect() {
  redirect("/edit/about");
}
