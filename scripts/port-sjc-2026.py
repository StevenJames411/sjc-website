#!/usr/bin/env python3
"""
Port /v2 into the design studio.

⛔ THE COPY IS READ OUT OF app/v2/content.ts, NEVER RETYPED HERE. Retyping it would create a
second copy of every sentence on the page, and the two would disagree the first time either
moved — which is exactly the bug the footer already had twice.

Writes a DRAFT only. Nothing publishes; Steven presses Publish when he has looked at it.
"""
import json, re, subprocess, sys, urllib.request, pathlib

SITE_DIR = pathlib.Path.home() / "SJC/AI-Employee-Dashboard/projects/sjc-website"
BASE = "https://www.stevenjamesconsulting.com"
# ⚠️ The slug is DERIVED from the title by the server (lowercase, non-alphanumerics to dashes).
# Assuming it instead of reading it back is how you write a draft to a page that does not exist.
# ⛔ ITS OWN WEBSITE, NOT A PAGE INSIDE THE OLD ONE. The new site REPLACES both the original SJC
# site and Steven James Designs; parking it as a page under the thing it replaces is what turned
# one toggle into a container for three brands. It gets its own card, and the other two get
# retired once this is finished.
SITE_NAME = "Steven James Consulting 2026"
TITLE = "Home"
SLUG = "home"

TOKEN = next(l.split("=", 1)[1].strip().strip('"')
             for l in open(SITE_DIR / ".env.local") if l.startswith("SITE_EDIT_TOKEN="))

# ── pull the words out of content.ts ─────────────────────────────────────────────────────────
# node evaluates the real module, so the copy that lands in the studio is byte-identical to what
# is on /v2 right now. A regex parser would drift the first time a quote style changed.
src = (SITE_DIR / "app/v2/content.ts").read_text()
js = src.replace("export const", "const")
js = re.sub(r"^\s*//.*$", "", js, flags=re.M)
js = js.replace("some: (n: number) =>", "some: (n) =>")
js += """
console.log(JSON.stringify({DIVISIONS,NAV_EXTRA,CONTACT,BRAND,HERO,STORY,DIAGNOSIS,BUCKETS,SOLUTION,PROOF,WHO,ASK,FOOTER}));
"""
p = subprocess.run(["node", "--input-type=module", "-e", js], capture_output=True, text=True)
if p.returncode:
    sys.exit("could not read content.ts:\n" + p.stderr[-1500:])
C = json.loads(p.stdout)

# ── block helpers ────────────────────────────────────────────────────────────────────────────
_n = [0]
def bid(t):
    _n[0] += 1
    return f"{t}-v2-{_n[0]:03d}"

def blk(t, **props):
    return {"type": t, "props": {"id": bid(t), **props}}

def text(html, size=17, color="white", align="center", above=0, below=0):
    # ⚠️ The Text block stores RICH TEXT, so a bare sentence has to be wrapped in <p> or the
    # editor opens with an empty box and the words only reappear on the public page.
    return blk("Text", text=f"<p>{html}</p>", fontSize=size, color=color,
               align=align, spaceAbove=above, spaceBelow=below)

def heading(s, size=44, color="white", align="center", above=16, below=0):
    return blk("Heading", text=s, fontSize=size, color=color, align=align,
               spaceAbove=above, spaceBelow=below)

def eyebrow(s, color="accent"):
    return text(f"<strong>{s.upper()}</strong>", size=13, color=color)

def section(bg, content, width="64rem", pt=88, pb=88, sid=None, decor="", grid=""):
    b = blk("Section", background=bg, maxWidth=width, paddingTop=pt, paddingBottom=pb,
            decor=decor, grid=grid, gradientTo="", gradientAngle=135, content=content)
    if sid:
        b["props"]["id"] = sid
    return b

def columns(cols, gap=20):
    props = {"columns": len(cols), "gap": gap}
    for i, c in enumerate(cols, 1):
        props[f"col{i}"] = c
    for i in range(len(cols) + 1, 5):
        props[f"col{i}"] = []
    return blk("Columns", **props)

DARK, DEEP, SOFT, WHITE = "bandDark", "bandDarker", "bandSoft", "white"

