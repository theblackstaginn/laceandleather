#!/usr/bin/env python3
import argparse
import json
import re
import shutil
from pathlib import Path

from PIL import Image

PRODUCTS = [
    "grimoire",
    "mapmaker",
    "volone",
    "smithy",
    "button-amber-bronze",
    "button-amethyst-frame",
    "button-amethyst-rectangle",
    "button-emerald-oval",
    "button-emerald-x",
    "button-green-moon",
    "button-grn-wax-book",
    "button-lantern",
    "button-moon-green",
    "button-moon-parch-clean",
    "button-purple-arrow",
    "button-purple-wax-crystal",
    "button-purple-x-shield",
    "button-red-arrow",
    "button-red-parch-arrow",
    "button-red-stag",
    "button-red-wax-feather",
    "button-red-x-bronze",
    "button-red-x-shield",
    "button-red-x",
    "button-ruby-plate",
    "button-sapphire-arrow",
    "button-sapphire-plate",
    "button-skull-bronze-plate",
    "button-skull-plate",
    "button-skull",
    "button-stag-plate",
    "button-stag-red-wax",
    "button-wax-green-book-2",
    "button-wax-key",
    "button-wax-skull",
]

PACK_SOURCES = {
    "grimoire": ("assets/grimoire", "grim-", {"grim-thumb.png"}),
    "mapmaker": ("assets/mapmaker", "map_", {"mapmaker-cover.png"}),
    "volone": ("assets/vol-one", "parchment-light_", set()),
    "smithy": ("assets/smithy", "smithy-", {"smithy-cover.png"}),
}

def natural_key(path: Path):
    parts = re.split(r"(\d+)", path.name.lower())
    return [int(p) if p.isdigit() else p for p in parts]

def product_sources(product_id: str):
    if product_id in PACK_SOURCES:
        directory, prefix, excluded = PACK_SOURCES[product_id]
        base = Path(directory)
        files = [
            p for p in base.iterdir()
            if p.is_file()
            and p.name not in excluded
            and p.name.lower().startswith(prefix.lower())
            and p.suffix.lower() in {".png", ".jpg", ".jpeg"}
        ]
        return sorted(files, key=natural_key)

    if product_id.startswith("button-"):
        slug = product_id[len("button-"):]
        path = Path("buttons-stickers") / f"{slug}.png"
        return [path] if path.exists() else []

    return []

def rgb_on_white(im: Image.Image):
    if im.mode in ("RGBA", "LA") or ("transparency" in im.info):
        rgba = im.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        bg.alpha_composite(rgba)
        return bg.convert("RGB")
    return im.convert("RGB")

def save_formats(source: Path, png_dir: Path, jpg_dir: Path, webp_dir: Path):
    with Image.open(source) as im:
        im.load()
        stem = source.stem

        png_path = png_dir / f"{stem}.png"
        im.convert("RGBA" if im.mode in ("RGBA", "LA") or "transparency" in im.info else "RGB").save(
            png_path, "PNG", optimize=True
        )

        rgb = rgb_on_white(im)
        jpg_path = jpg_dir / f"{stem}.jpg"
        rgb.save(jpg_path, "JPEG", quality=95, optimize=True, subsampling=0)

        webp_path = webp_dir / f"{stem}.webp"
        if im.mode in ("RGBA", "LA") or "transparency" in im.info:
            webp_im = im.convert("RGBA")
        else:
            webp_im = im.convert("RGB")
        webp_im.save(webp_path, "WEBP", quality=95, method=6)

        return rgb.copy()

def build_product(product_id: str, out_dir: Path):
    if product_id not in PRODUCTS:
        raise SystemExit(f"Unknown product id: {product_id}")

    sources = product_sources(product_id)
    missing = [str(p) for p in sources if not p.exists()]
    if missing:
        raise SystemExit("Missing source files: " + ", ".join(missing))
    if not sources:
        raise SystemExit(f"No source files found for {product_id}")

    if out_dir.exists():
        shutil.rmtree(out_dir)
    png_dir = out_dir / "PNG"
    jpg_dir = out_dir / "JPG"
    webp_dir = out_dir / "WEBP"
    pdf_dir = out_dir / "PDF"
    for d in (png_dir, jpg_dir, webp_dir, pdf_dir):
        d.mkdir(parents=True, exist_ok=True)

    pdf_pages = []
    manifest = []

    for source in sources:
        page = save_formats(source, png_dir, jpg_dir, webp_dir)
        pdf_pages.append(page)
        manifest.append({
            "source": str(source),
            "stem": source.stem,
        })

    pdf_path = pdf_dir / f"{product_id}.pdf"
    first, rest = pdf_pages[0], pdf_pages[1:]
    first.save(
        pdf_path,
        "PDF",
        resolution=300.0,
        save_all=True,
        append_images=rest,
    )
    for page in pdf_pages:
        page.close()

    readme = f"""Lace & Leather Digital Asset Pack

Product ID: {product_id}

Included formats:
- PNG
- JPG
- WEBP
- PDF

These designs are raster artwork. SVG is not included unless a future product is created as true vector art; wrapping a raster image in SVG would not create a genuine scalable vector file.

The PDF is a convenient print-ready version. PNG, JPG, and WEBP folders contain the individual artwork files.

For personal or licensed commercial use according to the terms supplied by Lace & Leather.
"""
    (out_dir / "README.txt").write_text(readme, encoding="utf-8")
    (out_dir / "manifest.json").write_text(
        json.dumps({"product_id": product_id, "files": manifest}, indent=2),
        encoding="utf-8",
    )

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--product", required=True)
    parser.add_argument("--out", default="delivery-package")
    args = parser.parse_args()
    build_product(args.product, Path(args.out))

if __name__ == "__main__":
    main()
