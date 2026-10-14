from PIL import Image, ImageFilter
import numpy as np
from pathlib import Path

SRC = Path("assets/smithy")
MASTER = Path("assets/smithy-hires/masters")
SITE = Path("assets/smithy-hires/site")
ROOT = Path("assets/smithy-hires")
SITE.mkdir(parents=True, exist_ok=True)

for i in range(1, 13):
    im = Image.open(MASTER / f"Smithy_Texture_{i:02d}.jpg").convert("RGB")
    im = im.resize((1600, 2400), Image.Resampling.LANCZOS)
    im.save(SITE / f"smithy-{i}.jpg", "JPEG", quality=90, optimize=True, progressive=True)

cover = Image.open(SRC / "smithy-cover.png").convert("RGB")
a = np.asarray(cover)
mask = np.min(a, axis=2) < 245
ys, xs = np.where(mask)
if len(xs):
    cover = cover.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
side = min(cover.width, cover.height)
x = (cover.width - side) // 2
y = (cover.height - side) // 2
cover = cover.crop((x, y, x + side, y + side))
cover = cover.resize((2400, 2400), Image.Resampling.LANCZOS)
cover = cover.filter(ImageFilter.UnsharpMask(radius=1.0, percent=45, threshold=2))
cover.save(ROOT / "smithy-cover-hires.jpg", "JPEG", quality=94, optimize=True, progressive=True)
