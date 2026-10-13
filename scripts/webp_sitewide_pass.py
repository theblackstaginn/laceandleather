#!/usr/bin/env python3
from pathlib import Path
from PIL import Image
import csv
import re

ROOT = Path(__file__).resolve().parents[1]
SKIP = {
    "favicon.png",
    "icon-192.png",
    "icon-512.png",
}
TEXT_EXTS = {".html", ".css", ".js", ".json", ".xml", ".md"}

rows = []
converted = []

for path in sorted(ROOT.rglob("*")):
    if not path.is_file():
        continue
    if path.name.lower() in SKIP:
        continue
    if path.suffix.lower() != ".png":
        continue
    if ".git" in path.parts:
        continue

    rel = path.relative_to(ROOT)
    out = path.with_suffix(".webp")
    before = path.stat().st_size

    with Image.open(path) as im:
        width, height = im.size
        mode = im.mode
        has_alpha = "A" in mode or "transparency" in im.info

        if has_alpha:
            im.save(out, "WEBP", lossless=True, method=6)
            strategy = "lossless-alpha"
        else:
            if im.mode not in ("RGB", "L"):
                im = im.convert("RGB")
            im.save(out, "WEBP", quality=88, method=6)
            strategy = "quality-88"

    after = out.stat().st_size
    savings = before - after
    pct = (savings / before * 100) if before else 0
    rows.append({
        "path": rel.as_posix(),
        "width": width,
        "height": height,
        "mode": mode,
        "strategy": strategy,
        "png_bytes": before,
        "webp_bytes": after,
        "saved_bytes": savings,
        "saved_pct": round(pct, 1),
    })
    converted.append(rel)

# Update textual references only for files actually converted.
for text_path in ROOT.rglob("*"):
    if not text_path.is_file() or text_path.suffix.lower() not in TEXT_EXTS:
        continue
    if ".git" in text_path.parts:
        continue
    try:
        original = text_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue

    updated = original
    for rel in converted:
        stem = rel.stem
        # Replace filename references case-insensitively (covers .png and .PNG).
        updated = re.sub(
            rf"(?i)(?<![A-Za-z0-9_.-]){re.escape(stem)}\.png(?![A-Za-z0-9_.-])",
            f"{stem}.webp",
            updated,
        )

    if updated != original:
        text_path.write_text(updated, encoding="utf-8")

csv_path = ROOT / "WEBP_AUDIT_2026-10-13.csv"
with csv_path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "path", "width", "height", "mode", "strategy",
        "png_bytes", "webp_bytes", "saved_bytes", "saved_pct"
    ])
    writer.writeheader()
    writer.writerows(rows)

total_png = sum(r["png_bytes"] for r in rows)
total_webp = sum(r["webp_bytes"] for r in rows)
total_saved = total_png - total_webp
total_pct = (total_saved / total_png * 100) if total_png else 0

md = [
    "# Lace & Leather WebP Audit — 2026-10-13",
    "",
    "This pass creates WebP siblings and rewrites site references on the audit branch.",
    "Original PNG files are intentionally retained for rollback/visual QA.",
    "",
    f"- Converted assets: **{len(rows)}**",
    f"- PNG source bytes: **{total_png:,}**",
    f"- WebP bytes: **{total_webp:,}**",
    f"- Estimated savings: **{total_saved:,} bytes ({total_pct:.1f}%)**",
    "",
    "## Intentional PNG compatibility exceptions",
    "",
    "- favicon.png",
    "- icon-192.png",
    "- icon-512.png",
    "",
    "These are retained as PNG for broad favicon/PWA compatibility and should be resized/optimized separately rather than blindly converted.",
    "",
    "## Largest source assets",
    "",
]
for r in sorted(rows, key=lambda x: x["png_bytes"], reverse=True)[:25]:
    md.append(
        f"- `{r['path']}` — {r['width']}×{r['height']}, "
        f"{r['png_bytes'] / 1024 / 1024:.2f} MB → "
        f"{r['webp_bytes'] / 1024 / 1024:.2f} MB ({r['saved_pct']}% saved)"
    )

(ROOT / "WEBP_AUDIT_2026-10-13.md").write_text("\n".join(md) + "\n", encoding="utf-8")
print(f"Converted {len(rows)} PNG assets to WebP siblings.")
print(f"Estimated byte savings: {total_saved:,} ({total_pct:.1f}%).")
