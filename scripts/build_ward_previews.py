#!/usr/bin/env python3
"""Build public, baked-watermark PREVIEWS from already committed source art.

This script is meant to run on a guarded branch only. It never changes original
source assets or paid private Google Drive packages.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
LIMIT = 1500
QUALITY = 80


def face(size: int, serif: bool = True):
    candidates = (
        ["/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
         "/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf"]
        if serif else
        ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
         "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"]
    )
    for p in candidates:
        if Path(p).is_file():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def source_for(index: int):
    candidates = [
        ROOT / "assets" / "smithy" / f"smithy-{index}.png",
        ROOT / "assets" / "smithy-hires" / "site" / f"smithy-{index}.jpg",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(f"Smithy preview source {index} not found")


def prepare(source: Path):
    with Image.open(source) as src:
        src = ImageOps.exif_transpose(src)
        if src.width < 500 or src.height < 500:
            raise ValueError(f"Source is unexpectedly small: {source} {src.size}")
        source_size = src.size
        rgba = src.convert("RGBA")
        matte = Image.new("RGBA", rgba.size, (230, 213, 185, 255))
        matte.alpha_composite(rgba)
        image = matte.convert("RGB")
        if max(image.size) > LIMIT:
            image.thumbnail((LIMIT, LIMIT), Image.Resampling.LANCZOS)
        return image, source_size


def bake_ward(image: Image.Image):
    """Diagonal embedded marks plus a narrow brand strip, not HTML/CSS overlays."""
    w, h = image.size
    base = image.convert("RGBA")
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ink = ImageDraw.Draw(overlay)
    headline = face(max(16, int(w * 0.054)), serif=True)
    small = face(max(13, int(w * 0.020)), serif=False)

    # Repeated, translucent watermarks are distributed throughout the artwork.
    # Baked into pixels so a direct image download retains the mark.
    phrase = "LACE & LEATHER ARCANE"
    stripe = Image.new("RGBA", (int(w * 1.9), max(100, int(h * 0.24))), (0, 0, 0, 0))
    stripe_draw = ImageDraw.Draw(stripe)
    text_box = stripe_draw.textbbox((0, 0), phrase, font=headline)
    tw = text_box[2] - text_box[0]
    for x in range(-tw, stripe.width + tw, int(max(1, tw * 1.3))):
        y = stripe.height // 2
        stripe_draw.text(
            (x, y), phrase, font=headline,
            anchor="lm", fill=(244, 230, 200, 82),
            stroke_width=1, stroke_fill=(37, 25, 19, 80)
        )
    stripe = stripe.rotate(19, expand=True, resample=Image.Resampling.BICUBIC)
    for fy in (0.22, 0.53, 0.84):
        y = round(h * fy - stripe.height / 2)
        overlay.alpha_composite(stripe, (round((w - stripe.width) / 2), y))

    # A permanent signature along the lower edge of the preview.
    band_h = max(44, round(h * 0.057))
    ink.rectangle((0, h - band_h, w, h), fill=(24, 19, 16, 178))
    ink.line((0, h - band_h, w, h - band_h), fill=(225, 191, 130, 172), width=2)
    center_y = h - band_h // 2
    ink.text((round(w * 0.025), center_y), "LACE & LEATHER ARCANE", font=small,
             anchor="lm", fill=(247, 224, 184, 245))
    ink.text((round(w * 0.975), center_y), "PREVIEW ONLY", font=small,
             anchor="rm", fill=(247, 224, 184, 235))
    return Image.alpha_composite(base, overlay).convert("RGB")


def build_smithy():
    output_dir = ROOT / "assets" / "previews" / "smithy"
    output_dir.mkdir(parents=True, exist_ok=True)
    inventory = []
    for index in range(1, 13):
        source = source_for(index)
        image, source_size = prepare(source)
        result = bake_ward(image)
        name = f"smithy-{index:02d}-preview.webp"
        out = output_dir / name
        result.save(out, "WEBP", quality=QUALITY, method=6)
        with Image.open(out) as checked:
            checked.verify()
        with Image.open(out) as checked:
            if checked.mode != "RGB" or max(checked.size) > LIMIT:
                raise ValueError(f"Invalid preview output: {out}")
            output_size = checked.size
        entry = {
            "file": str(out.relative_to(ROOT)),
            "source_dimensions": list(source_size),
            "preview_dimensions": list(output_size),
            "bytes": out.stat().st_size,
            "sha256": hashlib.sha256(out.read_bytes()).hexdigest(),
        }
        inventory.append(entry)
        print(f"{index:02d}/12 {name}: {source_size} -> {output_size}, "
              f"{out.stat().st_size:,} bytes")
    manifest = output_dir / "preview-manifest.json"
    manifest.write_text(json.dumps({"ward_version": 2, "source_count": 12,
                                    "max_long_edge": LIMIT, "files": inventory},
                                   indent=2) + "\n")
    print("All twelve watermarked, flattened previews verified.")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pack", choices=["smithy"], required=True)
    args = parser.parse_args()
    if args.pack == "smithy":
        raise SystemExit(build_smithy())
