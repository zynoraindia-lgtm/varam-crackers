/* =====================================================================
   WHATSAPP ORDER — order reference, WhatsApp messages and click-to-chat link
   Uses https://wa.me/<SHOP_CONFIG.whatsappNumber>?text=<encoded message>
   • buildPdfMessage(): the short message sent together with the order PDF
   • buildMessage():    the full order as text (only a last-resort fallback)
   ===================================================================== */
const WhatsAppOrder = (() => {
  "use strict";
  const { formatINR, formatNum, padCode } = UI;
  const LINE = "━━━━━━━━━━━━━━━━━━";

  const isConfigured = () => /^\d{10,15}$/.test(String(SHOP_CONFIG.whatsappNumber || ""));

  /** Human-friendly order reference, e.g. VC-261002-1745-K7Q
      (prefix · date · time · 3 random characters, so two orders placed in
      the same minute never get the same reference). */
  function makeRef(date = new Date()) {
    const p = (n) => String(n).padStart(2, "0");
    const cfg = SHOP_CONFIG.orderPdf || {};
    const prefix = String(cfg.orderRefPrefix || SHOP_CONFIG.shopName.split(/\s+/).map((w) => w[0]).join("").slice(0, 3) || "OR")
      .toUpperCase().replace(/[^A-Z0-9]/g, "");
    const ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";   // no 0/O or 1/I/L look-alikes
    let tail = "";
    const rnd = new Uint8Array(3);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(rnd);
    else for (let i = 0; i < 3; i++) rnd[i] = Math.floor(Math.random() * 256);
    rnd.forEach((n) => { tail += ABC[n % ABC.length]; });
    return `${prefix}-${String(date.getFullYear()).slice(2)}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}-${tail}`;
  }

  /** Short message that goes with the order PDF (never the whole product list). */
  function buildPdfMessage(meta, totals) {
    return `Hello ${SHOP_CONFIG.shopName}, I would like to place an order. Please find my order summary PDF attached. ` +
      `Order Reference: ${meta.ref}. Grand Total: ${formatINR(totals.grandTotal)}.`;
  }

  const formatDate = (d) =>
    d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

  /**
   * @param {{name:string, mobile:string, address:string}} customer
   * @param {Array<{product, qty, subtotal}>} lines
   * @param {{products:number, items:number, grandTotal:number}} totals
   * @param {{ref:string, date:Date}} meta
   */
  function buildMessage(customer, lines, totals, meta) {
    const out = [];
    out.push("🔥 *NEW CRACKERS ORDER* 🔥");
    out.push(`*${SHOP_CONFIG.shopName.toUpperCase()}*`);
    out.push(`Order Ref: ${meta.ref}`);
    out.push(`Date: ${formatDate(meta.date)}`);
    out.push(LINE);
    out.push("*CUSTOMER DETAILS*");
    out.push(`Name: ${customer.name}`);
    out.push(`Mobile: ${customer.mobile}`);
    out.push("Address:");
    out.push(customer.address);
    out.push(LINE);
    out.push("*ORDER DETAILS*");
    out.push("");
    lines.forEach((l, i) => {
      const p = l.product;
      out.push(`${i + 1}. *${p.name}*`);
      out.push(`   Code: #${padCode(p.serialNumber)}`);
      out.push(`   Pack: ${p.pack}`);
      out.push(`   Quantity: ${formatNum(l.qty)}`);
      out.push(`   Unit Price: ${formatINR(p.price)}`);
      out.push(`   Subtotal: ${formatINR(l.subtotal)}`);
      out.push("");
    });
    out.push(LINE);
    out.push(`Total Products: ${formatNum(totals.products)}`);
    out.push(`Total Items: ${formatNum(totals.items)}`);
    out.push(`*GRAND TOTAL: ${formatINR(totals.grandTotal)}*`);
    out.push(LINE);
    out.push("Please confirm the order and delivery details.");
    out.push(`Thank you for choosing ${SHOP_CONFIG.shopName}! 🎆`);
    return out.join("\n");
  }

  const buildURL = (message) =>
    `https://wa.me/${SHOP_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;

  return { isConfigured, makeRef, buildMessage, buildPdfMessage, buildURL, formatDate };
})();
