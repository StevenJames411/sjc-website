"use client";
import DesignSection from "@/components/blocks/DesignSection";
import type { DesignText } from "@/components/blocks/DesignSection";
import { fillTokens } from "@/lib/businessTokens";
import { useBusiness, useSiteUrl } from "@/components/blocks/SiteContext";

// Show the PHONE NUMBER on the builder canvas, not `{{business.phone}}`.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// Steven, looking at a Call button in his own builder that read `Call{{business.phone}}`:
//
//   *"Why in the fuck would a human want to read code instead of the actual phone number? The
//    code does not help me. If I saw the phone number, I'd know if it was the correct phone
//    number."*
//
// He is right, and the job of an editing canvas is exactly that: let him look at a thing and know
// whether it is correct. `{{business.phone}}` cannot answer that question. It is the storage
// format leaking into the surface a person reads.
//
// ── WHY IT LOOKED UNAVOIDABLE, AND WHY IT IS NOT ──────────────────────────────────────────────
// lib/businessTokens carried a note saying substitution is public-render-only, because *"the next
// auto-save would write the resolved VALUE back into the block and quietly sever the link to the
// settings screen"* — turning a live reference into frozen digits. That was a real hazard and a
// correct call at the time.
//
// ⚠️ IT EXPIRED 2026-08-13, when autosave was removed (see PuckEditor: one Save button, pressed on
// purpose). Nothing writes on render any more.
//
// But the deeper point is that the trade was never necessary. Two different things were being
// conflated:
//   • WHAT IS STORED must stay `{{business.phone}}` — that reference is the entire feature.
//   • WHAT IS DRAWN should be the number.
// They only had to match because the old path substituted into the DATA before handing it to the
// editor, so a save round-tripped the resolved value back in. This resolves on the way to the
// SCREEN and nowhere else: `props` are read, never written, and Puck keeps the tokens it already
// had. The same split TokenText has used for the page-title field since 2026-08-06.
//
// ⛔ EDITOR ONLY. On a published page DesignSection is rendered directly and lib/publicSitePage
// does the real fill — this component is never in that path. Keeping it out means the published
// markup stays byte-identical to the imported design, which is the promise sealed import rests on.
export default function DesignSectionLive(
  props: React.ComponentProps<typeof DesignSection>
) {
  const business = useBusiness();
  const siteUrl = useSiteUrl();

  // Not editing → hand the block through untouched. No resolve, no copy, no behaviour change.
  if (!props.editing) return <DesignSection {...props} />;

  const fill = (s: string) => (s && s.includes("{{") ? fillTokens(s, business, siteUrl) : s);

  // The text ROWS are what the sidebar list reads back, and the html is what the canvas draws.
  // Both get the readable value; neither is written anywhere.
  const text = (props.text || []).map((r: DesignText) =>
    r && typeof r.value === "string" && r.value.includes("{{") ? { ...r, value: fill(r.value) } : r
  );

  return <DesignSection {...props} html={fill(props.html || "")} text={text} />;
}
