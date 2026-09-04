#!/usr/bin/env python3
"""link_audit.py — catch menu links that point at the wrong page.

⛔ WHY THIS EXISTS (2026-08-24). Reordering the five services on the home page moved the
menu TEXT but not the HREFS, so every item in the hamburger opened the wrong page and the
site said nothing was wrong. Steven found it, not a test.

An imported design binds an anchor to its words in the HTML itself:

    <a href="{{h:h2}}"> <h3>{{t:t5}}</h3> <p>{{t:t6}}</p> </a>

So the visible label is derivable, and the correct destination follows from the label.
This reads the words inside each anchor and checks the href agrees with them.

    python3 tools/link_audit.py            # report only
    python3 tools/link_audit.py --apply    # repair + save drafts (still needs a publish)

⚠️ Run this after ANY reorder of a service list, on every page — not just the one edited.
⛔ It saves DRAFTS. Publish with site_text.py afterwards.
"""
import sys, pathlib, re
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import site_text as st

SITE = "sjc-2026"

# Words that can appear inside an anchor -> the page that anchor must open.
# Add a row here when a new service page ships.
# ⚠️ Keep the OLD wording alongside the new when a service is renamed — a page that has not been
# republished yet still carries the old label, and dropping it makes the auditor go silently blind
# on exactly the links a rename is most likely to have broken.
SLUGS = [
    (("custom website",),                    "/custom-websites"),
    (("automated five star review", "five star review", "five-star review"), "/automated-five-star-reviews"),
    (("every lead answered", "speed to lead"), "/speed-to-lead"),
    (("booked appointment", "paid ads"),     "/booked-appointments"),
    (("your ai employee", "ai implementation"), "/ai-implementation"),
    (("portfolio",),                         "/portfolio"),
    (("careers",),                           "/careers"),
    (("podcast",),                           "/podcast"),
]

def anchor_text_keys(html: str) -> dict:
    """href key -> the text keys rendered inside that same <a>...</a>, heading first.

    ⛔ ONLY THE FIRST KEY IS MATCHED ON, AND THAT IS THE WHOLE CORRECTNESS ARGUMENT.
    An anchor is <h3>{{t:t5}}</h3><p>{{t:t6}}</p> — a NAME followed by a sentence of prose.
    Matching the prose too produced a false repair on 2026-08-24: renaming "Speed to Lead" to
    "Every Lead Answered" made that phrase collide with the Paid Ads description, which reads
    "...with every lead answered in under a minute", so the auditor wanted to point the ads
    link at speed-to-lead. Service names are unique; descriptions are not, and they will keep
    borrowing each other's words because that is what good copy does.
    """
    return {
        m.group(1): re.findall(r"\{\{t:([a-z0-9]+)\}\}", m.group(2))
        for m in re.finditer(r'<a\b[^>]*href="\{\{h:([a-z0-9]+)\}\}"[^>]*>(.*?)</a>', html, re.S)
    }

def main() -> int:
    apply = "--apply" in sys.argv
    bad = 0
    stale = 0
    for pg in st.get_pages(SITE):
        try:
            doc = st.get_doc(SITE, pg)
        except SystemExit:
            continue
        dirty = False
        for bi, b in enumerate(doc.get("content") or []):
            p = b.get("props", {}) or {}
            links, html = p.get("links"), p.get("html")
            if not links or not html:
                continue
            vals = {e.get("key"): (e.get("value") or "")
                    for e in (p.get("text") or []) if isinstance(e, dict)}
            bound = anchor_text_keys(html)
            for ln in links:
                href = ln.get("href") or ""
                # only internal page links are derivable; tel:/mailto:/#anchors/home are not
                if not href.startswith("/") or href == "/":
                    continue
                keys = bound.get(ln.get("key"), [])
                # The heading only — see anchor_text_keys. No match means underivable, and an
                # underivable link is left alone rather than guessed at from surrounding prose.
                words = (vals.get(keys[0], "") if keys else "").lower()
                if not words.strip():
                    continue
                want = next((s for needles, s in SLUGS if any(n in words for n in needles)), None)
                if want and want != href:
                    bad += 1
                    dirty = True
                    print(f"{pg}[{bi}].{ln.get('key')}: {href}  ->  {want}   « {words.strip()[:52]} »")
                    ln["href"] = want

                # ── The link's own label, which is NOT the visible text and never follows it.
                # It ships inside the page source, so a crawler — and any AI reading the page —
                # sees the OLD service name long after the site stopped saying it. Steven's rule:
                # wrong is wrong even where a human cannot see it. Rebuilt from the heading plus
                # description the way the importer first built it.
                want_label = "".join(vals.get(tk, "") for tk in keys)[:40].rstrip()
                if want_label and (ln.get("label") or "") != want_label:
                    stale += 1
                    dirty = True
                    if not apply:
                        print(f"{pg}[{bi}].{ln.get('key')} label: {(ln.get('label') or '')[:34]!r}"
                              f"  ->  {want_label[:34]!r}")
                    ln["label"] = want_label
        if dirty and apply:
            st.put_doc(SITE, pg, doc)
            print(f"   ↳ draft saved: {pg}  (publish it)")
    print(f"\n{bad} broken link(s), {stale} stale label(s)  "
          f"{'APPLIED — now publish' if apply else '(report only)'}")
    return 1 if (bad and not apply) else 0

if __name__ == "__main__":
    sys.exit(main())
