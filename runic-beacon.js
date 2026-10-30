/* Lace & Leather Arcane | Shared Runic Beacon layout
 * Decorative, non-interactive maker's inscription. Preserves shopping, checkout,
 * product galleries, the Specimen Cabinet, original metadata and page content.
 */
(() => {
  "use strict";

  if (window.__llRunicBeaconApplied) return;
  window.__llRunicBeaconApplied = true;

  const main = document.querySelector("main.wrap") || document.querySelector("main");
  if (!main || document.body.classList.contains("pay-page")) return;

  document.documentElement.classList.add("ll-beacon-active");
  const isHome = /^\/(?:index\.html)?$/.test(window.location.pathname);

  if (!isHome && !main.querySelector(":scope > .ll-beacon-rail")) {
    const rail = document.createElement("nav");
    rail.className = "ll-beacon-rail";
    rail.setAttribute("aria-label", "Lace and Leather site navigation");
    rail.innerHTML =
      '<a class="ll-beacon-rail-brand" href="/"><span class="ll-beacon-rail-runes" aria-hidden="true">ᚠᚷᛃ</span><span>Lace &amp; Leather Arcane</span></a>'
      + '<div class="ll-beacon-rail-links">'
      + '<a href="/#packs">Collections</a>'
      + '<a href="/journal/">Field Notes</a>'
      + '<a href="mailto:lace.and.leather65@gmail.com">Contact</a>'
      + "</div>";
    main.prepend(rail);
  }

  if (isHome && !document.querySelector(".ll-beacon-home-mark")) {
    const anchor = document.querySelector(".hero-inner .subtag");
    if (anchor) {
      const mark = document.createElement("p");
      mark.className = "ll-beacon-home-mark";
      mark.setAttribute("aria-label", "Runic Beacon: Fehu, Gebo and Jera, a symbolic maker's invitation");
      mark.innerHTML =
        '<span class="ll-beacon-home-runes" aria-hidden="true">ᚠ ᚷ ᛃ</span>'
        + '<span class="ll-beacon-home-caption">Made with intention</span>';
      anchor.insertAdjacentElement("afterend", mark);
    }
  }

  // The Specimen Cabinet has its own functional inner footer. Leave it alone.
  // Replace only a direct child footer of main; add one if the page lacks it.
  let footer = main.querySelector(":scope > footer:not(.cabinet-index-foot)");
  if (!footer) {
    footer = document.createElement("footer");
    main.appendChild(footer);
  }
  footer.className = "site-footer ll-beacon-footer";
  footer.setAttribute("aria-label", "Lace and Leather Runic Beacon and site links");
  footer.innerHTML =
    '<div class="ll-beacon-footer-content">'
    + '<p class="ll-beacon-seal" role="img" aria-label="Runic Beacon: Fehu, Gebo and Jera">ᚠ ᚷ ᛃ</p>'
    + '<p class="ll-beacon-verse">May those who seek what we create find their way here.'
    + '<br>May every exchange be fair and freely chosen.'
    + '<br>May our work bring abundance to maker and patron alike.</p>'
    + '<div class="ll-beacon-divider" aria-hidden="true"></div>'
    + '<strong class="ll-beacon-footer-brand">Lace &amp; Leather Arcane</strong>'
    + '<p class="ll-beacon-footer-note">Digital textures, printable pages &amp; old-world creative assets</p>'
    + '<nav class="ll-beacon-footer-links" aria-label="Footer navigation">'
    + '<a href="/">Home</a>'
    + '<a href="/#packs">Collections</a>'
    + '<a href="/journal/">Field Notes</a>'
    + '<a href="/refunds.html">Delivery &amp; Refunds</a>'
    + '<a href="/privacy-policy.html">Privacy</a>'
    + '<a href="mailto:lace.and.leather65@gmail.com">Support</a>'
    + "</nav>"
    + '<p class="ll-beacon-footer-credit">© 2026 Lace &amp; Leather Arcane'
    + ' · Website by <a href="https://blackstagweb.com" rel="noopener noreferrer">Black Stag Web Design</a></p>'
    + "</div>";
})();
