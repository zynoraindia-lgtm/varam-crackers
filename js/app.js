/* =====================================================================
   APP — boots shared UI and the current page (body[data-page])
   The home page (index.html) is the 3D page and doesn't use this file;
   the contact cards shown on contact.html are rendered here.
   ===================================================================== */
const Home = (() => {
  "use strict";
  const { formatINR, formatNum, esc, icon, illustration } = UI;

  function init() {
    UI.fireworks(document.getElementById("hero-canvas"));
    renderStats();
    renderCategories();
    renderHighlights();
    renderContact();
  }

  function renderStats() {
    const min = Math.min(...PRODUCTS.map((p) => p.price));
    const catCount = CATEGORIES.filter((c) => PRODUCTS.some((p) => p.category === c.id)).length;
    const set = (sel, v) => document.querySelectorAll(sel).forEach((el) => (el.textContent = v));
    set("[data-stat=products]", formatNum(PRODUCTS.length));
    set("[data-stat=categories]", formatNum(catCount));
    set("[data-stat=min-price]", formatINR(min));
  }

  function renderCategories() {
    const el = document.getElementById("category-grid");
    if (!el) return;
    el.innerHTML = CATEGORIES.map((c, i) => {
      const items = PRODUCTS.filter((p) => p.category === c.id);
      if (!items.length) return "";
      const from = Math.min(...items.map((p) => p.price));
      return `
        <a class="cat-tile" href="products.html?category=${encodeURIComponent(c.id)}" style="--h:${c.hue}; --d:${i * 40}ms" data-reveal>
          <span class="cat-art">${illustration(c.id)}</span>
          <span class="cat-name">${esc(c.name)}</span>
          <span class="cat-meta">${items.length} ${items.length === 1 ? "product" : "products"} · from ${formatINR(from)}</span>
          <span class="cat-go" aria-hidden="true">${icon("arrowRight")}</span>
        </a>`;
    }).join("") + `
      <a class="cat-tile all" href="products.html" style="--d:${CATEGORIES.length * 40}ms" data-reveal>
        <span class="cat-art">${icon("grid")}</span>
        <span class="cat-name">All Products</span>
        <span class="cat-meta">${formatNum(PRODUCTS.length)} products · every category</span>
        <span class="cat-go" aria-hidden="true">${icon("arrowRight")}</span>
      </a>`;
    UI.initReveal(el);
  }

  function renderHighlights() {
    const el = document.getElementById("highlight-grid");
    if (!el) return;
    const cat = el.dataset.category || "fancy-items";
    const picks = PRODUCTS.filter((p) => p.category === cat).sort((a, b) => b.price - a.price).slice(0, 4);
    el.innerHTML = picks.map(ProductCards.html).join("");
    ProductCards.bind(el);
  }

  function renderContact() {
    const el = document.getElementById("contact-cards");
    if (!el) return;
    const c = SHOP_CONFIG;
    const phones = [c.phone, ...(c.altPhones || [])].filter(Boolean);
    const tel = (p) => `tel:+91${String(p).replace(/\D/g, "").slice(-10)}`;
    const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.shopName}, ${c.address}`)}`;
    el.innerHTML = `
      <article class="contact-card wa" data-reveal>
        <span class="contact-ic">${icon("whatsapp")}</span>
        <h3>Order on WhatsApp</h3>
        <p>Questions about a product, stock or delivery? Message us directly.</p>
        <p class="contact-big">+91 ${esc(c.phone)}</p>
        <a class="btn btn-whatsapp" href="${esc(UI.WhatsAppLink.chat())}" target="_blank" rel="noopener">${icon("whatsapp", "wa-icon")} Chat on WhatsApp</a>
      </article>
      <article class="contact-card" data-reveal>
        <span class="contact-ic">${icon("phone")}</span>
        <h3>Call Us</h3>
        <p>Speak to the shop for bulk orders and order help.</p>
        <ul class="contact-phones">${phones.map((p) => `<li><a href="${tel(p)}">${icon("phone")} ${esc(p)}</a></li>`).join("")}</ul>
      </article>
      ${c.address ? `
      <article class="contact-card" data-reveal>
        <span class="contact-ic">${icon("pin")}</span>
        <h3>Visit the Shop</h3>
        <p class="contact-addr">${esc(c.address)}</p>
        <a class="btn btn-ghost" href="${maps}" target="_blank" rel="noopener">${icon("pin")} Get Directions</a>
      </article>` : ""}`;
    UI.initReveal(el);
  }

  return { init };
})();


/* ---------- Boot ---------- */
(() => {
  "use strict";
  UI.boot();
  UI.updateCartIndicators(Cart.totals());
  Cart.subscribe(UI.updateCartIndicators);

  const page = document.body.dataset.page;
  if (page === "contact") Home.init();   // contact cards + stats (the home page itself is the 3D page)
  else if (page === "products") ProductsPage.init();
  else if (page === "cart") CartPage.init();
  else if (page === "checkout") Checkout.init();

  if (!Cart.isPersistent()) {
    UI.toast("Your browser is blocking storage, so the cart will reset if you refresh or close this page.", { type: "info", duration: 6500 });
  }
  if (Cart.droppedOnLoad() > 0) {
    UI.toast("Some items in your saved cart are no longer available and were removed.", { type: "info", duration: 5000 });
  }
})();
