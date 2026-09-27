# Lace & Leather

Static storefront for laceleatherarcane.com, hosted from GitHub.

## Architecture

- Plain HTML, CSS, and JavaScript with no framework or build step.
- Shared visual system in `styles.css`.
- Product previews and store interactions use page-level JavaScript.
- Cart state is stored locally under `ll_*` localStorage keys.
- `pay.html` handles checkout/order logging.
- Payhip and Etsy remain external sales/delivery channels.

## Primary pages

`index.html` is the storefront; `buttons.html` is the button/sticker catalog; the parchment, mapmaker, grimoire, and smithy HTML files are product pages; `use-case.html` contains creator examples; `pay.html` is checkout; and `refunds.html` contains the refund policy.

## Assets

`assets/` contains site imagery and product previews. `buttons-stickers/`, `L&L-buttons/`, `commission-modal-assets/`, `project-btns/`, and `use-case/` contain their corresponding visual assets. Local display fonts live in `fonts/`.

## Maintenance

- Keep public URLs aligned with `sitemap.xml`.
- Keep structured-data prices aligned with displayed prices.
- Treat browser cart values as UI state, not authoritative payment records.
- Use DOM `textContent` for browser-stored or user-controlled values.
- Preserve original high-resolution product files; optimize web-facing display assets separately.
- The custom domain is defined in `CNAME`.
