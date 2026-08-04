#!/usr/bin/env python3
"""pull_landingsite.py — pull a LandingSite.ai preview out as ONE plain HTML file.

Their preview page is a React shell, so fetching the URL gets you nothing. The site itself
lives behind their (unauthenticated) GraphQL API as an ordered list of <section> blocks with
Tailwind classes — the same shape SiteDrop produces, which is what /edit/import already eats.

    python3 pull_landingsite.py <preview-id-or-url> [out.html]
"""
import json, re, sys, urllib.request

API = "https://api.landingsite.ai/graphql"
Q = """query($id:String){websitePreview(id:$id){
  id fonts colorPalette aiWebsiteHeadHtml
  headerCodeSection{html} footerCodeSection{html}
  homepage{path aiPageHeadHtml codeSections{id html}}}}"""


def fetch(site_id):
    body = json.dumps({"query": Q, "variables": {"id": site_id}}).encode()
    req = urllib.request.Request(API, body, {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        payload = json.load(r)
    if payload.get("errors"):
        raise SystemExit(json.dumps(payload["errors"], indent=2))
    site = (payload.get("data") or {}).get("websitePreview")
    if not site:
        raise SystemExit("No website at that id.")
    return site


def build(site):
    # The markup leans on CSS variables (var(--primary-color)); without a :root block the
    # importer's colour reader sees no hexes at all, so the palette has to travel with it.
    palette = "\n".join(f"    --{k}: {v};" for k, v in (site.get("colorPalette") or {}).items())
    # css2 takes each family as its OWN `family=` parameter. Joining them with `|` is the v1
    # syntax: the URL still returns the first font, so the page looks fine and the second family
    # is silently invisible — including to our importer's font detection, which reads this link.
    fam = [f.replace(" ", "+") + ":wght@300;400;500;600;700" for f in (site.get("fonts") or [])]
    fonts_link = ('<link href="https://fonts.googleapis.com/css2?'
                  + "&".join(f"family={f}" for f in fam) + '&display=swap" rel="stylesheet">'
                  if fam else "")
    # The design states its families only in CSS variables, which the font detector doesn't read.
    # Say it in the two rules it does read, so headings and body are identified correctly.
    heading = (site.get("colorPalette") or {}).get("font-family-heading", "")
    body_f = (site.get("colorPalette") or {}).get("font-family-body", "")
    font_rules = (f"\n  body {{ font-family: {body_f}; }}" if body_f else "") + \
                 (f"\n  h1,h2,h3,h4,h5,h6 {{ font-family: {heading}; }}" if heading else "")
    head_extra = (site.get("aiWebsiteHeadHtml") or "") + ((site.get("homepage") or {}).get("aiPageHeadHtml") or "")
    # Their own head HTML can carry <script>; strip it so a paste-in stays inert markup.
    head_extra = re.sub(r"<script\b.*?</script>", "", head_extra, flags=re.S | re.I)

    parts = [(site.get("headerCodeSection") or {}).get("html") or ""]
    parts += [s["html"] for s in ((site.get("homepage") or {}).get("codeSections") or [])]
    parts.append((site.get("footerCodeSection") or {}).get("html") or "")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{fonts_link}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/css/all.min.css">
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<style>
  :root {{
{palette}
  }}{font_rules}
</style>
{head_extra}
</head>
<body>
{''.join(parts)}
</body>
</html>
"""


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    arg = sys.argv[1]
    m = re.search(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", arg)
    if not m:
        raise SystemExit("Couldn't find a site id in that argument.")
    site = fetch(m.group(0))
    html = build(site)
    out = sys.argv[2] if len(sys.argv) > 2 else f"{m.group(0)}.html"
    with open(out, "w") as f:
        f.write(html)
    n = len((site.get("homepage") or {}).get("codeSections") or [])
    print(f"{out} — {len(html):,} bytes, {n} sections + header + footer")
