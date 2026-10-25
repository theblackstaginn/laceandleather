(() => {
  const CART_KEY = "ll_cart";

  function readCart() {
    let raw = [];
    try {
      raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      raw = [];
    }

    if (window.LaceLeatherCatalog?.normalizeCart) {
      return window.LaceLeatherCatalog.normalizeCart(raw);
    }

    return Array.isArray(raw) ? raw : [];
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addProduct(productId) {
    const product = window.LaceLeatherCatalog?.get(productId);
    if (!product) return null;

    // Updating a saved unpaid cart must not reuse the old order reference.
    if (localStorage.getItem("ll_cart_locked") === "1") {
      localStorage.removeItem("ll_cart_locked");
      localStorage.removeItem("ll_order_id");
    }

    const cart = readCart();
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      existing.qty = Math.min(99, Math.max(1, Number(existing.qty || 1)) + 1);
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1
      });
    }

    writeCart(cart);
    return product;
  }

  function flashButton(button, text) {
    const original = button.textContent;
    button.textContent = text;
    button.disabled = true;
    window.setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, 900);
  }

  document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-product]");
    if (addButton) {
      event.preventDefault();
      const product = addProduct(addButton.getAttribute("data-add-product"));
      if (product) flashButton(addButton, "Added to cart ✓");
      return;
    }

    const buyButton = event.target.closest("[data-buy-product]");
    if (buyButton) {
      event.preventDefault();
      const product = addProduct(buyButton.getAttribute("data-buy-product"));
      if (!product) return;
      window.location.assign("/pay.html?_v=LL-20261023-STORE1");
    }
  });
})();