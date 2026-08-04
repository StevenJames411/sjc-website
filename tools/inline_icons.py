#!/usr/bin/env python3
"""inline_icons.py — turn a design's Font Awesome <i> tags into real inline SVG.

WHY. LandingSite draws every icon as an empty <i class="fa-solid fa-star"> filled in at runtime
by their Font Awesome PRO kit stylesheet. Our importer strips <link> and <script> — correctly —
so those tags arrive as empty boxes and 104 icons vanish from two pages.

Inlining solves it at the source: the SVG path travels inside the markup, so the page needs no
stylesheet from anybody. It also drops the Pro-licence problem, since the free set is ours to use.

Sizing matches Font Awesome's own SVG mode: height 1em so the surrounding text-* class still
drives the size, and the -0.125em baseline nudge so it sits on the line the way the glyph did.

    python3 inline_icons.py <file.html> [more.html ...]
"""
import os, re, sys

def _fa_dir() -> str:
    """The Font Awesome Free SVG set, wherever node_modules happens to sit.

    Walks up from this file so the tool works run from tools/, from the project root, or from
    anywhere else — instead of silently finding nothing and reporting that a design has no icons.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    for _ in range(4):
        p = os.path.join(here, "node_modules/@fortawesome/fontawesome-free/svgs")
        if os.path.isdir(p):
            return p
        here = os.path.dirname(here)
    raise SystemExit("Font Awesome Free not installed — run: npm i -D @fortawesome/fontawesome-free")


FA = _fa_dir()
STYLES = {"fa-solid": "solid", "fas": "solid", "fa-regular": "regular", "far": "regular",
          "fa-brands": "brands", "fab": "brands", "fa-light": "solid", "fal": "solid",
          "fa-duotone": "solid", "fad": "solid"}
# Names the design uses that Font Awesome Free doesn't have under that spelling. Mapped to the
# closest real icon rather than dropped — a missing icon is a hole in the layout.
ALIAS = {"flame": "fire", "shield-alt": "shield-halved", "check-circle": "circle-check",
         "info-circle": "circle-info", "map-marker-alt": "location-dot"}

missing = set()


def svg_for(style: str, name: str) -> str | None:
    name = ALIAS.get(name, name)
    for folder in ([STYLES.get(style, "solid")] + ["solid", "regular", "brands"]):
        p = os.path.join(FA, folder, name + ".svg")
        if os.path.exists(p):
            return open(p).read()
    missing.add(name)
    return None


def convert(html: str) -> tuple[str, int]:
    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        whole, cls = m.group(0), m.group(1)
        style = next((s for s in STYLES if re.search(rf"(?:^|\s){re.escape(s)}(?:\s|$)", cls)), None)
        icon = re.search(r"\bfa-([a-z0-9-]+)\b", re.sub(r"\bfa-(solid|regular|brands|light|duotone)\b", "", cls))
        if not style or not icon:
            return whole
        raw = svg_for(style, icon.group(1))
        if not raw:
            return whole
        # Keep the design's own classes on the SVG — they carry colour, margin and size.
        keep = " ".join(c for c in cls.split() if not c.startswith("fa-") and c not in STYLES)
        body = re.sub(r"^<svg\b", "", raw.strip(), flags=re.I)
        body = body[body.index(">") + 1:] if ">" in body else body
        vb = re.search(r'viewBox="([^"]+)"', raw)
        count += 1
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb.group(1) if vb else "0 0 512 512"}" '
                f'class="{keep}" fill="currentColor" aria-hidden="true" '
                f'style="height:1em;width:auto;display:inline-block;vertical-align:-0.125em">{body}')

    # The <i> is always empty in these designs, so it can be replaced outright by the <svg>.
    out = re.sub(r'<i\s+class="([^"]*\bfa[srlbd]?[- ][^"]*)"[^>]*>\s*</i>', repl, html)
    return out, count


if __name__ == "__main__":
    for path in sys.argv[1:]:
        html = open(path).read()
        out, n = convert(html)
        open(path, "w").write(out)
        left = len(re.findall(r'<i[^>]*class="[^"]*\bfa[srlbd]?[- ]', out))
        print(f"{path}: {n} icons inlined, {left} left as <i>")
    if missing:
        print("NOT FOUND in Font Awesome Free:", ", ".join(sorted(missing)))
