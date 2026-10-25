/* Lace & Leather Arcane | Ward v2
 * Browser-side preview deterrent. It is NOT access control.
 * Paid original images and download archives must be kept off public hosting.
 * Preserves click/touch/keyboard behavior, modal interactions and checkout.
 */
(() => {
  "use strict";

  const surfaceSelector = [
    ".tile", ".viewer-img", ".map-thumb",
    ".thumb", ".btn-main", ".uc-btn", ".uc-card",
    ".hero-card", ".buttons-banner-link", ".map-card",
    ".pack-preview", ".preview-card"
  ].join(",");

  const artSelector = [
    "img", ".ll-ward-surface", ".tile-face", ".viewer-img"
  ].join(",");

  function protectedTarget(target) {
    return target instanceof Element && Boolean(target.closest(artSelector));
  }

  document.addEventListener("dragstart", (event) => {
    if (protectedTarget(event.target)) event.preventDefault();
  }, true);

  document.addEventListener("contextmenu", (event) => {
    if (protectedTarget(event.target)) event.preventDefault();
  }, true);

  let queued = false;
  function applyWard() {
    queued = false;
    document.querySelectorAll("img").forEach((img) => {
      if (img.getAttribute("draggable") !== "false") {
        img.setAttribute("draggable", "false");
      }
      img.classList.add("ll-ward-image");
    });
    document.querySelectorAll(surfaceSelector).forEach((surface) => {
      surface.classList.add("ll-ward-surface");
    });
  }

  function scheduleWard() {
    if (queued) return;
    queued = true;
    queueMicrotask(applyWard);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applyWard();
      new MutationObserver(scheduleWard).observe(document.body, {
        childList: true, subtree: true
      });
    }, {once: true});
  } else {
    applyWard();
    new MutationObserver(scheduleWard).observe(document.body, {
      childList: true, subtree: true
    });
  }
})();
