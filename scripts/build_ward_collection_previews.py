#!/usr/bin/env python3
"""Build flattened, baked-watermark preview derivatives for L&L's paid art.

Only use source art already present in the temporary public repository clone.
NEVER publish source images, delivery packages, or Google Drive paid masters.
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

from build_ward_previews import bake_ward

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "previews"
MAP_IDS = (3, 4, 5, 6, 7, 8, 9, 10, 12, 13)
EXPECTED = {"grimoire": 12, "mapmaker": 10, "volone": 12, "buttons": 33}


def art_list():
    return {
        "grimoire": [(f"grimoire-{i:02d}-preview.webp",
                      ROOT / "assets" / "grimoire" / f"grim-{i}.PNG")
                     for i in range(1, 13)],
        "mapmaker": [(f"mapmaker-{i:02d}-preview.webp",
                      ROOT / "assets" / "mapmaker" / f"map_{i}.png")
                     for i in MAP_IDS],
        "volone": [(f"volone-{i:02d}-preview.webp",
                    ROOT / "assets" / "vol-one" / f"parchment-light_{i}.jpg")
                   for i in range(1, 13)],
        "buttons": [(p.stem + "-preview.webp", p)
                    for p in sorted((ROOT / "buttons-stickers").glob("*.png"))]
    }


def flatten_page(src):
    with Image.open(src) as original:
        original = ImageOps.exif_transpose(original)
        width, height = original.size
        if min(width, height) < 400:
            raise ValueError(f"Art source unexpectedly small: {src} {original.size}")
        rgba = original.convert("RGBA")
        paper = Image.new("RGBA", rgba.size, (229, 212, 185, 255))
        paper.alpha_composite(rgba)
        image = paper.convert("RGB")
        image.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
        return image, [width, height]


def flatten_sticker(src):
    with Image.open(src) as original:
        original = ImageOps.exif_transpose(original).convert("RGBA")
        source_size = list(original.size)
        # A paid PNG's transparent pixels must not be distributed in the preview.
        alpha = original.getchannel("A")
        crop = alpha.getbbox()
        if not crop:
            raise ValueError(f"Empty sticker: {src}")
        sticker = original.crop(crop)
        sticker.thumbnail((660, 660), Image.Resampling.LANCZOS)
        width = height = 820
        canvas = Image.new("RGB", (width, height), (35, 29, 27))
        draw = ImageDraw.Draw(canvas)
        for y in range(height):
            dist = abs(y - height * 0.45) / height
            # Restrained antique-charcoal surface complements the existing shop.
            tint = int(8 * (1 - min(1.0, dist * 1.5)))
            draw.line((0, y, width, y), fill=(35 + tint, 29 + tint, 27 + tint))
        base = canvas.convert("RGBA")
        x = (width - sticker.width) // 2
        y = max(10, (height - sticker.height) // 2 - 25)
        base.alpha_composite(sticker, (x, y))
        return base.convert("RGB"), source_size


def build():
    files = art_list()
    if len(files["buttons"]) != 33:
        raise ValueError(f"Expected 33 sold/staged sticker PNGs, found {len(files['buttons'])}")
    total = 0
    for group, sources in files.items():
        if len(sources) != EXPECTED[group]:
            raise ValueError(f"Unexpected source count for {group}")
        target_dir = OUT / group
        target_dir.mkdir(parents=True, exist_ok=True)
        records = []
        for filename, source in sources:
            if not source.is_file():
                raise FileNotFoundError(source)
            image, dims = (flatten_sticker(source)
                           if group == "buttons" else flatten_page(source))
            warded = bake_ward(image)
            destination = target_dir / filename
            warded.save(destination, "WEBP", quality=78, method=6)
            with Image.open(destination) as check:
                check.verify()
            with Image.open(destination) as check:
                if check.format != "WEBP" or check.mode != "RGB":
                    raise ValueError(f"Preview not flattened: {destination}")
                if max(check.size) > 1400:
                    raise ValueError(f"Oversize preview: {destination} {check.size}")
                result_dimensions = list(check.size)
            size = destination.stat().st_size
            if size > 1_000_000:
                raise ValueError(f"Public preview too large: {destination} {size}")
            records.append({
                "file": str(destination.relative_to(ROOT)),
                "source_dimensions": dims,
                "preview_dimensions": result_dimensions,
                "bytes": size,
                "sha256": hashlib.sha256(destination.read_bytes()).hexdigest()
            })
            total += 1
            print(f"{group}: {filename}: {dims} => {result_dimensions}, {size} bytes")
        manifest = {
            "ward_version": 2,
            "pack": group,
            "count": len(records),
            "assets": records,
            "access_control": "public marketing preview only; full assets are private"
        }
        (target_dir / "preview-manifest.json").write_text(
            json.dumps(manifest, indent=2) + "\n")
    assert total == 67, total
    print("PASS: 67 downsized, flattened, baked-watermark preview assets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(build())
