#!/usr/bin/env python3
"""
Generate the 4 cinematic A/B prototype slides for the SJC explainer-video deck.

For each slide:
  1. Generate a moody photographic background via DALL-E 3 (1792x1024).
  2. Pad to 1920x1080 with matching edge color.
  3. Add a gradient scrim and Lexend text overlay (headline + sub).
  4. Save as PNG to slideshow/prototypes/cinematic/.

Re-run safe: skips any slide whose final PNG already exists. Delete the file to regenerate.
"""

from __future__ import annotations
import base64
import os
import sys
import time
import urllib.request
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path("/Users/stevenbarchetti/SJC/AI-Employee-Dashboard")
SITE = ROOT / "projects" / "sjc-website"
OUT = SITE / "slideshow" / "prototypes" / "cinematic"
RAW = OUT / "_raw"
FONTS = SITE / "slideshow" / "_html" / "_fonts"

OUT.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)
FONTS.mkdir(parents=True, exist_ok=True)

load_dotenv(ROOT / ".env")

# ----- brand -----
SJC_BLUE = (37, 99, 235)
SJC_INK = (17, 24, 39)
WHITE = (255, 255, 255)

# ----- font download (Lexend Bold + ExtraBold) -----
LEXEND_URLS = {
    "Lexend-Bold.ttf": "https://github.com/google/fonts/raw/main/ofl/lexend/Lexend%5Bwght%5D.ttf",
}


def ensure_font() -> Path:
    """Download Lexend variable font once; return path."""
    target = FONTS / "Lexend.ttf"
    if target.exists():
        return target
    url = "https://github.com/google/fonts/raw/main/ofl/lexend/Lexend%5Bwght%5D.ttf"
    print(f"  downloading Lexend from {url}", flush=True)
    urllib.request.urlretrieve(url, target)
    return target


def load_font(font_path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(font_path), size)


# ----- style brief used in every prompt -----
STYLE = (
    "Cinematic 35mm photograph. Shallow depth of field. Warm tungsten lighting "
    "with subtle cool-blue accents. Editorial, moody, single clear subject. "
    "Realistic, no illustration, no cartoon, no text, no watermarks, no logos. "
    "Composition leaves the upper third visually quiet so headline text can sit there cleanly."
)


SLIDES = [
    {
        "name": "01-hero",
        "prompt": (
            "A solo small-business owner, age 40s, sitting alone at a cluttered desk "
            "in a dimly-lit home office late at night. Multiple monitors glowing, "
            "stacks of paper, sticky notes covering the wall, a coffee cup, an "
            "overflowing inbox visible. Head resting in one hand, expression of "
            "exhaustion and overwhelm. The person is the only human in frame, "
            "surrounded by the visible weight of running every role of a business alone. "
            f"{STYLE}"
        ),
        "headline": "AI Employee Operating Systems",
        "subline": "for solo entrepreneurs trapped in their own business.",
        "headline_color": WHITE,
        "subline_color": (191, 219, 254),
        "text_anchor": "top",
    },
    {
        "name": "02-hustle-trap",
        "prompt": (
            "A weary entrepreneur running on a treadmill in a dim industrial-style "
            "workspace, sweat on their brow, the treadmill belt visibly cracked and "
            "splitting apart beneath their feet. Surrounded by darkness with one "
            "warm work light overhead. The cracked broken belt is the focal point, "
            "telling the story: no amount of running will help when the machine itself "
            f"is broken. {STYLE}"
        ),
        "headline": "You can't out-hustle",
        "subline": "a broken system.",
        "headline_color": WHITE,
        "subline_color": WHITE,
        "text_anchor": "bottom",
    },
    {
        "name": "03-cost-chart",
        "prompt": (
            "A wide split composition. On the left half: a sprawling, mostly empty "
            "corporate office floor — twelve desks visible, only chairs and monitors, "
            "no people, cold fluorescent lighting, lonely and expensive-looking. On "
            "the right half: a single warm-lit home office with one person at a desk, "
            "their screens glowing with soft blue interface elements suggesting AI "
            "assistants quietly working. The contrast is the message: the same twelve "
            f"seats, two completely different worlds. {STYLE}"
        ),
        "headline": "$532,000  vs.  $82,000",
        "subline": "The same 12-seat org chart. A $450k payroll saving every year.",
        "headline_color": WHITE,
        "subline_color": (191, 219, 254),
        "text_anchor": "bottom",
    },
    {
        "name": "04-cta",
        "prompt": (
            "An open doorway in a dim hallway, bright warm light streaming through "
            "the open door into the dark space. Beyond the doorway, hints of a "
            "calm, organized workspace bathed in golden hour light. The viewer's "
            "perspective is from the dark side, looking toward the light. A clear "
            "pathway out — the metaphor is exit, escape, the way forward. "
            f"{STYLE}"
        ),
        "headline": "Count your hats.",
        "subline": "60-Second Org Chart Audit  ·  stevenjames.consulting/assessment",
        "headline_color": WHITE,
        "subline_color": (191, 219, 254),
        "text_anchor": "bottom",
    },
]


