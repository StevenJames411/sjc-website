// Photo upload for the intake form. PUBLIC, gated by the form's open state.
//
// /api/upload trusts its caller because middleware already proved they're the owner. This route
// cannot: whoever holds a client link can reach it. So it re-checks everything, and it stores into
// a path derived from the site id we just verified is open — never a caller-supplied path.
import { put } from "@vercel/blob";
import { checkIntakeOpen } from "@/lib/intakeLinks";
import { readIntake, addIntakePhotos, MAX_INTAKE_PHOTOS } from "@/lib/intake";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const siteId = (new URL(req.url).searchParams.get("site") || "").trim();
  if (!siteId) return Response.json({ ok: false, error: "site required" }, { status: 400 });
  const open = await checkIntakeOpen(siteId);
  if (!open.ok) return Response.json({ ok: false, error: "form is closed" }, { status: 403 });

  // A cap per client, not per request — otherwise "one at a time" is an unlimited upload loop.
  const existing = await readIntake(siteId);
  if (existing.photos.length >= MAX_INTAKE_PHOTOS) {
    return Response.json(
      { ok: false, error: `That's ${MAX_INTAKE_PHOTOS} photos — plenty. Text Steven if you have more.` },
      { status: 429 }
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get("file") as File | null;
  } catch {
    return Response.json({ ok: false, error: "bad request" }, { status: 400 });
  }
  if (!file) return Response.json({ ok: false, error: "no file" }, { status: 400 });

  if (file.type && !file.type.startsWith("image/")) {
    return Response.json({ ok: false, error: "That's not an image." }, { status: 415 });
  }
  if (/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    // The browser converts HEIC before sending (lib/imagePrep.ts). Reaching here means that step
    // was skipped, and a stored HEIC displays nowhere — better to refuse than serve a broken image.
    return Response.json(
      { ok: false, error: "That photo needs converting first — try again." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { ok: false, error: "That photo is too big. Try it again — it should shrink automatically." },
      { status: 413 }
    );
  }

  // The path comes from the TOKEN, so a client's photos physically cannot land in another
  // client's folder, whatever the caller sends.
  const safe = file.name.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(-60) || "photo";
  const blob = await put(`sites/${siteId}/intake/${Date.now()}-${safe}`, file, {
    access: "public",
  });

  const { ok, reason } = await addIntakePhotos(siteId, [blob.url]);
  if (!ok) return Response.json({ ok: false, error: reason || "could not save" }, { status: 409 });

  return Response.json({ ok: true, url: blob.url });
}
