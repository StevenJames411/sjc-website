#!/usr/bin/env python3
"""sync_services.py — one wording for the five services, pushed to every surface.

⛔ WHY THIS EXISTS (2026-08-24). Three places render the same five services — the home hero,
the hamburger menu, and the "What you get" cards on the home page. Each was edited by hand at
a different time, so all three described the same service differently and a visitor comparing
them could not tell they were the same thing. Steven, reading his own site:

    "So all three of them do not speak the same language."

SERVICES below is the ONLY place the wording lives. Edit it, run this, publish.

    python3 tools/sync_services.py            # report what would change
    python3 tools/sync_services.py --apply    # write drafts (then publish home + nav)

⛔ Writes DRAFTS. Publish with site_text.py afterwards.
⚠️ Run tools/link_audit.py after this — renaming a service can break links derived from names.
"""
import sys, pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import site_text as st

SITE = "sjc-2026"

# ── THE CANONICAL FIVE ───────────────────────────────────────────────────────────────
# Order is the order they are sold in: the website first, because everything else points
# people at it. Renumber here and every surface follows.
SERVICES = [
    {"n": 1, "slug": "/custom-websites", "name": "Custom Websites",
     "desc": "A website built to sell — not a page somebody's nephew made. Fast on a phone, "
             "and found on Google and by AI."},
    {"n": 2, "slug": "/five-star-reviews", "name": "Five Star Reviews",
     "desc": "Reviews arriving on their own, from every customer, without anybody having to "
             "remember to ask."},
    {"n": 3, "slug": "/speed-to-lead", "name": "Every Lead Answered",
     "desc": "Every call and every form answered in under a minute — nights, weekends and "
             "holidays included."},
    {"n": 4, "slug": "/booked-appointments", "name": "Paid Ads → Booked Appointments",
     "desc": "Ads running every day that turn into booked appointments, not a list of leads "
             "for you to chase."},
    {"n": 5, "slug": "/ai-implementation", "name": "Your AI Employee",
     "desc": "An AI employee working your leads inside the software you already use. Not a "
             "chat pop-up."},
]

def label(s):
    return f"{s['n']} · {s['name']}"

# Where each surface keeps its copy. name/desc key pairs, in service order.
# home block 1 and nav block 1 are imported designs: fixed text slots, so the pairs are
# positional and must not be reordered here.
CARD_KEYS = [("t3", "t4"), ("t5", "t6"), ("t7", "t8"), ("t9", "t10"), ("t11", "t12")]
MENU_KEYS = [("t5", "t6"), ("t7", "t8"), ("t9", "t10"), ("t11", "t12"), ("t13", "t14")]


def sync_text_block(doc, block_index, keys, changes, where):
    vals = {e["key"]: e for e in (doc["content"][block_index]["props"].get("text") or [])
            if isinstance(e, dict) and "key" in e}
    for s, (nk, dk) in zip(SERVICES, keys):
        for key, want in ((nk, label(s)), (dk, s["desc"])):
            e = vals.get(key)
            if e is not None and e.get("value") != want:
                changes.append((where, key, e.get("value", ""), want))
                e["value"] = want


def sync_hero_buttons(doc, changes):
    """The hero's right column: five Buttons, each linking to its own page."""
    def walk(nodes):
        for x in nodes:
            p = x.get("props", {}) or {}
            if x.get("type") == "Columns" and isinstance(p.get("col2"), list):
                btns = [b for b in p["col2"] if b.get("type") == "Button"]
                if len(btns) == len(SERVICES):
                    for b, s in zip(btns, SERVICES):
                        bp = b["props"]
                        for k, want in (("title", label(s)), ("subtitle", s["desc"]),
                                        ("href", s["slug"])):
                            if bp.get(k) != want:
                                changes.append(("home hero", f"{k}", str(bp.get(k, ""))[:30], want))
                                bp[k] = want
                    return True
            for k in ("content", "col1", "col2", "col3", "col4"):
                if isinstance(p.get(k), list) and walk(p[k]):
                    return True
        return False
    return walk(doc["content"])


def main():
    apply = "--apply" in sys.argv
    changes = []

    home = st.get_doc(SITE, "home")
    sync_text_block(home, 1, CARD_KEYS, changes, "home cards")
    if not sync_hero_buttons(home, changes):
        print("⚠️  hero buttons not found — the hero is not five Button blocks in column 2")

    nav = st.get_doc(SITE, "nav")
    sync_text_block(nav, 1, MENU_KEYS, changes, "menu")

    for where, key, old, new in changes:
        print(f"{where:12} {key:9} {old[:42]!r}\n{'':23}-> {new[:42]!r}")

    if apply and changes:
        st.put_doc(SITE, "home", home)
        st.put_doc(SITE, "nav", nav)
        print("\n↳ drafts saved: home, nav  (publish them)")
    print(f"\n{len(changes)} difference(s)  "
          f"{'APPLIED — now publish' if apply else '(report only)'}")
    return 1 if (changes and not apply) else 0


if __name__ == "__main__":
    sys.exit(main())
