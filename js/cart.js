/* =====================================================================
   CART — store (LocalStorage) + Cart page view
   ---------------------------------------------------------------------
   Stored in localStorage["crackersCart"] as  [{ "id": 17, "qty": 5 }, ...]
   Only ids and quantities are saved; name, pack and price are always read
   fresh from PRODUCTS, so a price change in data/products.js applies to
   carts that were saved earlier.
   ===================================================================== */
const Cart = (() => {
  "use strict";
  const KEY = SHOP_CONFIG.cartStorageKey || "crackersCart";
  const MAX = SHOP_CONFIG.maxQtyPerItem || 999;
  const productById = new Map(PRODUCTS.map((p) => [p.id, p]));
  const listeners = new Set();
  const toQty = (v) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? Math.max(0, Math.min(MAX, n)) : 0;
  };

  let persistent = storageAvailable();
  let memoryCopy = [];
  let droppedOnLoad = 0;
  resetIfOldVersion();
  let items = load();

  /* SHOP_CONFIG.cartVersion — carts saved under a different number are emptied
     once (use it after big price-list changes, or to reset old test carts). */
  function resetIfOldVersion() {
    if (!persistent) return;
    const VKEY = `${KEY}Version`;
    const want = String(SHOP_CONFIG.cartVersion || 1);
    try {
      if (window.localStorage.getItem(VKEY) !== want) {
        window.localStorage.removeItem(KEY);
        window.localStorage.setItem(VKEY, want);
      }
    } catch (e) { /* ignore */ }
  }

  function storageAvailable() {
    try {
      const k = "__vc_storage_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }

  /* Merge duplicates, drop unknown products / invalid quantities */
  function sanitize(data) {
    if (!Array.isArray(data)) return [];
    const merged = new Map();
    data.forEach((row) => {
      const id = Number(row && row.id);
      const qty = toQty(row && row.qty);
      if (!productById.has(id) || qty < 1) { droppedOnLoad++; return; }
      merged.set(id, Math.min(MAX, (merged.get(id) || 0) + qty));
    });
    return [...merged].map(([id, qty]) => ({ id, qty }));
  }

  function load() {
    if (!persistent) return memoryCopy.slice();
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? sanitize(JSON.parse(raw)) : [];
    } catch (e) {
      droppedOnLoad++;
      return [];
    }
  }

  function commit() {
    if (persistent) {
      try { window.localStorage.setItem(KEY, JSON.stringify(items)); }
      catch (e) { persistent = false; memoryCopy = items.slice(); }
    } else {
      memoryCopy = items.slice();
    }
    emit();
  }

  function emit() {
    const t = totals();
    listeners.forEach((fn) => { try { fn(t); } catch (e) { console.error(e); } });
  }

  /* ---------- Public API ---------- */
  function getQty(id) { const it = items.find((i) => i.id === id); return it ? it.qty : 0; }

  /** Adds qty to the product (merges with an existing line — never duplicates). */
  function add(id, qty) {
    id = Number(id);
    const q = toQty(qty);
    if (!productById.has(id)) return { ok: false, reason: "not-found" };
    if (q < 1) return { ok: false, reason: "invalid-qty" };
    const line = items.find((i) => i.id === id);
    let capped = false;
    if (line) {
      const next = line.qty + q;
      capped = next > MAX;
      line.qty = Math.min(MAX, next);
    } else {
      items.push({ id, qty: q });
    }
    commit();
    return { ok: true, qty: getQty(id), capped };
  }

  function setQty(id, qty) {
    id = Number(id);
    const q = toQty(qty);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    if (q < 1) items.splice(idx, 1); else items[idx].qty = q;
    commit();
  }

  function remove(id) {
    id = Number(id);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const [removed] = items.splice(idx, 1);
    commit();
    return { item: removed, index: idx };
  }

  function restore(snapshot) {
    if (!snapshot) return;
    if (Array.isArray(snapshot)) { items = sanitize(snapshot); commit(); return; }
    const { item, index } = snapshot;
    if (!productById.has(item.id) || items.some((i) => i.id === item.id)) return;
    items.splice(Math.min(index, items.length), 0, { id: item.id, qty: item.qty });
    commit();
  }

  function clear() { const prev = items.map((i) => ({ ...i })); items = []; commit(); return prev; }

  function lines() {
    return items
      .filter((i) => productById.has(i.id))
      .map((i) => {
        const product = productById.get(i.id);
        return { product, qty: i.qty, subtotal: product.price * i.qty };   // subtotal = price × quantity
      });
  }

  function totals() {
    const ls = lines();
    return {
      products: ls.length,
      items: ls.reduce((s, l) => s + l.qty, 0),
      grandTotal: ls.reduce((s, l) => s + l.subtotal, 0)
    };
  }

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  // Keep several open tabs in sync
  /* Re-read the saved cart. Keeps every open tab and every page correct —
     including pages the browser restores from its back/forward cache
     (pressing Back after an order used to show the old, pre-order cart). */
  function refresh() {
    const before = JSON.stringify(items);
    items = load();
    if (JSON.stringify(items) !== before) emit();
  }
  window.addEventListener("storage", (e) => { if (e.key === KEY || e.key === null) refresh(); });
  window.addEventListener("pageshow", (e) => { if (e.persisted) refresh(); });
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });

  return {
    add, setQty, remove, restore, clear, getQty, lines, totals, subscribe,
    get max() { return MAX; },
    isPersistent: () => persistent,
    droppedOnLoad: () => droppedOnLoad,
    product: (id) => productById.get(Number(id))
  };
})();