# ── the page, section by section ─────────────────────────────────────────────────────────────
H = C["HERO"]
hero = section(DARK, [
    text(f"<strong>{H['badge'].upper()}</strong>", size=12, color="accent"),
    heading(" ".join(H["h1"]), size=64, above=24),
    text(H["body"][0], size=18, color="white", above=26),
    text(H["body"][1], size=18, color="white", above=14),
    blk("Button", title=f"{H['video']['label']}  ({H['video']['duration']})",
        subtitle="", href=H["video"]["href"], variant="filled", shape="",
        color="accent", icon="play", align="center", fullWidth=False),
    blk("Button", title=H["cta"]["label"], subtitle="", href=H["cta"]["href"],
        variant="outline", shape="", color="white", icon="", align="center", fullWidth=False),
    blk("Spacer", height=40),
    text(f"<strong>{H['chainLabel'].upper()}</strong>", size=11, color="white"),
    blk("ChainStrip", color="accent", onDark=True,
        nodes=[{"k": n["k"], "note": n["note"], "mine": n["mine"]} for n in H["chain"]]),
    text(H["chainNote"], size=14, color="white", above=28),
# ⛔ A FLAT NAVY RECTANGLE IS NOT THE OLD HERO. The Steven James Designs hero Steven wants back
# is the SAME navy — what makes it read is the graph-paper grid over it plus the two soft corner
# glows. Both dials already existed on the Section block and were shipped blank, which is the
# entire difference between the two screenshots.
], width="80rem", pt=110, pb=90, sid="hero", grid="accent", decor="accent")

S = C["STORY"]
story = section(WHITE, [
    eyebrow(S["eyebrow"]),
    heading(S["h2"], size=46, color="ink"),
    *[text(p, size=18, color="ink", align="left", above=18) for p in S["paragraphs"]],
    text(f"<strong>{S['closer']}</strong>", size=21, color="ink", align="left", above=30),
], width="48rem")

D = C["DIAGNOSIS"]
diagnosis = section(DARK, [
    eyebrow(D["eyebrow"]),
    heading(D["h2"], size=46),
    text(D["lede"], size=18, above=24),
    blk("Spacer", height=36),
    blk("CheckList", dotColor="accent", textColor="white",
        rows=[{"heading": r["k"], "body": r["d"]} for r in D["chain"]]),
    text(f"<strong>{D['closer']}</strong>", size=26, above=44),
], width="56rem")

B = C["BUCKETS"]
selfcheck = section(DEEP, [
    eyebrow(B["eyebrow"]),
    heading(B["h2"], size=44),
    text(B["lede"], size=17, above=22),
    blk("Spacer", height=36),
    blk("SelfCheck", color="accent", onDark=True,
        summaryNone=B["results"]["none"], summaryOne=B["results"]["one"],
        summaryMany="{n} of them. That is normal, and it is why advertising has not worked the way you were told it would.",
        summaryTail=B["results"]["followUp"],
        questions=[{"q": q["q"], "verdict": q["verdict"],
                    "options": [{"label": o["label"], "bad": o["bad"]} for o in q["options"]]}
                   for q in B["questions"]]),
], width="56rem", sid="diagnosis")

SO = C["SOLUTION"]
solution = section(SOFT, [
    eyebrow(SO["eyebrow"]),
    heading(SO["h2"], size=46, color="ink"),
    text(SO["lede"], size=17, color="ink", above=24),
    blk("Spacer", height=40),
    columns([[blk("Card", badge="", eyebrow=c["n"], heading=c["t"], body=c["p"],
                  icon="", iconColor="", badgeColor="", badgePosition="top", centered=False,
                  layout="stack", bare=False, eyebrowSize=18, eyebrowColor="accent",
                  headingSize=27, headingColor="ink", bodySize=16, bodyColor="mute",
                  eyebrowBold=False, headingBold=False, bodyBold=False, eyebrowCaps=False,
                  surface="solid", surfaceColor="white", surfaceOpacity=100,
                  borderColor="line", hoverBorderColor="accent", shadowColor="",
                  hoverLift=True, radius=2)] for c in SO["cards"]]),
], width="80rem")

