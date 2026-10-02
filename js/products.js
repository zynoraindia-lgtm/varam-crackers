/* =====================================================================
   PRODUCTS — product card component + Products page
   (search · category filter · price filter · sorting · live count)
   ===================================================================== */

/* ---------- Product card (used on Products page and Home highlights) ---------- */
const ProductCards = (() => {
  "use strict";
  const { formatINR, padCode, esc, icon, illustration, toast } = UI;
  const selected = new Map();            // id -> quantity chosen on the card (not yet in cart)
  const MAX = Cart.max;

  function html(p) {
    const cat = UI.getCategory(p.category);
    const media = UI.productMedia(p, { w: 320, h: 220, sizes: "(max-width: 767px) 48vw, (max-width: 1199px) 31vw, 290px" });
    return `
      <article class="p-card" data-id="${p.id}" style="--h:${UI.productHue(p)}">
        <div class="p-media${p.image ? " has-photo" : ""}">
          <span class="p-code" aria-label="Code ${esc(p.serialNumber)}">#${esc(padCode(p.serialNumber))}</span>
          <span class="p-incart" hidden>${icon("check")}<span class="p-incart-n">0</span>&nbsp;in cart</span>
          ${media}
        </div>
        <div class="p-body">
          <p class="p-cat">${esc(cat.name)}</p>
          <h3 class="p-name" id="pn-${p.id}">${esc(p.name)}</h3>
          <p class="p-pack">${icon("box")}<span>Pack: <strong>${esc(p.pack)}</strong></span></p>
          <div class="p-price-row">
            <span class="p-price">${formatINR(p.price)}</span>
            <span class="p-line" aria-hidden="true"></span>
          </div>
          <div class="p-actions">
            <div class="stepper" role="group" aria-label="Quantity for ${esc(p.name)}">
              <button type="button" class="qty-btn" data-act="dec" aria-label="Decrease quantity of ${esc(p.name)}" disabled>${icon("minus")}</button>
              <input class="qty-input" type="number" inputmode="numeric" min="0" max="${MAX}" value="0" aria-label="Quantity of ${esc(p.name)}">
              <button type="button" class="qty-btn" data-act="inc" aria-label="Increase quantity of ${esc(p.name)}">${icon("plus")}</button>
            </div>
            <button type="button" class="btn btn-add is-idle" data-act="add" aria-describedby="pn-${p.id}">
              <span class="add-label">${icon("cart")} Add to Cart</span>
              <span class="added-label" aria-hidden="true">${icon("check")} Added</span>
            </button>
          </div>
        </div>
      </article>`;
  }

  function setSelected(card, qty) {
    const id = Number(card.dataset.id);
    const p = Cart.product(id);
    const q = Math.max(0, Math.min(MAX, Math.floor(Number(qty)) || 0));
    selected.set(id, q);
    const input = card.querySelector(".qty-input");
    if (document.activeElement !== input || String(input.value) !== String(q)) input.value = q;
    card.querySelector('[data-act="dec"]').disabled = q <= 0;
    card.querySelector('[data-act="inc"]').disabled = q >= MAX;
    const add = card.querySelector('[data-act="add"]');
    add.classList.toggle("is-idle", q === 0);
    add.setAttribute("aria-disabled", String(q === 0));
    const line = card.querySelector(".p-line");
    line.textContent = q > 0 ? `${q} × ${formatINR(p.price)} = ${formatINR(p.price * q)}` : "";
    card.classList.toggle("has-qty", q > 0);
  }

  function syncInCart(scope = document) {
    scope.querySelectorAll(".p-card").forEach((card) => {
      const n = Cart.getQty(Number(card.dataset.id));
      const badge = card.querySelector(".p-incart");
      badge.hidden = n === 0;
      badge.querySelector(".p-incart-n").textContent = n;
      card.classList.toggle("in-cart", n > 0);
    });
  }

  function addToCart(card) {
    const id = Number(card.dataset.id);
    const p = Cart.product(id);
    const q = selected.get(id) || 0;
    const stepper = card.querySelector(".stepper");

    if (!p) { toast("Sorry, this product is no longer available.", { type: "error" }); return; }
    if (q < 1) {
      toast("Tap + to choose a quantity first.", { type: "info" });
      stepper.classList.remove("nudge"); void stepper.offsetWidth; stepper.classList.add("nudge");
      card.querySelector('[data-act="inc"]').focus();
      return;
    }
    const res = Cart.add(id, q);
    if (!res.ok) { toast("Could not add this product. Please try again.", { type: "error" }); return; }

    toast(`${p.name} × ${q} added to cart 🎆`, { type: "success" });
    if (res.capped) toast(`Maximum ${MAX} per product — your cart now has ${res.qty}.`, { type: "info" });

    const btn = card.querySelector('[data-act="add"]');
    btn.classList.add("is-added");
    setTimeout(() => btn.classList.remove("is-added"), 1300);
    setSelected(card, 0);
  }

  function bind(container) {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const card = btn.closest(".p-card");
      if (!card) return;
      const id = Number(card.dataset.id);
      const cur = selected.get(id) || 0;
      if (btn.dataset.act === "inc") setSelected(card, cur + 1);
      else if (btn.dataset.act === "dec") setSelected(card, cur - 1);
      else if (btn.dataset.act === "add") addToCart(card);
    });
    container.addEventListener("input", (e) => {
      if (!e.target.matches(".qty-input")) return;
      const card = e.target.closest(".p-card");
      const raw = e.target.value;
      if (raw === "") { selected.set(Number(card.dataset.id), 0); return; }
      const v = Number(raw);
      if (Number.isInteger(v) && v >= 0 && v <= MAX) setSelected(card, v);
    });
    container.addEventListener("change", (e) => {
      if (!e.target.matches(".qty-input")) return;
      const card = e.target.closest(".p-card");
      let v = Math.floor(Number(e.target.value));
      if (!Number.isFinite(v) || v < 0) { v = 0; if (e.target.value !== "") toast("Please enter a valid quantity.", { type: "error" }); }
      if (v > MAX) { v = MAX; toast(`Maximum ${MAX} per product.`, { type: "info" }); }
      e.target.value = v;
      setSelected(card, v);
    });
    container.addEventListener("keydown", (e) => {
      if (!e.target.matches(".qty-input")) return;
      if (e.key === "Enter") { e.preventDefault(); e.target.dispatchEvent(new Event("change", { bubbles: true })); addToCart(e.target.closest(".p-card")); }
    });
    // Select the whole number on focus so typing replaces the "0"
    container.addEventListener("focusin", (e) => { if (e.target.matches(".qty-input")) e.target.select(); });
    Cart.subscribe(() => syncInCart(container));
    syncInCart(container);
  }

  return { html, bind, syncInCart };
})();


