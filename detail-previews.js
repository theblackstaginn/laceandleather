/* Lace & Leather Arcane | Accessible product-detail preview gallery.
 * Static thumbnails render without JavaScript. Only watermarked public
 * preview derivatives are displayed; no paid originals or checkout changes.
 */
(() => {
  "use strict";
  function initialiseGallery(gallery) {
    const tiles = Array.from(gallery.querySelectorAll(".detail-preview-tile"));
    const images = tiles.map((tile) => tile.querySelector("img"));
    if (!images.length || images.some((img) =>
      !img || !img.getAttribute("src")?.startsWith("./assets/previews/"))) {
      console.warn("Product detail preview: preview image source is missing");
      return;
    }

    const title = gallery.dataset.previewTitle || "Artwork";
    const label = gallery.dataset.previewUnit || "Preview";
    const modal = document.createElement("dialog");
    modal.className = "detail-preview-dialog";
    modal.setAttribute("aria-label", title + " enlarged previews");
    modal.innerHTML = [
      '<div class="detail-preview-dialog-head">',
      '  <h2 class="detail-preview-dialog-title"></h2>',
      '  <button type="button" class="detail-preview-dismiss" aria-label="Close enlarged preview">×</button>',
      '</div>',
      '<div class="detail-preview-stage" aria-label="Watermarked product preview">',
      '  <img alt="" draggable="false" />',
      '</div>',
      '<div class="detail-preview-dialog-controls">',
      '  <button class="detail-preview-step" type="button" data-prev aria-label="Previous preview">← Previous</button>',
      '  <span class="detail-preview-dialog-count" aria-live="polite"></span>',
      '  <button class="detail-preview-step" type="button" data-next aria-label="Next preview">Next →</button>',
      '</div>',
      '<p class="detail-preview-note">Watermarked preview. Clean, full-resolution files are included with purchase.</p>'
    ].join("");
    document.body.appendChild(modal);
    const currentImage = modal.querySelector(".detail-preview-stage img");
    const titleEl = modal.querySelector(".detail-preview-dialog-title");
    const countEl = modal.querySelector(".detail-preview-dialog-count");
    const closeButton = modal.querySelector(".detail-preview-dismiss");
    const prev = modal.querySelector("[data-prev]");
    const next = modal.querySelector("[data-next]");
    let current = 0;
    let trigger = null;
    let previousOverflow = "";

    function show(index) {
      current = (index + images.length) % images.length;
      const image = images[current];
      currentImage.src = image.getAttribute("src");
      currentImage.alt = image.alt + ", enlarged watermarked preview";
      titleEl.textContent = title + " | " + label + " " + (current + 1);
      countEl.textContent = (current + 1) + " of " + images.length;
    }

    function open(index, tile) {
      trigger = tile;
      show(index);
      if (typeof modal.showModal === "function") {
        modal.showModal();
      } else {
        modal.setAttribute("open", "");
      }
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      closeButton.focus({preventScroll: true});
    }

    function reset() {
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({preventScroll: true});
      trigger = null;
      currentImage.removeAttribute("src");
    }

    function close() {
      if (typeof modal.close === "function") {
        modal.close();
      } else {
        modal.removeAttribute("open");
        reset();
      }
    }

    tiles.forEach((tile, index) => {
      tile.addEventListener("click", () => open(index, tile));
    });
    prev.addEventListener("click", () => show(current - 1));
    next.addEventListener("click", () => show(current + 1));
    closeButton.addEventListener("click", close);
    modal.addEventListener("close", reset);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });
    modal.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(current - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        show(current + 1);
      }
    });
  }

  function start() {
    document.querySelectorAll("[data-detail-previews]").forEach(initialiseGallery);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, {once: true});
  } else {
    start();
  }
})();
