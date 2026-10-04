# -*- coding: utf-8 -*-
"""Draws the app's icons: the launcher icon in every density and the 512 one Play Store asks for.

The mark is the site's own: the white "14" of the header logo with the gold rule under it, on the
navy of the site's dark blocks. The digits are set in Bricolage Grotesque, the display face the site
uses for its headings (bundled under assets/fonts/, SIL Open Font License).

Android 8 and newer draw an *adaptive* icon: two layers, each 108dp wide, which the launcher masks
to whatever shape the phone uses -- a circle, a squircle, a rounded square. Only the central circle
of 72dp is guaranteed to survive every mask, so the digits and the rule stay inside it, and the
background layer fills the whole canvas. Run: python3 android/play/make-icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
RES = HERE.parent / "app/src/main/res"
FONT = HERE.parents[1] / "assets/fonts/BricolageGrotesque-Bold.ttf"

DEEP, GOLD, WHITE = (10, 17, 38), (217, 148, 42), (255, 255, 255)
BLUE_GLOW, TEAL_GLOW = (32, 66, 158), (12, 74, 72)

# Adaptive layers are 108dp; the launcher icon of old Android is 48dp. Both scale with density.
DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}


def background(size: int) -> Image.Image:
    """Navy with the two soft glows the site's dark blocks have."""
    glow = Image.new("RGB", (size, size), DEEP)
    g = ImageDraw.Draw(glow)
    g.ellipse((size * 0.35, -size * 0.27, size * 1.21, size * 0.59), fill=BLUE_GLOW)
    g.ellipse((-size * 0.23, size * 0.59, size * 0.59, size * 1.33), fill=TEAL_GLOW)
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.18))
    return Image.blend(Image.new("RGB", (size, size), DEEP), glow, 0.95)


def mark(size: int, scale: float) -> Image.Image:
    """The "14" and its gold rule, centred, on a transparent layer.

    `scale` is the share of the canvas the mark may fill: 0.45 keeps it inside the adaptive icon's
    safe circle, while a legacy icon has no mask to dodge and can carry it larger.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Fit the digits to the width the scale allows, then place the block on the optical centre.
    font_size, text = 10, "14"
    while True:
        f = ImageFont.truetype(str(FONT), font_size + 2)
        box = d.textbbox((0, 0), text, font=f)
        if box[2] - box[0] > size * scale:
            break
        font_size += 2
    f = ImageFont.truetype(str(FONT), font_size)
    box = d.textbbox((0, 0), text, font=f)
    w, h = box[2] - box[0], box[3] - box[1]
    rule_gap, rule_h = size * 0.055, max(2, round(size * 0.035))
    block = h + rule_gap + rule_h
    top = (size - block) / 2

    d.text(((size - w) / 2 - box[0], top - box[1]), text, font=f, fill=WHITE)
    d.rounded_rectangle(
        (size / 2 - w * 0.33, top + h + rule_gap, size / 2 + w * 0.33, top + h + rule_gap + rule_h),
        radius=rule_h / 2,
        fill=GOLD,
    )
    return img


def full(size: int, scale: float = 0.52) -> Image.Image:
    """Background and mark in one square image."""
    img = background(size).convert("RGBA")
    img.alpha_composite(mark(size, scale))
    return img


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)


for density, k in DENSITIES.items():
    out = RES / f"mipmap-{density}"
    # Adaptive layers: 108dp square, mark inside the 72dp safe circle.
    save(background(round(108 * k)), out / "ic_launcher_background.png")
    save(mark(round(108 * k), 0.45), out / "ic_launcher_foreground.png")
    # Legacy icon for Android 7 and older, and for launchers that ask for a plain bitmap.
    legacy = full(round(48 * k))
    save(legacy, out / "ic_launcher.png")
    save(legacy, out / "ic_launcher_round.png")

# Play Store listing icon: 512x512, no transparency (Play rounds the corners itself).
save(full(512).convert("RGB"), HERE / "icon-512.png")
print("icons written")
