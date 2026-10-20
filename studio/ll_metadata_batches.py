#!/usr/bin/env python3
"""Safely retrofit one unattended batch of public L&L-owned marketing images.

No client-supplied media, private masters, third-party icons, animations, or
unsupported formats. Original compressed image data must be byte-identical.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

from ll_metadata_pilot import (
    ROOT, OWNER, STUDIO, WEBSITE, RIGHTS, SUPPORTED,
    digest, identify_unchanged_image, compressed_image_payload,
    exiftool_metadata, has_authenticity_credentials, has_conflicting_rights,
)

FIELD_NAMES = {
    "XMP-dc:Creator": OWNER,
    "XMP-dc:Rights": RIGHTS,
    "XMP-photoshop:Credit": STUDIO + " (artwork production and preparation)",
    "XMP-xmpRights:WebStatement": WEBSITE,
}
SUPPORTED_TYPES = {".jpg": "JPEG", ".jpeg": "JPEG", ".webp": "WEBP", ".png": "PNG"}
DANGEROUS_RIGHTS_FIELDS = (
    "XMP-xmpRights:UsageTerms", "XMP-plus:LicensorName",
    "XMP-iptcExt:DigitalSourceType",
)


def full_description(relative_path: str) -> str:
    stem = Path(relative_path).stem.replace("-", " ").replace("_", " ")
    stem = " ".join(stem.split())
    return f"Lace & Leather Arcane public artwork: {stem}"[:180]


def metadata_matches(meta: dict, description: str) -> bool:
    required = dict(FIELD_NAMES)
    required["XMP-dc:Description"] = description
    for key, value in required.items():
        received = meta.get(key)
        if isinstance(received, list):
            received = ", ".join(str(v) for v in received)
        if str(received or "") != value:
            return False
    return True


def load_ledger(path: Path) -> dict:
    if not path.exists():
        return {"schema_version": 1, "studio": STUDIO, "records": {}}
    content = json.loads(path.read_text(encoding="utf-8"))
    if (content.get("schema_version") != 1 or content.get("studio") != STUDIO
            or not isinstance(content.get("records"), dict)):
        raise ValueError("Unexpected studio ledger schema")
    return content


def scan_candidates(policy: dict) -> list:
    prefixes = policy["allowlisted_public_paths"]
    if not isinstance(prefixes, list) or not prefixes:
        raise ValueError("No approved public source directories")
    paths = []
    seen = set()
    for pref in prefixes:
        if not pref.endswith("/") or pref.startswith("/") or ".." in Path(pref).parts:
            raise ValueError(f"Unsafe directory prefix: {pref!r}")
        directory = (ROOT / pref).resolve()
        if not directory.is_relative_to(ROOT):
            raise ValueError(f"Outside repo: {pref}")
        if not directory.is_dir():
            raise ValueError(f"Missing approved directory: {pref}")
        for candidate in sorted(directory.rglob("*")):
            if not candidate.is_file() or candidate.is_symlink():
                continue
            real = candidate.resolve()
            if not real.is_relative_to(ROOT):
                continue
            suffix = candidate.suffix.lower()
            if suffix not in SUPPORTED:
                continue
            rel = candidate.relative_to(ROOT).as_posix()
            if rel not in seen:
                seen.add(rel)
                paths.append(rel)
    return paths


def apply_one(path: Path, relative: str, expected_hash: str) -> dict:
    original = path.read_bytes()
    before_hash = digest(original)
    if expected_hash != before_hash:
        raise RuntimeError(f"Source changed during validation: {relative}")
    if len(original) > 15_000_000:
        return {
            "status": "review_required", "reason": "file_exceeds_batch_limit",
            "sha256": before_hash,
        }
    try:
        before_image = identify_unchanged_image(path)
        before_payload = compressed_image_payload(original, path.suffix.lower())
        before_meta = exiftool_metadata(path)
    except (ValueError, OSError, RuntimeError, subprocess.CalledProcessError) as exc:
        return {
            "status": "review_required", "reason": "unsupported_or_unreadable_image",
            "sha256": before_hash, "detail": type(exc).__name__,
        }

    if before_image["format"] != SUPPORTED_TYPES[path.suffix.lower()]:
        return {"status": "review_required", "reason": "file_extension_format_mismatch", "sha256": before_hash}
    if has_authenticity_credentials(original, before_meta):
        return {"status": "review_required", "reason": "existing_authenticity_credentials", "sha256": before_hash}
    conflicts = has_conflicting_rights(before_meta)
    if conflicts:
        return {"status": "review_required", "reason": "other_creator_or_rights", "sha256": before_hash, "conflicting_fields": conflicts}
    for field in DANGEROUS_RIGHTS_FIELDS:
        if before_meta.get(field):
            return {"status": "review_required", "reason": "license_or_provenance_needs_review", "sha256": before_hash, "field": field}

    description = full_description(relative)
    if metadata_matches(before_meta, description) or (
        OWNER.lower() in str(before_meta.get("XMP-dc:Creator", "")).lower()
        and STUDIO.lower() in str(before_meta.get("XMP-photoshop:Credit", "")).lower()
        and RIGHTS.lower() == str(before_meta.get("XMP-dc:Rights", "")).lower()
        and WEBSITE == str(before_meta.get("XMP-xmpRights:WebStatement", ""))
    ):
        return {
            "status": "already_credited", "sha256": before_hash,
            "pixel_sha256": before_image["pixel_sha256"],
        }

    command = [
        "exiftool", "-overwrite_original", "-P",
        f"-XMP-dc:Creator={OWNER}",
        f"-XMP-dc:Rights={RIGHTS}",
        f"-XMP-dc:Description={description}",
        f"-XMP-photoshop:Credit={FIELD_NAMES['XMP-photoshop:Credit']}",
        f"-XMP-xmpRights:WebStatement={WEBSITE}",
        str(path),
    ]
    try:
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0 or "1 image files updated" not in result.stdout:
            raise RuntimeError("Metadata writer refused or failed")
        updated = path.read_bytes()
        after_image = identify_unchanged_image(path)
        after_payload = compressed_image_payload(updated, path.suffix.lower())
        after_meta = exiftool_metadata(path)
        if before_image != after_image or before_payload != after_payload:
            raise RuntimeError("Pixel, alpha, color, frames, or original image payload changed")
        if has_authenticity_credentials(updated, after_meta):
            raise RuntimeError("Unexpected provenance marker after writing")
        if not metadata_matches(after_meta, description):
            raise RuntimeError("Studio metadata did not survive a readback check")
    except Exception:
        path.write_bytes(original)
        raise

    return {
        "status": "verified_metadata_only",
        "source_sha256": before_hash,
        "sha256": digest(updated),
        "pixel_sha256": before_image["pixel_sha256"],
        "original_image_payload_sha256": before_payload,
        "width": before_image["size"][0],
        "height": before_image["size"][1],
        "format": before_image["format"],
        "pixels_alpha_frames_profile_unchanged": True,
        "compressed_picture_data_unchanged": True,
        "studio_credit": FIELD_NAMES["XMP-photoshop:Credit"],
        "copyright": RIGHTS,
        "website": WEBSITE,
    }


def run(policy_file: Path, ledger_file: Path, summary_file: Path):
    policy = json.loads(policy_file.read_text(encoding="utf-8"))
    required = {
        "project": "Lace & Leather Arcane",
        "studio": STUDIO, "creator": OWNER, "rights": RIGHTS,
        "website": WEBSITE,
    }
    if any(policy.get(field) != value for field, value in required.items()):
        raise ValueError("Batch policy ownership fields are not approved")
    limit = policy.get("max_processed_per_run")
    if not isinstance(limit, int) or not 1 <= limit <= 12:
        raise ValueError("Invalid maximum batch size (1 through 12)")
    if policy.get("output_ledger") != ledger_file.relative_to(ROOT).as_posix():
        raise ValueError("Ledger location does not match approved policy")
    ledger = load_ledger(ledger_file)
    files = scan_candidates(policy)
    updated = []
    skipped = []
    already = 0
    new_reviews = 0
    for rel in files:
        path = ROOT / rel
        current_sha = hashlib.sha256(path.read_bytes()).hexdigest()
        prior = ledger["records"].get(rel)
        if prior and prior.get("sha256") == current_sha and prior.get("status") in {
            "verified_metadata_only", "already_credited", "review_required",
            "protected_provenance_preserved",
        }:
            continue
        if len(updated) >= limit:
            break
        result = apply_one(path, rel, current_sha)
        ledger["records"][rel] = result
        status = result["status"]
        if status == "verified_metadata_only":
            updated.append(rel)
        elif status == "already_credited":
            already += 1
        elif status == "review_required":
            skipped.append({"path": rel, "reason": result["reason"]})
            new_reviews += 1
        else:
            raise RuntimeError("Unexpected file result: " + status)
        print(f"{status}: {rel}", flush=True)

    # Deterministic ledger keeps old/new hashes and the exact result per file.
    ledger_file.parent.mkdir(parents=True, exist_ok=True)
    ledger_file.write_text(json.dumps(ledger, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
    remaining = sum(
        (not (r := ledger["records"].get(rel))
         or r.get("sha256") != digest((ROOT / rel).read_bytes()))
        for rel in files
    )
    report = {
        "schema_version": 1, "eligible_public_images": len(files),
        "retrofitted_this_run": len(updated),
        "updated_paths": updated,
        "already_credited_new_this_run": already,
        "held_for_rights_or_integrity_review_this_run": skipped,
        "previously_completed_or_held": len(files) - remaining - len(updated) - already - new_reviews,
        "remaining_unchecked": remaining,
        "requires_manual_review": sum(v.get("status") == "review_required" for v in ledger["records"].values()),
        "protected_provenance_preserved": sum(v.get("status") == "protected_provenance_preserved" for v in ledger["records"].values()),
        "auto_batches_complete": remaining == 0,
        "live_site_image_code_changed": False,
        "safety": "On batch failure nothing is committed. Original pixels, alpha, ICC, frames and compressed picture data required to match.",
    }
    # Only add changing batch summaries to the Git commit alongside edits.
    summary_file.parent.mkdir(parents=True, exist_ok=True)
    summary_file.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--policy", default="studio/batch-policy.json")
    parser.add_argument("--ledger", default="studio/batch-ledger.json")
    parser.add_argument("--summary", default="studio/batch-last-result.json")
    args = parser.parse_args()
    run(ROOT / args.policy, ROOT / args.ledger, ROOT / args.summary)
