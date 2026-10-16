#!/usr/bin/env python3
"""Automated screenshot and interaction smoke-check for Ward v2 draft.

Serves branch checkout locally. Never creates a checkout session or sends email.
"""
from __future__ import annotations

import functools
import json
import os
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT / "ward-qa"
OUT.mkdir(exist_ok=True)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


def assert_ok(test, info, failures):
    if not test:
        failures.append(info)


def check_images(page, failures, prefix):
    for img in page.locator("img").all():
        if not img.is_visible():
            continue
        if not img.get_attribute("src"):
            continue
        # Browser loading is async; wait briefly for visible thumbnails.
        try:
            img.evaluate("""el => el.complete || new Promise(resolve => {
              el.addEventListener('load', () => resolve(true), {once:true});
              el.addEventListener('error', () => resolve(false), {once:true});
              setTimeout(() => resolve(false), 4000);
            })""")
        except Exception:
            pass
        dimensions = img.evaluate("(e) => [e.naturalWidth,e.naturalHeight]")
        if not dimensions[0]:
            failures.append(f"{prefix}: visible image did not load: {img.get_attribute('src')}")


def check(device, browser, base, failures, results):
    mobile=device=="mobile"
    context=browser.new_context(viewport={"width":390,"height":844} if mobile else {"width":1440,"height":900},
                                device_scale_factor=1,has_touch=mobile,is_mobile=mobile)
    page=context.new_page()
    errors=[]
    response_errors=[]
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("response",lambda r: response_errors.append(f"{r.status} {r.url}") if
            r.status>=400 and r.url.startswith(base) else None)

    page.goto(base+"/index.html",wait_until="domcontentloaded",timeout=30000)
    page.locator('button.pack[data-pack="smithy"]').wait_for(timeout=15000)
    page.wait_for_timeout(700)
    page.screenshot(path=str(OUT/f"{device}-home.png"))
    assert_ok(page.locator("script[src*='ward.js']").count()==1,
              f"{device}: Ward v2 script is missing", failures)
    assert_ok(page.evaluate("document.documentElement.scrollWidth<=innerWidth+5"),
              f"{device}: homepage horizontal overflow", failures)
    check_images(page,failures,f"{device} homepage")

    page.locator('button.pack[data-pack="smithy"]').click()
    page.locator("#packCollage .tile").first.wait_for(timeout=7000)
    assert_ok(page.locator("#packCollage .tile").count()==12,
              f"{device}: pack collage does not have 12 previews", failures)
    sources=page.locator("#packCollage .tile-face").evaluate_all(
        "(els)=>els.map(x=>x.style.backgroundImage)")
    assert_ok(len(sources)==12 and all("assets/previews/smithy/" in s for s in sources),
              f"{device}: pack previews reference unwarded sources", failures)
    page.screenshot(path=str(OUT/f"{device}-pack-grid.png"))
    page.locator("#packCollage .tile").first.click()
    assert_ok(page.locator("#packModal.mode-viewer").count()==1,
              f"{device}: pack zoom did not open", failures)
    assert_ok("assets/previews/smithy/" in page.locator("#packViewerImg").evaluate(
              "(e) => e.style.backgroundImage"), f"{device}: pack zoom uses original artwork", failures)
    # Guard against CSS pseudo-element overlays that dim the artwork.
    packview=page.locator("#packViewer")
    assert_ok(packview.is_visible(), f"{device}: pack viewer is hidden", failures)
    assert_ok(not packview.evaluate("(e) => e.classList.contains('ll-ward-surface')"),
              f"{device}: full-screen viewer gained dark Ward pseudo-overlay",failures)
    assert_ok(page.locator("#packViewerImg").evaluate("(e) => e.classList.contains('ll-ward-surface')"),
              f"{device}: preview canvas lacks Ward badge", failures)
    page.wait_for_timeout(300)
    page.screenshot(path=str(OUT/f"{device}-pack-zoom.png"))
    page.locator("#packBackBtn").click()
    assert_ok(page.locator("#packModal.mode-viewer").count()==0,
              f"{device}: back button failed", failures)
    page.locator("#packModal button[data-close]").click()
    assert_ok(page.locator("#packModal.open").count()==0,
              f"{device}: pack close button failed", failures)

    # Representative art galleries must remain navigable under Ward v2.
    for pack, expected in (("grimoire",12),("mapmaker",10),("volone",12)):
        page.locator(f'button.pack[data-pack="{pack}"]').click()
        page.locator("#packModal.open").wait_for(timeout=8000)
        assert_ok(page.locator("#packCollage .tile").count()==expected,
                  f"{device}: {pack} collage expected {expected} tiles",failures)
        paths=page.locator("#packCollage .tile-face").evaluate_all(
            "(els)=>els.map(el=>el.style.backgroundImage)")
        assert_ok(len(paths)==expected and all(f"assets/previews/{pack}/" in path for path in paths),
                  f"{device}: {pack} gallery is still sourcing paid originals",failures)
        urls=page.locator("#packCollage .tile-face").evaluate_all(
            """(els) => els.map(el => getComputedStyle(el).backgroundImage
                .match(/url\\(["']?(.*?)["']?\\)/)?.[1]).filter(Boolean)""")
        for path in urls:
            if path.startswith("http:") or path.startswith("https:"):
                if not path.startswith(base):
                    failures.append(f"{device}: {pack} unexpected remote preview URL: {path}")
                    continue
            response=page.request.head(path)
            assert_ok(response.ok, f"{device}: {pack} preview missing at {path}", failures)
        page.screenshot(path=str(OUT/f"{device}-{pack}-pack-grid.png"))
        page.locator("#packCollage .tile").first.click()
        assert_ok(page.locator("#packModal.mode-viewer").count()==1,
                  f"{device}: {pack} tile enlarged viewer did not open",failures)
        page.screenshot(path=str(OUT/f"{device}-{pack}-pack-zoom.png"))
        page.locator("#packModal button[data-close]").click()

    page.locator(".map-card[data-map='suneen']").click()
    page.locator("#mapModal.open").wait_for(timeout=8000)
    assert_ok("assets/maps/suneen-reef.webp" in page.locator("#mapViewerImg").evaluate(
              "(e)=>e.style.backgroundImage"),f"{device}: commission map preview broken",failures)
    page.screenshot(path=str(OUT/f"{device}-map-zoom.png"))
    page.locator("#mapModal button[data-close]").click()
    assert_ok(page.locator("#mapModal.open").count()==0,
              f"{device}: commission map close failed",failures)

    page.locator("#useCaseBtn").click()
    page.locator("#useCaseModal.open").wait_for(timeout=8000)
    page.screenshot(path=str(OUT/f"{device}-usecase.png"))
    page.locator("#useCaseModal button[data-close]").first.click()
    assert_ok(page.locator("#useCaseModal.open").count()==0,
              f"{device}: use-case close failed",failures)

    page.goto(base+"/smithy-textures.html",wait_until="domcontentloaded",timeout=30000)
    page.locator("#thumbs .thumb").first.wait_for(timeout=12000)
    page.wait_for_timeout(500)
    assert_ok("\\n" not in page.locator(".bullets").inner_text(),
              f"{device}: literal newline escape rendered in Smithy bullet text",failures)
    page.screenshot(path=str(OUT/f"{device}-smithy-detail.png"))
    assert_ok(page.locator("#thumbs .thumb").count()==12,
              f"{device}: detail page does not have 12 thumbnails", failures)
    page.locator("#thumbs .thumb").first.click()
    page.locator("#viewerModal.open").wait_for(timeout=8000)
    number=page.locator("#viewerTitle .preview-num")
    assert_ok(number.count()==1 and number.inner_text()=="1",
              f"{device}: Smithy modal numeral missing",failures)
    font=number.evaluate("(el) => getComputedStyle(el).fontFamily") if number.count() else ""
    assert_ok("Georgia" in font,
              f"{device}: Smithy modal numeric glyph may use broken decorative font ({font})",failures)
    viewer=page.locator("#viewerImg")
    assert_ok("assets/previews/smithy/" in (viewer.get_attribute("src") or ""),
              f"{device}: detail zoom uses unwarded source", failures)
    page.wait_for_function("() => document.querySelector('#viewerImg').naturalWidth > 0",
                           timeout=12000)
    # A loaded image is not enough: confirm it is actually rendered onscreen.
    assert_ok(viewer.is_visible(), f"{device}: detail zoom image is hidden by CSS",failures)
    box=viewer.bounding_box()
    assert_ok(bool(box and box["height"]>160 and box["width"]>150),
              f"{device}: detail zoom image has no visible dimensions ({box})",failures)
    shape=viewer.evaluate("(el) => [el.naturalWidth,el.naturalHeight]")
    assert_ok(max(shape)<=1500,
              f"{device}: detail zoom exceeds intended preview resolution ({shape})", failures)
    # Hidden modal control icons may defer decoding. Confirm the actual asset
    # renders instead of mistaking a broken-image placeholder for a button.
    page.wait_for_function("""() => {
      const icon = document.querySelector('#viewerModal button[data-close] img');
      return Boolean(icon && icon.complete && icon.naturalWidth > 0);
    }""", timeout=12000)
    page.wait_for_timeout(300)
    page.screenshot(path=str(OUT/f"{device}-smithy-zoom.png"))
    page.locator("#viewerModal button[data-close]").click()
    assert_ok(page.locator("#viewerModal.open").count()==0,
              f"{device}: detail modal didn't close",failures)

    page.goto(base+"/buttons.html",wait_until="domcontentloaded",timeout=30000)
    page.locator("#buttonsGrid .btn-main").first.wait_for(timeout=15000)
    sticker_images=page.locator("#buttonsGrid .btn-main img")
    assert_ok(sticker_images.count()==31,
              f"{device}: sold sticker count changed ({sticker_images.count()})",failures)
    sticker_sources=sticker_images.evaluate_all("(els)=>els.map(el=>el.getAttribute('src'))")
    assert_ok(len(sticker_sources)==31 and all("/assets/previews/buttons/" in x and x.endswith("-preview.webp") for x in sticker_sources),
              f"{device}: sticker gallery still contains clean originals",failures)
    page.wait_for_function("""() => Array.from(document.querySelectorAll('#buttonsGrid .btn-main img')).every(img => img.complete)""", timeout=15000)
    assert_ok(sticker_images.evaluate_all("(els)=>els.every(el=>el.naturalWidth>0)"),
              f"{device}: missing sticker preview image",failures)
    page.locator("#buttonsGrid .btn-main").first.click()
    cart=page.evaluate("() => JSON.parse(localStorage.getItem('ll_cart')||'[]')")
    assert_ok(len(cart)>0, f"{device}: button gallery add-to-cart click failed",failures)
    assert_ok(bool(cart and cart[0].get("id")=="button-amber-bronze"),
              f"{device}: sticker catalog id or order item changed unexpectedly",failures)
    page.screenshot(path=str(OUT/f"{device}-buttons.png"))
    assert_ok(page.evaluate("document.documentElement.scrollWidth<=innerWidth+5"),
              f"{device}: button gallery horizontal overflow", failures)
    # Journal social/hero links and public RSS must use the protected map artwork.
    page.goto(base+"/journal/coastline-drafting.html",wait_until="domcontentloaded",timeout=30000)
    hero=page.locator("img.hero").first
    hero.wait_for(timeout=10000)
    assert_ok("assets/previews/mapmaker/" in (hero.get_attribute("src") or ""),
              f"{device}: journal still serves a clean Mapmaker original",failures)
    page.wait_for_function("() => document.querySelector('img.hero').naturalWidth > 0",timeout=12000)
    page.screenshot(path=str(OUT/f"{device}-journal-mapmaker.png"))
    feed=page.request.get(base+"/feed.xml")
    assert_ok(feed.ok and "assets/mapmaker/map_" not in feed.text() and
              "assets/previews/mapmaker/" in feed.text(),
              f"{device}: RSS still contains exposed Mapmaker assets",failures)

    results[device]={"preview_count":len(sources),"detail_viewer_dimensions":shape,
                     "cart_after_click":len(cart),
                     "page_javascript_errors":errors[:15],
                     "internal_http_errors":response_errors[:20]}
    if errors:
        failures.extend(f"{device}: JS {x[:200]}" for x in errors)
    if response_errors:
        failures.extend(f"{device}: HTTP {x}" for x in response_errors)
    context.close()


def main():
    handler=functools.partial(QuietHandler,directory=str(ROOT))
    server=ThreadingHTTPServer(("127.0.0.1",0),handler)
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    base=f"http://127.0.0.1:{server.server_port}"
    failures=[]
    results={}
    try:
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
            for device in ("desktop","mobile"):
                try:
                    check(device,browser,base,failures,results)
                except Exception as exc:
                    failures.append(f"{device}: QA crashed: {type(exc).__name__}: {exc}")
            browser.close()
    finally:
        server.shutdown()
    report={"ok":not failures,"devices":results,"failures":failures,
            "screenshots":sorted(p.name for p in OUT.glob("*.png"))}
    (OUT/"ward-qa-report.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2))
    return 0 if not failures else 1


if __name__=="__main__":
    sys.exit(main())
