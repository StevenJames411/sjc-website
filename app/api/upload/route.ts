// Image upload endpoint for the Puck builder. Accepts a multipart POST with a single
// "file" field, stores the file in Vercel Blob (public access), returns { url }.
// Protected by middleware — only the signed-in owner can reach this route.
import { put } from "@vercel/blob";
import { SJC } from "@/lib/siteKeys";
import { siteOr } from "@/lib/siteAccess";

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

  // Server-side net (2026-07-30). The browser now decodes, downscales and strips EXIF before
  // anything reaches here (lib/imagePrep.ts) — but this route is reachable by anything holding
  // the owner credential, so it can't assume that ran. These checks are the floor, not the feature.
  if (file.type && !file.type.startsWith("image/")) {
    return Response.json(
      { error: `That's a ${file.type} file, not an image.` },
      { status: 415 }
    );
  }
  // Vercel caps the request body around 4.5 MB, so a bigger file fails before it ever gets here.
  // Naming the real cause beats the generic network error the browser would otherwise show.
  if (file.size > 4 * 1024 * 1024) {
    return Response.json(
      { error: `That image is ${Math.round(file.size / 1024 / 1024)} MB. The limit is 4 MB.` },
      { status: 413 }
    );
  }
  if (/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    // Only reachable if the browser step was skipped. A stored HEIC displays nowhere, so
    // refusing it loudly beats serving a permanently broken image.
    return Response.json(
      { error: "HEIC photos must be converted before upload." },
      { status: 415 }
    );
  }

  // Keep the name recognisable but strip anything that could confuse a path or a URL.
  const safe = file.name.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(-80) || "image";
  // ⚠️ SITE-PREFIXED, AND THAT IS WHAT MAKES DELETION POSSIBLE AT ALL (2026-08-12). Every upload
  // used to land in one flat `uploads/` folder with nothing naming its owner — so when a website
  // was permanently deleted its photos stayed publicly served forever. There was no way to even
  // ENUMERATE one site's images, let alone remove them, which quietly made the 30-day erasure
  // promise false for every photo a client ever sent. `purgeSiteForever` deletes the `sites/<id>/`
  // prefix; without this line there is nothing there for it to find.
  // ⛔ SCOPED — and this one matters more than most: an upload writes a PUBLIC blob under
  // `sites/<id>/`, so an unscoped call drops a stranger's file into someone else's folder, where
  // it is then served from their website and swept up by THEIR deletion.
  // ⛔ THE FALLBACK IS THE CONSTANT, NEVER A TYPED-IN ID (2026-09-04). This read `|| "sjc"`, and on
  // 2026-09-04 that cost the live site three images. An upload with no `?site=` landed in
  // `sites/sjc/` — the RETIRED site's folder — while being used on the live site, because a blob
  // URL does not care which folder it sits in. It served perfectly until `purgeSiteForever` was run
  // on that retired site, which deletes the `sites/<id>/` prefix by design, and the live About hero,
  // an explainer graphic and the favicon all went with it.
  //
  // ⚠️ A HARDCODED ID GOES STALE SILENTLY AND A CONSTANT CANNOT. `SJC` now resolves to the site that
  // is actually live, so a defaulted upload lands where the file is used. The literal would also
  // 404 outright today, since no site with that id exists any more.
  const asked =
    String(new URL(req.url).searchParams.get("site") || "")
      .replace(/[^a-z0-9-]/gi, "")
      .toLowerCase() || SJC;
  const { site: __s, deny } = await siteOr(asked, req);
  if (deny) return deny;
  const site = __s.id;
  // Timestamp so repeated uploads of the same filename don't collide.
  const pathname = `sites/${site}/uploads/${Date.now()}-${safe}`;
  const blob = await put(pathname, file, { access: "public" });
  return Response.json({ url: blob.url });
}
