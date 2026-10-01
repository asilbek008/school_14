# -*- coding: utf-8 -*-
"""Play Store feature graphic (1024x500) in the site's own colours.

Play crops this image on some surfaces, so everything that matters stays inside the central
924x400 safe area.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1024, 500
NAVY, DEEP = (17, 28, 58), (7, 12, 24)
BRAND, TEAL, GOLD, WHITE = (44, 92, 224), (18, 140, 126), (217, 148, 42), (255, 255, 255)
B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
font = lambda path, size: ImageFont.truetype(path, size)

# Navy with two soft glows, like the dark blocks on the site.
img = Image.new("RGB", (W, H), DEEP)
glow = Image.new("RGB", (W, H), DEEP)
g = ImageDraw.Draw(glow)
g.ellipse((480, -300, 1240, 300), fill=(28, 58, 140))
g.ellipse((-260, 300, 360, 780), fill=(10, 60, 58))
img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(130)), 0.92)

# A faint grid, blended rather than drawn solid.
grid = img.copy()
gd = ImageDraw.Draw(grid)
for x in range(0, W, 64):
    gd.line([(x, 0), (x, H)], fill=WHITE)
for y in range(0, H, 64):
    gd.line([(0, y), (W, y)], fill=WHITE)
img = Image.blend(img, grid, 0.05)
d = ImageDraw.Draw(img)

# The logo tile: white rounded square, navy "14", gold underline.
ts = 132
tx, ty = 118, (H - ts) // 2 - 6
d.rounded_rectangle((tx, ty, tx + ts, ty + ts), radius=32, fill=WHITE)
fn = font(B, 72)
bbox = d.textbbox((0, 0), "14", font=fn)
d.text((tx + (ts - (bbox[2] - bbox[0])) / 2 - bbox[0], ty + 26), "14", font=fn, fill=NAVY)
d.rounded_rectangle((tx + 40, ty + ts - 30, tx + ts - 40, ty + ts - 23), radius=4, fill=GOLD)

# Title block, all of it inside the safe area (x <= 924).
x = tx + ts + 48
d.text((x, 168), "14-maktab", font=font(B, 66), fill=WHITE)
d.text((x, 252), "Qiziriq tumani, Surxondaryo", font=font(R, 28), fill=(169, 179, 208))
d.text((x, 300), "Dars jadvali · Yangiliklar · Testlar", font=font(B, 24), fill=GOLD)

# The site's tricolour rule along the bottom.
h = 10
d.rectangle((0, H - h, int(W * 0.38), H), fill=BRAND)
d.rectangle((int(W * 0.38), H - h, int(W * 0.70), H), fill=TEAL)
d.rectangle((int(W * 0.70), H - h, W, H), fill=GOLD)

img.save(Path(__file__).with_name("feature-graphic.png"), optimize=True)
print("saved", img.size)
