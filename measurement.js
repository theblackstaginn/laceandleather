/* Shared public-page measurement + first-touch attribution.
   Checkout/session URLs never load Metricool. */
(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const internalKey = "ll_internal_analytics";
  const attributionKey = "ll_attribution_v1";

  let internal = params.get("ll_internal") === "1";
  try {
    if (params.get("ll_internal") === "0") localStorage.removeItem(internalKey);
    if (internal) localStorage.setItem(internalKey, "1");
    internal = internal || localStorage.getItem(internalKey) === "1";
  } catch {
    /* Storage restrictions must never break the shop. */
  }

  if (internal || window.__llMeasurementLoaded) return;
  if (!/^(www\.)?laceleatherarcane\.com$/.test(location.hostname)) return;
  if (/(?:^|\/)(?:pay(?:-sandbox)?|payment-success)\.html$/.test(location.pathname)) return;

  const ownSiteReferrer = /^https?:\/\/(?:www\.)?laceleatherarcane\.com(?=\/|$)/i;
  const externalReferrer =
    document.referrer && !ownSiteReferrer.test(document.referrer)
      ? document.referrer
      : "";

  const campaign = {
    source: String(params.get("utm_source") || "").slice(0, 120),
    medium: String(params.get("utm_medium") || "").slice(0, 120),
    campaign: String(params.get("utm_campaign") || "").slice(0, 180),
    content: String(params.get("utm_content") || "").slice(0, 180),
    term: String(params.get("utm_term") || "").slice(0, 180)
  };

  const hasPinterestClickId = params.has("epik");
  const source =
    campaign.source
    || (hasPinterestClickId || /(?:^|\.)pinterest\./i.test((() => {
      try { return new URL(externalReferrer).hostname; } catch { return ""; }
    })()) ? "pinterest" : "");

  const touch = {
    at: new Date().toISOString(),
    path: location.pathname,
    referrer: externalReferrer,
    source,
    medium: campaign.medium,
    campaign: campaign.campaign,
    content: campaign.content,
    term: campaign.term
  };

  try {
    const saved = JSON.parse(localStorage.getItem(attributionKey) || "null") || {};
    const hasCampaign =
      !!source
      || !!campaign.medium
      || !!campaign.campaign
      || !!campaign.content
      || !!campaign.term
      || !!externalReferrer;

    if (!saved.first) saved.first = touch;
    if (hasCampaign) saved.last = touch;
    if (!saved.last) saved.last = saved.first;

    localStorage.setItem(attributionKey, JSON.stringify(saved));
  } catch {
    /* Attribution is helpful, never required for purchasing. */
  }

  /* Pinterest promoted traffic may append epik. It is useful for recognizing
     the source, but we do not forward that click identifier to Metricool. */
  if (hasPinterestClickId) {
    try {
      const clean = new URL(location.href);
      clean.searchParams.delete("epik");
      const next = clean.pathname + (clean.search || "") + (clean.hash || "");
      history.replaceState(history.state, "", next);
      params.delete("epik");
    } catch {
      /* URL cleanup is optional. */
    }
  }

  /* Never send unrecognized URL parameters to Metricool. */
  const publicParams = new Set([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "_v",
    "ll_internal"
  ]);

  if ([...params.keys()].some(key => !publicParams.has(key))) return;

  window.__llMeasurementLoaded = true;

  const script = document.createElement("script");
  script.src = "https://tracker.metricool.com/resources/be.js";
  script.async = true;
  script.onload = () => {
    try {
      window.beTracker?.t({hash:"570203b21402b6698caff30be98f0ebc"});
    } catch {
      /* Analytics is optional; purchasing is not. */
    }
  };
  document.head.appendChild(script);
})();
