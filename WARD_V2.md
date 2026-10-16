# Lace & Leather | Ward v2 security boundary

Ward v2 separates **public previews** from **paid master artwork**.

## What Ward v2 does
- Prevents ordinary image drag-and-drop, context-menu saving, and browser long-press image menus where supported.
- Shows a subtle, non-interactive "L&L · PREVIEW" overlay on key artwork surfaces.
- Covers dynamically added gallery tiles, including modal content.
- Preserves clickable gallery controls, accessibility, modal navigation, checkout, Stripe, and fulfillment.

## What Ward v2 cannot do
- Protect a publicly hosted source image, archive, or anything in Git history.
- Stop screenshots, network inspection, browser developer tools, or deliberate circumvention.
- Turn a GitHub Pages folder into private storage.

## Required for real protection (next deployment step)
1. Keep full-resolution masters, downloadable ZIPs and transparent commercial originals exclusively in private storage. The existing Drive product map already holds private delivery packages.
2. Generate intentionally reduced-resolution, flattened, visually watermarked previews from those originals, then replace every public product-art reference with its preview derivative.
3. Remove publicly committed paid originals including \`downloads/*.zip\`, \`assets/smithy-hires/masters/*\`, sale-quality textures and sale-ready transparent sticker sources **after** checking every preview URL and backing up originals.
4. Review Git history and caching separately. Removing a file from \`main\` does not erase it from earlier commits; rehosting the cleaned public site in a new history may be necessary for stronger revocation.
5. Do not modify the deployed Railway Stripe webhook, checkout, Google Sheets order bridge or email delivery when migrating presentation assets.

This PR contains the UI Ward layer only. The original artwork migration must be completed before anyone claims the artwork has been secured.

## QA
- On mobile and desktop: browse homepage packs, open/close enlarged previews, add stickers to cart, open commissioned maps, navigate product-detail galleries, use keyboard navigation.
- Inspect image URLs: product previews must resolve to reduced flattened and baked-watermark versions, **not** master originals.
- Confirm no /downloads archive URLs or full-resolution paid artwork can be served from public hosting.
- Review an authenticated test order's email/file delivery without initiating unnecessary real charges.


## Legacy workflow security hold
The draft PR also disables seven public GitHub Actions jobs pending relocation:
- Three high-resolution Smithy master builders.
- Two Smithy paid-ZIP packaging jobs.
- The customer-ready delivery-package build that published public GitHub Actions artifacts.
- The broad WebP conversion job that could recommit source assets.

These are **asset generation/publishing** jobs, not live customer Stripe payment, Google Sheets order confirmation, or Resend fulfillment. These workflows should be rebuilt with PRIVATE source and output storage before enabling them. Public GitHub Actions artifacts should not store customer-ready digital goods.


## Smithy preview migration (staged on this branch)
- The one-time \`scripts/build_ward_previews.py --pack smithy\` build has produced **12 baked-watermark, flattened WebP previews**, each <=1500px on its long edge. All 12 are listed with dimensions, byte count and checksum in \`assets/previews/smithy/preview-manifest.json\`.
- Both \`index.html\` pack previews and \`smithy-textures.html\` detail gallery now load \`assets/previews/smithy/smithy-XX-preview.webp\`. The website does NOT request original Smithy source images in those galleries.
- This draft removes the old public sale-quality \`assets/smithy/smithy-N.png\`, \`assets/smithy/smithy-N.webp\`, and \`assets/smithy-hires/site/smithy-N.jpg\` files (36 total) as well as 12 high-resolution masters and six ZIPs.
- Marketing cover assets are intentionally preserved to avoid broken site listings. Their public status must still be reviewed as preview collateral.
- **Important**: The working private Drive \`smithy.zip\` delivery package is separate, and was not changed. Public-history purge and broader product-art migration remain prerequisites for claiming full protection.


## Remaining product collection migration (2026-10-16)
- All 67 remaining art previews were generated as reduced flattened baked-watermark WebP files: 12 Grimoire, 10 Mapmaker, 12 Vol One, 33 buttons/stickers.
- Homepage collection galleries, buttons/stickers catalog JSON-LD and clickable thumbnails, six map journal pages, and corresponding Flipboard RSS enclosures use preview URLs rather than clean product artwork.
- The public working tree stages removal of 24 Grimoire raster sources, 20 Mapmaker sources, 12 Vol One sources, and 66 button/sticker source images (122 files). Including the earlier 54 Smithy files, 176 public product-source files have been staged for removal.
- Product Map references have private owner-only Google Drive delivery ZIPs for all 31 sold button designs and all four texture packs. The remaining two not-listed sticker designs (blue-naut-wax and bronze-x-sheild) were preserved in an owner-only Drive ZIP of four exact original PNG/WebP files; archive integrity and owner-only access were checked separately.
- Additional outdated Itch publication and Vol One master-building jobs were placed on security hold because their source images are being removed. The one-off preview-building and unlisted-sticker-backup jobs are also disabled after successful completion.
- Expanded Chromium tests covered all four texture galleries, sticker cart, map journal hero, RSS media references, and modal behavior on desktop and mobile. All checks passed in the build log; inspect captured screenshots prior to release.

**RELEASE BLOCKER:** The public GitHub repository retains all older commit history, including historic paid artwork. A new clean-history presentation-only hosting repository or carefully planned history rewrite and cache assessment is required before claiming that previously exposed originals are no longer available. The current PR does not solve historical exposure.
