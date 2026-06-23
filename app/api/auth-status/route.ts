// Tells the client whether the current visitor is the signed-in editor, so the edit
// affordance only appears for Steven. Public visitors get { authed: false } and never
// see any edit UI (and even if they tried, every write is cookie-gated by middleware).
import { cookies } from "next/headers";

const COOKIE_NAME = "sjc_site_auth";

function expectedToken(): string | null {
  const pass = process.env.SITE_EDIT_PASSWORD;
  if (!pass) return null;
  const user = process.env.SITE_EDIT_USER || "steven";
  return Buffer.from(`${user}:${pass}`).toString("base64");
}

export const dynamic = "force-dynamic";

export async function GET() {
  const expected = expectedToken();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return Response.json({ authed: Boolean(expected && token === expected) });
}
