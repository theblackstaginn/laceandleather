#!/usr/bin/env python3
from __future__ import annotations

import functools
import json
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "preview-modal-qa"
OUT.mkdir(exist_ok=True)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


def check(condition, message, failures):
    if not condition:
        failures.append(message)


def modal_signature(page, selector):
    return page.locator(selector + " .modal-panel").evaluate("""el => {
      const s = getComputedStyle(el);
      return {
        width: Math.round(el.getBoundingClientRect().width),
        radius: s.borderRadius,
        maxHeight: s.maxHeight,
        position: s.position
      };
    }""")


def wait_img(page, selector):
    page.wait_for_function(
        """sel => {
          const img = document.querySelector(sel);
          return Boolean(img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
        }""",
        arg=selector,
        timeout=15000,
    )


def verify_shared_modal(page, selector, failures, prefix):
    root = page.locator(selector)
    check(root.count() == 1, f"{prefix}: modal missing", failures)
    if not root.count():
        return
    check(root.evaluate("e => e.classList.contains('preview-modal')"),
          f"{prefix}: preview-modal class missing", failures)
    check(root.locator(".glass.modal-panel").count() == 1,
          f"{prefix}: shared glass panel missing", failures)
    check(root.locator(".modal-head").count() == 1,
          f"{prefix}: shared modal head missing", failures)
    check(root.locator(".modal-body").count() == 1,
          f"{prefix}: shared modal body missing", failures)
    check(root.locator("button.wax-btn[data-close]").count() >= 1,
          f"{prefix}: wax close control missing", failures)


