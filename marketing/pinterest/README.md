# Lace & Leather Arcane | Pinterest Export Pipeline

These files are **marketing previews**, not customer download masters. The input
images are public, already displayed on the shop's active Etsy listings.

## Ownership and privacy

- Creator / Artist: **Lace & Leather Arcane**
- Copyright: **Copyright 2026 Lace & Leather Arcane**
- Website: **https://laceleatherarcane.com**
- Destination for Pins: **https://www.etsy.com/shop/laceLeatherArcane**
- Source manifest: [pin-plan.json](pin-plan.json), containing scheduled post UUID,
  title, active Etsy listing ID, and an exact public preview URL.

The script `../../scripts/build_pinterest_exports.py` creates a freshly encoded
JPEG for each queued Pin and writes accurate derivative-image metadata. EXIF from
the original public preview is not copied, including potentially private device
and location details. Source files with detected authenticity credentials are
**not silently stripped**; the script stops for review instead. We don't claim
the preview was made without AI or falsify source provenance.

The resulting images may still be classified by Pinterest according to its own
rules. **No export setting guarantees removal of Pinterest's AI label.**

## Generated files

- `exports/pin-<sanitized Metricool UUID>.jpg` (one per Pin)
- `exports/metadata-audit.json` (source, checksum, dimensions, attribution)
- GitHub Actions workflow: `.github/workflows/build-pinterest-exports.yml`

The exports are intentionally publicly accessible after GitHub Actions commits
them, so Metricool can download the exact final files. Do not add paid download
masters, raw customer files, API credentials, or unwatermarked private originals
to this directory.

## Running / reviewing

1. Update the manifest only when the queue or public Etsy preview sources change.
2. GitHub Actions rebuilds the 57 public previews and checks artist, copyright,
   website, shop link, and absence of unapproved EXIF tags.
3. Inspect images plus the audit before changing scheduled Pinterest posts.
4. When approved, edit posts **in place**, preserving their time, board, and
   shop destination. Updating Metricool does not happen in this workflow.

Do not automate re-posting or Etsy product changes from this pipeline.
