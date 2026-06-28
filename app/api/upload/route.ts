// Image upload endpoint for the Puck builder. Accepts a multipart POST with a single
// "file" field, stores the file in Vercel Blob (public access), returns { url }.
// Protected by middleware — only the signed-in owner can reach this route.
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get("file") as File | null;
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  if (!file) {
    return Response.json({ error: "no file" }, { status: 400 });
  }
  // Prefix with a timestamp so repeated uploads of the same filename don't collide.
  const pathname = `uploads/${Date.now()}-${file.name}`;
  const blob = await put(pathname, file, { access: "public" });
  return Response.json({ url: blob.url });
}
