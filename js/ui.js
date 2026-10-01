/* =====================================================================
   UI — shared helpers used by every page
   formatting · icons · toasts · header · footer · floating cart bar ·
   fireworks canvas · button ripple · scroll reveal
   ===================================================================== */
const UI = (() => {
  "use strict";

  /* ---------- Formatting ---------- */
  const inrFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0, minimumFractionDigits: 0
  });
  const numFormatter = new Intl.NumberFormat("en-IN");
  const formatINR = (n) => inrFormatter.format(Math.round(Number(n) || 0));
  const formatNum = (n) => numFormatter.format(Number(n) || 0);
  const padCode = (code) => {
    const s = String(code).trim();
    return /^\d+$/.test(s) ? s.padStart(3, "0") : s;
  };
  const plural = (n, one, many) => `${formatNum(n)} ${n === 1 ? one : many}`;

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

  const reducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Icons ---------- */
  const icon = (name, cls = "") =>
    `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;

  const categoryById = new Map((typeof CATEGORIES !== "undefined" ? CATEGORIES : []).map((c) => [c.id, c]));
  const getCategory = (id) => categoryById.get(id) || { id: "other", name: "Other", icon: "star", hue: 40 };

  /* Slight per-product colour variation so placeholder cards don't look identical */
  const productHue = (p) => getCategory(p.category).hue + ((p.id * 47) % 44) - 22;

  const illustration = (catId, cls = "") => {
    const c = getCategory(catId);
    return `<svg class="ill ${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><use href="#ill-${c.icon}"></use></svg>`;
  };

  /* ---------- Product photos ----------
     p.image can be a local file ("assets/images/products/017.webp") or a web
     address. Unsplash addresses are resized on their CDN, so we request the
     exact size each place needs (and a 2× version for sharp phone screens). */
  const isUnsplash = (url) => /^https:\/\/images\.unsplash\.com\//.test(url);
  const sized = (url, w, h) => url.replace(/([?&])w=\d+/, `$1w=${w}`).replace(/([?&])h=\d+/, `$1h=${h}`);

  /** <img> for a product, or its drawn illustration when there is no photo */
  function productMedia(p, { w = 320, h = 220, sizes = "", cls = "p-img", eager = false } = {}) {
    if (!p.image) return illustration(p.category);
    const alt = `${p.name} (illustrative photo)`;
    let src = p.image, srcset = "";
    if (isUnsplash(p.image)) {
      src = sized(p.image, w, h);
      srcset = ` srcset="${esc(sized(p.image, w, h))} ${w}w, ${esc(sized(p.image, w * 2, h * 2))} ${w * 2}w"${sizes ? ` sizes="${sizes}"` : ""}`;
    }
    return `<img class="${cls}" src="${esc(src)}"${srcset} alt="${esc(alt)}" width="${w}" height="${h}" ${eager ? "" : 'loading="lazy" '}decoding="async" data-cat="${esc(p.category)}">`;
  }

  /* If a photo can't load (offline, blocked, removed) show the illustration instead */
  function initPhotoFallback() {
    document.addEventListener("error", (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || !img.dataset.cat) return;
      img.insertAdjacentHTML("afterend", illustration(img.dataset.cat));
      img.parentElement?.classList.remove("has-photo");
      img.remove();
    }, true);
  }

  function injectSprite() {
    if (document.getElementById("vc-sprite") || typeof ICON_SPRITE === "undefined") return;
    const holder = document.createElement("div");
    holder.id = "vc-sprite";
    holder.innerHTML = ICON_SPRITE;
    document.body.prepend(holder);
  }

  /* ---------- Toasts ---------- */
  let toastRegion = null;
  function ensureToastRegion() {
    if (toastRegion) return toastRegion;
    toastRegion = document.createElement("div");
    toastRegion.className = "toast-region";
    toastRegion.setAttribute("role", "status");
    toastRegion.setAttribute("aria-live", "polite");
    document.body.appendChild(toastRegion);
    return toastRegion;
  }

  /**
   * toast("Saved!", { type: "success" | "error" | "info", action: { label, onClick }, duration })
   */
  function toast(message, opts = {}) {
    const { type = "success", action = null, duration = action ? 5200 : 3200 } = opts;
    const region = ensureToastRegion();
    while (region.children.length >= 3) region.firstElementChild.remove();

    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    const ic = type === "error" ? "alert" : type === "info" ? "info" : "check";
    el.innerHTML = `<span class="toast-icon">${icon(ic)}</span><span class="toast-msg"></span>`;
    el.querySelector(".toast-msg").textContent = message;

    if (action) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "toast-action";
      b.textContent = action.label;
      b.addEventListener("click", () => { action.onClick(); dismiss(); });
      el.appendChild(b);
    }
    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast-close";
    close.setAttribute("aria-label", "Dismiss notification");
    close.innerHTML = icon("close");
    close.addEventListener("click", () => dismiss());
    el.appendChild(close);

    region.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-in"));

    let timer = setTimeout(dismiss, duration);
    el.addEventListener("mouseenter", () => clearTimeout(timer));
    el.addEventListener("mouseleave", () => { timer = setTimeout(dismiss, 1800); });

    function dismiss() {
      clearTimeout(timer);
      if (!el.isConnected) return;
      el.classList.remove("is-in");
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 260);
    }
    return dismiss;
  }

  /* ---------- Header ---------- */
  function initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Active link
    const page = document.body.dataset.page;
    header.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.dataset.nav === page) a.setAttribute("aria-current", "page");
    });

    // Brand text from config
    document.querySelectorAll("[data-shop-name]").forEach((el) => (el.textContent = SHOP_CONFIG.shopName));

    // Mobile menu
    const toggle = header.querySelector(".nav-toggle");
    const menu = document.getElementById("site-nav");
    if (toggle && menu) {
      const setOpen = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        toggle.innerHTML = icon(open ? "close" : "menu");
        header.classList.toggle("menu-open", open);
        document.body.classList.toggle("no-scroll", open);
      };
      toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
      menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && header.classList.contains("menu-open")) { setOpen(false); toggle.focus(); }
      });
      window.matchMedia("(min-width: 900px)").addEventListener?.("change", (mq) => { if (mq.matches) setOpen(false); });
    }
  }

  /* Update every [data-cart-count] / [data-cart-total] on the page */
  let lastCount = null;
  function updateCartIndicators(totals) {
    document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = formatNum(totals.items)));
    document.querySelectorAll("[data-cart-total]").forEach((el) => (el.textContent = formatINR(totals.grandTotal)));
    document.querySelectorAll("[data-cart-items-label]").forEach((el) => (el.textContent = totals.items === 1 ? "Item" : "Items"));
    document.querySelectorAll(".cart-link").forEach((el) => {
      el.setAttribute("aria-label", `Cart, ${plural(totals.items, "item", "items")}, ${formatINR(totals.grandTotal)}`);
      el.classList.toggle("has-items", totals.items > 0);
    });
    if (lastCount !== null && totals.items !== lastCount) {
      document.querySelectorAll(".cart-badge, .cartbar-count").forEach((b) => {
        b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
      });
    }
    lastCount = totals.items;

    const bar = document.querySelector(".cartbar");
    if (bar) {
      const show = totals.items > 0;
      bar.classList.toggle("is-visible", show);
      bar.setAttribute("aria-hidden", String(!show));
      bar.querySelectorAll("a").forEach((a) => (a.tabIndex = show ? 0 : -1));
      document.body.classList.toggle("has-cartbar", show);
    }
  }

  /* ---------- Floating cart bar (Home + Products) ---------- */
  function renderCartBar() {
    if (!document.body.hasAttribute("data-cartbar")) return;
    const bar = document.createElement("aside");
    bar.className = "cartbar";
    bar.setAttribute("aria-label", "Cart summary");
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = `
      <a class="cartbar-inner" href="cart.html" tabindex="-1">
        <span class="cartbar-icon">${icon("cart")}<span class="cartbar-count" data-cart-count>0</span></span>
        <span class="cartbar-text">
          <span class="cartbar-items"><span data-cart-count>0</span> <span data-cart-items-label>Items</span></span>
          <strong class="cartbar-total" data-cart-total>₹0</strong>
        </span>
        <span class="cartbar-cta">View Cart ${icon("arrowRight")}</span>
      </a>`;
    document.body.appendChild(bar);
  }

  /* ---------- Footer (built from SHOP_CONFIG — no business info in HTML) ---------- */
  function renderFooter() {
    const f = document.getElementById("site-footer");
    if (!f) return;
    const c = SHOP_CONFIG;
    const phones = [c.phone, ...(c.altPhones || [])].filter(Boolean);
    const tel = (p) => `tel:+91${String(p).replace(/\D/g, "").slice(-10)}`;
    const cats = (typeof CATEGORIES !== "undefined" ? CATEGORIES : []).slice(0, 6);

    f.innerHTML = `
      <div class="footer-glow" aria-hidden="true"></div>
      <div class="container footer-grid">
        <div class="footer-brand">
          <a class="brand" href="index.html" aria-label="${esc(c.shopName)} home">
            <img src="assets/logo/varam-logo-sm.webp" width="44" height="66" alt="" loading="lazy" decoding="async">
            <span class="brand-text"><span class="brand-name">${esc(c.shopName)}</span><span class="brand-sub">Premium Crackers Collection</span></span>
          </a>
          <p class="footer-tagline">${esc(c.tagline)}</p>
          <p class="footer-note">${icon("tag")} Prices as per our ${esc(c.priceListLabel)}. Orders are confirmed by the shop on WhatsApp — no online payment on this website.</p>
        </div>
        <nav class="footer-col" aria-label="Quick links">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="products.html">Products</a></li>
            <li><a href="cart.html">Cart</a></li>
            <li><a href="contact.html">Contact &amp; Order Help</a></li>
          </ul>
        </nav>
        <nav class="footer-col" aria-label="Popular categories">
          <h3>Categories</h3>
          <ul>${cats.map((k) => `<li><a href="products.html?category=${encodeURIComponent(k.id)}">${esc(k.name)}</a></li>`).join("")}
            <li><a href="products.html">All categories →</a></li>
          </ul>
        </nav>
        <div class="footer-col" id="footer-contact">
          <h3>Contact</h3>
          <ul class="footer-contact">
            ${phones.map((p) => `<li>${icon("phone")}<a href="${tel(p)}">${esc(p)}</a></li>`).join("")}
            ${c.whatsappNumber ? `<li>${icon("whatsapp")}<a href="${WhatsAppLink.chat()}" target="_blank" rel="noopener">WhatsApp: ${esc(c.phone)}</a></li>` : ""}
            ${c.address ? `<li>${icon("pin")}<span>${esc(c.address)}</span></li>` : ""}
          </ul>
        </div>
      </div>
      <div class="container footer-bottom">
        <p class="footer-safety">${icon("shield")} Please use fireworks responsibly and follow all local safety regulations. Adult supervision is recommended where appropriate.</p>
        <p class="footer-credit">Product photos: <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a> (free licence), for illustration only — actual product and packaging may vary.</p>
        <p>© ${esc(c.copyrightYear)} ${esc(c.shopName)}. All Rights Reserved.</p>
      </div>`;
  }

  /* Small helper for plain "chat with us" WhatsApp links */
  const WhatsAppLink = {
    chat(text = `Hi ${SHOP_CONFIG.shopName}, I need help with my crackers order.`) {
      return `https://wa.me/${SHOP_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
    }
  };

  /* ---------- Button ripple ---------- */
  function initRipple() {
    document.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest(".btn, .qty-btn");
      if (!btn || btn.disabled || reducedMotion()) return;
      const r = btn.getBoundingClientRect();
      const s = document.createElement("span");
      s.className = "ripple";
      const size = Math.max(r.width, r.height) * 1.2;
      s.style.width = s.style.height = `${size}px`;
      s.style.left = `${e.clientX - r.left - size / 2}px`;
      s.style.top = `${e.clientY - r.top - size / 2}px`;
      btn.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }, { passive: true });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal(root = document) {
    const els = root.querySelectorAll("[data-reveal]:not(.is-visible)");
    if (!els.length) return;
    if (reducedMotion() || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Fireworks (hero canvas) ----------
     Lightweight: clears each frame, draws short streaks with additive
     blending, caps particle count, pauses when off-screen or tab hidden,
     and does not run at all when prefers-reduced-motion is set.        */
  function fireworks(canvas) {
    if (!canvas || !canvas.getContext || reducedMotion()) return;
    const ctx = canvas.getContext("2d");
    const COLORS = ["246,214,130", "255,240,205", "232,184,82", "170,205,255", "255,184,110", "255,255,255", "205,225,255"];   // gold · champagne · ice blue
    let W = 0, H = 0, raf = 0, last = 0, nextLaunch = 0, onScreen = true, running = false;
    const rockets = [], sparks = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const cap = () => (W < 700 ? 220 : 480);

    function launch() {
      const x = W * (0.12 + Math.random() * 0.76);
      const targetY = H * (0.1 + Math.random() * 0.32);
      rockets.push({ x, y: H + 6, px: x, py: H + 6, vx: (Math.random() - 0.5) * 0.5, vy: -(4.6 + Math.random() * 2.2) * (H / 720 + 0.35), targetY, c: COLORS[(Math.random() * COLORS.length) | 0] });
    }
    function burst(x, y, c) {
      const n = Math.min(W < 700 ? 38 : 64, cap() - sparks.length);
      const c2 = COLORS[(Math.random() * COLORS.length) | 0];
      const power = (W < 700 ? 2.6 : 3.4) * (0.8 + Math.random() * 0.4);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
        const sp = power * (0.35 + Math.random() * 0.75);
        sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: 0.011 + Math.random() * 0.012, c: Math.random() < 0.7 ? c : c2, w: 1.2 + Math.random() * 1.2 });
      }
    }

    function frame(t) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(3, (t - (last || t)) / 16.667);
      last = t;
      if (t > nextLaunch && rockets.length < 3) { launch(); nextLaunch = t + 900 + Math.random() * 1300; }

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.px = r.x; r.py = r.y;
        r.x += r.vx * dt; r.y += r.vy * dt; r.vy += 0.035 * dt;
        ctx.strokeStyle = `rgba(${r.c},0.9)`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(r.x - r.vx * 5, r.y - r.vy * 5); ctx.lineTo(r.x, r.y); ctx.stroke();
        if (r.y <= r.targetY || r.vy >= -0.6) { burst(r.x, r.y, r.c); rockets.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vx *= Math.pow(0.975, dt); s.vy = s.vy * Math.pow(0.975, dt) + 0.04 * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.life -= s.decay * dt;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(${s.c},${(s.life * 0.95).toFixed(3)})`;
        ctx.lineWidth = s.w;
        ctx.beginPath(); ctx.moveTo(s.x - s.vx * 3.2, s.y - s.vy * 3.2); ctx.lineTo(s.x, s.y); ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    const start = () => { if (!running && onScreen && !document.hidden) { running = true; last = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    resize();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); }, { passive: true });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; onScreen ? start() : stop(); }).observe(canvas);
    }
    nextLaunch = performance.now() + 250;
    start();
  }

  /* ---------- Boot shared UI on every page ---------- */
  function boot() {
    injectSprite();
    initPhotoFallback();
    initHeader();
    renderFooter();
    renderCartBar();
    initRipple();
    initReveal();
  }

  return {
    formatINR, formatNum, padCode, plural, esc, icon, illustration, getCategory,
    toast, boot, updateCartIndicators, productHue, productMedia, fireworks, initReveal, reducedMotion, WhatsAppLink
  };
})();
