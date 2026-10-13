# Lace & Leather WebP Audit — 2026-10-13

This pass creates WebP siblings and rewrites site references on the audit branch.
Original PNG files are intentionally retained for rollback/visual QA.

- Converted assets: **124**
- PNG source bytes: **240,694,176**
- WebP bytes: **94,938,468**
- Estimated savings: **145,755,708 bytes (60.6%)**

## Intentional PNG compatibility exceptions

- favicon.png
- icon-192.png
- icon-512.png

These are retained as PNG for broad favicon/PWA compatibility and should be resized/optimized separately rather than blindly converted.

## Largest source assets

- `assets/l&l_logo.png` — 1600×1600, 3.96 MB → 2.43 MB (38.7% saved)
- `assets/mapmaker/map_8.png` — 1024×1536, 3.58 MB → 0.62 MB (82.6% saved)
- `assets/mapmaker/map_9.png` — 1024×1536, 3.40 MB → 0.61 MB (82.0% saved)
- `assets/mapmaker/map_6.png` — 1024×1536, 3.38 MB → 0.62 MB (81.6% saved)
- `buttons-stickers/skull-bronze-plate.png` — 1536×1024, 3.36 MB → 1.79 MB (46.8% saved)
- `assets/mapmaker/map_4.png` — 1024×1536, 3.36 MB → 0.59 MB (82.3% saved)
- `assets/mapmaker/map_12.png` — 1024×1536, 3.30 MB → 0.60 MB (81.9% saved)
- `assets/mapmaker/map_3.png` — 1024×1536, 3.30 MB → 0.59 MB (82.1% saved)
- `assets/mapmaker/map_10.png` — 1024×1536, 3.29 MB → 0.57 MB (82.6% saved)
- `assets/mapmaker/map_7.png` — 1024×1536, 3.28 MB → 0.57 MB (82.5% saved)
- `assets/mapmaker/map_5.png` — 1024×1536, 3.25 MB → 0.55 MB (82.9% saved)
- `buttons-stickers/ruby-plate.png` — 1536×1024, 3.20 MB → 1.65 MB (48.6% saved)
- `assets/social-icons/payhip-icon.PNG` — 1536×1024, 3.20 MB → 1.29 MB (59.7% saved)
- `buttons-stickers/bronze-x-sheild.png` — 1536×1024, 3.17 MB → 1.34 MB (57.8% saved)
- `buttons-stickers/stag-red-wax.png` — 1536×1024, 3.12 MB → 1.48 MB (52.7% saved)
- `buttons-stickers/grn-wax-book.png` — 1024×1536, 3.11 MB → 1.28 MB (58.8% saved)
- `buttons-stickers/red-stag.png` — 1024×1536, 3.11 MB → 1.46 MB (53.1% saved)
- `assets/social-icons/pinterest-icon.PNG` — 1536×1024, 3.09 MB → 1.28 MB (58.5% saved)
- `buttons-stickers/skull-plate.png` — 1536×1024, 3.09 MB → 1.43 MB (53.7% saved)
- `assets/social-icons/etsy-icon.PNG` — 1536×1024, 3.04 MB → 1.02 MB (66.4% saved)
- `assets/mapmaker/map_13.png` — 1024×1536, 3.03 MB → 0.46 MB (84.9% saved)
- `buttons-stickers/stag-plate.png` — 1536×1024, 3.02 MB → 1.33 MB (56.0% saved)
- `buttons-stickers/lantern.png` — 1536×1024, 3.00 MB → 1.25 MB (58.4% saved)
- `assets/social-icons/instagram-icon.PNG` — 1536×1024, 2.98 MB → 1.11 MB (62.8% saved)
- `buttons-stickers/red-parch-arrow.png` — 1536×1024, 2.96 MB → 1.39 MB (53.2% saved)
