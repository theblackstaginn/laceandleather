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
