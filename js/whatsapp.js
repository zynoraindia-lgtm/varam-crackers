/* =====================================================================
   WHATSAPP ORDER — builds the order message and the click-to-chat link
   Uses https://wa.me/<SHOP_CONFIG.whatsappNumber>?text=<encoded message>
   ===================================================================== */
const WhatsAppOrder = (() => {
  "use strict";
  const { formatINR, formatNum, padCode } = UI;
  const LINE = "━━━━━━━━━━━━━━━━━━";

  const isConfigured = () => /^\d{10,15}$/.test(String(SHOP_CONFIG.whatsappNumber || ""));

  /** Human-friendly order reference, e.g. VC-260928-1745 */
  function makeRef(date = new Date()) {
    const p = (n) => String(n).padStart(2, "0");
    const initials = SHOP_CONFIG.shopName.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 3) || "OR";
    return `${initials}-${String(date.getFullYear()).slice(2)}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
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

  return { isConfigured, makeRef, buildMessage, buildURL, formatDate };
})();
