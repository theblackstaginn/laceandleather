# L&L Studio asset standard (pilot v1)

**Status:** pilot. Applies only to the explicitly selected L&L public-marketing artwork below. It does not authorize modifications to paid masters, customer uploads, fonts, client-owned photography, external licenses, animations, or other projects.

## Roles, rights, and provenance

- Production / processing studio: **Lace & Leather Arcane Studio**
- Studio URL: https://laceleatherarcane.com
- Creator: the verified individual or studio responsible for the artwork. For the first pilot, selected images are L&L's own published marketing previews.
- Copyright: keep the existing rights holder unless ownership is verified. Never claim client-owned or licensed art as L&L-owned.
- Do not invent cameras, software histories, human authorship, or absence of generative assistance.
- Retain any authentic Content Credentials / C2PA and other trustworthy source provenance; stop and review rather than deleting them.
- Keep the original Git blob in history and a checksum in the audit. Do **not** publicly publish a backup of any confidential original.


## Client rights and L&L Studio credit matrix

| Asset origin | Credited original creator | Copyright / usage rights | L&L Studio credit |
|---|---|---|---|
| L&L's own artwork | Verified L&L creator | Lace & Leather Arcane, if verified | Artwork creation, preparation and export |
| Artwork commissioned by a client from L&L | L&L Studio or verified artist, as appropriate | Client ownership only to the extent provided by the signed agreement; record agreement | Artwork creation and production |
| Client-provided photo, logo or illustration | **Original artist / photographer** where known | Original owner, and the client's documented license or ownership | **Image editing, preparation and optimization only** |
| Third-party stock, licensed or commissioned material supplied to us | Original creator/rights holder | Actual licensed rights and restrictions | **Image editing and preparation only**, when authorized |

**Never credit L&L as the original creator or copyright holder merely because we resized, edited, retouched, optimized or exported a client-supplied image.** Do not erase the photographer's original author/copyright/license metadata. For an image lacking proof of rights or editing permission, do not rewrite its authorship or copyright; hold it for review.

### Metadata schema and role tags

- `asset_id`, source repository/file path, SHA-256, project/client, rights basis and rights holder: maintained in the private or appropriate-visibility studio ledger.
- Creator/copyright/XMP `dc:creator` and `dc:rights`: **verified original creator and appropriate rights holder**, never automatically L&L.
- Studio production credit for L&L-owned art: XMP `photoshop:Credit` = `Lace & Leather Arcane Studio (artwork production and preparation)`.
- Client-provided materials: XMP `photoshop:Credit` = `Lace & Leather Arcane Studio (image editing and preparation)`, only when allowed by the asset's license and the client's terms.
- Client-commissioned work with agreed client ownership: use the agreed rights holder; retain the actual artist creator credit and credit L&L Studio for production.
- Never invent a license, transfer of rights, model release, source-camera history, or AI-free provenance.
- Prefer a studio ledger over overriding EXIF/XMP tags when a format or licensing restriction prevents trustworthy embedded metadata.

## Safe-retrofit process

1. Inventory the precise repository path, SHA, product, format, rights status, and current provenance.
2. Only process an explicitly allowlisted marketing image with verified ownership. Refuse paths outside the repository or unexpected formats.
3. Write truthful XMP creator, copyright, studio-credit, description, and link fields via ExifTool. **Don't decode and re-encode the art** just to add metadata.
4. Verify decoded RGBA pixels, dimensions, alpha, frame count, color profile, and encoded image payload are identical. Inspect resulting metadata and reject mismatches.
5. Record old/new cryptographic fingerprints plus test status in the pilot audit. If any image fails, abort the entire commit.
6. Commit to an isolated branch. Review the diff and verification report before merging to main.
7. After merge, re-fetch main and confirm the browser-facing URLs still resolve. Allow image-CDN and social platforms to transform files independently; their delivered metadata must be checked separately.

## Asset types to hold for later

- Animated WebP / APNG / GIF and videos (motion and frame/timing preservation).
- SVG artwork (text/XML signing, namespaces, and script safety).
- Font binaries (copyright and licensing must be preserved).
- Client-site images and brand marks until license and ownership are recorded.
- Etsy products' paid downloadable masters, private drafts, and embedded authentication / credential records.

## Scope of this pilot

Selected **public marketing previews only**: a Grimoire PNG thumbnail, three small product-sample WebPs, and two Etsy-listing JPEG heroes. No file paths on the live branch are altered by the pilot until the review branch is merged. The script produces `studio/pilot-results.json` as a record of the verified outcome.

The result proves metadata-retrofit safety for the tested files only, not every format or every image across all projects.