/* ---------- Gift Boxes — poster cards at the top of the Products page ----------
   Reads the products that have a poster: in data/products.js (gift boxes and
   combo packs). Boxes without a poster are still in the price list below.
   The quantity on a card IS the cart quantity (same as the price-list rows).
   Tapping the poster opens the full poster with the list of items inside.
   ------------------------------------------------------------------------ */
const GiftBoxes = (() => {
  "use strict";
  const { formatINR, esc, icon, toast } = UI;
  const MAX = Cart.max;
  let grid, dialog, dlgImg, dlgTitle, dlgFoot, current = null;

  const boxes = () => PRODUCTS.filter((p) => p.poster);
  /* Card title: "Gift Box", or e.g. "Leo Combo" for LEO COMBO PACK */
  const label = (p) => p.category === "combo-packs"
    ? p.name.replace(/\s*PACK$/i, "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : "Gift Box";

  function stepperHTML(p) {
    const name = esc(p.name);
    return `
      <div class="stepper" role="group" aria-label="Quantity for ${name}">
        <button type="button" class="qty-btn" data-act="dec" aria-label="Decrease quantity of ${name}" disabled>${icon("minus")}</button>
        <input class="qty-input" type="number" inputmode="numeric" min="0" max="${MAX}" step="1" value="" placeholder="0" aria-label="Quantity of ${name}">
        <button type="button" class="qty-btn" data-act="inc" aria-label="Increase quantity of ${name}">${icon("plus")}</button>
      </div>`;
  }

  function cardHTML(p) {
    return `
      <article class="gb-card" data-id="${p.id}">
        <button type="button" class="gb-media" data-act="view" aria-label="View everything inside ${esc(p.name)}">
          <img src="${esc(p.card || p.poster || p.image)}" alt="${esc(p.name)} poster with the list of crackers inside" width="600" height="900" loading="lazy" decoding="async">
          <span class="gb-view">${icon("list")} View ${p.items ? `${p.items} items` : "items"}</span>
        </button>
        <div class="gb-body">
          <div class="gb-row">
            <h3 class="gb-name">${esc(label(p))}</h3>
            <span class="gb-price">${formatINR(p.price)}</span>
          </div>
          <p class="gb-meta">${icon("box")}<span>${p.items ? `${p.items} items` : esc(p.pack)} · Code ${esc(p.serialNumber)}</span></p>
          ${stepperHTML(p)}
          <p class="gb-amt" aria-live="polite"></p>
        </div>
      </article>`;
  }

  function paint(scope) {
    scope.querySelectorAll("[data-id]").forEach((el) => {
      const id = Number(el.dataset.id);
      const p = Cart.product(id);
      if (!p) return;
      const q = Cart.getQty(id);
      const input = el.querySelector(".qty-input");
      if (input && document.activeElement !== input) input.value = q > 0 ? q : "";
      const dec = el.querySelector('[data-act="dec"]'), inc = el.querySelector('[data-act="inc"]');
      if (dec) dec.disabled = q <= 0;
      if (inc) inc.disabled = q >= MAX;
      const amt = el.querySelector(".gb-amt");
      if (amt) amt.textContent = q > 0 ? `${q} in cart · ${formatINR(p.price * q)}` : "";
      el.classList.toggle("in-cart", q > 0);
    });
  }
  const syncAll = () => { if (grid) paint(grid); if (dlgFoot) paint(dlgFoot); };

  function setQty(id, qty) {
    const p = Cart.product(id);
    const q = Math.max(0, Math.min(MAX, Math.floor(Number(qty)) || 0));
    const cur = Cart.getQty(id);
    if (q === cur) { syncAll(); return; }
    if (cur === 0) Cart.add(id, q); else Cart.setQty(id, q);
    if (cur === 0 && q > 0 && p) toast(`${p.name} added to cart 🎁`, { type: "success" });
  }

  function open(id) {
    const p = Cart.product(id);
    if (!p) return;
    current = id;
    dlgTitle.textContent = `${p.name} — ${p.items ? `${p.items} items` : p.pack}`;
    dlgImg.src = p.poster || p.card || p.image;
    dlgImg.alt = `${p.name} — full list of crackers inside`;
    dlgFoot.innerHTML = `<div class="gb-foot-in" data-id="${p.id}"><span class="gb-price">${formatINR(p.price)}</span>${stepperHTML(p)}<p class="gb-amt"></p></div>`;
    paint(dlgFoot);
    if (typeof dialog.showModal === "function") dialog.showModal(); else window.open(dlgImg.src, "_blank");
  }

  function bind(container) {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn || btn.disabled) return;
      const id = Number(btn.closest("[data-id]").dataset.id);
      if (btn.dataset.act === "view") { open(id); return; }
      const cur = Cart.getQty(id);
      setQty(id, btn.dataset.act === "inc" ? cur + 1 : cur - 1);
    });
    container.addEventListener("input", (e) => {
      if (!e.target.matches(".qty-input") || e.target.value === "") return;
      const v = Number(e.target.value);
      if (Number.isInteger(v) && v >= 0 && v <= MAX) setQty(Number(e.target.closest("[data-id]").dataset.id), v);
    });
    container.addEventListener("change", (e) => {
      if (!e.target.matches(".qty-input")) return;
      let v = e.target.value === "" ? 0 : Math.floor(Number(e.target.value));
      if (!Number.isFinite(v) || v < 0) v = 0;
      if (v > MAX) { v = MAX; toast(`Maximum ${MAX} per product.`, { type: "info" }); }
      setQty(Number(e.target.closest("[data-id]").dataset.id), v);
      syncAll();
    });
    container.addEventListener("focusin", (e) => { if (e.target.matches(".qty-input")) e.target.select(); });
  }

  function init() {
    grid = document.getElementById("gb-grid");
    const list = boxes();
    const section = document.getElementById("gift-boxes");
    if (!grid) return;
    if (!list.length) { if (section) section.hidden = true; return; }
    grid.innerHTML = list.map(cardHTML).join("");
    bind(grid);

    dialog = document.getElementById("gb-dialog");
    dlgImg = document.getElementById("gb-dialog-img");
    dlgTitle = document.getElementById("gb-dialog-title");
    dlgFoot = document.getElementById("gb-dialog-foot");
    if (dialog) {
      bind(dlgFoot);
      document.getElementById("gb-close").addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });   // tap outside = close
      dialog.addEventListener("close", () => { current = null; });
    }
    syncAll();
    Cart.subscribe(syncAll);
  }

  return { init };
})();


