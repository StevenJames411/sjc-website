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
SLUGS = [
    (("custom website",),                    "/custom-websites"),
    (("five star review", "five-star review"), "/five-star-reviews"),
    (("speed to lead",),                     "/speed-to-lead"),
    (("booked appointment", "paid ads"),     "/booked-appointments"),
    (("ai implementation",),                 "/ai-implementation"),
    (("portfolio",),                         "/portfolio"),
    (("careers",),                           "/careers"),
    (("podcast",),                           "/podcast"),
]

def anchor_text_keys(html: str) -> dict:
    """href key -> the text keys rendered inside that same <a>...</a>."""
    return {
        m.group(1): re.findall(r"\{\{t:([a-z0-9]+)\}\}", m.group(2))
        for m in re.finditer(r'<a\b[^>]*href="\{\{h:([a-z0-9]+)\}\}"[^>]*>(.*?)</a>', html, re.S)
    }

def main() -> int:
    apply = "--apply" in sys.argv
    bad = 0
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
                words = " ".join(vals.get(tk, "") for tk in bound.get(ln.get("key"), [])).lower()
                if not words.strip():
                    continue
                want = next((s for needles, s in SLUGS if any(n in words for n in needles)), None)
                if want and want != href:
                    bad += 1
                    dirty = True
                    print(f"{pg}[{bi}].{ln.get('key')}: {href}  ->  {want}   « {words.strip()[:52]} »")
                    ln["href"] = want
        if dirty and apply:
            st.put_doc(SITE, pg, doc)
            print(f"   ↳ draft saved: {pg}  (publish it)")
    print(f"\n{bad} broken link(s)  {'APPLIED — now publish' if apply else '(report only)'}")
    return 1 if (bad and not apply) else 0

if __name__ == "__main__":
    sys.exit(main())
