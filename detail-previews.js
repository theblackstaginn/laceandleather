/* Lace & Leather Arcane | Shared product-detail preview gallery.
 * Uses the same Lace & Leather modal engine as homepage/map/use-case previews.
 * Public images must remain reduced, flattened, baked-watermark derivatives.
 */
(() => {
  "use strict";

  const ui = window.LaceLeatherUI;
  if (!ui?.openModal) {
    console.warn("Product detail preview: shared modal engine is unavailable");
    return;
  }

  let modalNumber = 0;

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

    const modal = document.createElement("div");
    modalNumber += 1;
    modal.id = `detailPreviewModal${modalNumber}`;
    modal.className = "modal preview-modal detail-preview-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", title + " enlarged previews");

    modal.innerHTML = [
      '<div class="modal-backdrop" data-close></div>',
      '<div class="glass modal-panel" role="document" tabindex="-1">',
      '  <div class="modal-head">',
      '    <div class="modal-left">',
      '      <div>',
      '        <div class="modal-title detail-preview-dialog-title"></div>',
      '        <div class="modal-sub muted detail-preview-dialog-count" aria-live="polite"></div>',
      '      </div>',
      '    </div>',
      '    <div class="modal-actions">',
      '      <button class="wax-btn" type="button" data-close aria-label="Close enlarged preview">',
      '        <img src="./assets/x-button.webp" alt="Close" decoding="async" />',
      '      </button>',
      '    </div>',
      '  </div>',
      '  <div class="modal-body">',
      '    <div class="detail-preview-stage" aria-label="Watermarked product preview">',
      '      <img alt="" draggable="false" decoding="async" />',
      '    </div>',
      '    <div class="detail-preview-dialog-controls">',
      '      <button class="detail-preview-step" type="button" data-prev aria-label="Previous preview">← Previous</button>',
      '      <button class="detail-preview-step" type="button" data-next aria-label="Next preview">Next →</button>',
      '    </div>',
      '    <p class="detail-preview-note">Watermarked preview. Clean, full-resolution files are included with purchase.</p>',
      '  </div>',
      '</div>'
    ].join("");

    document.body.appendChild(modal);

    const currentImage = modal.querySelector(".detail-preview-stage img");
    const titleEl = modal.querySelector(".detail-preview-dialog-title");
    const countEl = modal.querySelector(".detail-preview-dialog-count");
    const prev = modal.querySelector("[data-prev]");
    const next = modal.querySelector("[data-next]");
    let current = 0;

    function show(index) {
      current = (index + images.length) % images.length;
      const image = images[current];
      currentImage.src = image.getAttribute("src");
      currentImage.alt = image.alt + ", enlarged watermarked preview";
      titleEl.textContent = title + " | " + label + " " + (current + 1);
      countEl.textContent = (current + 1) + " of " + images.length;
    }

    function open(index, tile) {
      show(index);
      ui.openModal(modal, tile);
    }

    tiles.forEach((tile, index) => {
      tile.addEventListener("click", () => open(index, tile));
    });

    prev.addEventListener("click", () => show(current - 1));
    next.addEventListener("click", () => show(current + 1));

    modal.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(current - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        show(current + 1);
      }
    });

    modal.addEventListener("ll:modal-closed", () => {
      currentImage.removeAttribute("src");
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
