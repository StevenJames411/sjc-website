// Résumé upload for the careers form. PUBLIC by necessity — an applicant has no account.
//
// Modelled on /api/intake/upload, which is the other public writer here, and it carries the same
// discipline: this route cannot trust its caller, so it re-checks type and size itself and writes
// to a path IT derives. Nothing caller-supplied reaches the storage key.
//
// ⚠️ DOCUMENTS ONLY, AND SMALL. A public upload endpoint is a free file host to anyone who finds
// it. The allow-list is deliberately short — a CV is a PDF or a Word file, never a zip, never an
// image, never a script.
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);
const OK_EXT = /\.(pdf|doc|docx|txt)$/i;

export async function POST(req: Request) {
  let file: File | null = null;
  try {
    file = (await req.formData()).get("file") as File | null;
  } catch {
    return Response.json({ ok: false, error: "bad request" }, { status: 400 });
  }
  if (!file) return Response.json({ ok: false, error: "no file" }, { status: 400 });

  if (file.size > MAX_BYTES) {
    return Response.json(
      { ok: false, error: "That file is over 5MB — send a PDF and it will fit." },
      { status: 413 }
    );
  }
  // Check BOTH, because a browser can report an empty type and an extension can lie.
  if (!OK_TYPES.has(file.type) && !OK_EXT.test(file.name || "")) {
    return Response.json(
      { ok: false, error: "PDF, Word or plain text, please." },
      { status: 415 }
    );
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ ok: false, error: "uploads unavailable" }, { status: 503 });
  }

  // The stored name is ours: a timestamp plus a sanitised original, under a fixed prefix. A
  // caller-supplied path is how a public uploader becomes someone else's problem.
  const safe = (file.name || "resume")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-60);
  try {
    const blob = await put(`careers/${Date.now()}-${safe}`, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return Response.json({ ok: true, url: blob.url, name: file.name || safe });
  } catch (e) {
    console.error("[careers/upload]", e);
    return Response.json({ ok: false, error: "upload failed" }, { status: 500 });
  }
}
