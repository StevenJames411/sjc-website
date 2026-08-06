// Re-cut an ALREADY-IMPORTED design section into the bands hiding inside it.
//
// ── WHY THIS EXISTS INSTEAD OF "JUST RE-IMPORT" ───────────────────────────────────────────────
// Because until 2026-08-05 the importer threw the source markup away. It kept the finished page
// and the compiled stylesheet, and nothing else — so when the splitter improved, there was no
// file left to feed it. Four live pages, and the only remedy on offer was asking Steven to go
// find the originals again. (siteKeys.designSrc now archives it, but that only helps imports
// from today forward.)
//
// So this works from what IS kept: the tokenised markup on each DesignSection block. Splitting
// that is the same operation as splitting the original — the tokens are inert text and travel
// with whichever piece they land in. What has to be done by hand is repartitioning the block's
// text / image / link ROWS so each new piece carries only the rows its own markup references.
//
//   POST { site?, page?, dryRun?, publish? } -> { ok, pages: [{ slug, before, after }] }
//
// ⚠️ DRY RUN BY DEFAULT, publish a second opt-in — same contract as the other admin routes.
//
// ⚠️ WHAT THIS CANNOT DO: pair the desktop and mobile navs. That happens while the markup is
// being tokenised, and these pages are already tokenised — the two copies were assigned separate
// keys months ago and nothing here can tell which pairs with which. Nav pairing applies to
// imports from now on. Said out loud because a route that silently does 90% of what its name
// suggests is how you end up trusting a page that was never fixed.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { readPages } from "@/lib/pageRegistry";
import { SJC } from "@/lib/siteKeys";
import { explodeBands } from "@/lib/designHtml";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Row = { key: string };
type SectionProps = {
  id?: string;
  html?: string;
  text?: Row[];
  images?: Row[];
  links?: Row[];
  paddingTop?: number;
  paddingBottom?: number;
  hasForm?: boolean;
  useRealForm?: boolean;
  formFields?: unknown;
  formButton?: unknown;
};
type Block = { type?: string; props?: SectionProps };

/** Rows whose token actually appears in this piece of markup. */
const rowsIn = (rows: Row[] | undefined, html: string, kind: string) =>
  (rows || []).filter((r) => r?.key && html.includes(`{{${kind}:${r.key}}}`));

export async function POST(req: Request) {
  let body: { site?: string; page?: string; dryRun?: boolean; publish?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  const only = String(body?.page || "").trim();
  const dryRun = body?.dryRun !== false;
  const publish = !dryRun && body?.publish === true;

  const client = getClient();
  const pages = await readPages(site);
  const report: { slug: string; before: number; after: number; published?: boolean }[] = [];

  for (const page of pages) {
    if (only && page.slug !== only) continue;

    const store = createKvStore(client, puckKey(page.slug, false, site));
    const data = await store.read<{ content?: Block[] }>();
    if (!data?.content?.length) continue;

    const before = data.content.length;
    const next: Block[] = [];
    let split = false;

    for (const block of data.content) {
      const props = block?.props;
      if (block?.type !== "DesignSection" || !props?.html) {
        next.push(block);
        continue;
      }

      const bands = explodeBands(props.html);
      if (!bands || bands.length < 2) {
        next.push(block);
        continue;
      }
      split = true;

      bands.forEach((html, i) => {
        // The form lives in exactly one band. Only that one keeps the form settings — copying
        // them onto all five would mount five lead forms on one page, each writing to the same
        // sheet, and the first one anybody filled in would look like four lost enquiries.
        const holdsForm = /data-sjc-form/.test(html);
        next.push({
          ...block,
          props: {
            ...props,
            // Ids must stay unique: Puck treats two blocks sharing an id as ONE node and renders
            // the last one's content in every slot.
            id: `${props.id || "design"}-b${i + 1}`,
            html,
            text: rowsIn(props.text, html, "t"),
            images: rowsIn(props.images, html, "i"),
            links: rowsIn(props.links, html, "h"),
            // Keep the section's outer spacing at its edges rather than repeating it between
            // every band, which would silently add four gaps that were never in the design.
            paddingTop: i === 0 ? props.paddingTop : 0,
            paddingBottom: i === bands.length - 1 ? props.paddingBottom : 0,
            hasForm: holdsForm && !!props.hasForm,
            useRealForm: holdsForm && !!props.useRealForm,
            formFields: holdsForm ? props.formFields : [],
            formButton: holdsForm ? props.formButton : "",
          },
        });
      });
    }

    if (!split) continue;

    const row: { slug: string; before: number; after: number; published?: boolean } = {
      slug: page.slug,
      before,
      after: next.length,
    };
    if (!dryRun) {
      await store.write({ ...data, content: next });
      if (publish) {
        row.published = await createKvStore(client, puckKey(page.slug, true, site)).write({
          ...data,
          content: next,
          _pub: 1,
        });
      }
    }
    report.push(row);
  }

  return Response.json({ ok: true, dryRun, publish, site, pages: report });
}