def generate_photo(client: OpenAI, prompt: str, raw_path: Path) -> Image.Image:
    if raw_path.exists():
        print(f"  raw exists, reusing: {raw_path.name}", flush=True)
        return Image.open(raw_path).convert("RGB")
    print(f"  generating photo -> {raw_path.name}", flush=True)
    resp = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size="1536x1024",
        quality="high",
        n=1,
    )
    data = resp.data[0]
    if getattr(data, "b64_json", None):
        img_bytes = base64.b64decode(data.b64_json)
    elif getattr(data, "url", None):
        with urllib.request.urlopen(data.url) as r:
            img_bytes = r.read()
    else:
        raise RuntimeError("image response had neither b64_json nor url")
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    img.save(raw_path, "PNG")
    return img


def pad_to_1920x1080(img: Image.Image) -> Image.Image:
    """DALL-E gives 1792x1024. Resize to fit 1920x1080 (slight stretch ok, or letterbox)."""
    target = (1920, 1080)
    src_w, src_h = img.size
    # Scale to cover (so no letterboxing), then center-crop.
    scale = max(target[0] / src_w, target[1] / src_h)
    new_w, new_h = int(src_w * scale + 0.5), int(src_h * scale + 0.5)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target[0]) // 2
    top = (new_h - target[1]) // 2
    return resized.crop((left, top, left + target[0], top + target[1]))


def draw_scrim(img: Image.Image, anchor: str) -> Image.Image:
    """Add a soft dark gradient at the top or bottom for text legibility."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    h = img.size[1]
    scrim_h = int(h * 0.45)
    for i in range(scrim_h):
        alpha = int(200 * (1 - i / scrim_h))  # darker at edge, fade toward center
        if anchor == "top":
            y = i
        else:
            y = h - 1 - i
        draw.rectangle([(0, y), (img.size[0], y + 1)], fill=(0, 0, 0, alpha))
    composed = Image.alpha_composite(img.convert("RGBA"), overlay)
    return composed.convert("RGB")


def draw_text(
    img: Image.Image,
    headline: str,
    subline: str,
    anchor: str,
    font_path: Path,
    headline_color: tuple[int, int, int],
    subline_color: tuple[int, int, int],
) -> Image.Image:
    """Draw headline + subline anchored to top or bottom with consistent margins."""
    img = img.copy()
    draw = ImageDraw.Draw(img)
    W, H = img.size

    head_font = load_font(font_path, 110)
    sub_font = load_font(font_path, 44)

    margin_x = 160
    margin_y = 110

    # Wrap headline naively at ~30 chars per line if too long
    head_lines = wrap_to_width(headline, head_font, W - 2 * margin_x, draw)
    sub_lines = wrap_to_width(subline, sub_font, W - 2 * margin_x, draw)

    line_gap_head = 12
    line_gap_sub = 8
    block_gap = 32

    head_h = sum(line_height(l, head_font, draw) for l in head_lines) + line_gap_head * (
        len(head_lines) - 1
    )
    sub_h = sum(line_height(l, sub_font, draw) for l in sub_lines) + line_gap_sub * (
        len(sub_lines) - 1
    )
    total_h = head_h + block_gap + sub_h

    if anchor == "top":
        y = margin_y
    else:
        y = H - margin_y - total_h

    for line in head_lines:
        w = text_width(line, head_font, draw)
        x = (W - w) // 2
        # Subtle shadow for legibility
        draw.text((x + 2, y + 2), line, font=head_font, fill=(0, 0, 0, 200))
        draw.text((x, y), line, font=head_font, fill=headline_color)
        y += line_height(line, head_font, draw) + line_gap_head
    y += block_gap - line_gap_head

    for line in sub_lines:
        w = text_width(line, sub_font, draw)
        x = (W - w) // 2
        draw.text((x + 1, y + 1), line, font=sub_font, fill=(0, 0, 0, 180))
        draw.text((x, y), line, font=sub_font, fill=subline_color)
        y += line_height(line, sub_font, draw) + line_gap_sub

    return img


def text_width(text: str, font: ImageFont.FreeTypeFont, draw: ImageDraw.ImageDraw) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def line_height(text: str, font: ImageFont.FreeTypeFont, draw: ImageDraw.ImageDraw) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[3] - bbox[1]


def wrap_to_width(
    text: str, font: ImageFont.FreeTypeFont, max_w: int, draw: ImageDraw.ImageDraw
) -> list[str]:
    words = text.split()
    lines, current = [], ""
    for w in words:
        candidate = (current + " " + w).strip()
        if text_width(candidate, font, draw) <= max_w:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def main() -> int:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set", file=sys.stderr)
        return 1
    client = OpenAI(api_key=api_key)

    font_path = ensure_font()
    print(f"font: {font_path}")

    for slide in SLIDES:
        final_path = OUT / f"{slide['name']}.png"
        if final_path.exists():
            print(f"[skip] {final_path.name} already exists")
            continue

        print(f"[{slide['name']}]")
        raw_path = RAW / f"{slide['name']}.png"
        photo = generate_photo(client, slide["prompt"], raw_path)
        photo = pad_to_1920x1080(photo)
        photo = draw_scrim(photo, slide["text_anchor"])
        composed = draw_text(
            photo,
            slide["headline"],
            slide["subline"],
            slide["text_anchor"],
            font_path,
            slide["headline_color"],
            slide["subline_color"],
        )
        composed.save(final_path, "PNG")
        print(f"  saved: {final_path}")
        time.sleep(1)

    print("done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