P = C["PROOF"]
proof = section(DARK, [
    eyebrow(P["eyebrow"]),
    heading(P["h2"], size=46),
    text(P["lede"], size=17, above=24),
    blk("Spacer", height=36),
    columns([[blk("Image", src=w["img"], alt=w["t"], caption=f"{w['t']} — {w['s']}",
                  captionColor="white", maxWidth=0, rounded="none", align="center", spaceAbove=0, spaceBelow=0,
                  linkUrl="", openInNewTab="false", shape="landscape", zoom=100, focus="top")]
             for w in P["items"]]),
    blk("Spacer", height=56),
    text(f"<strong>{P['caseStudy']['eyebrow'].upper()}</strong>", size=12, color="accent"),
    heading(P["caseStudy"]["h3"], size=32, above=14),
    blk("Stats", valueColor="white", labelColor="white", valueSize=0, align="center",
        items=[{"value": s["n"], "label": s["l"]} for s in P["caseStudy"]["stats"]]),
    blk("Button", title=P["caseStudy"]["link"]["label"], subtitle="",
        href=P["caseStudy"]["link"]["href"], variant="outline", shape="",
        color="accent", icon="", align="center", fullWidth=False),
], width="80rem", sid="work")

W = C["WHO"]
who = section(SOFT, [
    eyebrow(W["eyebrow"]),
    heading(W["h2"], size=44, color="ink"),
    *[text(p, size=18, color="ink", align="left", above=18) for p in W["paragraphs"]],
    text(f"<strong>{W['signature']['name']}</strong>", size=24, color="ink", align="left", above=28),
    text(W["signature"]["role"].upper(), size=12, color="accent", align="left", above=6),
], width="48rem", sid="about")

A = C["ASK"]
ask = section(DEEP, [
    eyebrow(A["eyebrow"]),
    heading(A["h2"], size=44),
    text(A["lede"], size=17, above=24),
    blk("Button", title=A["cta"]["label"], subtitle="", href=A["cta"]["href"],
        variant="filled", shape="", color="accent", icon="", align="center", fullWidth=False),
], width="56rem", pt=76, pb=76, sid="contact")

# ⚠️ A CLIENT SITE RENDERS NO SJC NAV — `ownHeader` is true for anything that isn't the SJC site,
# so the page must carry its OWN header and footer blocks or it ships headless. That is also why
# menu mode can go straight in here: nothing on this site is live yet.
NAV_LINKS = (
    [{"label": f"{d['n']} · {d['short']}", "target": d["href"], "fontSize": 0, "color": "white",
      "newTab": False, "note": d["line"], "group": "Divisions"} for d in C["DIVISIONS"]] +
    [{"label": n["short"], "target": n["href"], "fontSize": 0, "color": "white",
      "newTab": False, "note": n["line"], "group": "Company"} for n in C["NAV_EXTRA"]]
)

