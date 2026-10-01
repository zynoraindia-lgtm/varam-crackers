/* =====================================================================
   CHECKOUT — customer details → order summary → send via WhatsApp
   Customer details are kept in memory only (never saved to the browser)
   and are used solely to build the WhatsApp order message.
   ===================================================================== */
const Checkout = (() => {
  "use strict";
  const { formatINR, formatNum, padCode, esc, icon, illustration, toast, plural } = UI;

  let root, stepsEl;
  let step = "details";
  let customer = { name: "", mobile: "", address: "" };
  let meta = null;           // { ref, date } — created when the summary is shown
  let lastMessage = "";
  let sentCart = null;       // copy of the cart that was sent (lets the customer edit & resend)
  let attempted = false;     // show live validation after the first submit

  /* ---------- Validation ---------- */
  const cleanName = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const cleanAddress = (s) => String(s || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  function normalizeMobile(raw) {
    let d = String(raw || "").replace(/\D/g, "");
    if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
    else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
    return d;
  }
  const formatMobile = (d) => (d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);

  function validate(values) {
    const errors = {};
    const name = cleanName(values.name);
    const mobile = normalizeMobile(values.mobile);
    const address = cleanAddress(values.address);

    if (!name) errors.name = "Please enter your full name.";
    else if (name.length < 2) errors.name = "Name looks too short — please enter your full name.";
    else if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)) errors.name = "Please use letters only (no numbers or symbols).";

    if (!String(values.mobile || "").trim()) errors.mobile = "Please enter your 10-digit mobile number.";
    else if (!/^[6-9]\d{9}$/.test(mobile)) errors.mobile = "Enter a valid 10-digit Indian mobile number (starting with 6, 7, 8 or 9).";

    if (!address) errors.address = "Please enter your delivery address.";
    else if (address.length < 10) errors.address = "Please enter the complete address (door no., street, area, town).";

    return { ok: Object.keys(errors).length === 0, errors, values: { name, mobile, address } };
  }

  /* ---------- Init & routing ---------- */
  function init() {
    root = document.getElementById("checkout-root");
    stepsEl = document.getElementById("checkout-steps");
    if (!root) return;
    try { history.replaceState({ step: "details" }, "", location.pathname); } catch (e) { /* ignore */ }
    window.addEventListener("popstate", (e) => go((e.state && e.state.step) || "details", false));
    Cart.subscribe(() => {
      // Keep numbers correct if the cart changes in another tab
      if (step === "details") renderDetails(); else if (step === "summary") renderSummary();
    });
    go("details", false);
  }

  function go(next, push = true) {
    if (next === "summary" && !validate(customer).ok) next = "details";
    step = next;
    if (push) { try { history.pushState({ step }, "", `#${step}`); } catch (e) { /* ignore */ } }
    if (step === "details") renderDetails();
    else if (step === "summary") renderSummary();
    else if (step === "sent") renderSent();
    updateSteps();
    const top = document.getElementById("main");
    if (top && push) top.scrollIntoView({ behavior: UI.reducedMotion() ? "auto" : "smooth", block: "start" });
  }

  function updateSteps() {
    if (!stepsEl) return;
    const order = ["cart", "details", "summary", "whatsapp"];
    const cur = { details: 1, summary: 2, sent: 3 }[step];
    stepsEl.querySelectorAll("li").forEach((li) => {
      const i = order.indexOf(li.dataset.step);
      li.classList.toggle("is-done", i < cur || step === "sent");
      li.classList.toggle("is-current", i === cur && step !== "sent");
      if (i === cur && step !== "sent") li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
  }

  function emptyCartHTML() {
    return `
      <div class="empty-state" data-reveal>
        <div class="empty-art" aria-hidden="true"><span class="empty-ring"></span>${icon("cart", "empty-icon")}</div>
        <h2>Your cart is empty</h2>
        <p>Add products to your cart before placing an order.</p>
        <a class="btn btn-primary btn-lg" href="products.html">${icon("sparkle")} Shop Products</a>
      </div>`;
  }

  function miniSummaryHTML(lines, t) {
    return `
      <aside class="summary-card mini" aria-labelledby="mini-title">
        <div class="mini-head"><h2 id="mini-title">Your Order</h2><a class="link-btn" href="cart.html">${icon("edit")} Edit cart</a></div>
        <ul class="mini-list">
          ${lines.map((l) => `
            <li style="--h:${UI.productHue(l.product)}">
              <span class="mini-thumb">${UI.productMedia(l.product, { w: 88, h: 88, cls: "mini-img" })}</span>
              <span class="mini-name">${esc(l.product.name)}<small>#${esc(padCode(l.product.serialNumber))} · ${esc(l.product.pack)} · ${formatNum(l.qty)} × ${formatINR(l.product.price)}</small></span>
              <strong>${formatINR(l.subtotal)}</strong>
            </li>`).join("")}
        </ul>
        <dl class="sum-list">
          <div><dt>Products</dt><dd>${formatNum(t.products)}</dd></div>
          <div><dt>Total Items</dt><dd>${formatNum(t.items)}</dd></div>
        </dl>
        <div class="grand-total"><span>Grand Total</span><strong>${formatINR(t.grandTotal)}</strong></div>
      </aside>`;
  }

  /* ---------- Step 1: customer details ---------- */
  function renderDetails() {
    const lines = Cart.lines();
    if (!lines.length) { root.innerHTML = emptyCartHTML(); UI.initReveal(root); return; }

    // Preserve what the user is typing if we re-render
    const form0 = root.querySelector("#details-form");
    if (form0) customer = readForm(form0);

    const t = Cart.totals();
    const field = (id, label, control, hint = "") => `
      <div class="field" data-field="${id}">
        <label for="c-${id}">${label} <span class="req" aria-hidden="true">*</span></label>
        ${control}
        ${hint ? `<p class="field-hint" id="c-${id}-hint">${hint}</p>` : ""}
        <p class="field-error" id="c-${id}-err" hidden></p>
      </div>`;

    root.innerHTML = `
      <div class="checkout-layout">
        <form id="details-form" class="form-card" novalidate aria-labelledby="details-title">
          <div class="form-head">
            <span class="form-icon">${icon("user")}</span>
            <div><h2 id="details-title">Customer Details</h2><p>Tell us where to deliver. All fields are required.</p></div>
          </div>
          ${field("name", "Full Name",
            `<input id="c-name" name="name" type="text" autocomplete="name" maxlength="60" required placeholder="Full Name" aria-describedby="c-name-err" value="${esc(customer.name)}">`)}
          ${field("mobile", "Mobile Number",
            `<div class="input-prefix"><span aria-hidden="true">+91</span><input id="c-mobile" name="mobile" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="16" required placeholder="10-digit mobile number" aria-describedby="c-mobile-hint c-mobile-err" value="${esc(customer.mobile ? formatMobile(normalizeMobile(customer.mobile)) : "")}"></div>`,
            "We'll call or WhatsApp you on this number to confirm the order.")}
          ${field("address", "Delivery Address",
            `<textarea id="c-address" name="address" rows="4" autocomplete="street-address" maxlength="400" required placeholder="Complete Address — door no., street, area, town, pincode" aria-describedby="c-address-err">${esc(customer.address)}</textarea>`)}
          <button type="submit" class="btn btn-primary btn-lg btn-block">Review Order Summary ${icon("arrowRight")}</button>
          <p class="privacy-note">${icon("shield")} Your details are only used to prepare the WhatsApp order message. Nothing is stored on this website.</p>
        </form>
        ${miniSummaryHTML(lines, t)}
      </div>`;

    const form = root.querySelector("#details-form");
    form.addEventListener("submit", onSubmit);
    form.addEventListener("input", (e) => {
      if (e.target.id === "c-mobile") {
        // keep digits (and a leading +) only
        const v = e.target.value.replace(/[^\d+ ]/g, "");
        if (v !== e.target.value) e.target.value = v;
      }
      if (attempted) showErrors(validate(readForm(form)).errors, false);
    });
    form.addEventListener("focusout", (e) => {
      if (e.target.id === "c-mobile") {
        const d = normalizeMobile(e.target.value);
        if (/^[6-9]\d{9}$/.test(d)) e.target.value = formatMobile(d);
      }
    });
    if (attempted) showErrors(validate(customer).errors, false);
  }

  const readForm = (form) => ({
    name: form.elements.name.value,
    mobile: form.elements.mobile.value,
    address: form.elements.address.value
  });

  function showErrors(errors, focusFirst) {
    let first = null;
    ["name", "mobile", "address"].forEach((k) => {
      const input = root.querySelector(`#c-${k}`);
      const err = root.querySelector(`#c-${k}-err`);
      if (!input || !err) return;
      const msg = errors[k];
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      input.closest(".field").classList.toggle("has-error", !!msg);
      err.hidden = !msg;
      err.innerHTML = msg ? `${icon("alert")}<span>${esc(msg)}</span>` : "";
      if (msg && !first) first = input;
    });
    if (focusFirst && first) first.focus();
  }

  function onSubmit(e) {
    e.preventDefault();
    attempted = true;
    if (!Cart.lines().length) { toast("Your cart is empty. Please add products first.", { type: "error" }); renderDetails(); return; }
    const res = validate(readForm(e.currentTarget));
    showErrors(res.errors, true);
    if (!res.ok) {
      const missing = ["name", "mobile", "address"].filter((k) => res.errors[k]);
      toast(missing.length === 1 && res.errors.mobile && e.currentTarget.elements.mobile.value.trim()
        ? "Please enter a valid 10-digit mobile number."
        : "Please enter your name, mobile number and address.", { type: "error" });
      return;
    }
    customer = res.values;
    meta = { ref: WhatsAppOrder.makeRef(new Date()), date: new Date() };
    go("summary");
  }

  /* ---------- Step 2: order summary ---------- */
  function currentMessage() {
    const lines = Cart.lines();
    const t = Cart.totals();
    return WhatsAppOrder.buildMessage(
      { name: customer.name, mobile: `+91 ${formatMobile(customer.mobile)}`, address: customer.address },
      lines, t, meta || { ref: WhatsAppOrder.makeRef(), date: new Date() }
    );
  }

  function renderSummary() {
    const lines = Cart.lines();
    if (!lines.length) { root.innerHTML = emptyCartHTML(); UI.initReveal(root); return; }
    if (!meta) meta = { ref: WhatsAppOrder.makeRef(new Date()), date: new Date() };
    const t = Cart.totals();
    lastMessage = currentMessage();
    const url = WhatsAppOrder.buildURL(lastMessage);

    root.innerHTML = `
      <section class="order-summary" aria-labelledby="os-title">
        <header class="os-head">
          <div>
            <p class="eyebrow">${icon("list")} Final bill</p>
            <h2 id="os-title">Order Summary</h2>
          </div>
          <div class="os-ref"><span>Order Ref</span><strong>${esc(meta.ref)}</strong><small>${esc(WhatsAppOrder.formatDate(meta.date))}</small></div>
        </header>

        <div class="os-customer">
          <div class="os-cust-grid">
            <div><span class="os-label">Customer</span><strong>${esc(customer.name)}</strong></div>
            <div><span class="os-label">Mobile</span><strong>+91 ${esc(formatMobile(customer.mobile))}</strong></div>
            <div class="os-addr"><span class="os-label">Delivery Address</span><p>${esc(customer.address).replace(/\n/g, "<br>")}</p></div>
          </div>
          <button type="button" class="link-btn" data-act="edit">${icon("edit")} Edit details</button>
        </div>

        <div class="os-table-wrap">
          <table class="os-table">
            <caption class="sr-only">Products in this order</caption>
            <thead><tr><th scope="col">#</th><th scope="col">Product</th><th scope="col" class="num">Qty</th><th scope="col" class="num">Unit Price</th><th scope="col" class="num">Subtotal</th></tr></thead>
            <tbody>
              ${lines.map((l, i) => `
                <tr>
                  <td class="os-n">${i + 1}</td>
                  <td><span class="os-pname">${esc(l.product.name)}</span><span class="os-pmeta">Code #${esc(padCode(l.product.serialNumber))} · Pack: ${esc(l.product.pack)}</span></td>
                  <td class="num" data-label="Qty">${formatNum(l.qty)}</td>
                  <td class="num" data-label="Unit Price">${formatINR(l.product.price)}</td>
                  <td class="num strong" data-label="Subtotal">${formatINR(l.subtotal)}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>

        <div class="os-totals">
          <dl class="sum-list">
            <div><dt>Total Products</dt><dd>${formatNum(t.products)}</dd></div>
            <div><dt>Total Items</dt><dd>${formatNum(t.items)}</dd></div>
          </dl>
          <div class="grand-total xl"><span>Grand Total</span><strong>${formatINR(t.grandTotal)}</strong></div>
        </div>

        <div class="os-send">
          <a class="btn btn-whatsapp btn-xl btn-block" id="send-wa" href="${esc(url)}" target="_blank" rel="noopener">
            ${icon("whatsapp", "wa-icon")}<span>🔥 Send Order via WhatsApp</span>
          </a>
          <p class="os-send-note">WhatsApp opens with your complete order typed in — just press <strong>Send</strong>. The shop will confirm availability and delivery.</p>
          <div class="os-secondary">
            <button type="button" class="btn btn-ghost" data-act="copy">${icon("copy")} Copy order text</button>
            <a class="btn btn-ghost" href="cart.html">${icon("cart")} Edit cart</a>
          </div>
        </div>
      </section>`;

    root.querySelector('[data-act="edit"]').addEventListener("click", () => go("details"));
    root.querySelector('[data-act="copy"]').addEventListener("click", () => copyText(currentMessage()));
    root.querySelector("#send-wa").addEventListener("click", onSend);
  }

  function onSend(e) {
    const a = e.currentTarget;
    if (!Cart.lines().length) { e.preventDefault(); toast("Your cart is empty. Please add products first.", { type: "error" }); go("details"); return; }
    if (!validate(customer).ok) { e.preventDefault(); toast("Please enter your name, mobile number and address.", { type: "error" }); go("details"); return; }
    if (!WhatsAppOrder.isConfigured()) {
      e.preventDefault();
      toast(`WhatsApp ordering is unavailable right now. Please call us on ${SHOP_CONFIG.phone}.`, { type: "error", duration: 6000 });
      return;
    }
    // Rebuild at the moment of sending so it always matches the current cart
    lastMessage = currentMessage();
    a.href = WhatsAppOrder.buildURL(lastMessage);
    // The order is complete: empty the cart now, so the header, the floating cart
    // bar and every other page show an empty cart (even if the phone reloads this tab).
    step = "sent";             // stops the summary re-rendering while the cart empties
    sentCart = Cart.clear();
    setTimeout(() => go("sent"), 350);
  }

  /* ---------- Step 3: sent ---------- */
  function renderSent() {
    if (!lastMessage) { go("details", false); return; }
    const url = WhatsAppOrder.buildURL(lastMessage);
    root.innerHTML = `
      <section class="sent-card" aria-labelledby="sent-title">
        <div class="sent-burst" aria-hidden="true"><span></span>${icon("check", "sent-check")}</div>
        <h2 id="sent-title" tabindex="-1">Your order is ready in WhatsApp!</h2>
        <p class="sent-lead">Press <strong>Send</strong> in WhatsApp to deliver order <strong>${esc(meta.ref)}</strong> to ${esc(SHOP_CONFIG.shopName)}. We'll reply to confirm availability, final bill and delivery.</p>
        <div class="sent-actions">
          <a class="btn btn-whatsapp btn-lg" href="${esc(url)}" target="_blank" rel="noopener">${icon("whatsapp", "wa-icon")} Open WhatsApp again</a>
          <button type="button" class="btn btn-ghost btn-lg" data-act="copy">${icon("copy")} Copy order message</button>
        </div>
        <details class="sent-message">
          <summary>View order message</summary>
          <pre></pre>
        </details>
        <div class="sent-help">
          <p>${icon("info")}<span>WhatsApp didn't open? Copy the message above and send it to <a href="${esc(UI.WhatsAppLink.chat())}" target="_blank" rel="noopener">+91 ${esc(SHOP_CONFIG.phone)}</a>, or call us on <a href="tel:+91${esc(String(SHOP_CONFIG.phone).replace(/\D/g, "").slice(-10))}">${esc(SHOP_CONFIG.phone)}</a>.</span></p>
        </div>
        <p class="sent-cleared">${icon("check")} Your cart has been cleared, ready for your next order.</p>
        <div class="sent-foot">
          <a class="btn btn-primary" href="index.html">${icon("sparkle")} Back to Home</a>
          <a class="btn btn-ghost" href="products.html">Continue Shopping</a>
          ${sentCart && sentCart.length ? `<button type="button" class="link-btn" data-act="edit-order">${icon("edit")} Need to change this order? Put the items back in the cart</button>` : ""}
        </div>
      </section>`;
    root.querySelector(".sent-message pre").textContent = lastMessage;
    root.querySelector('[data-act="copy"]').addEventListener("click", () => copyText(lastMessage));
    root.querySelector('[data-act="edit-order"]')?.addEventListener("click", () => {
      Cart.restore(sentCart);
      window.location.href = "cart.html";
    });
    root.querySelector("#sent-title").focus({ preventScroll: true });
  }

  /* ---------- Clipboard with fallback ---------- */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        if (!ok) throw new Error("copy failed");
      }
      toast("Order message copied. Paste it in WhatsApp to send.", { type: "success" });
    } catch (err) {
      toast("Couldn't copy automatically — open “View order message” and copy it manually.", { type: "error", duration: 5000 });
    }
  }

  return { init, _validate: validate, _normalizeMobile: normalizeMobile };
})();
