// Browser-side image preparation. Runs BEFORE anything is uploaded.
//
// FIRST PRINCIPLE: we do not get to choose what a business owner sends us. A groomer photographs
// a dog on an iPhone and uploads it from a Windows laptop in Chrome. A contractor sends a 48-
// megapixel Android shot. Someone drags in a screenshot. Every one of those has to land as a
// clean, small, web-safe image without the person being told to go fix anything.
//
// What used to happen instead: /api/upload stored the raw file byte-for-byte, so
//   - HEIC (the iPhone default) went up as HEIC. No browser can display it. Broken image, no error.
//   - A 5 MB, 4032px photo was served at full size to every visitor on a phone.
//   - EXIF rode along, including GPS. A photo taken at a client's house carried the address to a
//     public URL.
//   - Anything over ~4.5 MB never reached the function at all — Vercel caps the request body — so
//     the upload just failed.
//
// Doing this in the browser rather than on the server is deliberate: it is the only place the
// file exists before it has to survive that 4.5 MB cap, and it needs no image library on Vercel
// (`sharp` can't read HEIC without libheif, which isn't in the build Vercel ships).

/** Longest edge of the stored image. Beyond this is invisible on the web and costs load time. */
const MAX_EDGE = 2000;
/** JPEG quality. 0.82 is the point where artefacts stop being visible on photographs. */
const QUALITY = 0.82;
/** Files at or under this are already small; only convert if the format needs it. */
const SMALL_ENOUGH = 400 * 1024;

export type PreparedImage = {
  file: File;
  /** Set when the file was changed, for showing the person what happened. */
  note?: string;
};

const isHeic = (f: File) =>
  /image\/hei[cf]/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);

/**
 * HEIC → JPEG via a WebAssembly decoder, loaded ONLY when a HEIC actually shows up.
 *
 * Safari decodes HEIC natively, so on a Mac this is never needed — which is exactly the trap:
 * building for Safari alone means every client on Windows or Android silently fails. The decoder
 * is a dynamic import so the ~1 MB of WASM is never downloaded by anyone who doesn't hit it.
 */
async function decodeHeic(file: File): Promise<Blob> {
  const { heicTo } = await import("heic-to");
  return heicTo({ blob: file, type: "image/jpeg", quality: QUALITY });
}

/** Decode to a bitmap, honouring EXIF orientation so phone photos aren't sideways. */
async function toBitmap(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    // Older Safari doesn't accept the options bag.
    return await createImageBitmap(blob);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("could not encode image"))), type, q)
  );
}

/**
 * Take whatever the person picked and return something safe to store.
 *
 * Re-encoding through a canvas is what strips EXIF — the canvas only ever holds pixels, so GPS,
 * camera serial, and timestamps are gone by construction rather than by us remembering to delete
 * them field by field.
 *
 * Never throws for a merely awkward file: if anything goes wrong it returns the original with a
 * note, so a strange image is still uploadable and the person isn't blocked by our cleverness.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  // SVGs are markup, not pixels — a canvas would rasterise them and destroy the whole point.
  if (file.type === "image/svg+xml") return { file };
  // GIFs may be animated; a canvas would flatten them to the first frame.
  if (file.type === "image/gif") return { file };

  const heic = isHeic(file);
  if (!heic && file.size <= SMALL_ENOUGH) {
    // Already small and already web-safe. Still worth a pass if it's huge in pixels, but at
    // this file size it won't be.
    return { file };
  }

  try {
    const source: Blob = heic ? await decodeHeic(file) : file;
    const bitmap = await toBitmap(source);

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas context");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    // Keep transparency when the original had it; otherwise JPEG, which is far smaller.
    const keepAlpha = file.type === "image/png" || file.type === "image/webp";
    const outType = keepAlpha ? "image/webp" : "image/jpeg";
    const blob = await canvasToBlob(canvas, outType, QUALITY);

    // A conversion that made things worse isn't a conversion. Only applies to non-HEIC, since a
    // HEIC has to be replaced whatever its size.
    if (!heic && blob.size >= file.size) return { file };

    const ext = outType === "image/webp" ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    const out = new File([blob], name, { type: outType });

    const kb = (n: number) => Math.round(n / 1024).toLocaleString();
    const parts: string[] = [];
    if (heic) parts.push("converted from HEIC");
    if (scale < 1) parts.push(`resized to ${w}×${h}`);
    parts.push(`${kb(file.size)} KB → ${kb(out.size)} KB`);
    parts.push("location data removed");

    return { file: out, note: parts.join(" · ") };
  } catch (err) {
    // HEIC that we genuinely could not decode is the one case worth naming, because the person
    // can act on it. Everything else uploads as-is and the server still has its own limits.
    if (heic) {
      throw new Error(
        "Could not read this iPhone photo (HEIC). On the iPhone: Settings → Camera → Formats → " +
          "Most Compatible, then retake or re-send it."
      );
    }
    console.warn("[imagePrep] falling back to the original file:", err);
    return { file };
  }
}
