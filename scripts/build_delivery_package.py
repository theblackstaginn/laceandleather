#!/usr/bin/env python3
# Builds customer-ready Lace & Leather digital delivery packages.
import argparse
import json
import re
import shutil
import zipfile
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

FORMATS = ("PNG", "JPG", "WEBP", "PDF")


def natural_key(path: Path):
    parts = re.split(r"(\d+)", path.name.lower())
    return [int(p) if p.isdigit() else p for p in parts]


def product_sources(product_id: str):
    if product_id in PACK_SOURCES:
        directory, prefix, excluded = PACK_SOURCES[product_id]
        base = Path(directory)
        if not base.exists():
            return []
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
        has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info

        png_im = im.convert("RGBA" if has_alpha else "RGB")
        png_im.save(png_dir / f"{stem}.png", "PNG", optimize=True)

        rgb = rgb_on_white(im)
        rgb.save(jpg_dir / f"{stem}.jpg", "JPEG", quality=95, optimize=True, subsampling=0)

        webp_im = im.convert("RGBA" if has_alpha else "RGB")
        webp_im.save(webp_dir / f"{stem}.webp", "WEBP", quality=95, method=6)

        return rgb.copy()


def build_product(product_id: str, out_dir: Path):
    if product_id not in PRODUCTS:
        raise ValueError(f"Unknown product id: {product_id}")

    sources = product_sources(product_id)
    if not sources:
        raise FileNotFoundError(f"No source files found for {product_id}")

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
        if not source.exists():
            raise FileNotFoundError(f"Missing source file: {source}")
        page = save_formats(source, png_dir, jpg_dir, webp_dir)
        pdf_pages.append(page)
        manifest.append({"source": str(source), "stem": source.stem})

    pdf_path = pdf_dir / f"{product_id}.pdf"
    first, rest = pdf_pages[0], pdf_pages[1:]
    first.save(pdf_path, "PDF", resolution=300.0, save_all=True, append_images=rest)
    for page in pdf_pages:
        page.close()

    readme = f"""Lace & Leather Digital Asset Pack

Product ID: {product_id}

Included formats:
- PNG
- JPG
- WEBP
- PDF

These designs are raster artwork. SVG is not included because wrapping a raster image inside SVG would not create a genuine scalable vector asset.

The PDF is a convenient print-ready version. PNG, JPG, and WEBP folders contain the individual artwork files.

For use according to the Lace & Leather license supplied with the product.
"""
    (out_dir / "README.txt").write_text(readme, encoding="utf-8")
    (out_dir / "manifest.json").write_text(
        json.dumps({"product_id": product_id, "formats": FORMATS, "files": manifest}, indent=2),
        encoding="utf-8",
    )


def zip_product(product_dir: Path, zip_path: Path):
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for path in sorted(product_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(product_dir))


def build_all(dist_dir: Path):
    work_dir = dist_dir / "work"
    zip_dir = dist_dir / "zips"
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    work_dir.mkdir(parents=True, exist_ok=True)
    zip_dir.mkdir(parents=True, exist_ok=True)

    built = []
    for product_id in PRODUCTS:
        product_dir = work_dir / product_id
        build_product(product_id, product_dir)
        zip_path = zip_dir / f"{product_id}.zip"
        zip_product(product_dir, zip_path)
        built.append({"product_id": product_id, "zip": str(zip_path), "bytes": zip_path.stat().st_size})

    (dist_dir / "build-manifest.json").write_text(json.dumps(built, indent=2), encoding="utf-8")
    return built


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--product")
    mode.add_argument("--all", action="store_true")
    parser.add_argument("--out", default="delivery-package")
    parser.add_argument("--dist", default="dist")
    args = parser.parse_args()

    if args.all:
        built = build_all(Path(args.dist))
        print(json.dumps(built, indent=2))
        return

    out_dir = Path(args.out)
    build_product(args.product, out_dir)
    zip_path = out_dir.with_suffix(".zip")
    zip_product(out_dir, zip_path)
    print(zip_path)


if __name__ == "__main__":
    main()
