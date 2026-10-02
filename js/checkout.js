/* =====================================================================
   CHECKOUT — customer details → order summary → order PDF → WhatsApp
   ---------------------------------------------------------------------
   1. The customer enters name, mobile and address (validated here).
   2. The summary step builds the order PDF in the browser (js/order-pdf.js)
      and offers Preview, Download and "Share PDF via WhatsApp".
   3. "Share PDF via WhatsApp" downloads the PDF and opens the shop's
      WhatsApp chat straight away (wa.me) with a short message; the customer
      attaches the PDF there (📎 → Document) and presses Send. On phones,
      "Share via phone menu" opens the share menu with the PDF attached
      (Web Share API) as a second option.
   Nothing is sent automatically — the customer presses Send in WhatsApp.
   Customer details are kept in memory only (never saved to the browser)
   and are used solely to make the PDF and the WhatsApp message.
   ===================================================================== */
const Checkout = (() => {
  "use strict";
  const { formatINR, formatNum, padCode, esc, icon, illustration, toast, plural } = UI;

  let root, stepsEl;
  let step = "details";
  let customer = { name: "", mobile: "", address: "" };
  let meta = null;           // { ref, date } — created when the summary is shown
  let lastMessage = "";      // full order as text (last-resort fallback)
  let sentCart = null;       // copy of the cart that was sent (lets the customer edit & resend)
  let attempted = false;     // show live validation after the first submit

  let pdf = null;            // current PDF job: { key, promise, result, error }
  let sent = null;           // what the "sent" screen shows: { mode, pdf, totals, shareFailed }
  let fileShare = null;      // can this browser share PDF files? (checked once)
  let previewDialog = null;

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
    root.addEventListener("click", onAction);
    go("details", false);
  }

  function go(next, push = true) {
    if (next === "summary" && !validate(customer).ok) next = "details";
    if (next === "sent" && !sent) next = "details";
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
          <p class="privacy-note">${icon("shield")} Your details are only used to make your order PDF and WhatsApp message, right here on your device. Nothing is uploaded or stored on this website.</p>
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

  /* ---------- Step 2: order summary + PDF ---------- */
  function currentMessage() {
    const lines = Cart.lines();
    const t = Cart.totals();
    return WhatsAppOrder.buildMessage(
      { name: customer.name, mobile: `+91 ${formatMobile(customer.mobile)}`, address: customer.address },
      lines, t, meta || { ref: WhatsAppOrder.makeRef(), date: new Date() }
    );
  }

  const shopPhone = () => `+91 ${SHOP_CONFIG.phone}`;

  function renderSummary() {
    const lines = Cart.lines();
    if (!lines.length) { root.innerHTML = emptyCartHTML(); UI.initReveal(root); return; }
    if (!meta) meta = { ref: WhatsAppOrder.makeRef(new Date()), date: new Date() };
    const t = Cart.totals();
    if (fileShare === null) fileShare = canShareFiles();
    const fileName = typeof OrderPDF !== "undefined" ? OrderPDF.fileName(meta.ref) : `order-${meta.ref}.pdf`;
    const shop = esc(SHOP_CONFIG.shopName);

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

        <div class="os-send pdf-actions" aria-labelledby="pdf-title">
          <div class="pdf-file">
            <span class="pdf-file-icon" aria-hidden="true">${icon("file")}<b>PDF</b></span>
            <span class="pdf-file-text">
              <strong id="pdf-title">Your order summary PDF</strong>
              <small class="pdf-name">${esc(fileName)}</small>
              <small class="pdf-status" id="pdf-status" role="status" aria-live="polite"></small>
            </span>
          </div>
          <button type="button" class="btn btn-whatsapp btn-xl btn-block" data-act="share">
            <span class="btn-spin" aria-hidden="true"></span>${icon("whatsapp", "wa-icon")}<span class="btn-label">Share PDF via WhatsApp</span>
          </button>
          <p class="os-send-note">Your PDF downloads and the WhatsApp chat with <strong>${shop} (${esc(shopPhone())})</strong> opens.
            In the chat, tap ${icon("paperclip", "inline-ic")} → <strong>Document</strong> → choose the PDF, then press <strong>Send</strong>.
            Nothing is sent until you press Send in WhatsApp.</p>
          <div class="os-secondary">
            ${showShareMenu() ? `<button type="button" class="btn btn-ghost" data-act="share-menu"><span class="btn-spin" aria-hidden="true"></span>${icon("share")}<span class="btn-label">Share via phone menu</span></button>` : ""}
            <button type="button" class="btn btn-ghost" data-act="preview"><span class="btn-spin" aria-hidden="true"></span>${icon("eye")}<span class="btn-label">Preview Order PDF</span></button>
            <button type="button" class="btn btn-ghost" data-act="download"><span class="btn-spin" aria-hidden="true"></span>${icon("download")}<span class="btn-label">Download Order PDF</span></button>
          </div>
          <div class="pdf-alert" id="pdf-alert" hidden></div>
          <a class="link-btn" href="cart.html">${icon("cart")} Edit cart</a>
        </div>
      </section>`;

    paintPdfStatus();
    // Make the PDF in the background, so Share opens instantly when tapped
    setTimeout(() => { if (step === "summary") ensurePdf().catch(() => { /* shown in the status line */ }); }, 80);
  }

  /* ---------- The PDF ---------- */
  const orderKey = () => JSON.stringify([
    meta && meta.ref, customer.name, customer.mobile, customer.address,
    Cart.lines().map((l) => [l.product.id, l.qty, l.product.price])
  ]);
  const currentPdf = () => (pdf && pdf.result && pdf.key === orderKey() ? pdf.result : null);

  function ensurePdf() {
    const key = orderKey();
    if (pdf && pdf.key === key && !pdf.error) return pdf.promise;
    if (typeof OrderPDF === "undefined") return Promise.reject(new Error("order-pdf.js is missing"));
    const old = pdf;
    const job = { key, result: null, error: null, promise: null };
    pdf = job;
    job.promise = OrderPDF.build({
      customer: { name: customer.name, mobile: `+91 ${formatMobile(customer.mobile)}`, address: customer.address },
      lines: Cart.lines(),
      totals: Cart.totals(),
      ref: meta.ref,
      date: meta.date,
      dateText: WhatsAppOrder.formatDate(meta.date)
    }).then((r) => {
      let file = null;
      try { file = new File([r.blob], r.fileName, { type: "application/pdf", lastModified: Date.now() }); } catch (e) { /* very old browser: download only */ }
      job.result = { ...r, file, url: URL.createObjectURL(r.blob) };
      if (old && old.result && (!sent || sent.pdf !== old.result)) URL.revokeObjectURL(old.result.url);
      if (pdf === job) paintPdfStatus();
      return job.result;
    }, (err) => {
      job.error = err;
      console.error("Order PDF:", err);
      if (pdf === job) paintPdfStatus();
      throw err;
    });
    paintPdfStatus();
    return job.promise;
  }

  function paintPdfStatus() {
    const el = root && root.querySelector("#pdf-status");
    if (!el) return;
    const job = pdf && pdf.key === orderKey() ? pdf : null;
    el.className = "pdf-status";
    if (job && job.result) {
      el.classList.add("is-ready");
      el.innerHTML = `${icon("check")} Ready · ${plural(job.result.pages, "page", "pages")} · ${plural(job.result.products, "product", "products")}`;
    } else if (job && job.error) {
      el.classList.add("is-error");
      el.innerHTML = `${icon("alert")} Couldn't create the PDF`;
    } else {
      el.classList.add("is-busy");
      el.innerHTML = `<span class="mini-spin" aria-hidden="true"></span> Preparing your PDF…`;
    }
  }

  /** Feature check: can this browser put a PDF file in the share menu? */
  function canShareFiles() {
    try {
      if (!navigator.share || !navigator.canShare || typeof File === "undefined") return false;
      const probe = new File([new Blob(["%PDF-1.4"], { type: "application/pdf" })], "order.pdf", { type: "application/pdf" });
      return navigator.canShare({ files: [probe] }) === true;
    } catch (e) { return false; }
  }

  /** The phone share menu is offered as a second option on touch devices that can share files. */
  const showShareMenu = () => !!fileShare && !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  /** How to preview: in a window on this page, in a new tab, or by downloading. */
  function previewMode() {
    if (isIOS()) return "tab";                          // iPhone/iPad show only page 1 inside a frame
    if (navigator.pdfViewerEnabled === true) return "dialog";
    if (navigator.pdfViewerEnabled === false) return "download";   // e.g. Chrome on Android
    return "tab";
  }

  /* ---------- Buttons ---------- */
  function onAction(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn || !root.contains(btn) || btn.disabled) return;
    const act = btn.dataset.act;
    if (act === "edit") { go("details"); return; }
    if (act === "share") { onShare(btn); return; }
    if (act === "share-menu") { onShareMenu(btn); return; }
    if (act === "preview") { onPreview(btn); return; }
    if (act === "download") { onDownload(btn); return; }
    if (act === "manual") { onManual(btn); return; }
    if (act === "retry") { hideAlert(); onShare(root.querySelector('[data-act="share"]')); return; }
    if (act === "send-text") { onSendText(e, btn); return; }
    if (act === "share-again") { shareAgain(); return; }
    if (act === "copy") { copyText(lastMessage || currentMessage()); return; }
    if (act === "edit-order") { Cart.restore(sentCart); window.location.href = "cart.html"; }
  }

  /** Stops the order if the cart is empty or the details are invalid. */
  function guard(needWhatsApp) {
    if (!Cart.lines().length) { toast("Your cart is empty. Please add products first.", { type: "error" }); go("details"); return false; }
    if (!validate(customer).ok) {
      attempted = true;
      toast("Please check your name, mobile number and address.", { type: "error" });
      go("details");
      return false;
    }
    if (needWhatsApp && !WhatsAppOrder.isConfigured()) {
      toast(`WhatsApp ordering is unavailable right now. Please call us on ${SHOP_CONFIG.phone}.`, { type: "error", duration: 6000 });
      return false;
    }
    return true;
  }

  function setBusy(btn, on, text) {
    root.querySelectorAll('.pdf-actions [data-act="share"], .pdf-actions [data-act="share-menu"], .pdf-actions [data-act="preview"], .pdf-actions [data-act="download"]')
      .forEach((b) => { b.disabled = on; });
    if (!btn) return;
    btn.classList.toggle("is-loading", on);
    btn.setAttribute("aria-busy", on ? "true" : "false");
    const label = btn.querySelector(".btn-label");
    if (!label) return;
    if (on) { label.dataset.idle = label.dataset.idle || label.textContent; label.textContent = text; }
    else if (label.dataset.idle) label.textContent = label.dataset.idle;
  }

  /** The PDF for the current order — made now if it isn't ready yet. */
  async function getPdf(btn) {
    const ready = currentPdf();
    if (ready) return ready;
    hideAlert();
    setBusy(btn, true, "Preparing PDF…");
    try {
      return await ensurePdf();
    } catch (err) {
      showPdfError(err);
      return null;
    } finally {
      setBusy(btn, false);
    }
  }

  function downloadPdf(r) {
    const a = document.createElement("a");
    a.href = r.url;
    a.download = r.fileName;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 0);
  }

  async function onDownload(btn) {
    if (step === "sent") { if (sent && sent.pdf) { downloadPdf(sent.pdf); toast(`Downloaded ${sent.pdf.fileName}`, { type: "success" }); } return; }
    if (!guard(false)) return;
    const r = await getPdf(btn);
    if (!r) return;
    downloadPdf(r);
    toast(`Downloaded ${r.fileName}`, { type: "success" });
  }

  async function onPreview(btn) {
    if (!guard(false)) return;
    const mode = previewMode();
    const ready = currentPdf();
    // A new tab must be opened during the tap, or it may be blocked as a pop-up
    let win = null;
    if (mode === "tab" && !ready) {
      win = window.open("", "_blank");
      try { if (win) win.document.write('<p style="font:16px system-ui,sans-serif;padding:24px">Preparing your order PDF…</p>'); } catch (e) { /* ignore */ }
    }
    const r = ready || await getPdf(btn);
    if (!r) { if (win) win.close(); return; }
    if (mode === "dialog") { openPreview(r); return; }
    if (mode === "tab") {
      if (win) { win.location.href = r.url; return; }
      if (window.open(r.url, "_blank")) return;
    }
    downloadPdf(r);
    showAlert("info", `This browser can't show PDFs on the page, so the PDF was downloaded instead. Open <strong>${esc(r.fileName)}</strong> from your downloads to view it.`);
  }

  function openPreview(r) {
    if (!previewDialog) {
      previewDialog = document.createElement("dialog");
      previewDialog.className = "pdf-dialog";
      previewDialog.setAttribute("aria-labelledby", "pdf-dialog-title");
      previewDialog.innerHTML = `
        <div class="pdf-dialog-bar">
          <div class="pdf-dialog-head"><h2 id="pdf-dialog-title">Order PDF preview</h2><small class="pdf-dialog-meta"></small></div>
          <button type="button" class="btn btn-ghost pdf-dialog-dl">${icon("download")} <span>Download</span></button>
          <button type="button" class="gb-close" aria-label="Close preview">${icon("close")}</button>
        </div>
        <iframe class="pdf-frame" title="Order PDF preview"></iframe>`;
      document.body.appendChild(previewDialog);
      previewDialog.querySelector(".gb-close").addEventListener("click", () => previewDialog.close());
      previewDialog.addEventListener("click", (e) => { if (e.target === previewDialog) previewDialog.close(); });
      previewDialog.addEventListener("close", () => { previewDialog.querySelector("iframe").src = "about:blank"; });
    }
    previewDialog.querySelector(".pdf-dialog-meta").textContent = `${r.fileName} · ${plural(r.pages, "page", "pages")}`;
    previewDialog.querySelector(".pdf-dialog-dl").onclick = () => downloadPdf(r);
    previewDialog.querySelector("iframe").src = `${r.url}#view=FitH`;
    if (typeof previewDialog.showModal === "function") previewDialog.showModal();
    else window.open(r.url, "_blank");
  }

  /** Main button: download the PDF and open the shop's WhatsApp chat directly. */
  async function onShare(btn) {
    if (!guard(true)) return;
    hideAlert();
    const ready = currentPdf();
    // If the PDF still has to be made, open the chat tab now, during the tap,
    // so the browser doesn't block it as a pop-up (iPhone: see sendManually).
    let win = null;
    if (!ready && !isIOS()) {
      win = window.open("", "_blank");
      try { if (win) win.document.write('<p style="font:16px system-ui,sans-serif;padding:24px">Opening WhatsApp…</p>'); } catch (e) { /* ignore */ }
    }
    const r = ready || await getPdf(btn);
    if (!r) { if (win) win.close(); return; }
    sendManually(r, false, win);
  }

  /** Second option on phones: the share menu with the PDF attached. */
  async function onShareMenu(btn) {
    if (!guard(true)) return;
    hideAlert();
    const ready = currentPdf();
    const r = ready || await getPdf(btn);
    if (!r) return;
    if (r.file && canShareThis(r.file)) { shareFile(r, !ready); return; }
    sendManually(r, true);
  }

  function canShareThis(file) {
    try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { return false; }
  }

  function shareData(r, totals) {
    // On iPhone/iPad, WhatsApp can drop the file when text comes with it, so share the PDF alone
    // (the order reference is in the file name and on the PDF itself).
    if (isIOS()) return { files: [r.file] };
    const data = { files: [r.file], title: `${SHOP_CONFIG.shopName} order ${meta.ref}`, text: WhatsAppOrder.buildPdfMessage(meta, totals) };
    try { if (navigator.canShare(data)) return data; } catch (e) { /* fall through */ }
    return { files: [r.file] };   // some browsers share files only
  }

  async function shareFile(r, waited) {
    const totals = Cart.totals();
    try {
      await navigator.share(shareData(r, totals));
      finish("shared", r, totals);
    } catch (err) {
      const name = err && err.name;
      if (name === "AbortError") {
        showAlert("info", `Sharing was cancelled, so nothing was sent. Tap <strong>Share PDF via WhatsApp</strong> to open our WhatsApp chat directly, or
          <button type="button" class="link-btn" data-act="share-menu">open the share menu again</button>.`);
      } else if (name === "NotAllowedError" && waited) {
        // Making the PDF took a moment, and the browser now wants a fresh tap
        showAlert("info", `Your PDF is ready. Tap <strong>Share via phone menu</strong> again to open the share menu.`);
      } else {
        console.warn("Share failed, using download + WhatsApp instead:", err);
        sendManually(r, true);
      }
    }
  }

  async function onManual(btn) {
    if (!guard(true)) return;
    hideAlert();
    const r = currentPdf() || await getPdf(btn);
    if (r) sendManually(r, false);
  }

  /** Download the PDF and open the shop's WhatsApp chat with a short message. */
  function sendManually(r, shareFailed, win = null) {
    const totals = Cart.totals();
    downloadPdf(r);
    const url = WhatsAppOrder.buildURL(WhatsAppOrder.buildPdfMessage(meta, totals));
    let opened = false;
    if (isIOS()) {
      // On iPhone/iPad, switching to WhatsApp at once can cancel the download,
      // so the next screen has a big "Open WhatsApp chat" button instead.
      if (win) win.close();
    } else {
      try {
        const w = win || window.open(url, "_blank");
        if (w) {
          if (win) w.location.href = url;
          opened = true;
          try { w.opener = null; } catch (e) { /* ignore */ }
        }
      } catch (e) { /* pop-up blocked: the button on the next screen opens it */ }
    }
    finish("manual", r, totals, { shareFailed, opened });
  }

  /** Last resort: the whole order as a WhatsApp text message (the old way). */
  function onSendText(e, a) {
    if (!guard(true)) { e.preventDefault(); return; }
    const totals = Cart.totals();
    lastMessage = currentMessage();
    a.href = WhatsAppOrder.buildURL(lastMessage);
    setTimeout(() => finish("text", null, totals), 350);
  }

  /** The customer is now in WhatsApp: empty the cart (it can be put back) and show the next steps. */
  function finish(mode, r, totals, extra = {}) {
    lastMessage = lastMessage && mode === "text" ? lastMessage : currentMessage();
    sent = { mode, pdf: r, totals, ...extra };
    step = "sent";             // stops the summary re-rendering while the cart empties
    sentCart = Cart.clear();
    go("sent");
  }

  async function shareAgain() {
    if (!sent || !sent.pdf) return;
    const r = sent.pdf;
    if (!(r.file && canShareThis(r.file))) { downloadPdf(r); return; }
    try { await navigator.share(shareData(r, sent.totals)); }
    catch (err) { if (!err || err.name !== "AbortError") downloadPdf(r); }
  }

  /* ---------- Messages under the buttons ---------- */
  function showAlert(type, html) {
    const el = root.querySelector("#pdf-alert");
    if (!el) { toast(html.replace(/<[^>]+>/g, ""), { type: type === "error" ? "error" : "info", duration: 6000 }); return; }
    el.className = `pdf-alert is-${type}`;
    el.innerHTML = `${icon(type === "error" ? "alert" : "info")}<div>${html}</div>`;
    el.hidden = false;
    el.setAttribute("role", type === "error" ? "alert" : "status");
  }
  function hideAlert() { const el = root.querySelector("#pdf-alert"); if (el) el.hidden = true; }

  function showPdfError(err) {
    const dataProblem = err && err.code === "data";
    const textUrl = WhatsAppOrder.isConfigured() ? WhatsAppOrder.buildURL(currentMessage()) : "";
    showAlert("error", dataProblem
      ? `Something in your cart doesn't add up, so no PDF was made. Please <a href="cart.html">open your cart</a>, check the quantities and try again.`
      : `Sorry, we couldn't create the PDF on this device. <button type="button" class="link-btn" data-act="retry">Try again</button>
         ${textUrl ? `or <a class="link-btn" data-act="send-text" href="${esc(textUrl)}" target="_blank" rel="noopener">send your order as a WhatsApp text message</a> instead.` : ""}`);
  }

  /* ---------- Step 3: in WhatsApp ---------- */
  function renderSent() {
    if (!sent) { go("details", false); return; }
    const shop = esc(SHOP_CONFIG.shopName);
    const phone = esc(shopPhone());
    const totals = sent.totals || { grandTotal: 0 };
    const chatUrl = WhatsAppOrder.buildURL(WhatsAppOrder.buildPdfMessage(meta, totals));
    const textUrl = WhatsAppOrder.buildURL(lastMessage);
    const tel = `tel:+91${esc(String(SHOP_CONFIG.phone).replace(/\D/g, "").slice(-10))}`;
    const r = sent.pdf;
    const file = r ? `<code>${esc(r.fileName)}</code>` : "";

    let title, lead, steps, actions;
    if (sent.mode === "text") {
      title = "Your order is ready in WhatsApp!";
      lead = `Press <strong>Send</strong> in WhatsApp to deliver order <strong>${esc(meta.ref)}</strong> to ${shop}. We'll reply to confirm availability, final bill and delivery.`;
      steps = [];
      actions = `<a class="btn btn-whatsapp btn-lg" href="${esc(textUrl)}" target="_blank" rel="noopener">${icon("whatsapp", "wa-icon")} Open WhatsApp again</a>
        <button type="button" class="btn btn-ghost btn-lg" data-act="copy">${icon("copy")} Copy order message</button>`;
    } else if (sent.mode === "manual") {
      title = "Attach the PDF in WhatsApp";
      lead = `Order <strong>${esc(meta.ref)}</strong> · ${formatINR(totals.grandTotal)}. ${sent.shareFailed ? "Your browser couldn't attach the PDF by itself, so we downloaded it for you. " : ""}Your order reaches ${shop} only after you send the PDF:`;
      steps = [
        `${icon("download")}<span><strong>The PDF is downloaded</strong> to your device as ${file}.</span>`,
        sent.opened
          ? `${icon("whatsapp")}<span><strong>The WhatsApp chat with ${shop} (${phone}) is open</strong> with a short message and your order reference typed in. (Closed it? Tap <strong>Open WhatsApp chat</strong> below.)</span>`
          : `${icon("whatsapp")}<span><strong>Tap Open WhatsApp chat</strong> below. The chat with ${shop} (${phone}) opens with a short message and your order reference typed in.</span>`,
        `${icon("paperclip")}<span><strong>Attach the PDF:</strong> in the chat, tap the ${icon("paperclip", "inline-ic")} (Attach) button → <strong>Document</strong> → choose ${file}.</span>`,
        `${icon("check")}<span><strong>Press Send.</strong></span>`
      ];
      actions = `<a class="btn btn-whatsapp btn-lg" href="${esc(chatUrl)}" target="_blank" rel="noopener">${icon("whatsapp", "wa-icon")} Open WhatsApp chat</a>
        <button type="button" class="btn btn-ghost btn-lg" data-act="download">${icon("download")} Download PDF again</button>`;
    } else {
      title = "Now press Send in WhatsApp";
      lead = `Order <strong>${esc(meta.ref)}</strong> · ${formatINR(totals.grandTotal)}. Your order PDF went to the share menu. It reaches ${shop} only after you send it:`;
      steps = [
        `${icon("whatsapp")}<span>In WhatsApp, choose <strong>${shop} (${phone})</strong>.</span>`,
        `${icon("file")}<span>Check that ${file} is attached.</span>`,
        `${icon("check")}<span><strong>Press Send.</strong></span>`
      ];
      actions = `<button type="button" class="btn btn-whatsapp btn-lg" data-act="share-again">${icon("whatsapp", "wa-icon")} Share PDF again</button>
        <button type="button" class="btn btn-ghost btn-lg" data-act="download">${icon("download")} Download PDF</button>`;
    }

    root.innerHTML = `
      <section class="sent-card" aria-labelledby="sent-title">
        <div class="sent-burst" aria-hidden="true"><span></span>${icon(sent.mode === "text" ? "check" : "file", "sent-check")}</div>
        <h2 id="sent-title" tabindex="-1">${title}</h2>
        <p class="sent-lead">${lead}</p>
        ${steps.length ? `<ol class="sent-steps">${steps.map((s) => `<li>${s}</li>`).join("")}</ol>` : ""}
        <div class="sent-actions">${actions}</div>
        ${sent.mode === "text" ? `
        <details class="sent-message">
          <summary>View order message</summary>
          <pre></pre>
        </details>` : ""}
        <div class="sent-help">
          <p>${icon("info")}<span>${sent.mode === "text"
            ? `WhatsApp didn't open? Copy the message above and send it to <a href="${esc(UI.WhatsAppLink.chat())}" target="_blank" rel="noopener">${phone}</a>, or call us on <a href="${tel}">${esc(SHOP_CONFIG.phone)}</a>.`
            : `Can't find ${shop} in WhatsApp? <a href="${esc(chatUrl)}" target="_blank" rel="noopener">Open our chat (${phone})</a> and attach the PDF there, or call us on <a href="${tel}">${esc(SHOP_CONFIG.phone)}</a>.`}</span></p>
        </div>
        ${sent.mode !== "text" && lastMessage ? `
        <details class="sent-message">
          <summary>Can't send a PDF? Send the order as a text message</summary>
          <div class="sent-text">
            <p>This puts the whole order into a WhatsApp message instead of a PDF.</p>
            <div class="sent-actions">
              <a class="btn btn-ghost" href="${esc(textUrl)}" target="_blank" rel="noopener">${icon("whatsapp")} Send as WhatsApp text</a>
              <button type="button" class="btn btn-ghost" data-act="copy">${icon("copy")} Copy order text</button>
            </div>
          </div>
        </details>` : ""}
        <p class="sent-cleared">${icon("check")} Your cart has been cleared, ready for your next order.</p>
        <div class="sent-foot">
          <a class="btn btn-primary" href="index.html">${icon("sparkle")} Back to Home</a>
          <a class="btn btn-ghost" href="products.html">Continue Shopping</a>
          ${sentCart && sentCart.length ? `<button type="button" class="link-btn" data-act="edit-order">${icon("edit")} Need to change this order? Put the items back in the cart</button>` : ""}
        </div>
      </section>`;
    const pre = root.querySelector(".sent-message pre");
    if (pre) pre.textContent = lastMessage;
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
