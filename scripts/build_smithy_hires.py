from PIL import Image, ImageFilter
import numpy as np
from pathlib import Path

SRC = Path("assets/smithy")
OUT = Path("assets/smithy-hires/masters")
OUT.mkdir(parents=True, exist_ok=True)
TARGET = (3600, 5400)

for i in range(1, 13):
    im = Image.open(SRC / f"smithy-{i}.png").convert("RGB")
    a = np.asarray(im)
    mask = np.min(a, axis=2) < 245
    ys, xs = np.where(mask)
    if len(xs):
        im = im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))

    ratio = im.width / im.height
    target_ratio = TARGET[0] / TARGET[1]
    if ratio > target_ratio:
        w = round(im.height * target_ratio)
        x = (im.width - w) // 2
        im = im.crop((x, 0, x + w, im.height))
    elif ratio < target_ratio:
        h = round(im.width / target_ratio)
        y = (im.height - h) // 2
        im = im.crop((0, y, im.width, y + h))

    im = im.resize(TARGET, Image.Resampling.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.15, percent=55, threshold=2))
    im.save(OUT / f"Smithy_Texture_{i:02d}.jpg", "JPEG", quality=93, dpi=(300, 300))
