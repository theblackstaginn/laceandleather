(() => {
  const VERSION = "LL-20261013-2";
  window.LL_SITE_VERSION = VERSION;

  const current = new URL(window.location.href);
  if (current.searchParams.has("_cb") || current.searchParams.has("_v")) {
    current.searchParams.delete("_cb");
    current.searchParams.delete("_v");
    window.history.replaceState({}, "", current.toString());
  }

  // Sitewide PTR is for normal Lace & Leather pages.
  // The PayPad has its own internal scroll surface and is intentionally skipped.
  if (document.body.classList.contains("pay-page")) return;

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

  const atTop=()=> (window.scrollY || document.documentElement.scrollTop || 0) <= 1;

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