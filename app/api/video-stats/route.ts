// Owner-only (middleware gates every /api route not listed public): per video, totals and the last 14 days.
import { readVideoStats } from "@/lib/videoStats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ ok: true, videos: await readVideoStats() });
  } catch {
    return Response.json({ ok: false, error: "Could not read the numbers" }, { status: 500 });
  }
}
