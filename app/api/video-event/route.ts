// Public, no auth: the welcome video's beacon. Counts only; never throws to the client.
import { recordVideoEvent, validateVideoEvent } from "@/lib/videoStats";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ok = validateVideoEvent(await req.json().catch(() => null), req.headers.get("user-agent") || "");
    if (ok) await recordVideoEvent(ok.video, ok.event);
  } catch (e) {
    console.error("[video-event]", e instanceof Error ? e.message : e);
  }
  return new Response(null, { status: 204 });
}
