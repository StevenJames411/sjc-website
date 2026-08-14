// GIVE AN ALREADY-IMPORTED SITE ITS DESIGN'S REAL TYPEFACE.
//
// ── WHY THIS EXISTS SEPARATELY FROM THE IMPORTER ──────────────────────────────────────────────
// `lib/designFonts` copies a bought design's actual font files onto our own Blob storage, so a
// customer's website renders in the typeface they paid for instead of `nearestFont()`'s closest of
// eight. Wiring that into the importer only helps sites imported AFTER it ships. Steven's own site
// — three designs, ten pages, a day of edits on top — is already in the database:
//
//   *"I wanted the design that we already imported, and I don't have it as far as font family is
//    concerned. So let's fix the font family that I don't have, so I could have it."*
//
// Re-importing to pick up a font would discard every edit made since. So this reads the markup the
// importer already archived (`siteKeys.designSrc`, kept for exactly this class of repair), works
// out what the design really asked for, fetches it, and writes it to the site's brand.
//
//   POST { site?, dryRun? } -> { ok, families, css, bytes, wrote }
//
// ⚠️ DRY RUN IS THE DEFAULT.
//
// ⛔ IT NEVER FAILS THE SITE. Same law as nearestFont and the importer: a family Google does not
// host, a network that is down, a design that names a system font — all return "no change" and the
// site keeps rendering exactly as it does now, on the nearest of our eight. There is no state where
// this leaves a page worse than it found it.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { readPages } from "@/lib/pageRegistry";
import { readDesignSource, sheetIdsIn, puckKey } from "@/lib/puckContent";
import { readBrand, writeBrand } from "@/lib/brand";
import { detectFontFamilies, captureDesignFonts } from "@/lib/designFonts";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  let body: { site?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  const dryRun = body?.dryRun !== false;

  const client = getClient();
  const pages = await readPages(site);

  // ⚠️ THE ARCHIVED SOURCE, NOT THE STORED MARKUP. The stored copy has been tokenised — every text
  // node replaced with `{{t:…}}` — and the Google Fonts <link> that names the real families is
  // stripped at import along with every other <link>. The archive is the page as it arrived.
  const ids = new Set<string>();
  for (const page of pages) {
    for (const pub of [false, true]) {
      const data = await createKvStore(client, puckKey(page.slug, pub, site)).read<Record<string, unknown>>();
      if (data) sheetIdsIn(data).forEach((id) => ids.add(id));
    }
  }
  if (!ids.size) return Response.json({ ok: true, site, note: "No imported designs on this website." });

  // FIRST SHEET THAT ANSWERS WINS, and that is deliberate. A site merged from three designs has
  // three opinions about its typeface; the brand holds one. Page one is the one the customer
  // looked at when they bought it — the same rule import-html uses when refusing to let page ten
  // redecide a site's fonts.
  let families = { heading: "", body: "" };
  let from = "";
  for (const id of ids) {
    const html = await readDesignSource(id);
    if (!html) continue;
    const f = detectFontFamilies(html);
    if (f.heading || f.body) {
      families = f;
      from = id;
      break;
    }
  }
  if (!families.heading && !families.body) {
    return Response.json({ ok: true, site, note: "No named font families in the archived designs." });
  }

  const got = await captureDesignFonts(families);
  if (!got) {
    return Response.json({
      ok: true,
      site,
      families,
      note: `Could not copy ${[families.heading, families.body].filter(Boolean).join(" / ")} — it is probably not a Google family. The site keeps the nearest of our eight.`,
    });
  }

  const report = {
    ok: true,
    site,
    dryRun,
    from,
    asked: families,
    got: { heading: got.heading, body: got.body },
    bytes: got.css.length,
    // Self-hosted: nothing in the emitted CSS may still point at Google, or the third-party request
    // this exists to remove is still on every customer's page.
    selfHosted: !/fonts\.g(static|oogleapis)\.com/.test(got.css),
  };
  if (dryRun) return Response.json({ ...report, note: "Dry run. Nothing written." });

  const brand = await readBrand(false, site);
  const next = {
    ...brand,
    designFamilyHeading: got.heading || "",
    designFamilyBody: got.body || "",
    designFontCss: got.css,
  };
  const okDraft = await writeBrand(next, false, site);
  // Published too: the whole point is the LIVE site wearing the typeface it was bought with, and
  // an import that lands in the draft and never publishes is the exact bug this morning produced —
  // a brand-new site live in Lexend with the design's own font already stripped from its sheet.
  const okPub = await writeBrand(next, true, site);

  return Response.json({ ...report, wrote: okDraft && okPub });
}
