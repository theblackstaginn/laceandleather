from PIL import Image, ImageFilter
import numpy as np, os, zipfile, hashlib, json

SRC = "assets/vol-one"
OUT = "vol1-hires"
MASTER = os.path.join(OUT, "masters")
os.makedirs(MASTER, exist_ok=True)

KEEP = list(range(1, 11))
TARGET = (3600, 5400)

manifest = []
for idx, src_num in enumerate(KEEP, start=1):
    src_path = os.path.join(SRC, f"parchment-light_{src_num}.jpg")
    im = Image.open(src_path).convert("RGB")
    arr = np.asarray(im)
    mask = np.min(arr, axis=2) < 245
    ys, xs = np.where(mask)
    if len(xs) == 0:
        crop = im
        bbox = [0, 0, im.width, im.height]
    else:
        left, right = int(xs.min()), int(xs.max()) + 1
        top, bottom = int(ys.min()), int(ys.max()) + 1
        bbox = [left, top, right, bottom]
        crop = im.crop((left, top, right, bottom))

    target_ratio = TARGET[0] / TARGET[1]
    ratio = crop.width / crop.height
    if ratio > target_ratio:
        new_w = round(crop.height * target_ratio)
        x0 = (crop.width - new_w) // 2
        crop = crop.crop((x0, 0, x0 + new_w, crop.height))
    elif ratio < target_ratio:
        new_h = round(crop.width / target_ratio)
        y0 = max(0, (crop.height - new_h) // 2)
        crop = crop.crop((0, y0, crop.width, y0 + new_h))

    hi = crop.resize(TARGET, Image.Resampling.LANCZOS)
    hi = hi.filter(ImageFilter.UnsharpMask(radius=1.15, percent=55, threshold=2))

    # Add extremely restrained monochrome micro-grain so the upscale does not look plasticky.
    a = np.asarray(hi).astype(np.int16)
    rng = np.random.default_rng(1000 + src_num)
    grain = rng.normal(0, 0.9, (TARGET[1], TARGET[0], 1))
    a = np.clip(a + grain, 0, 255).astype(np.uint8)
    hi = Image.fromarray(a, "RGB")

    out_name = f"Parchment_Light_Vol_1_{idx:02d}.jpg"
    out_path = os.path.join(MASTER, out_name)
    hi.save(out_path, "JPEG", quality=93, optimize=True, progressive=True, dpi=(300,300))
    manifest.append({
        "output": out_name,
        "source": os.path.basename(src_path),
        "source_crop_bbox": bbox,
        "width": TARGET[0],
        "height": TARGET[1],
        "dpi": 300,
        "sha256": hashlib.sha256(open(out_path, "rb").read()).hexdigest(),
        "bytes": os.path.getsize(out_path),
    })

# Contact sheet for visual QA.
thumb_w, thumb_h = 360, 540
sheet = Image.new("RGB", (thumb_w * 5, thumb_h * 2), "white")
for i, item in enumerate(manifest):
    im = Image.open(os.path.join(MASTER, item["output"])).convert("RGB")
    im.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
    x = (i % 5) * thumb_w
    y = (i // 5) * thumb_h
    sheet.paste(im, (x, y))
sheet.save(os.path.join(OUT, "Parchment_Light_Vol_1_contact_sheet.jpg"), "JPEG", quality=88)

# Full master archive.
full_zip = os.path.join(OUT, "Parchment_Light_Vol_1_High_Res_Master.zip")
with zipfile.ZipFile(full_zip, "w", compression=zipfile.ZIP_STORED) as z:
    for item in manifest:
        z.write(os.path.join(MASTER, item["output"]), item["output"])

# Etsy-safe split archives, capped around 18 MiB because JPEGs are already compressed.
parts = []
limit = 18 * 1024 * 1024
current = []
current_bytes = 0
for item in manifest:
    size = item["bytes"]
    if current and current_bytes + size > limit:
        parts.append(current)
        current = []
        current_bytes = 0
    current.append(item)
    current_bytes += size
if current:
    parts.append(current)

for pnum, group in enumerate(parts, start=1):
    path = os.path.join(OUT, f"Parchment_Light_Vol_1_High_Res_Part_{pnum}_of_{len(parts)}.zip")
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_STORED) as z:
        for item in group:
            z.write(os.path.join(MASTER, item["output"]), item["output"])

with open(os.path.join(OUT, "manifest.json"), "w") as f:
    json.dump({"kept_sources": KEEP, "removed_duplicate": 11, "removed_weakest_fit": 12, "textures": manifest}, f, indent=2)

print(json.dumps({
    "texture_count": len(manifest),
    "parts": len(parts),
    "part_sizes": [os.path.getsize(os.path.join(OUT, f"Parchment_Light_Vol_1_High_Res_Part_{i}_of_{len(parts)}.zip")) for i in range(1,len(parts)+1)],
    "master_size": os.path.getsize(full_zip),
}, indent=2))