# ⛔ THE MARK IS A TYPESET WORDMARK, NOT A LOGO TILE. `SJC` in a circle beside the name is a
# stock-template lockup — the thing this rebuild exists to stop looking like. Two lines, display
# serif, small-caps: STEVEN JAMES over a wide-tracked CONSULTING.
# ⚠️ `showLogo` stays True and does nothing here — wordmark mode never reaches the image branch.
# Left true so flipping back to the logo lockup is one field, not two.
#
# `bandGrid` = the hero's grid colour on purpose. Header and hero then share one continuous navy
# field; without it the bar reads as a separate rectangle laid on top of the page.
header = blk("SiteHeader",
    # menuEmail feeds the menu's third contact button — the overlay renders the SAME
    # components/ContactButtons the footer does, so the two can no longer disagree.
    menuMode="menu", menuPhone=C["CONTACT"]["tel"], menuPhoneDisplay=C["CONTACT"]["phone"],
    menuEmail="support@stevenjamesconsulting.com",
    # ⚠️ STEVEN'S OWN ARTWORK, PULLED FROM alamoslimclinic.com — the same files his Landing Site AI
    # account serves. Only the calendar and the phone exist; that site reuses the phone for both
    # of its call blocks and has no text or email icon, so those two keep the drawn glyphs.
    # ⛔ HOTLINKED FROM A THIRD PARTY. If the Landing Site account lapses, these 404 and the tiles
    # lose their icons — re-host on SJC's own blob before this site goes live on the real domain.
    # ⛔ SERVED FROM SJC'S OWN DOMAIN. Built by scripts/make-contact-icons.mjs from Steven's source
    # art: cropped to the icon's real bounds, kept transparent, 2.3MB -> ~130KB each. They live in
    # public/icons, so they deploy with the site and are in version control — an icon cannot
    # silently vanish, and no third-party account sits in front of the most-clicked controls.
    ctaIcon="/icons/calendar.png",
    menuIconText="/icons/sms.png",
    menuIconEmail="/icons/email.png",
    # ⚠️ STILL HOTLINKED — the only one left. The phone exists solely on Landing Site's CDN, and the
    # AVIF export macOS produces when dragging it out is a bitstream sharp cannot decode. Re-save it
    # as PNG (open in Preview → File → Export) and this becomes /icons/phone.png like the rest.
    menuIconCall="https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/55a02769-6830-4e6f-998a-6c3efa7b4a00/public",
    brandName="Steven James", brandHref="/", brandSize=26,
    brandStyle="wordmark", brandLine2="Consulting", brandLine2Color="accent",
    tagline="", taglineColor="accent", taglineSize=14,
    links=NAV_LINKS,
    # ⛔ READ, NOT RETYPED — the rule at the top of this file, broken right here.
    # This label was typed as "Book a walkthrough" while content.ts said something else, so the
    # site-wide copy pass changed every CTA on the page and silently missed the one in the MENU.
    # Steven caught it by eye. Sourced from ASK.cta now, which is the page's primary call to
    # action, so the menu button and the page button can never say different things again.
    ctaLabel=C["ASK"]["cta"]["label"], ctaHref=C["CONTACT"]["book"], ctaNewTab=False,
    # ⛔ bandDARK, NOT bandHeader — the hero's own ground. bandHeader is a lighter slate, and at
    # that tone the bar still read as a separate rectangle sitting on the hero even WITH the grid
    # running across the seam. A continuous grid cannot join two different colours; matching the
    # tone is what does it, and the grid is what stops the joined field looking flat.
    background="bandDark", foreground="white", showLogo=True, bandGrid="accent",
    ctaColor="accent", brandIcon="", brandIconColor="")

footer = blk("SiteFooter",
    blurb=C["FOOTER"]["closing"],
    links=[],
    # ⛔ CARRY `line` THROUGH AS `note`. content.ts has always put a descriptor on the footer's
    # division links — "The divisions carry their descriptor here too — a footer has the room a nav
    # bar doesn't" — and THIS mapping silently dropped it, keeping only label and href. So the menu
    # taught the four divisions and the footer merely listed them. The data was never missing; it
    # just never made the trip.
    groups=[{"heading": col["title"],
             "links": [{"label": l["label"], "target": l["href"], "note": l.get("line", "")}
                       for l in col["links"]]}
            for col in C["FOOTER"]["columns"]],
    phone=C["CONTACT"]["tel"], phoneDisplay=C["CONTACT"]["phone"],
    email="support@stevenjamesconsulting.com",
    privacyUrl="https://www.privacypolicies.com/live/1cbbc5dd-5b42-4b68-abdd-a279a5e3b4f7",
    tosUrl="https://www.privacypolicies.com/live/34bb5cc7-32b9-4449-ae32-7cfe78f34e45",
    copyright="ARV Venture Group LLC Parent Company · Steven James Consulting",
    # ⛔ THE SAME MARK AS THE HEADER. The footer shipped the `SJC` circle while the header wore the
    # serif wordmark — two brands on one screen, visible in the first phone screenshot Steven took.
    background="", foreground="", brandName="Steven James", showLogo=True,
    brandStyle="wordmark", brandLine2="Consulting", brandLine2Color="accent")

