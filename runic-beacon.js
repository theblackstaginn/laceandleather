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
        '<span class="ll-beacon-home-runes" aria-hidden="true">ᚠ ᚷ ᛃ</span>';
      anchor.insertAdjacentElement("afterend", mark);
    }
  }

  // Preserve existing footer content, links and attribution on every page.
  // The Specimen Cabinet's functional inner footer is not a site footer.
  let footer = main.querySelector(":scope > footer:not(.cabinet-index-foot)");
  const hadFooter = Boolean(footer);
  if (!footer) {
    footer = document.createElement("footer");
    main.appendChild(footer);
  }
  footer.classList.add("site-footer", "ll-beacon-footer");
  if (!footer.hasAttribute("aria-label")) {
    footer.setAttribute("aria-label", "Lace and Leather footer and Runic Beacon");
  }

  // Add rather than replace: existing Home, policy and product links survive.
  if (!footer.querySelector(".ll-beacon-footer-content")) {
    const inscription = document.createElement("div");
    inscription.className = "ll-beacon-footer-content";
    inscription.innerHTML =
      '<p class="ll-beacon-seal" role="img" aria-label="Runic Beacon: Fehu, Gebo and Jera">ᚠ ᚷ ᛃ</p>'
      + '<div class="ll-beacon-divider" aria-hidden="true"></div>'
      + (!hadFooter
        ? '<strong class="ll-beacon-footer-brand">Lace &amp; Leather Arcane</strong>'
          + '<p class="ll-beacon-footer-note">Digital textures, printable pages &amp; old-world creative assets</p>'
        : '')
      + (!footer.querySelector(".footer-links")
        ? '<nav class="ll-beacon-footer-links" aria-label="Footer navigation">'
          + '<a href="/">Home</a>'
          + '<a href="/#packs">Collections</a>'
          + '<a href="/journal/">Field Notes</a>'
          + '<a href="/refunds.html">Delivery &amp; Refunds</a>'
          + '<a href="/privacy-policy.html">Privacy</a>'
          + '<a href="mailto:lace.and.leather65@gmail.com">Support</a>'
          + '</nav>'
        : '')
      + (!hadFooter
        ? '<p class="ll-beacon-footer-credit">© 2026 Lace &amp; Leather Arcane'
          + ' · Website by <a href="https://blackstagweb.com" rel="noopener noreferrer">Black Stag Web Design</a></p>'
        : '');
    footer.appendChild(inscription);
  }
})();


/* The Runic Beacon: a ten-second, owner-invoked apparition. */
(() => {
  "use strict";
  function init(){
    if(document.getElementById("ll-beacon-popup")) return;
    const triggers=[...document.querySelectorAll(".ll-beacon-seal, .ll-beacon-home-mark, .ll-beacon-rail-runes")];
    if(!triggers.length)return;
    const modal=document.createElement("div");
    modal.id="ll-beacon-popup";
    modal.hidden=true;
    modal.className="ll-beacon-popup";
    modal.innerHTML='<div class="ll-beacon-popup-shade"></div><section class="ll-beacon-popup-card" role="dialog" aria-modal="true" aria-label="The Runic Beacon intention"><button class="ll-beacon-popup-close" type="button" aria-label="Close">×</button><img class="ll-beacon-popup-art" src="/assets/runic-beacon-intention.webp" alt="A weathered parchment bearing ᚠ ᚷ ᛃ and the intention: May those who seek what we create find their way here. May every exchange be fair and freely chosen. May our work bring abundance to maker and patron alike."><div class="ll-beacon-popup-sparks" aria-hidden="true"></div></section>';
    document.body.append(modal);
    const close=modal.querySelector(".ll-beacon-popup-close"),sparks=modal.querySelector(".ll-beacon-popup-sparks");
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer,cleanup,previous,open=false;
    function finish(){clearTimeout(timer);clearTimeout(cleanup);modal.hidden=true;modal.classList.remove("ll-beacon-popup-vanishing");sparks.replaceChildren();open=false;if(previous&&previous.isConnected)previous.focus({preventScroll:true});}
    function vanish(){if(!open||modal.classList.contains("ll-beacon-popup-vanishing"))return;clearTimeout(timer);if(reduce.matches){finish();return;}modal.classList.add("ll-beacon-popup-vanishing");cleanup=setTimeout(finish,1100);}
    function show(){if(open)finish();previous=document.activeElement;open=true;modal.hidden=false;modal.classList.remove("ll-beacon-popup-vanishing");sparks.replaceChildren();if(!reduce.matches){for(let i=0;i<28;i++){const s=document.createElement("i");s.style.setProperty("--i",String(i));s.style.setProperty("--x",((i*67+11)%100)+"%");s.style.setProperty("--y",((i*47+19)%100)+"%");sparks.append(s);}}close.focus({preventScroll:true});timer=setTimeout(vanish,10000);}
    triggers.forEach(el=>{
      if(el.classList.contains("ll-beacon-rail-runes")){
        el.closest("a")?.addEventListener("click",e=>{if(e.target!==el)return;e.preventDefault();show();});
      }else{el.tabIndex=0;el.setAttribute("role","button");el.setAttribute("aria-label","Reveal the Runic Beacon intention");el.addEventListener("click",show);el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();show();}});}
    });
    modal.querySelector(".ll-beacon-popup-shade").addEventListener("click",vanish);
    close.addEventListener("click",vanish);
    document.addEventListener("keydown",e=>{if(!open)return;if(e.key==="Escape"){e.preventDefault();vanish();}else if(e.key==="Tab"){e.preventDefault();close.focus();}});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
