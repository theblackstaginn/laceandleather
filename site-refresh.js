(() => {
  const VERSION = "LL-20261024-PIN1";
  window.LL_SITE_VERSION = VERSION;

  const current = new URL(window.location.href);
  if (current.searchParams.has("_cb") || current.searchParams.has("_v")) {
    current.searchParams.delete("_cb");
    current.searchParams.delete("_v");
    window.history.replaceState({}, "", current.toString());
  }

  const isPayPage = document.body.classList.contains("pay-page");

  // Keep measurement consistent even when a product page forgets its explicit
  // measurement.js tag. The measurement script itself rejects checkout pages.
  if (
    !isPayPage
    && !window.__llMeasurementLoaded
    && !document.querySelector('script[src*="measurement.js"]')
  ) {
    const measurement = document.createElement("script");
    measurement.src = "./measurement.js?v=LL-20261024-PIN1";
    measurement.defer = true;
    document.head.appendChild(measurement);
  }

  // Product-page conversion treatment: keep direct checkout as the primary
  // path while preserving marketplace alternatives in a quieter position.
  const productCta = document.querySelector(".product-cta");
  if (productCta) {
    const buyNow = productCta.querySelector("[data-buy-product]");
    if (buyNow) productCta.prepend(buyNow);

    if (!document.querySelector(".direct-purchase-note")) {
      const note = document.createElement("div");
      note.className = "direct-purchase-note";
      note.innerHTML =
        "<strong>Shop direct.</strong> No marketplace account or app required. "
        + "Secure Stripe checkout. Digital files are delivered by email.";
      productCta.parentNode.insertBefore(note, productCta);
    }

    const marketplaceLinks = Array.from(
      productCta.querySelectorAll(
        'a[href*="etsy.com"], a[href*="itch.io"], a[href*="payhip.com"]'
      )
    );

    if (marketplaceLinks.length && !document.querySelector(".marketplace-alts")) {
      const alts = document.createElement("div");
      alts.className = "marketplace-alts muted";
      const label = document.createElement("span");
      label.textContent = "Prefer another marketplace?";
      alts.appendChild(label);

      marketplaceLinks.forEach((link, index) => {
        const copy = link.cloneNode(true);
        copy.className = "marketplace-alt-link";
        if (index > 0) alts.append(" · ");
        alts.appendChild(copy);
        link.remove();
      });

      productCta.insertAdjacentElement("afterend", alts);
    }
  }

  // On the homepage, merchandise should appear before the workshop/social
  // detour so Pinterest shoppers reach products with less scrolling.
  const packsSection = document.querySelector("#packs");
  const processSection = document.querySelector("#process");
  if (packsSection && processSection && packsSection.nextElementSibling !== processSection) {
    packsSection.insertAdjacentElement("afterend", processSection);
  }

  const shopEntry = document.querySelector(".shop-entry");
  if (shopEntry && !document.querySelector(".direct-shop-trust")) {
    const trust = document.createElement("div");
    trust.className = "direct-shop-trust";
    trust.setAttribute("aria-label", "Direct shop benefits");
    trust.innerHTML =
      "<span>No marketplace account required</span>"
      + "<span>Secure Stripe checkout</span>"
      + "<span>Digital delivery by email</span>";
    shopEntry.insertAdjacentElement("afterend", trust);
  }

  // Sitewide PTR is for normal Lace & Leather pages.
  // The PayPad has its own internal scroll surface and is intentionally skipped.
  if (isPayPage) return;

  const touchCapable =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

  if (!touchCapable) return;

  document.documentElement.style.overscrollBehaviorY = "contain";

  const style = document.createElement("style");
  style.textContent = `
    #ll-ptr-indicator{
      position:fixed;
      left:50%;
      top:max(10px, env(safe-area-inset-top));
      z-index:2147483647;
      transform:translate(-50%,-18px);
      opacity:0;
      pointer-events:none;
      padding:7px 11px;
      border:1px solid rgba(184,145,82,.42);
      border-radius:999px;
      background:rgba(28,19,12,.94);
      color:#ead7ac;
      box-shadow:0 7px 18px rgba(0,0,0,.34);
      font:800 11px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      letter-spacing:.08em;
      white-space:nowrap;
      transition:opacity .14s ease, transform .14s ease;
      -webkit-backdrop-filter:blur(8px);
      backdrop-filter:blur(8px);
    }
    #ll-ptr-indicator.ll-ptr-visible{
      opacity:1;
      transform:translate(-50%,0);
    }
    #ll-ptr-indicator .ll-ptr-icon{
      display:inline-block;
      margin-right:6px;
    }
    #ll-ptr-indicator.ll-ptr-refreshing .ll-ptr-icon{
      animation:ll-ptr-spin .7s linear infinite;
    }
    @keyframes ll-ptr-spin{
      to{transform:rotate(360deg)}
    }
    @media (prefers-reduced-motion:reduce){
      #ll-ptr-indicator{transition:none}
      #ll-ptr-indicator.ll-ptr-refreshing .ll-ptr-icon{animation:none}
    }
  `;
  document.head.appendChild(style);

  const indicator = document.createElement("div");
  indicator.id = "ll-ptr-indicator";
  indicator.setAttribute("role","status");
  indicator.setAttribute("aria-live","polite");

  const icon = document.createElement("span");
  icon.className = "ll-ptr-icon";
  icon.setAttribute("aria-hidden","true");
  icon.textContent = "↻";

  const label = document.createElement("span");
  label.textContent = "PULL TO REFRESH";

  indicator.append(icon,label);
  document.body.appendChild(indicator);

  const THRESHOLD = 92;
  const MAX_TRAVEL = 82;

  let tracking=false;
  let pulling=false;
  let startX=0;
  let startY=0;
  let currentPull=0;

  // A fixed-body modal makes Safari report scrollY=0. Never mistake that
  // for a user pulling down from the top of the underlying page.
  const overlayOpen=()=> document.documentElement.classList.contains("no-scroll")
    || !!document.querySelector(".modal.open, dialog[open], .specimen-drawer.is-open");
  const atTop=()=> !overlayOpen()
    && (window.scrollY || document.documentElement.scrollTop || 0) <= 1;

  const isInteractive=target =>
    !!target?.closest?.("input, textarea, select, button, a, [contenteditable='true']");

  const reset=()=>{
    tracking=false;
    pulling=false;
    currentPull=0;
    indicator.classList.remove("ll-ptr-visible","ll-ptr-refreshing");
    indicator.style.opacity="0";
    indicator.style.transform="translate(-50%,-18px)";
    label.textContent="PULL TO REFRESH";
  };

  const refreshWithCacheBust=()=>{
    indicator.classList.add("ll-ptr-visible","ll-ptr-refreshing");
    indicator.style.opacity="1";
    indicator.style.transform="translate(-50%,0)";
    label.textContent="REFRESHING…";

    const url=new URL(window.location.href);
    url.searchParams.set("_cb",Date.now().toString(36));
    url.searchParams.set("_v",VERSION);

    window.setTimeout(()=>{
      window.location.replace(url.toString());
    },180);
  };

  document.addEventListener("touchstart",event=>{
    if(event.touches.length!==1 || !atTop() || isInteractive(event.target)){
      tracking=false;
      return;
    }

    const touch=event.touches[0];
    startX=touch.clientX;
    startY=touch.clientY;
    currentPull=0;
    tracking=true;
    pulling=false;
  },{passive:true});

  document.addEventListener("touchmove",event=>{
    if(!tracking || event.touches.length!==1) return;

    const touch=event.touches[0];
    const deltaX=touch.clientX-startX;
    const deltaY=touch.clientY-startY;

    if(deltaY<=0 || Math.abs(deltaX)>Math.abs(deltaY)){
      if(pulling) reset();
      return;
    }

    if(!atTop()){
      reset();
      return;
    }

    pulling=true;
    currentPull=deltaY;
    event.preventDefault();

    const travel=Math.min(MAX_TRAVEL,deltaY*.48);
    const progress=Math.min(1,deltaY/THRESHOLD);

    indicator.classList.add("ll-ptr-visible");
    indicator.style.opacity=String(.35+progress*.65);
    indicator.style.transform="translate(-50%,"+(travel-58)+"px)";
    label.textContent=
      deltaY>=THRESHOLD
        ? "RELEASE TO REFRESH"
        : "PULL TO REFRESH";
  },{passive:false});

  const finish=()=>{
    if(!tracking || !pulling){
      reset();
      return;
    }

    if(currentPull>=THRESHOLD && atTop()){
      refreshWithCacheBust();
      return;
    }

    reset();
  };

  document.addEventListener("touchend",finish,{passive:true});
  document.addEventListener("touchcancel",reset,{passive:true});
})();