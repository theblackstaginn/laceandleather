#!/usr/bin/env python3
"""Metadata-only, reversible L&L Studio pilot for allowlisted public artwork.

GitHub Actions runs this on an isolated branch. It NEVER recompresses pixels,
strips authentic Content Credentials, or changes non-allowlisted paths.
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OWNER = "Lace & Leather Arcane"
STUDIO = "Lace & Leather Arcane Studio"
WEBSITE = "https://laceleatherarcane.com"
RIGHTS = "Copyright 2026 Lace & Leather Arcane"
SUPPORTED = {".png", ".jpg", ".jpeg", ".webp"}
CREDENTIAL_MARKERS = (
    b"c2pa", b"jumbf", b"content credentials", b"contentcredentials",
)
CONTENT_TAGS = {
    ".png": {"IDAT", "PLTE", "tRNS", "acTL", "fcTL", "fdAT"},
    ".webp": {"VP8 ", "VP8L", "ALPH", "ANIM", "ANMF"},
}
CREDIT_FIELDS = (
    "XMP-dc:Creator", "EXIF:Artist", "IPTC:By-line",
    "XMP-dc:Rights", "EXIF:Copyright", "IPTC:CopyrightNotice",
    "XMP-xmpRights:Owner", "XMP-photoshop:Credit",
)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def identify_unchanged_image(path: Path) -> dict:
    with Image.open(path) as img:
        frames = getattr(img, "n_frames", 1)
        if frames != 1:
            raise RuntimeError("Animated/multiframe image is not safe in this pilot")
        img.load()
        rgba = img.convert("RGBA")
        alpha = rgba.getchannel("A")
        profile = img.info.get("icc_profile") or b""
        return {
            "format": img.format,
            "size": list(img.size),
            "frames": frames,
            "pixel_sha256": digest(rgba.tobytes()),
            "alpha_sha256": digest(alpha.tobytes()),
            "icc_sha256": digest(profile if isinstance(profile, bytes) else profile.encode("utf-8")),
        }


def compressed_image_payload(data: bytes, suffix: str) -> str:
    """Hash encoded picture payload, excluding metadata chunks/segments."""
    fragments = []
    if suffix == ".png":
        if not data.startswith(b"\x89PNG\r\n\x1a\n"):
            raise ValueError("Not a PNG")
        cursor = 8
        while cursor + 12 <= len(data):
            count = int.from_bytes(data[cursor:cursor + 4], "big")
            tag = data[cursor + 4:cursor + 8].decode("ascii")
            end = cursor + count + 12
            if end > len(data):
                raise ValueError("Truncated PNG chunk")
            if tag in CONTENT_TAGS[suffix]:
                fragments.append(data[cursor + 4:cursor + 8 + count])
            cursor = end
            if tag == "IEND":
                break
    elif suffix == ".webp":
        if not (data.startswith(b"RIFF") and data[8:12] == b"WEBP"):
            raise ValueError("Not a WebP")
        cursor = 12
        while cursor + 8 <= len(data):
            count = int.from_bytes(data[cursor + 4:cursor + 8], "little")
            tag = data[cursor:cursor + 4].decode("ascii")
            end = cursor + 8 + count
            if end > len(data):
                raise ValueError("Truncated WebP chunk")
            if tag in CONTENT_TAGS[suffix]:
                fragments.append(data[cursor:end])
            cursor = end + (count % 2)
    elif suffix in {".jpg", ".jpeg"}:
        if not data.startswith(b"\xff\xd8"):
            raise ValueError("Not a JPEG")
        cursor = 2
        while cursor < len(data) - 4:
            if data[cursor] != 0xff:
                raise ValueError("Unexpected JPEG segment")
            while data[cursor] == 0xff:
                cursor += 1
            marker = data[cursor]
            cursor += 1
            if marker in (0xd8, 0xd9, 0x01) or 0xd0 <= marker <= 0xd7:
                continue
            segment_length = int.from_bytes(data[cursor:cursor + 2], "big")
            if segment_length < 2:
                raise ValueError("Malformed JPEG segment")
            if marker == 0xda:
                # Metadata APP segments precede image scan; everything after
                # this SOS header is the original entropy-coded picture data.
                fragments.append(data[cursor + segment_length:])
                break
            cursor += segment_length
    if not fragments:
        raise RuntimeError("Could not identify an encoded image payload")
    return digest(b"".join(fragments))


def exiftool_metadata(path: Path) -> dict:
    command = ["exiftool", "-j", "-G1", "-a", "-s", str(path)]
    output = subprocess.run(command, capture_output=True, text=True, check=True)
    records = json.loads(output.stdout)
    if len(records) != 1:
        raise RuntimeError("ExifTool returned an unexpected number of files")
    return records[0]


def has_authenticity_credentials(raw: bytes, metadata: dict) -> bool:
    lower = raw.lower()
    if any(mark in lower for mark in CREDENTIAL_MARKERS):
        return True
    return any(
        ("c2pa" in k.lower() or "jumbf" in k.lower()
         or "contentcredentials" in k.lower())
        for k in metadata.keys()
    )


def has_conflicting_rights(metadata: dict) -> list:
    conflicts = []
    for name in CREDIT_FIELDS:
        value = metadata.get(name)
        if value is None or value == "":
            continue
        if isinstance(value, list):
            value = ", ".join(str(item) for item in value)
        if OWNER.lower() not in str(value).lower() and STUDIO.lower() not in str(value).lower():
            conflicts.append(name)
    return conflicts


def run(manifest_path: Path, report_path: Path) -> None:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if (manifest.get("creator") != OWNER or manifest.get("studio") != STUDIO
            or manifest.get("website") != WEBSITE or manifest.get("copyright") != RIGHTS):
        raise ValueError("Pilot manifest does not match the approved L&L Studio identity")
    entries = manifest["files"]
    if len(entries) != 6 or len({x["path"] for x in entries}) != len(entries):
        raise ValueError("Expected precisely six unique pilot artwork files")

    outcome = []
    for entry in entries:
        relative = Path(entry["path"])
        if (relative.is_absolute() or ".." in relative.parts
                or relative.suffix.lower() not in SUPPORTED):
            raise ValueError("Invalid or out-of-scope image path")
        path = (ROOT / relative).resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise ValueError("Asset path does not resolve within the repository")
        if not path.as_posix().startswith(ROOT.as_posix() + "/assets/"):
            raise ValueError("This pilot only accepts L&L public assets")
        if not entry.get("description") or len(entry["description"]) > 180:
            raise ValueError("Missing or excessive truthful description")
        before = path.read_bytes()
        before_image = identify_unchanged_image(path)
        before_payload = compressed_image_payload(before, relative.suffix.lower())
        before_meta = exiftool_metadata(path)
        record = {
            "path": relative.as_posix(),
            "rights_basis": entry["kind"],
            "original_sha256": digest(before),
            "decoded_pixel_sha256": before_image["pixel_sha256"],
            "encoded_image_sha256": before_payload,
            "original_dimensions": before_image["size"],
            "format": before_image["format"],
        }
        credentials = has_authenticity_credentials(before, before_meta)
        conflicts = has_conflicting_rights(before_meta)
        if credentials or conflicts:
            record.update({
                "status": "skipped_pending_provenance_review",
                "reason": "content_credentials" if credentials else "non_studio_credit",
                "fields": conflicts,
                "output_sha256": digest(before),
            })
            outcome.append(record)
            print("SKIP", relative, record["reason"], flush=True)
            continue

        command = [
            "exiftool", "-overwrite_original", "-P",
            f"-XMP-dc:Creator={OWNER}",
            f"-XMP-dc:Rights={RIGHTS}",
            f"-XMP-dc:Description={entry['description']}",
            f"-XMP-photoshop:Credit={STUDIO} (production and metadata)",
            f"-XMP-xmpRights:WebStatement={WEBSITE}",
            str(path),
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0 or "1 image files updated" not in result.stdout:
            raise RuntimeError(
                f"ExifTool failed for {relative}: {result.stdout} {result.stderr}"
            )

        after = path.read_bytes()
        after_image = identify_unchanged_image(path)
        after_payload = compressed_image_payload(after, relative.suffix.lower())
        after_meta = exiftool_metadata(path)
        if before_image != after_image or before_payload != after_payload:
            # The job aborts before any Git commit if this happens.
            path.write_bytes(before)
            raise RuntimeError(f"Image integrity mismatch, restored original: {relative}")
        required = {
            "XMP-dc:Creator": OWNER,
            "XMP-dc:Rights": RIGHTS,
            "XMP-dc:Description": entry["description"],
            "XMP-photoshop:Credit": STUDIO + " (production and metadata)",
            "XMP-xmpRights:WebStatement": WEBSITE,
        }
        missing = {
            k: {"expected": v, "actual": after_meta.get(k)}
            for k, v in required.items() if str(after_meta.get(k, "")) != v
        }
        if missing:
            path.write_bytes(before)
            raise RuntimeError(f"Metadata mismatch, restored original: {relative}: {missing}")
        if has_authenticity_credentials(after, after_meta):
            path.write_bytes(before)
            raise RuntimeError("Unexpected authenticity declaration after retrofit")
        record.update({
            "status": "verified_metadata_only",
            "output_sha256": digest(after),
            "pixel_and_alpha_unchanged": True,
            "compressed_image_unchanged": True,
            "color_profile_unchanged": True,
            "metadata": required,
        })
        outcome.append(record)
        print("VERIFIED", relative, flush=True)

    count = sum(row["status"] == "verified_metadata_only" for row in outcome)
    if count == 0:
        raise RuntimeError("No artwork passed the pilot checks; will not commit")
    report = {
        "pilot": "L&L Studio metadata-only verification",
        "branch_scope": "isolated GitHub review branch",
        "total": len(outcome),
        "verified": count,
        "skipped": len(outcome) - count,
        "files": outcome,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n",
                           encoding="utf-8")
    print(f"RESULT: {count} verified, {len(outcome) - count} skipped", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default="studio/pilot-manifest.json")
    parser.add_argument("--report", default="studio/pilot-results.json")
    args = parser.parse_args()
    run(ROOT / args.manifest, ROOT / args.report)
