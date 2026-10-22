/* Shared public-page measurement. Checkout/session URLs never go to Metricool. */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const internalKey = "ll_internal_analytics";
  let internal = params.get("ll_internal") === "1";
  try {
    if (params.get("ll_internal") === "0") localStorage.removeItem(internalKey);
    if (internal) localStorage.setItem(internalKey, "1");
    internal = internal || localStorage.getItem(internalKey) === "1";
  } catch { /* Storage restrictions must never break the shop. */ }

  if (internal || window.__llMeasurementLoaded) return;
  if (!/^(www\.)?laceleatherarcane\.com$/.test(location.hostname)) return;
  if (/(?:^|\/)(?:pay(?:-sandbox)?|payment-success)\.html$/.test(location.pathname)) return;
  // Never send unrecognized URL parameters (e.g. order references or email).
  const publicParams = new Set([
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "_v", "ll_internal"
  ]);
  if ([...params.keys()].some(key => !publicParams.has(key))) return;

  window.__llMeasurementLoaded = true;
  const script = document.createElement("script");
  script.src = "https://tracker.metricool.com/resources/be.js";
  script.async = true;
  script.onload = () => {
    try {
      window.beTracker?.t({hash:"570203b21402b6698caff30be98f0ebc"});
    } catch { /* Analytics is optional; purchasing is not. */ }
  };
  document.head.appendChild(script);
})();