def run_device(device, browser, base, failures, results):
    mobile = device == "mobile"
    context = browser.new_context(
        viewport={"width": 390, "height": 844} if mobile else {"width": 1440, "height": 900},
        is_mobile=mobile,
        has_touch=mobile,
        device_scale_factor=1,
    )
    page = context.new_page()
    js_errors = []
    http_errors = []
    page.on("pageerror", lambda exc: js_errors.append(str(exc)))
    page.on("response", lambda r: http_errors.append(f"{r.status} {r.url}")
            if r.status >= 400 and r.url.startswith(base) else None)

    page.goto(base + "/index.html", wait_until="domcontentloaded", timeout=30000)
    page.locator('button.pack[data-pack="smithy"]').wait_for(timeout=15000)

    for selector, label in (
        ("#packModal", "homepage pack"),
        ("#mapModal", "homepage map"),
        ("#useCaseModal", "homepage use-case"),
    ):
        verify_shared_modal(page, selector, failures, f"{device} {label}")

    homepage_packs = (
        ("grimoire", 12),
        ("grimoirejournal", 8),
        ("mapmaker", 10),
        ("volone", 10),
        ("voltwo", 8),
        ("illuminated", 14),
        ("antiquarian", 20),
        ("smithy", 12),
    )

    baseline = None
    for pack, total in homepage_packs:
        page.locator(f'button.pack[data-pack="{pack}"]').click()
        page.locator("#packModal.open").wait_for(timeout=8000)
        signature = modal_signature(page, "#packModal")
        if baseline is None:
            baseline = signature
        else:
            check(signature == baseline,
                  f"{device} {pack}: homepage preview shell differs", failures)

        tiles = page.locator("#packCollage .tile")
        check(tiles.count() == total,
              f"{device} {pack}: expected {total} homepage previews, got {tiles.count()}", failures)
        sources = tiles.locator(".tile-face").evaluate_all(
            """els => els.map(el => {
              const value = el.style.backgroundImage || "";
              const match = value.match(/url\\(["']?(.*?)["']?\\)/);
              return match ? match[1] : "";
            })""")
        check(len(sources) == total and all(
            f"assets/previews/{pack}/" in src for src in sources),
            f"{device} {pack}: homepage modal contains an unprotected source", failures)
        if pack == "antiquarian":
            # CSS backgrounds can fail silently or remain blank with HTTP 200.
            # Decode every public preview, including tiles initially off screen.
            decoded = page.evaluate("""async urls => Promise.all(urls.map(async src => {
              const image = new Image();
              image.src = src;
              try {
                await image.decode();
                return {src, ok: true, width: image.naturalWidth, height: image.naturalHeight};
              } catch {
                return {src, ok: false, width: 0, height: 0};
              }
            }))""", sources)
            check(len(decoded) == 20 and all(
                result["ok"] and result["width"] == 600 and result["height"] == 900
                and result["src"].endswith(".jpg") for result in decoded),
                f"{device} antiquarian: a public preview failed decoding or has the wrong dimensions", failures)

        page.keyboard.press("Escape")
        check(page.locator("#packModal.open").count() == 0,
              f"{device} {pack}: Escape failed to close homepage pack modal", failures)

    page.locator('button.pack[data-pack="smithy"]').click()
    page.locator("#packModal.open").wait_for(timeout=8000)
    page.locator("#packCollage .tile").first.click()
    page.locator("#packModal.mode-viewer").wait_for(timeout=8000)
    check(page.locator("#packViewer").evaluate(
        "e => getComputedStyle(e, '::after').pointerEvents === 'auto'"),
        f"{device}: homepage pack viewer glass shield missing", failures)
    page.screenshot(path=str(OUT / f"{device}-home-pack.png"))
    page.keyboard.press("Escape")
    check(page.locator("#packModal.open").count() == 0,
          f"{device}: Escape failed to close homepage pack modal", failures)

    page.locator(".map-card[data-map='suneen']").click()
    page.locator("#mapModal.open").wait_for(timeout=8000)
    check(modal_signature(page, "#mapModal") == baseline,
          f"{device}: map preview shell differs from pack preview shell", failures)
    page.keyboard.press("Escape")
    check(page.locator("#mapModal.open").count() == 0,
          f"{device}: Escape failed to close map modal", failures)

    # The standalone gallery and its six-image popup were merged into the
    # homepage's "Made for What You Create" section. Test the actual buyer flow.
    gallery_entry = page.locator('a.ll-home-btn.ll-usecase[href="#process"]')
    check(gallery_entry.count() == 1,
          f"{device}: homepage gallery anchor missing", failures)
    gallery_entry.click()
    check(page.url.endswith("/index.html#process"),
          f"{device}: gallery link did not scroll to the unified section", failures)

    gallery = page.locator("#process .uc-grid")
    check(gallery.count() == 1,
          f"{device}: unified gallery grid missing", failures)
    check(gallery.locator(".uc-card").count() == 8,
          f"{device}: unified gallery must show eight approved examples", failures)
    check(gallery.locator(".uc-product-link").count() == 8,
          f"{device}: unified gallery must have eight product links", failures)
    check(page.locator(".creation-grid").count() == 0,
          f"{device}: old illustrative homepage grid remains", failures)
    check(page.locator("#useCaseModal .usecase-grid").count() == 0,
          f"{device}: old six-image popup remains", failures)
    check(page.locator("#meet-the-maker").count() == 1,
          f"{device}: Meet the Maker should not be duplicated", failures)

    gallery.locator("button.uc-btn[data-uc]").first.click()
    page.locator("#useCaseModal.open").wait_for(timeout=8000)
    check(modal_signature(page, "#useCaseModal") == baseline,
          f"{device}: unified gallery viewer differs from shared preview shell", failures)
    check("il_fullxfull" in page.locator("#ucViewerImg").evaluate("e => e.style.backgroundImage"),
          f"{device}: gallery viewer did not load the approved full-size artwork", failures)
    page.screenshot(path=str(OUT / f"{device}-unified-use-case.png"))
    page.locator("#useCaseModal .modal-backdrop").click(position={"x": 5, "y": 5})
    check(page.locator("#useCaseModal.open").count() == 0,
          f"{device}: backdrop failed to close unified gallery viewer", failures)

    # Old bookmarks still land on the correct individual image on the homepage.
    page.goto(base + "/use-case.html#light-parchment",
              wait_until="domcontentloaded", timeout=30000)
    page.wait_for_url("**/#light-parchment", timeout=8000)
    check(page.locator("#process .uc-card").count() == 8,
          f"{device}: legacy use-case URL failed to reach homepage gallery", failures)
    page.locator('button.uc-btn[data-uc="light-parchment"]').click()
    page.locator("#useCaseModal.open").wait_for(timeout=8000)
    check(modal_signature(page, "#useCaseModal") == baseline,
          f"{device}: redirected gallery viewer differs from shared preview shell", failures)
    page.keyboard.press("Escape")
    check(page.locator("#useCaseModal.open").count() == 0,
          f"{device}: Escape failed to close redirected gallery viewer", failures)

    # Every customer-facing pack gallery must use local, reduced,
    # baked-watermark previews. Marketplace/mockup images are not allowed here.
    packs = (
        ("smithy", "smithy-textures.html", 12),
        ("grimoire", "grimoire-pages.html", 12),
        ("grimoirejournal", "grimoire-journal-pages.html", 8),
        ("mapmaker", "mapmaker-sheets.html", 10),
        ("volone", "light-aged-parchment-vol-1.html", 10),
        ("voltwo", "parchment-light-vol-2.html", 8),
        ("illuminated", "illuminated-manuscripts-vol-1.html", 14),
        ("antiquarian", "antiquarians-cabinet.html", 20),
    )
    detail_signatures = []

    for pack, route, total in packs:
        page.goto(base + "/" + route, wait_until="domcontentloaded", timeout=30000)
        gallery = page.locator("#product-previews")
        gallery.wait_for(state="visible", timeout=15000)
        tiles = gallery.locator(".detail-preview-tile")
        check(tiles.count() == total,
              f"{device} {pack}: expected {total} preview tiles, got {tiles.count()}", failures)

        sources = gallery.locator(".detail-preview-art img").evaluate_all(
            "(els) => els.map(img => img.getAttribute('src'))")
        check(len(sources) == total and all(f"assets/previews/{pack}/" in src for src in sources),
              f"{device} {pack}: gallery contains an unprotected source", failures)

        first_art = gallery.locator(".detail-preview-art").first
        box = first_art.bounding_box()
        if box:
            ratio = box["width"] / box["height"]
            check(0.62 <= ratio <= 0.70,
                  f"{device} {pack}: preview tile is not portrait 2:3 ({ratio:.3f})", failures)

        if pack == "smithy":
            natural = gallery.locator(".detail-preview-art img").first.evaluate(
                "img => [img.naturalWidth, img.naturalHeight]")
            check(natural[1] > natural[0],
                  f"{device}: Smithy source itself is not portrait ({natural})", failures)
            page.screenshot(path=str(OUT / f"{device}-smithy-grid.png"))

        tiles.first.click()
        modal = page.locator(".detail-preview-modal.open")
        modal.wait_for(state="visible", timeout=8000)
        verify_shared_modal(page, ".detail-preview-modal.open", failures,
                            f"{device} {pack} detail")
        signature = modal_signature(page, ".detail-preview-modal.open")
        detail_signatures.append(signature)
        check(signature == baseline,
              f"{device} {pack}: detail modal shell differs from homepage preview shell", failures)

        hero_sel = ".detail-preview-modal.open .detail-preview-stage img"
        wait_img(page, hero_sel)
        hero = page.locator(hero_sel)
        src = hero.get_attribute("src") or ""
        check(f"assets/previews/{pack}/" in src,
              f"{device} {pack}: enlarged view uses unprotected source", failures)
        check(hero.evaluate("img => Math.max(img.naturalWidth, img.naturalHeight) <= 1500"),
              f"{device} {pack}: enlarged preview exceeds public preview resolution", failures)
        check(page.locator(".detail-preview-modal.open .detail-preview-stage").evaluate(
            "e => getComputedStyle(e, '::after').pointerEvents === 'auto'"),
            f"{device} {pack}: literal transparent glass shield missing", failures)

        context_prevented = hero.evaluate("""img => {
          const ev = new MouseEvent('contextmenu', {bubbles:true, cancelable:true});
          return !img.dispatchEvent(ev);
        }""")
        drag_prevented = hero.evaluate("""img => {
          const ev = new DragEvent('dragstart', {bubbles:true, cancelable:true});
          return !img.dispatchEvent(ev);
        }""")
        check(context_prevented, f"{device} {pack}: context menu ward failed", failures)
        check(drag_prevented, f"{device} {pack}: drag ward failed", failures)

        count = modal.locator(".detail-preview-dialog-count")
        check(count.inner_text() == f"1 of {total}",
              f"{device} {pack}: initial count is wrong", failures)
        modal.locator("[data-next]").click()
        check(count.inner_text() == f"2 of {total}",
              f"{device} {pack}: next button failed", failures)
        modal.press("ArrowLeft")
        check(count.inner_text() == f"1 of {total}",
              f"{device} {pack}: keyboard navigation failed", failures)

        page.screenshot(path=str(OUT / f"{device}-{pack}-modal.png"))
        page.keyboard.press("Escape")
        check(page.locator(".detail-preview-modal.open").count() == 0,
              f"{device} {pack}: Escape failed to close detail modal", failures)
        check(page.evaluate("document.body.style.overflow !== 'hidden'"),
              f"{device} {pack}: page scrolling stayed locked", failures)
        check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 5"),
              f"{device} {pack}: horizontal overflow", failures)

    check(all(sig == baseline for sig in detail_signatures),
          f"{device}: product detail preview modal shells are not identical", failures)

    if js_errors:
        failures.extend(f"{device}: JS {x[:220]}" for x in js_errors)
    if http_errors:
        failures.extend(f"{device}: HTTP {x}" for x in http_errors)

    results[device] = {
        "baseline_modal": baseline,
        "detail_modal_count": len(detail_signatures),
        "javascript_errors": js_errors[:10],
        "http_errors": http_errors[:10],
    }
    context.close()


def main():
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"
    failures = []
    results = {}
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
            for device in ("desktop", "mobile"):
                try:
                    run_device(device, browser, base, failures, results)
                except Exception as exc:
                    failures.append(f"{device}: QA crashed: {type(exc).__name__}: {exc}")
            browser.close()
    finally:
        server.shutdown()

    report = {
        "ok": not failures,
        "devices": results,
        "failures": failures,
        "screenshots": sorted(p.name for p in OUT.glob("*.png")),
    }
    (OUT / "preview-modal-qa-report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())

