# -*- coding: utf-8 -*-
"""Draws the app's icons: the launcher icon in every density and the 512 one Play Store asks for.

The mark is the site's own: a two-centred pointed arch -- the gate of a school courtyard -- with the
numerals cut out of it and a gold keystone at the apex, on the navy of the site's dark blocks. The
geometry is the one in src/components/mark.ts (written by scripts/make-mark.py), restated here in
the few lines of trigonometry it takes, so the launcher icon and the site cannot drift apart. The
digits are set in Bricolage Grotesque, the display face the site uses for its headings (bundled
under assets/fonts/, SIL Open Font License).

Android 8 and newer draw an *adaptive* icon: two layers, each 108dp wide, which the launcher masks
to whatever shape the phone uses -- a circle, a squircle, a rounded square. Only the central circle
of 72dp is guaranteed to survive every mask, so the digits and the rule stay inside it, and the
background layer fills the whole canvas. Run: python3 android/play/make-icons.py
"""
import math

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
    """The arch, its keystone and the numerals cut out of it, centred on a transparent layer.

    `scale` is the share of the canvas the mark's height may fill: 0.56 keeps the whole mark, corners
    and all, inside the adaptive
    icon's safe circle, while a legacy icon has no mask to dodge and can carry it larger.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    h = size * scale                                  # height of the whole mark
    a = h / 3.613                                     # from the geometry: height = (2.13 + 1.483) a
    e, r = 0.60 * a, 1.60 * a
    rise = math.sqrt(r * r - e * e)
    cx = size / 2
    apex = (size - h) / 2
    spring = apex + rise
    base = apex + h

    def arc(centre, a0, a1, steps=160):
        return [(centre + r * math.cos(a0 + (a1 - a0) * i / steps),
                 spring - r * math.sin(a0 + (a1 - a0) * i / steps)) for i in range(steps + 1)]

    outline = ([(cx - a, base), (cx - a, spring)]
               + arc(cx + e, math.pi, math.atan2(rise, -e))      # left arc, springing to apex
               + arc(cx - e, math.atan2(rise, e), 0.0)           # right arc, apex to springing
               + [(cx + a, spring), (cx + a, base)])
    d.polygon(outline, fill=WHITE)

    # The keystone: the cap above the chord that cuts the top 18% of the rise.
    cap = apex + rise * 0.18
    s = (spring - cap) / r
    dx = r * math.cos(math.asin(s))
    d.polygon([(cx + e - dx, cap)] + arc(cx + e, math.pi - math.asin(s), math.atan2(rise, -e))
              + arc(cx - e, math.atan2(rise, e), math.asin(s)) + [(cx - e + dx, cap)], fill=GOLD)

    # The numerals read as holes cut through the arch, so they are painted in the ground colour.
    font_size, text = 10, "14"
    while True:
        f = ImageFont.truetype(str(FONT), font_size + 2)
        if d.textbbox((0, 0), text, font=f)[2] > 2 * a * 0.78:
            break
        font_size += 2
    f = ImageFont.truetype(str(FONT), font_size)
    b = d.textbbox((0, 0), text, font=f)
    cy = spring + (base - spring) * 0.46
    d.text((cx - (b[2] - b[0]) / 2 - b[0], cy - (b[3] - b[1]) / 2 - b[1]), text, font=f, fill=DEEP)
    return img


def full(size: int, scale: float = 0.72) -> Image.Image:
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
    save(mark(round(108 * k), 0.56), out / "ic_launcher_foreground.png")
    # Legacy icon for Android 7 and older, and for launchers that ask for a plain bitmap.
    legacy = full(round(48 * k))
    save(legacy, out / "ic_launcher.png")
    save(legacy, out / "ic_launcher_round.png")

# Play Store listing icon: 512x512, no transparency (Play rounds the corners itself).
save(full(512).convert("RGB"), HERE / "icon-512.png")
print("icons written")
