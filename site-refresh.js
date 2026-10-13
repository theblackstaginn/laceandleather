(() => {
  const VERSION = "LL-20261013-1";
  const THRESHOLD = 76;
  const PAY_SCROLL_ID = "payScroll";

  window.LL_SITE_VERSION = VERSION;

  const payScroller = document.getElementById(PAY_SCROLL_ID);
  const scrollTop = () => {
    if (payScroller) return payScroller.scrollTop;
    return window.scrollY || document.documentElement.scrollTop || 0;
  };

  const indicator = document.createElement("div");
  indicator.id = "ll-ptr-indicator";
  indicator.setAttribute("aria-hidden", "true");
  indicator.textContent = "PULL TO REFRESH";

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
      background:rgba(28,19,12,.92);
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
  `;

  document.head.appendChild(style);
  document.body.appendChild(indicator);

  let tracking = false;
  let startY = 0;
  let distance = 0;

  const atTop = () => scrollTop() <= 1;

  const insideActiveScroller = target => {
    if (!payScroller) return true;
    return !!target?.closest?.("#" + PAY_SCROLL_ID);
  };

  const isInteractive = target =>
    !!target?.closest?.("input, textarea, select, [contenteditable='true']");

  const reset = () => {
    tracking = false;
    distance = 0;
    indicator.classList.remove("ll-ptr-visible");
    indicator.textContent = "PULL TO REFRESH";
  };

  const refreshWithCacheBust = () => {
    indicator.classList.add("ll-ptr-visible");
    indicator.textContent = "REFRESHING…";

    const url = new URL(window.location.href);
    url.searchParams.set("_cb", Date.now().toString(36));
    window.location.replace(url.toString());
  };

  document.addEventListener("touchstart", event => {
    if (
      event.touches.length !== 1 ||
      !atTop() ||
      !insideActiveScroller(event.target) ||
      isInteractive(event.target)
    ) {
      return;
    }

    startY = event.touches[0].clientY;
    distance = 0;
    tracking = true;
  }, {passive:true});

  document.addEventListener("touchmove", event => {
    if (!tracking || event.touches.length !== 1) return;

    distance = Math.max(0, event.touches[0].clientY - startY);

    if (distance > 12) {
      indicator.classList.add("ll-ptr-visible");
      indicator.textContent =
        distance >= THRESHOLD ? "RELEASE TO REFRESH" : "PULL TO REFRESH";
    }
  }, {passive:true});

  document.addEventListener("touchend", () => {
    if (!tracking) return;

    if (distance >= THRESHOLD && atTop()) {
      refreshWithCacheBust();
      return;
    }

    reset();
  }, {passive:true});

  document.addEventListener("touchcancel", reset, {passive:true});
})();