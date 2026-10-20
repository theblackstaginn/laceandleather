#!/usr/bin/env python3
"""Build brand-attributed Pinterest marketing exports from public Etsy previews.

Only the public listing-gallery images in pin-plan.json are downloaded.
This does not read, modify, or publish customer download masters.
No claim is made about the creative tools used to make the source artwork.
"""
import argparse
import hashlib
import io
import json
import re
import time
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from PIL import Image, ImageOps

BRAND = "Lace & Leather Arcane"
SITE = "https://laceleatherarcane.com"
SHOP = "https://www.etsy.com/shop/laceLeatherArcane"
ARTIST_TAG = 315
COPYRIGHT_TAG = 33432
DESCRIPTION_TAG = 270
SOFTWARE_TAG = 305
MAX_IMAGE_EDGE = 1300
MAX_DOWNLOAD_BYTES = 24 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 45_000_000


def read_public_preview(url: str) -> bytes:
    parts = urlsplit(url)
    if (parts.scheme != "https" or parts.hostname != "i.etsystatic.com"
            or not parts.path.startswith("/63811998/r/il/") or parts.query):
        raise ValueError("Image source is not a public Lace & Leather Etsy listing preview")
    headers = {"User-Agent": "Mozilla/5.0 (LaceLeatherArcane-PreviewExport/1.0)",
               "Accept": "image/jpeg,image/png,image/webp,image/*",
               "Referer": "https://www.etsy.com/"}
    error = None
    for attempt in range(4):
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=35) as response:
                if response.status != 200:
                    raise ValueError("Image returned HTTP " + str(response.status))
                payload = response.read(MAX_DOWNLOAD_BYTES + 1)
            if not 2000 < len(payload) <= MAX_DOWNLOAD_BYTES:
                raise ValueError("Unexpected public preview size")
            # Keep verifiable provenance intact: do not intentionally
            # erase authentic C2PA / Content Credentials manifests.
            low = payload.lower()
            if b"c2pa" in low or b"content credentials" in low or b"jumbf" in low:
                raise ValueError("Source may contain authenticity metadata; review manually")
            with Image.open(io.BytesIO(payload)) as check:
                check.verify()
            return payload
        except Exception as exc:
            error = exc
            if "authenticity metadata" in str(exc):
                break
            time.sleep(1 + attempt * 2)
    raise RuntimeError("Unable to read approved public preview: " + str(error)) from error


def make_export(pin: dict, raw: bytes, out_dir: Path) -> dict:
    uuid = pin["uuid"]
    title = pin["title"]
    filename = "pin-" + re.sub("[^0-9a-zA-Z_-]", "", uuid.replace("-", "n")) + ".jpg"
    if not uuid or not title or len(title) > 250:
        raise ValueError("Missing/invalid pin identity or title")

    with Image.open(io.BytesIO(raw)) as opened:
        upright = ImageOps.exif_transpose(opened)
        if upright.mode in ("RGBA", "LA") or "transparency" in upright.info:
            base = Image.new("RGBA", upright.size, (246, 240, 230, 255))
            base.alpha_composite(upright.convert("RGBA"))
            artwork = base.convert("RGB")
        else:
            artwork = upright.convert("RGB")
        artwork.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE), Image.Resampling.LANCZOS)
        dimensions = list(artwork.size)

        # Only accurate brand information is added to this new *derivative*.
        # Original EXIF / camera / location / editor metadata is not copied.
        copyright_text = "Copyright 2026 Lace & Leather Arcane"
        description = (title + " | Product preview from " + BRAND
                       + " | Site: " + SITE + " | Shop: " + SHOP)
        exif = Image.Exif()
        exif[ARTIST_TAG] = BRAND
        exif[COPYRIGHT_TAG] = copyright_text
        exif[DESCRIPTION_TAG] = description
        exif[SOFTWARE_TAG] = "Lace & Leather Arcane Pinterest Export (Pillow)"

        out_dir.mkdir(parents=True, exist_ok=True)
        dest = out_dir / filename
        artwork.save(dest, "JPEG", quality=90, subsampling=0,
                     optimize=True, progressive=True, exif=exif.tobytes(),
                     dpi=(300, 300))

    with Image.open(dest) as exported:
        tags = exported.getexif()
        if (exported.format != "JPEG"
                or tags.get(ARTIST_TAG) != BRAND
                or tags.get(COPYRIGHT_TAG) != copyright_text
                or SITE not in str(tags.get(DESCRIPTION_TAG, ""))
                or SHOP not in str(tags.get(DESCRIPTION_TAG, ""))):
            raise AssertionError("Brand attribution missing from exported image")
        allowed = {ARTIST_TAG, COPYRIGHT_TAG, DESCRIPTION_TAG, SOFTWARE_TAG}
        extra = [int(tag) for tag in tags if tag not in allowed]
        if extra:
            raise AssertionError("Unexpected EXIF tags: " + str(extra))
        if exported.info.get("xmp"):
            raise AssertionError("Unexpected original XMP in new export")

    result = {
        "pin_uuid": uuid,
        "scheduled_at": pin["scheduled_at"],
        "title": title,
        "family": pin["family"],
        "listing_id": pin["listing_id"],
        "source_preview": pin["source_preview"],
        "file": filename,
        "sha256": hashlib.sha256(dest.read_bytes()).hexdigest(),
        "bytes": dest.stat().st_size,
        "size": dimensions,
        "artist": BRAND,
        "copyright": copyright_text,
        "website": SITE,
        "shop_link": SHOP,
        "metadata_check": "verified",
    }
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", default="marketing/pinterest/pin-plan.json")
    parser.add_argument("--out", default="marketing/pinterest/exports")
    args = parser.parse_args()
    plan = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    if plan.get("brand") != BRAND or plan.get("shop") != SHOP:
        raise ValueError("Unexpected brand or destination in export plan")
    pins = plan.get("pins", [])
    if len(pins) != 57 or len({p["uuid"] for p in pins}) != len(pins):
        raise ValueError("Expected 57 unique queued Pin identities")
    out = Path(args.out)
    cache = {}
    reports = []
    for number, pin in enumerate(pins, 1):
        source = pin["source_preview"]
        if source not in cache:
            cache[source] = read_public_preview(source)
        result = make_export(pin, cache[source], out)
        reports.append(result)
        print(f"{number:02d}/{len(pins)} {result['file']} "
              f"{result['bytes']} bytes [verified]", flush=True)
    report = {
        "brand": BRAND, "shop": SHOP, "total": len(reports),
        "description": "Metadata checked on public-preview promotional derivatives.",
        "records": reports,
    }
    (out / "metadata-audit.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print("Completed", len(reports), "clean, branded Pinterest marketing exports")


if __name__ == "__main__":
    main()