# ⛔ THE PAGE NO LONGER CARRIES THE CHROME. `header` and `footer` now live in the SITE's own `nav`
# and `footer` documents (--chrome, below), which every page of this website renders inside. Leaving
# them in `content` as well would render each one TWICE the moment the chrome docs exist.
#
# This is the whole reason for the change: with the chrome in the page, the five division pages
# queued behind this one would each hold their own copy of the header, and the copies drift the
# first time any one of them is edited.
DATA = {
    "root": {"props": {
        "title": "Steven James Consulting — websites for high-end trades",
        "description": "Websites, reviews and follow-up for contractors, builders and specialty "
                       "shops. Forty years running our own businesses — you deal with the people "
                       "who build it, not an account manager.",
        "businessName": "Steven James Consulting",
    }},
    "content": [hero, story, diagnosis, selfcheck, solution, proof, who, ask],
    "zones": {},
}

# The two site-wide documents. Same block objects the page used to hold — same wordmark, same
# bandGrid, same links — just stored once for the whole website instead of once per page.
NAV_DATA = {"root": {"props": {}}, "content": [header], "zones": {}}
FOOTER_DATA = {"root": {"props": {}}, "content": [footer], "zones": {}}

def api(method, path, payload):
    req = urllib.request.Request(
        BASE + path, method=method, data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return r.status, json.loads(r.read().decode() or "{}")

# ⛔ THE SITE ALREADY EXISTS. Run bare a second time and this script creates "Steven James
# Consulting 2026" AGAIN — a duplicate card holding a stale copy of the page, and no way to tell
# from the studio which of the two is the real one. Every re-port after the first is --rewrite,
# which touches only the existing home page.
SITE_ID = "steven-james-consulting-2026"

if __name__ == "__main__":
    if "--dump" in sys.argv:
        print(json.dumps(DATA, indent=1)[:600]); sys.exit()

    # --chrome writes all THREE documents: the page without its chrome, plus the site-wide nav and
    # footer. Deliberately one flag rather than three runs — writing the chrome docs while the page
    # still contained the same blocks would render the header twice, and that intermediate state is
    # exactly the kind of thing that gets left behind and found later on a live site.
    if "--chrome" in sys.argv:
        print(f"writing chrome + page for {SITE_ID}…")
        ok = True
        for label, page, payload in (("page  ", SLUG, DATA),
                                     ("nav   ", "nav", NAV_DATA),
                                     ("footer", "footer", FOOTER_DATA)):
            st, res = api("PUT", "/api/puck", {"page": page, "site": SITE_ID, "data": payload})
            print(f"  {label} -> {st} {res}")
            ok = ok and st < 300
        print(f"\nedit page:   https://stevenjamesdesigns.com/edit/{SITE_ID}/{SLUG}")
        print(f"edit nav:    https://stevenjamesdesigns.com/edit/{SITE_ID}/nav")
        print(f"edit footer: https://stevenjamesdesigns.com/edit/{SITE_ID}/footer")
        sys.exit(0 if ok else 1)

    if "--rewrite" in sys.argv:
        print(f"rewriting {SITE_ID}/{SLUG} (no site or page created)…")
        st, res = api("PUT", "/api/puck", {"page": SLUG, "site": SITE_ID, "data": DATA})
        print("  ", st, res)
        print(f"\nedit: https://stevenjamesdesigns.com/edit/{SITE_ID}/{SLUG}")
        sys.exit(0 if st < 300 else 1)

    print("creating the website…")
    st, res = api("POST", "/api/sites", {"name": SITE_NAME, "kind": "client",
                                         "description": "The rebuild — replaces the original SJC site "
                                                        "and Steven James Designs once finished."})
    site = res.get("id")
    print("  ", st, res)
    if not site:
        sys.exit("no site id — stopping rather than writing into the wrong website")

    print("creating its home page…")
    st, res = api("POST", "/api/pages", {"title": TITLE, "site": site})
    print("  ", st, res)
    slug = res.get("slug") or SLUG

    print("writing the page…")
    print("  ", api("PUT", "/api/puck", {"page": slug, "site": site, "data": DATA}))
    print(f"\nsite id: {site}")
    print(f"edit:    https://stevenjamesdesigns.com/edit/{site}/{slug}")