/* ---------- Products page — Excel-style price list (no photos) ----------
   Every product is one row of the sheet: Code · Product · Pack · Price ·
   Quantity · Amount. The quantity typed in a row IS the cart quantity, so
   the amount, the cart badge and the total at the bottom update instantly.
   ------------------------------------------------------------------------ */
const ProductsPage = (() => {
  "use strict";
  const { formatINR, formatNum, esc, icon, toast } = UI;
  const MAX = Cart.max;

  const PRICE_RANGES = [
    { id: "under-100", min: 0, max: 99.99, label: () => `Under ${formatINR(100)}` },
    { id: "100-500", min: 100, max: 500, label: () => `${formatINR(100)} – ${formatINR(500)}` },
    { id: "500-1000", min: 500.01, max: 1000, label: () => `${formatINR(500)} – ${formatINR(1000)}` },
    { id: "above-1000", min: 1000.01, max: Infinity, label: () => `Above ${formatINR(1000)}` }
  ];
  const SORTS = {
    default: null,
    "price-asc": (a, b) => a.price - b.price || a.id - b.id,
    "price-desc": (a, b) => b.price - a.price || a.id - b.id,
    "name-asc": (a, b) => a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" }),
    "name-desc": (a, b) => b.name.localeCompare(a.name, "en", { numeric: true, sensitivity: "base" })
  };

  const norm = (s) => String(s).toLowerCase().replace(/["'′″`]/g, "").replace(/[()&,.\-/]/g, " ").replace(/\s+/g, " ").trim();
  const index = PRODUCTS.map((p, i) => ({
    p, order: i,
    hay: norm(`${p.name} ${/^\d+$/.test(p.serialNumber) ? "" : p.serialNumber}`),   // search by product name (and text codes like GB500) …
    code: String(p.serialNumber).replace(/^0+/, "")   // … or by serial number / code
  }));

  const state = { q: "", cat: "all", price: "all", sort: "default" };
  let sheetEl, tableEl, tbody, totalEl, countEl, resetBtn, searchEl, clearBtn, priceEl, sortEl, chipRow, emptyEl, filterToggle, toolbar;
  const rows = new Map();     // id -> <tr>
  const heads = new Map();    // category id -> group <tr>
  let welcomed = false;       // one-time "added to cart" hint

  function init() {
    tbody = document.getElementById("product-rows");
    if (!tbody) return;
    sheetEl = document.getElementById("sheet");
    tableEl = document.getElementById("product-table");
    totalEl = document.getElementById("sheet-total");
    countEl = document.getElementById("result-count");
    resetBtn = document.getElementById("reset-filters");
    searchEl = document.getElementById("catalog-search");
    clearBtn = document.getElementById("search-clear");
    priceEl = document.getElementById("price-filter");
    sortEl = document.getElementById("sort-select");
    chipRow = document.getElementById("chip-row");
    emptyEl = document.getElementById("no-results");
    filterToggle = document.getElementById("filter-toggle");
    toolbar = document.querySelector(".catalog-toolbar");

    GiftBoxes.init();
    buildControls();
    readURL();
    buildRows();
    fitGroupRows();
    bindSheet();
    bindControls();
    trackToolbarHeight();
    update(false);
    syncAll();
    Cart.subscribe(syncAll);
  }

  function buildControls() {
    // Category chips (from the PDF sections) with counts
    const counts = new Map();
    PRODUCTS.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    const chips = [{ id: "all", name: "All", n: PRODUCTS.length, icon: null }]
      .concat(CATEGORIES.filter((c) => counts.get(c.id)).map((c) => ({ id: c.id, name: c.name, n: counts.get(c.id), icon: c.icon })));
    chipRow.innerHTML = chips.map((c) => `
      <button type="button" class="chip" data-cat="${esc(c.id)}" aria-pressed="false">
        ${c.icon ? `<svg class="chip-ill" viewBox="0 0 120 120" aria-hidden="true"><use href="#ill-${c.icon}"></use></svg>` : icon("grid", "chip-ill")}
        <span>${esc(c.name)}</span><span class="chip-n">${c.n}</span>
      </button>`).join("");

    // Price ranges: only ranges that actually contain products are offered
    const opts = [`<option value="all">All prices</option>`];
    PRICE_RANGES.forEach((r) => {
      const n = PRODUCTS.filter((p) => p.price >= r.min && p.price <= r.max).length;
      if (n) opts.push(`<option value="${r.id}">${r.label()} (${n})</option>`);
    });
    priceEl.innerHTML = opts.join("");
  }

  /* ---------- Sheet rows ---------- */
  function rowHTML(p) {
    const cat = UI.getCategory(p.category);
    const name = esc(p.name);
    return `
      <tr class="t-row" data-id="${p.id}">
        <td class="c-code${String(p.serialNumber).length > 4 ? " is-long" : ""}">${esc(p.serialNumber).replace(/^([A-Za-z]+)(\d+)$/, "<span class=\"code-pre\">$1</span>$2")}</td>
        <th class="c-name" scope="row">
          <span class="t-name" id="pn-${p.id}">${name}</span>
          <span class="t-cat">${esc(cat.name)}</span>
          <span class="t-pack-m">${esc(p.pack)}</span>
        </th>
        <td class="c-pack">${esc(p.pack)}</td>
        <td class="c-price">${formatINR(p.price)}</td>
        <td class="c-qty">
          <div class="stepper" role="group" aria-label="Quantity for ${name}">
            <button type="button" class="qty-btn" data-act="dec" aria-label="Decrease quantity of ${name}" disabled>${icon("minus")}</button>
            <input class="qty-input" type="number" inputmode="numeric" min="0" max="${MAX}" step="1" value="" placeholder="0" enterkeyhint="next" aria-label="Quantity of ${name}">
            <button type="button" class="qty-btn" data-act="inc" aria-label="Increase quantity of ${name}">${icon("plus")}</button>
          </div>
          <span class="t-amt-m" aria-hidden="true"></span>
        </td>
        <td class="c-amt is-empty">–</td>
      </tr>`;
  }

  function buildRows() {
    const tpl = document.createElement("template");
    tpl.innerHTML = `<table><tbody>${PRODUCTS.map(rowHTML).join("")}</tbody></table>`;
    tpl.content.querySelectorAll("tr.t-row").forEach((tr) => rows.set(Number(tr.dataset.id), tr));
    CATEGORIES.forEach((c) => {
      const tr = document.createElement("tr");
      tr.className = "t-group";
      tr.innerHTML = `<th colspan="6" scope="colgroup"><span class="t-group-in"><span class="t-group-name">${esc(c.name)}</span><span class="t-group-n"></span></span></th>`;
      heads.set(c.id, tr);
    });
  }

  /* Category bands span exactly the visible columns (phones hide Pack and Amount) */
  function fitGroupRows() {
    const set = () => {
      const n = [...tableEl.tHead.rows[0].cells].filter((c) => getComputedStyle(c).display !== "none").length || 6;
      heads.forEach((tr) => { tr.firstElementChild.colSpan = n; });
    };
    set();
    const mq = window.matchMedia("(max-width: 767px)");
    if (mq.addEventListener) mq.addEventListener("change", set); else window.addEventListener("resize", set);
  }

  /* Paint one row from the cart quantity (never overwrite the cell being typed in) */
  function paintRow(tr, q) {
    const p = Cart.product(Number(tr.dataset.id));
    const input = tr.querySelector(".qty-input");
    if (document.activeElement !== input) input.value = q > 0 ? q : "";
    tr.querySelector('[data-act="dec"]').disabled = q <= 0;
    tr.querySelector('[data-act="inc"]').disabled = q >= MAX;
    const amt = tr.querySelector(".c-amt");
    amt.textContent = q > 0 ? formatINR(p.price * q) : "–";
    amt.classList.toggle("is-empty", q === 0);
    tr.querySelector(".t-amt-m").textContent = q > 0 ? `= ${formatINR(p.price * q)}` : "";
    tr.classList.toggle("in-cart", q > 0);
  }

  function paintTotal() {
    const t = Cart.totals();
    const empty = t.items === 0;
    totalEl.classList.toggle("is-empty", empty);
    totalEl.querySelector("#st-meta").textContent = empty
      ? "Enter a quantity next to any product to start your order."
      : `${formatNum(t.products)} ${t.products === 1 ? "product" : "products"} · ${formatNum(t.items)} ${t.items === 1 ? "item" : "items"} in your cart`;
    totalEl.querySelector("#st-amount").textContent = formatINR(t.grandTotal);
    totalEl.querySelector("#st-cta").hidden = empty;
  }

  function syncAll() {
    rows.forEach((tr, id) => paintRow(tr, Cart.getQty(id)));
    paintTotal();
  }

  /* Write a quantity straight to the cart (0 removes the product) */
  function setQty(id, qty) {
    const q = Math.max(0, Math.min(MAX, Math.floor(Number(qty)) || 0));
    const cur = Cart.getQty(id);
    if (q === cur) { paintRow(rows.get(id), q); return; }
    const wasEmpty = Cart.totals().items === 0;
    if (cur === 0) Cart.add(id, q); else Cart.setQty(id, q);   // Cart notifies → syncAll()
    if (wasEmpty && q > 0 && !welcomed) {
      welcomed = true;
      toast("Added to cart 🎆 Keep entering quantities — your total updates automatically.", { type: "success" });
    }
  }

  function commitInput(input) {
    const id = Number(input.closest(".t-row").dataset.id);
    const raw = String(input.value).trim();
    let v = raw === "" ? 0 : Math.floor(Number(raw));
    if (!Number.isFinite(v) || v < 0) { v = 0; toast("Please enter a valid quantity.", { type: "error" }); }
    if (v > MAX) { v = MAX; toast(`Maximum ${MAX} per product.`, { type: "info" }); }
    input.value = v > 0 ? v : "";
    setQty(id, v);
  }

  /* Keep a row clear of the sticky header / toolbar / column titles and the floating cart bar */
  function ensureVisible(el) {
    const r = el.getBoundingClientRect();
    const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 72;
    const top = headerH + (toolbar ? toolbar.offsetHeight : 0) + (tableEl.tHead ? tableEl.tHead.offsetHeight : 0);
    const bottom = window.innerHeight - 96;
    if (r.top < top) window.scrollBy({ top: r.top - top - 4, behavior: "instant" });
    else if (r.bottom > bottom) window.scrollBy({ top: r.bottom - bottom + 4, behavior: "instant" });
  }

  function bindSheet() {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn || btn.disabled) return;
      const id = Number(btn.closest(".t-row").dataset.id);
      const cur = Cart.getQty(id);
      setQty(id, btn.dataset.act === "inc" ? cur + 1 : cur - 1);
    });
    // Live: every valid number typed goes to the cart right away
    tbody.addEventListener("input", (e) => {
      if (!e.target.matches(".qty-input")) return;
      const raw = e.target.value;
      if (raw === "") return;
      const v = Number(raw);
      if (Number.isInteger(v) && v >= 0 && v <= MAX) setQty(Number(e.target.closest(".t-row").dataset.id), v);
    });
    tbody.addEventListener("change", (e) => { if (e.target.matches(".qty-input")) commitInput(e.target); });
    // Enter = next row, Shift+Enter = previous row (like a spreadsheet)
    tbody.addEventListener("keydown", (e) => {
      if (!e.target.matches(".qty-input") || e.key !== "Enter") return;
      e.preventDefault();
      commitInput(e.target);
      const inputs = [...tbody.querySelectorAll(".qty-input")];
      const next = inputs[inputs.indexOf(e.target) + (e.shiftKey ? -1 : 1)];
      if (next) { next.focus({ preventScroll: true }); ensureVisible(next.closest("tr")); }
      else e.target.blur();
    });
    // Select the whole number on focus so typing replaces it
    tbody.addEventListener("focusin", (e) => { if (e.target.matches(".qty-input")) e.target.select(); });
    // A cell that was left empty shows the cart quantity again
    tbody.addEventListener("focusout", (e) => {
      if (!e.target.matches(".qty-input")) return;
      const tr = e.target.closest(".t-row");
      setTimeout(() => { if (document.activeElement !== e.target) paintRow(tr, Cart.getQty(Number(tr.dataset.id))); }, 0);
    });
  }

  /* The column titles stick just below the search/filter bar */
  function trackToolbarHeight() {
    if (!toolbar) return;
    const set = () => document.documentElement.style.setProperty("--toolbar-h", `${toolbar.offsetHeight}px`);
    set();
    if ("ResizeObserver" in window) new ResizeObserver(set).observe(toolbar);
    else window.addEventListener("resize", set);
  }

  /* ---------- Search / filter / sort ---------- */
  function bindControls() {
    let t;
    searchEl.addEventListener("input", () => {
      clearBtn.hidden = !searchEl.value;
      clearTimeout(t);
      t = setTimeout(() => { state.q = searchEl.value; update(true); }, 90);
    });
    searchEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); searchEl.blur(); }
      if (e.key === "Escape" && searchEl.value) { e.preventDefault(); clearSearch(); }
    });
    clearBtn.addEventListener("click", () => { clearSearch(); searchEl.focus(); });

    chipRow.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      state.cat = chip.dataset.cat;
      update(true);
      chip.scrollIntoView({ block: "nearest", inline: "center", behavior: UI.reducedMotion() ? "auto" : "smooth" });
    });
    priceEl.addEventListener("change", () => { state.price = priceEl.value; update(true); });
    sortEl.addEventListener("change", () => { state.sort = sortEl.value; update(true); });
    resetBtn.addEventListener("click", resetAll);
    document.getElementById("empty-reset")?.addEventListener("click", resetAll);

    filterToggle?.addEventListener("click", () => {
      const open = filterToggle.getAttribute("aria-expanded") !== "true";
      filterToggle.setAttribute("aria-expanded", String(open));
      document.getElementById("toolbar-extra").classList.toggle("is-open", open);
    });

    // Press "/" to jump to search
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !e.target.closest("input, textarea, select")) { e.preventDefault(); searchEl.focus(); }
    });
  }

  function clearSearch() { searchEl.value = ""; clearBtn.hidden = true; state.q = ""; update(true); }

  function resetAll() {
    Object.assign(state, { q: "", cat: "all", price: "all", sort: "default" });
    searchEl.value = ""; clearBtn.hidden = true;
    update(true);
  }

  function readURL() {
    const sp = new URLSearchParams(location.search);
    const cat = sp.get("category");
    if (cat && CATEGORIES.some((c) => c.id === cat)) state.cat = cat;
    if (sp.get("q")) state.q = sp.get("q").slice(0, 60);
    if (PRICE_RANGES.some((r) => r.id === sp.get("price"))) state.price = sp.get("price");
    if (sp.get("sort") in SORTS) state.sort = sp.get("sort");
    searchEl.value = state.q;
    clearBtn.hidden = !state.q;
  }

  function writeURL() {
    const sp = new URLSearchParams();
    if (state.cat !== "all") sp.set("category", state.cat);
    if (state.q.trim()) sp.set("q", state.q.trim());
    if (state.price !== "all") sp.set("price", state.price);
    if (state.sort !== "default") sp.set("sort", state.sort);
    const qs = sp.toString();
    try { history.replaceState(null, "", qs ? `?${qs}` : location.pathname); } catch (e) { /* file:// in some browsers */ }
  }

  function matches(entry, tokens, range) {
    const p = entry.p;
    if (state.cat !== "all" && p.category !== state.cat) return false;
    if (range && !(p.price >= range.min && p.price <= range.max)) return false;
    return tokens.every((tk) => {
      const num = tk.replace(/^#/, "");
      if (/^\d+$/.test(num) && num.replace(/^0+/, "") === entry.code) return true;   // serial number
      return entry.hay.includes(tk.replace(/^#/, ""));
    });
  }

  function update(userAction) {
    const tokens = norm(state.q).split(" ").filter(Boolean);
    const range = PRICE_RANGES.find((r) => r.id === state.price) || null;
    let list = index.filter((e) => matches(e, tokens, range)).map((e) => e.p);
    if (SORTS[state.sort]) list = list.slice().sort(SORTS[state.sort]);

    // Controls reflect state
    chipRow.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.cat === state.cat)));
    priceEl.value = state.price;
    sortEl.value = state.sort;
    const filtered = state.q.trim() || state.cat !== "all" || state.price !== "all" || state.sort !== "default";
    resetBtn.hidden = !filtered;
    const extraActive = state.price !== "all" || state.sort !== "default";
    filterToggle?.classList.toggle("is-active", extraActive);

    // Build the rows (grouped by PDF section when using the default order)
    const frag = document.createDocumentFragment();
    let k = 0;
    const pushRow = (p) => {
      const tr = rows.get(p.id);
      tr.classList.toggle("t-alt", k++ % 2 === 1);
      frag.appendChild(tr);
    };
    if (state.sort === "default") {
      CATEGORIES.forEach((c) => {
        const group = list.filter((p) => p.category === c.id);
        if (!group.length) return;
        const h = heads.get(c.id);
        h.querySelector(".t-group-n").textContent = `${group.length} ${group.length === 1 ? "product" : "products"}`;
        frag.appendChild(h);
        k = 0;
        group.forEach(pushRow);
      });
      list.filter((p) => !heads.has(p.category)).forEach(pushRow);
    } else {
      list.forEach(pushRow);
    }
    sheetEl.classList.toggle("is-grouped", state.sort === "default");
    tbody.replaceChildren(frag);

    const n = list.length;
    tableEl.hidden = n === 0;
    countEl.innerHTML = `Showing <strong>${formatNum(n)}</strong> ${n === 1 ? "Product" : "Products"}${n !== PRODUCTS.length ? ` <span class="of-total">of ${formatNum(PRODUCTS.length)}</span>` : ""}`;
    emptyEl.hidden = n > 0;
    if (!n) {
      document.getElementById("no-results-q").textContent = state.q.trim()
        ? `We couldn't find anything for “${state.q.trim()}”.`
        : "No products match these filters.";
    }

    if (userAction) {
      writeURL();
      const top = document.getElementById("catalog-top").getBoundingClientRect().top;
      const offset = (toolbar ? toolbar.offsetHeight : 0) + parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h") || 72, 10);
      if (top < offset - 2) {
        window.scrollTo({ top: window.scrollY + top - offset + 1, behavior: UI.reducedMotion() ? "auto" : "smooth" });
      }
    }
  }

  return { init };
})();