/* =====================================================================
   CART PAGE VIEW  (cart.html)
   ===================================================================== */
const CartPage = (() => {
  "use strict";
  const { formatINR, formatNum, padCode, esc, icon, illustration, toast, plural } = UI;
  let root;

  function init() {
    root = document.getElementById("cart-root");
    if (!root) return;
    render();
    Cart.subscribe(() => {
      // Full re-render only when the set of products changes; otherwise patch numbers.
      const ids = Cart.lines().map((l) => l.product.id).join(",");
      if (ids !== root.dataset.ids) render(); else patch();
    });

    root.addEventListener("click", onClick);
    root.addEventListener("change", onChange);
    root.addEventListener("input", (e) => {
      // Live update while typing a valid quantity (final clean-up happens on "change")
      if (!e.target.matches(".qty-input")) return;
      const v = Number(e.target.value);
      if (Number.isInteger(v) && v >= 1 && v <= Cart.max) Cart.setQty(Number(e.target.closest(".cart-row").dataset.id), v);
    });
    root.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches(".qty-input")) { e.preventDefault(); e.target.blur(); }
    });
  }

  function emptyState() {
    return `
      <div class="empty-state" data-reveal>
        <div class="empty-art" aria-hidden="true">
          <span class="empty-ring"></span>${icon("cart", "empty-icon")}
        </div>
        <h2>Your cart is empty</h2>
        <p>Explore our crackers collection and add your favourite products.</p>
        <a class="btn btn-primary btn-lg" href="products.html">${icon("sparkle")} Shop Products</a>
      </div>`;
  }

  function rowHTML(l) {
    const p = l.product;
    const cat = UI.getCategory(p.category);
    const media = UI.productMedia(p, { w: 144, h: 144, cls: "cr-img" });
    return `
      <li class="cart-row" data-id="${p.id}" style="--h:${UI.productHue(p)}">
        <div class="cr-thumb">${media}</div>
        <div class="cr-info">
          <div class="cr-meta"><span class="code-badge">#${esc(padCode(p.serialNumber))}</span><span class="cr-cat">${esc(cat.name)}</span></div>
          <h3 class="cr-name">${esc(p.name)}</h3>
          <p class="cr-pack">${icon("box")} Pack: ${esc(p.pack)}</p>
        </div>
        <div class="cr-price"><span class="cr-label">Unit Price</span><strong>${formatINR(p.price)}</strong></div>
        <div class="cr-qty">
          <span class="cr-label" id="qlbl-${p.id}">Quantity</span>
          <div class="stepper" role="group" aria-labelledby="qlbl-${p.id}">
            <button type="button" class="qty-btn" data-act="dec" aria-label="Decrease quantity of ${esc(p.name)}" ${l.qty <= 1 ? "disabled" : ""}>${icon("minus")}</button>
            <input class="qty-input" type="number" inputmode="numeric" min="1" max="${Cart.max}" value="${l.qty}" aria-label="Quantity of ${esc(p.name)}">
            <button type="button" class="qty-btn" data-act="inc" aria-label="Increase quantity of ${esc(p.name)}" ${l.qty >= Cart.max ? "disabled" : ""}>${icon("plus")}</button>
          </div>
        </div>
        <div class="cr-sub"><span class="cr-label">Subtotal</span><strong data-sub>${formatINR(l.subtotal)}</strong></div>
        <button type="button" class="cr-remove" data-act="remove" aria-label="Remove ${esc(p.name)} from cart">${icon("trash")}<span>Remove</span></button>
      </li>`;
  }

  function summaryHTML(t) {
    return `
      <aside class="summary-card" aria-labelledby="sum-title">
        <h2 id="sum-title">Order Summary</h2>
        <dl class="sum-list">
          <div><dt>Products</dt><dd data-s="products">${formatNum(t.products)}</dd></div>
          <div><dt>Total Items</dt><dd data-s="items">${formatNum(t.items)}</dd></div>
          <div><dt>Subtotal</dt><dd data-s="subtotal">${formatINR(t.grandTotal)}</dd></div>
        </dl>
        <div class="grand-total">
          <span>Grand Total</span>
          <strong data-s="grand">${formatINR(t.grandTotal)}</strong>
        </div>
        <a class="btn btn-primary btn-lg btn-block" href="checkout.html" id="proceed-btn">Proceed to Order ${icon("arrowRight")}</a>
        <a class="btn btn-ghost btn-block" href="products.html">${icon("arrowLeft")} Continue Shopping</a>
        <ul class="sum-notes">
          <li>${icon("whatsapp")} Your order is sent to us on WhatsApp — no online payment.</li>
          <li>${icon("check")} We confirm availability and delivery with you before dispatch.</li>
        </ul>
      </aside>`;
  }

  function render() {
    const ls = Cart.lines();
    root.dataset.ids = ls.map((l) => l.product.id).join(",");
    document.querySelector(".mobile-checkout-bar")?.remove();

    if (!ls.length) {
      root.innerHTML = emptyState();
      UI.initReveal(root);
      return;
    }
    const t = Cart.totals();
    root.innerHTML = `
      <div class="cart-layout">
        <section class="cart-panel" aria-labelledby="cart-title">
          <header class="cart-panel-head">
            <h2 id="cart-title">${plural(t.products, "product", "products")} in your cart</h2>
            <button type="button" class="link-btn" data-act="clear">${icon("trash")} Clear cart</button>
          </header>
          <div class="cart-cols" aria-hidden="true"><span>Product</span><span>Unit Price</span><span>Quantity</span><span>Subtotal</span><span></span></div>
          <ul class="cart-list">${ls.map(rowHTML).join("")}</ul>
        </section>
        ${summaryHTML(t)}
      </div>`;

    const bar = document.createElement("aside");
    bar.className = "mobile-checkout-bar";
    bar.setAttribute("aria-label", "Cart total");
    bar.innerHTML = `
      <div><span>Grand Total · <span data-cart-count>${formatNum(t.items)}</span> <span data-cart-items-label>${t.items === 1 ? "Item" : "Items"}</span></span><strong data-cart-total>${formatINR(t.grandTotal)}</strong></div>
      <a class="btn btn-primary" href="checkout.html">Proceed ${icon("arrowRight")}</a>`;
    document.body.appendChild(bar);
    document.body.classList.add("has-checkout-bar");
  }

  function patch() {
    const t = Cart.totals();
    Cart.lines().forEach((l) => {
      const row = root.querySelector(`.cart-row[data-id="${l.product.id}"]`);
      if (!row) return;
      const input = row.querySelector(".qty-input");
      if (document.activeElement !== input) input.value = l.qty;
      const sub = row.querySelector("[data-sub]");
      const txt = formatINR(l.subtotal);
      if (sub.textContent !== txt) { sub.textContent = txt; flash(sub); }
      row.querySelector('[data-act="dec"]').disabled = l.qty <= 1;
      row.querySelector('[data-act="inc"]').disabled = l.qty >= Cart.max;
    });
    const set = (k, v) => { const el = root.querySelector(`[data-s="${k}"]`); if (el && el.textContent !== v) { el.textContent = v; flash(el); } };
    set("products", formatNum(t.products));
    set("items", formatNum(t.items));
    set("subtotal", formatINR(t.grandTotal));
    set("grand", formatINR(t.grandTotal));
  }

  function flash(el) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }

  function onClick(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;

    if (act === "clear") {
      const prev = Cart.clear();
      toast("Cart cleared.", { type: "info", action: { label: "Undo", onClick: () => Cart.restore(prev) } });
      return;
    }
    const row = btn.closest(".cart-row");
    if (!row) return;
    const id = Number(row.dataset.id);
    const p = Cart.product(id);
    const current = Cart.getQty(id);

    if (act === "inc") Cart.setQty(id, current + 1);
    else if (act === "dec") Cart.setQty(id, Math.max(1, current - 1));
    else if (act === "remove") {
      row.classList.add("is-removing");
      const done = () => {
        const snap = Cart.remove(id);
        toast(`${p.name} removed from cart.`, { type: "info", action: { label: "Undo", onClick: () => Cart.restore(snap) } });
      };
      UI.reducedMotion() ? done() : setTimeout(done, 220);
    }
  }

  function onChange(e) {
    if (!e.target.matches(".qty-input")) return;
    const row = e.target.closest(".cart-row");
    const id = Number(row.dataset.id);
    let v = Math.floor(Number(e.target.value));
    if (!Number.isFinite(v) || v < 1) {
      v = 1;
      toast("Quantity must be at least 1. Use Remove to delete a product.", { type: "error" });
    } else if (v > Cart.max) {
      v = Cart.max;
      toast(`Maximum ${Cart.max} per product.`, { type: "error" });
    }
    e.target.value = v;
    Cart.setQty(id, v);
  }

  return { init };
})();
