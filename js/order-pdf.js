/* =====================================================================
   ORDER PDF — the customer's order summary as an A4 PDF, made in the browser
   ---------------------------------------------------------------------
   • jsPDF + jsPDF-AutoTable (js/vendor/, MIT licence) draw the PDF.
   • Fonts (Noto Sans with the ₹ sign, Playfair Display) and the logo come
     from js/vendor/order-pdf-assets.js.
   • The libraries are loaded only when a PDF is first needed (checkout).
   • Everything happens on the customer's device: nothing is uploaded and
     nothing about the customer is saved.

   Shop name, title and file name: SHOP_CONFIG.orderPdf in js/config.js.
   Address, phone numbers and WhatsApp number: the rest of js/config.js.
   ===================================================================== */
const OrderPDF = (() => {
  "use strict";

  class PdfError extends Error {
    constructor(code, message) { super(message); this.name = "PdfError"; this.code = code; }
  }

  /* ---------- Loading the library (once, on demand) ---------- */
  const hasJsPDF = () => !!(window.jspdf && window.jspdf.jsPDF);
  const hasAutoTable = () => hasJsPDF() && typeof window.jspdf.jsPDF.API.autoTable === "function";
  const hasAssets = () => !!(window.VC_PDF_ASSETS && window.VC_PDF_ASSETS.fonts);
  const VENDOR = [
    { src: "js/vendor/jspdf.umd.min.js?v=4.2.1", ok: hasJsPDF },
    { src: "js/vendor/jspdf.plugin.autotable.min.js?v=5.0.8", ok: hasAutoTable },
    { src: "js/vendor/order-pdf-assets.js?v=1", ok: hasAssets }
  ];
  const isReady = () => VENDOR.every((v) => v.ok());
  let loading = null;

  function loadScript({ src, ok }) {
    if (ok()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = () => (ok() ? resolve() : reject(new PdfError("load", `${src} did not start`)));
      s.onerror = () => { s.remove(); reject(new PdfError("load", `Could not load ${src}`)); };
      document.head.appendChild(s);
    });
  }

  /** Loads jsPDF, AutoTable and the fonts. Safe to call many times. */
  function load() {
    if (isReady()) return Promise.resolve();
    if (!loading) {
      loading = VENDOR.reduce((p, v) => p.then(() => loadScript(v)), Promise.resolve())
        .catch((e) => { loading = null; throw e; });
    }
    return loading;
  }

  /* ---------- Shop details (from js/config.js) ---------- */
  function shop() {
    const c = typeof SHOP_CONFIG !== "undefined" ? SHOP_CONFIG : {};
    const o = c.orderPdf || {};
    const name = c.shopName || "Varam Crackers";
    const wa = String(c.whatsappNumber || "").replace(/\D/g, "");
    const waShown = wa.length === 12 && wa.startsWith("91") ? `+91 ${wa.slice(2, 7)} ${wa.slice(7)}` : (wa ? `+${wa}` : "");
    return {
      name,
      pdfName: o.shopName || name.toUpperCase(),
      title: o.title || "CUSTOMER ORDER SUMMARY",
      filePrefix: o.fileNamePrefix || `${name.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-ORDER`,
      tagline: c.tagline || "",
      address: c.address || "",
      phones: [c.phone].concat(c.altPhones || []).filter(Boolean),
      whatsapp: waShown
    };
  }

  /** e.g. VARAM-CRACKERS-ORDER-VC-261002-1745-K7Q.pdf */
  function fileName(ref) {
    const safeRef = String(ref || "ORDER").toUpperCase().replace(/[^A-Z0-9-]+/g, "-");
    return `${shop().filePrefix}-${safeRef}.pdf`.replace(/-{2,}/g, "-");
  }

  /* ---------- Check the order before drawing it ----------
     Every line is checked against the catalogue (data/products.js) and every
     subtotal and total is calculated again: subtotal = unit price × quantity.
     If anything doesn't add up, no PDF is made.                            */
  const money = (n) => Math.round(Number(n) * 100) / 100;

  function verify(lines, totals) {
    if (!Array.isArray(lines) || lines.length === 0) throw new PdfError("empty-cart", "The cart is empty.");
    const catalogue = new Map(PRODUCTS.map((p) => [p.id, p]));
    const max = typeof Cart !== "undefined" && Cart.max ? Cart.max : 999;
    const seen = new Set();
    let units = 0;
    let grand = 0;
    const rows = lines.map((l, i) => {
      const p = l && l.product && catalogue.get(l.product.id);
      if (!p) throw new PdfError("data", `Line ${i + 1}: this product is not in the price list.`);
      if (seen.has(p.id)) throw new PdfError("data", `Line ${i + 1}: ${p.name} is listed twice.`);
      seen.add(p.id);
      const qty = l.qty;
      if (!Number.isInteger(qty) || qty < 1 || qty > max) throw new PdfError("data", `Line ${i + 1}: invalid quantity for ${p.name}.`);
      const price = Number(p.price);
      if (!Number.isFinite(price) || price < 0) throw new PdfError("data", `Line ${i + 1}: invalid price for ${p.name}.`);
      const subtotal = money(price * qty);
      if (money(l.subtotal) !== subtotal) throw new PdfError("data", `Line ${i + 1}: subtotal does not match for ${p.name}.`);
      units += qty;
      grand = money(grand + subtotal);
      return { sno: i + 1, id: p.id, code: String(p.serialNumber), name: String(p.name), pack: String(p.pack), qty, price, subtotal };
    });
    if (totals && (totals.products !== rows.length || totals.items !== units || money(totals.grandTotal) !== grand)) {
      throw new PdfError("data", "The cart totals do not match the products in the cart.");
    }
    return { rows, products: rows.length, units, grandTotal: grand };
  }

  /* ---------- Page geometry & colours (points; A4 = 595.28 × 841.89) ---------- */
  const PAGE = { w: 595.28, h: 841.89 };
  const M = { l: 40, r: 40, t: 36, b: 46 };
  const X2 = PAGE.w - M.r;
  const CW = PAGE.w - M.l - M.r;
  const COL = {
    ink: [28, 32, 43], navy: [16, 21, 30], soft: [72, 80, 96], muted: [112, 120, 136],
    line: [222, 226, 233], zebra: [246, 247, 250], gold: [176, 124, 26], gold2: [232, 184, 82],
    goldSoft: [246, 222, 163], cream: [252, 248, 238], creamLine: [234, 219, 180], white: [255, 255, 255]
  };
  const F = { body: "NotoSans", display: "PlayfairDisplay" };
  const LH = 1.32;
  /* Table columns. Product Name gets whatever width is left. */
  const COLS = [
    { head: "S.No.", w: 34, align: "center" },
    { head: "Code", w: 42, align: "center" },
    { head: "Product Name", w: 0, align: "left" },
    { head: "Pack / Unit", w: 62, align: "left" },
    { head: "Qty", w: 44, align: "right" },
    { head: "Unit Price", w: 66, align: "right" },
    { head: "Subtotal", w: 76, align: "right" }
  ];
  COLS[2].w = CW - COLS.reduce((s, c) => s + c.w, 0);
  const CELL_PAD = { top: 4.2, right: 6, bottom: 4.2, left: 6 };

  /* ---------- Text helpers ---------- */
  const fmtINR = (n) => (typeof UI !== "undefined" ? UI.formatINR(n) : `₹${Math.round(n).toLocaleString("en-IN")}`);
  const fmtNum = (n) => (typeof UI !== "undefined" ? UI.formatNum(n) : Number(n).toLocaleString("en-IN"));
  /** Normal spaces only (Intl dates use narrow no-break spaces), no control characters. */
  const clean = (s) => String(s ?? "").normalize("NFC")
    .replace(/\r\n?/g, "\n").replace(/[\t   ]/g, " ")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .split("\n").map((l) => l.replace(/ {2,}/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();

  /** Can the embedded body font draw every character? (Tamil, emoji … can't.) */
  function canDraw(text) {
    const cov = window.VC_PDF_ASSETS.coverage;
    for (const ch of text) {
      if (ch === "\n") continue;
      const cp = ch.codePointAt(0);
      if (!cov.some(([a, b]) => cp >= a && cp <= b)) return false;
    }
    return true;
  }

  function setText(doc, { font = F.body, style = "normal", size = 9, color = COL.ink } = {}) {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  }
  /** Baseline of line i in a text block whose first line box starts at yTop. */
  const baseline = (yTop, i, size, lineH) => yTop + i * lineH + (lineH + size * 0.714) / 2;

  /** Small letter-spaced caps label (left aligned, y = baseline). */
  function label(doc, text, x, y, { size = 6.8, color = COL.muted, space = 0.7 } = {}) {
    setText(doc, { style: "bold", size, color });
    doc.text(text, x, y, { charSpace: space });
  }
  /** Right-aligned text that also has letter spacing. */
  function textRight(doc, text, xRight, y, space = 0) {
    const w = doc.getTextWidth(text) + space * Math.max(0, text.length - 1);
    doc.text(text, xRight - w, y, space ? { charSpace: space } : undefined);
  }

  /* Customer text the font can't draw (e.g. a Tamil address) is drawn as a
     sharp picture by the browser, which knows how to shape every script. */
  const CANVAS_FONT = '"Noto Sans", "Noto Sans Tamil", "Nirmala UI", "Latha", "Tamil Sangam MN", "Tamil MN", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const graphemes = (s) => (typeof Intl !== "undefined" && Intl.Segmenter
    ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s), (g) => g.segment)
    : Array.from(s));

  function wrapForCanvas(ctx, text, maxPx) {
    const out = [];
    text.split("\n").forEach((para) => {
      const words = para.split(/ +/).filter(Boolean);
      if (!words.length) { out.push(""); return; }
      let line = "";
      words.forEach((word) => {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width <= maxPx) { line = test; return; }
        if (line) out.push(line);
        if (ctx.measureText(word).width <= maxPx) { line = word; return; }
        line = "";   // one very long word: break between letters, never inside a letter cluster
        graphemes(word).forEach((g) => {
          if (line && ctx.measureText(line + g).width > maxPx) { out.push(line); line = g; } else line += g;
        });
      });
      out.push(line);
    });
    return out;
  }

  function textImage(text, maxW, o) {
    const S = 4;   // canvas pixels per PDF point (≈ 288 dpi)
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PdfError("canvas", "This browser can't draw text for the PDF.");
    const font = `${o.style === "bold" ? 700 : 400} ${o.size * S}px ${CANVAS_FONT}`;
    ctx.font = font;
    const lines = wrapForCanvas(ctx, text, maxW * S);
    const lineH = o.size * o.lh * S;
    const widest = Math.max(1, ...lines.map((l) => ctx.measureText(l).width));
    canvas.width = Math.ceil(Math.min(widest + 2, maxW * S));
    canvas.height = Math.ceil(lines.length * lineH);
    ctx.font = font;   // resizing a canvas resets its state
    ctx.fillStyle = `rgb(${o.color.join(",")})`;
    ctx.textBaseline = "alphabetic";
    lines.forEach((l, i) => ctx.fillText(l, 0, i * lineH + (lineH + o.size * S * 0.714) / 2));
    return { data: canvas.toDataURL("image/png"), w: canvas.width / S, h: canvas.height / S };
  }

  /** Measures wrapped text first (so boxes can be sized) and draws it later. */
  function layoutText(doc, text, maxW, opt = {}) {
    const o = { size: 9, style: "normal", font: F.body, color: COL.ink, lh: LH, ...opt };
    const t = clean(text);
    if (!t) return { h: 0, draw() {} };
    const lineH = o.size * o.lh;
    if (o.font !== F.body || canDraw(t)) {
      setText(doc, o);
      const lines = o.commas ? wrapAtCommas(doc, t, maxW) : doc.splitTextToSize(t, maxW);
      return {
        h: lines.length * lineH,
        draw(x, y) {
          setText(doc, o);
          lines.forEach((ln, i) => doc.text(ln, x, baseline(y, i, o.size, lineH)));
        }
      };
    }
    const img = textImage(t, maxW, o);
    return { h: img.h, image: true, draw(x, y) { doc.addImage(img.data, "PNG", x, y, img.w, img.h, undefined, "FAST"); } };
  }

  /** Wraps an address at its commas where possible ("…Road," / "Mathiyasenai, Sivakasi - 626130"). */
  function wrapAtCommas(doc, text, maxW) {
    const out = [];
    text.split("\n").forEach((para) => {
      let line = "";
      para.split(/(?<=,)\s+/).forEach((part) => {
        const test = line ? `${line} ${part}` : part;
        if (doc.getTextWidth(test) <= maxW) { line = test; return; }
        if (line) out.push(line);
        if (doc.getTextWidth(part) <= maxW) { line = part; return; }
        const pieces = doc.splitTextToSize(part, maxW);
        line = pieces.pop();
        out.push(...pieces);
      });
      out.push(line);
    });
    return out;
  }

  /* ---------- Document ---------- */
  function createDoc(info) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait", compress: true, putOnlyUsedFonts: true });
    const A = window.VC_PDF_ASSETS.fonts;
    doc.addFileToVFS("NotoSans-Regular.ttf", A["NotoSans-Regular.ttf"]);
    doc.addFont("NotoSans-Regular.ttf", F.body, "normal");
    doc.addFileToVFS("NotoSans-Bold.ttf", A["NotoSans-Bold.ttf"]);
    doc.addFont("NotoSans-Bold.ttf", F.body, "bold");
    doc.addFileToVFS("PlayfairDisplay-Bold.ttf", A["PlayfairDisplay-Bold.ttf"]);
    doc.addFont("PlayfairDisplay-Bold.ttf", F.display, "bold");
    doc.setFont(F.body, "normal");
    doc.setLineHeightFactor(LH);
    doc.setProperties({
      title: `${info.shop.name} — Order ${info.ref}`,
      subject: "Customer order summary",
      author: info.shop.name,
      creator: `${info.shop.name} website`,
      keywords: `order, ${info.ref}`
    });
    return doc;
  }

  function drawHeader(doc, info) {
    const s = info.shop;
    const y = M.t;
    const L = window.VC_PDF_ASSETS.logo;
    const logoH = 70;
    const logoW = (logoH * L.width) / L.height;
    doc.addImage(L.data, "JPEG", M.l, y, logoW, logoH, "vc-logo", "FAST");

    // Shop name, tagline, address, phones
    const tx = M.l + logoW + 12;
    const bw = 200;                              // width of the order reference box (right)
    const textW = X2 - bw - 18 - tx;             // never runs under the box
    setText(doc, { font: F.display, style: "bold", size: 21, color: COL.navy });
    doc.text(s.pdfName, tx, y + 19);
    if (s.tagline) label(doc, s.tagline.toUpperCase(), tx, y + 31, { size: 6.6, color: COL.gold, space: 0.9 });
    let yy = y + 37;
    [s.address, s.phones.length ? `Phone: ${s.phones.join("  ·  ")}` : "", s.whatsapp ? `WhatsApp: ${s.whatsapp}` : ""]
      .filter(Boolean)
      .forEach((t) => {
        const b = layoutText(doc, t, textW, { size: 8, color: COL.soft, lh: 1.38, commas: true });
        b.draw(tx, yy);
        yy += b.h;
      });
    const leftBottom = Math.max(y + logoH, yy);

    // Title and the order reference box
    setText(doc, { style: "bold", size: 12.5, color: COL.navy });
    textRight(doc, s.title, X2, y + 15, 0.6);
    const bh = 48, bx = X2 - bw, by = y + 25;
    doc.setFillColor(...COL.cream);
    doc.setDrawColor(...COL.creamLine);
    doc.setLineWidth(0.6);
    doc.roundedRect(bx, by, bw, bh, 5, 5, "FD");
    doc.setDrawColor(...COL.creamLine);
    doc.line(bx + 10, by + bh / 2, X2 - 10, by + bh / 2);
    label(doc, "ORDER REF", bx + 10, by + 15.5);
    setText(doc, { style: "bold", size: 10.5, color: COL.navy });
    textRight(doc, info.ref, X2 - 10, by + 16);
    label(doc, "DATE & TIME", bx + 10, by + 39.5);
    setText(doc, { size: 8.8, color: COL.ink });
    textRight(doc, info.dateText, X2 - 10, by + 40);

    const bottom = Math.max(leftBottom, by + bh) + 10;
    doc.setDrawColor(...COL.gold2);
    doc.setLineWidth(1.4);
    doc.line(M.l, bottom, X2, bottom);
    return bottom + 14;
  }

  function drawCustomer(doc, info, y) {
    const c = info.customer;
    const pad = 12, gap = 20, colL = 188;
    const colR = CW - pad * 2 - colL - gap;
    const name = layoutText(doc, c.name, colL, { size: 10.5, style: "bold", color: COL.navy });
    const mobile = layoutText(doc, c.mobile, colL, { size: 10, style: "bold", color: COL.ink });
    const addr = layoutText(doc, c.address, colR, { size: 9.2, color: COL.ink, lh: 1.4 });
    const titleH = 18, labelH = 12;
    const leftH = labelH + name.h + 9 + labelH + mobile.h;
    const rightH = labelH + addr.h;
    const h = pad + titleH + Math.max(leftH, rightH) + pad - 2;

    doc.setFillColor(...COL.cream);
    doc.setDrawColor(...COL.creamLine);
    doc.setLineWidth(0.6);
    doc.roundedRect(M.l, y, CW, h, 6, 6, "FD");
    label(doc, "CUSTOMER DETAILS", M.l + pad, y + pad + 6, { size: 7.4, color: COL.gold, space: 1 });

    const lx = M.l + pad;
    let ly = y + pad + titleH;
    label(doc, "NAME", lx, ly + 7);
    name.draw(lx, ly + labelH);
    ly += labelH + name.h + 9;
    label(doc, "MOBILE", lx, ly + 7);
    mobile.draw(lx, ly + labelH);

    const rx = lx + colL + gap;
    const ry = y + pad + titleH;
    doc.setDrawColor(...COL.creamLine);
    doc.line(rx - gap / 2, ry, rx - gap / 2, y + h - pad);
    label(doc, "DELIVERY ADDRESS", rx, ry + 7);
    addr.draw(rx, ry + labelH);
    return y + h + 16;
  }

  function drawRunningHeader(doc, info) {
    const y = M.t;
    setText(doc, { font: F.display, style: "bold", size: 12, color: COL.navy });
    doc.text(info.shop.pdfName, M.l, y + 11);
    const w = doc.getTextWidth(info.shop.pdfName);
    setText(doc, { size: 7.8, color: COL.muted });
    doc.text(`${info.shop.title} (continued)`, M.l + w + 8, y + 10.5);
    setText(doc, { style: "bold", size: 8.4, color: COL.navy });
    textRight(doc, `Order Ref: ${info.ref}`, X2, y + 10.5);
    doc.setDrawColor(...COL.gold2);
    doc.setLineWidth(1);
    doc.line(M.l, y + 19, X2, y + 19);
  }
  const CONT_TOP = M.t + 31;   // where content starts on pages 2, 3 …

  function drawItems(doc, info, data, startY) {
    const nameW = COLS[2].w - CELL_PAD.left - CELL_PAD.right;
    const images = new Map();   // row index → picture of a name the font can't draw
    const body = data.rows.map((r) => [
      String(r.sno), r.code, clean(r.name), clean(r.pack), fmtNum(r.qty), fmtINR(r.price), fmtINR(r.subtotal)
    ]);
    const opts = {
      startY,
      margin: { top: CONT_TOP, right: M.r, bottom: M.b + 8, left: M.l },
      head: [COLS.map((c) => c.head)],
      body,
      theme: "plain",
      showHead: "everyPage",
      rowPageBreak: "avoid",
      tableWidth: CW,
      styles: {
        font: F.body, fontStyle: "normal", fontSize: 8.8, textColor: COL.ink, cellPadding: CELL_PAD,
        lineColor: COL.line, lineWidth: { bottom: 0.5 }, valign: "middle", overflow: "linebreak", minCellHeight: 18
      },
      headStyles: { fontStyle: "bold", fontSize: 7.8, fillColor: COL.navy, textColor: COL.white, lineWidth: 0, cellPadding: { top: 7, right: 6, bottom: 7, left: 6 } },
      alternateRowStyles: { fillColor: COL.zebra },
      columnStyles: Object.fromEntries(COLS.map((c, i) => [i, { cellWidth: c.w, halign: c.align }])),
      didParseCell(d) {
        d.cell.styles.halign = COLS[d.column.index].align;
        if (d.section !== "body") return;
        if (d.column.index === 6) d.cell.styles.fontStyle = "bold";
        if (d.column.index === 0 || d.column.index === 1) d.cell.styles.textColor = COL.soft;
        if (d.column.index === 2) {
          const t = String(d.cell.raw || "");
          if (!canDraw(t)) {
            const img = textImage(t, nameW, { size: 8.8, style: "normal", color: COL.ink, lh: LH });
            images.set(d.row.index, img);
            d.cell.text = [""];
            d.cell.styles.minCellHeight = img.h + CELL_PAD.top + CELL_PAD.bottom;
          }
        }
      },
      didDrawCell(d) {
        if (d.section !== "body" || d.column.index !== 2) return;
        const img = images.get(d.row.index);
        if (img) doc.addImage(img.data, "PNG", d.cell.x + CELL_PAD.left, d.cell.y + (d.cell.height - img.h) / 2, img.w, img.h, undefined, "FAST");
      },
      didDrawPage() {
        if (doc.getCurrentPageInfo().pageNumber > 1) drawRunningHeader(doc, info);
      }
    };
    doc.autoTable(opts);
    return doc.lastAutoTable.finalY;
  }

  function drawTotals(doc, info, data, y) {
    const boxW = 236, bx = X2 - boxW;
    const noteW = CW - boxW - 18;
    const notePad = 12;
    const note = layoutText(doc,
      `Dear ${info.shop.name} team, please confirm this order with the customer on ${info.customer.mobile} — product availability, the final bill and the delivery date.`,
      noteW - notePad * 2, { size: 8.5, color: COL.ink, lh: 1.42 });
    const small = layoutText(doc,
      "Prices are from the current price list on the website. This is the customer's order request, not a tax invoice.",
      noteW - notePad * 2, { size: 7.3, color: COL.muted, lh: 1.42 });
    const noteH = notePad + 12 + note.h + 6 + small.h + notePad;
    const totalsH = 22 * 2 + 8 + 40;
    const blockH = Math.max(noteH, totalsH);
    const need = 6 + blockH + 46;
    if (y + need > PAGE.h - M.b - 4) {
      doc.addPage();
      drawRunningHeader(doc, info);
      y = CONT_TOP + 4;
    } else {
      y += 16;
    }

    // Totals (right)
    const row = (text, value, ry) => {
      setText(doc, { size: 8.8, color: COL.soft });
      doc.text(text, bx + 4, ry + 14);
      setText(doc, { style: "bold", size: 10, color: COL.ink });
      textRight(doc, value, X2 - 4, ry + 14.5);
      doc.setDrawColor(...COL.line);
      doc.setLineWidth(0.6);
      doc.line(bx, ry + 22, X2, ry + 22);
    };
    row("Total distinct products", fmtNum(data.products), y);
    row("Total ordered units", fmtNum(data.units), y + 22);
    const gy = y + 22 * 2 + 8;
    doc.setFillColor(...COL.navy);
    doc.roundedRect(bx, gy, boxW, 40, 5, 5, "F");
    doc.setFillColor(...COL.gold2);
    doc.rect(bx, gy + 8, 3, 24, "F");
    label(doc, "GRAND TOTAL", bx + 14, gy + 24, { size: 8.4, color: COL.goldSoft, space: 1 });
    setText(doc, { style: "bold", size: 15.5, color: COL.white });
    textRight(doc, fmtINR(data.grandTotal), X2 - 12, gy + 25.5);

    // Confirmation note (left)
    doc.setFillColor(...COL.cream);
    doc.setDrawColor(...COL.creamLine);
    doc.setLineWidth(0.6);
    doc.roundedRect(M.l, y, noteW, noteH, 6, 6, "FD");
    label(doc, "PLEASE CONFIRM THIS ORDER", M.l + notePad, y + notePad + 6, { size: 7.2, color: COL.gold, space: 0.9 });
    note.draw(M.l + notePad, y + notePad + 12);
    small.draw(M.l + notePad, y + notePad + 12 + note.h + 6);

    // Thank-you line
    const ty = y + blockH + 30;
    setText(doc, { font: F.display, style: "bold", size: 13.5, color: COL.navy });
    doc.text(`Thank you for choosing ${info.shop.name}.`, PAGE.w / 2, ty, { align: "center" });
    doc.setDrawColor(...COL.gold2);
    doc.setLineWidth(0.8);
    doc.line(PAGE.w / 2 - 28, ty + 8, PAGE.w / 2 + 28, ty + 8);
  }

  function drawFooters(doc, info) {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      const y = PAGE.h - M.b + 16;
      doc.setDrawColor(...COL.line);
      doc.setLineWidth(0.6);
      doc.line(M.l, y, X2, y);
      setText(doc, { size: 7.3, color: COL.muted });
      doc.text(`${info.shop.name}  ·  ${info.shop.title.charAt(0)}${info.shop.title.slice(1).toLowerCase()}  ·  ${info.ref}`, M.l, y + 12);
      setText(doc, { style: "bold", size: 7.3, color: COL.soft });
      textRight(doc, `Page ${i} of ${n}`, X2, y + 12);
    }
  }

  /**
   * Builds the order PDF.
   * @param {{customer:{name,mobile,address}, lines:Array, totals:Object, ref:string, date:Date, dateText?:string}} order
   * @returns {Promise<{blob:Blob, fileName:string, pages:number, products:number, units:number, grandTotal:number}>}
   */
  async function build(order) {
    await load();
    const data = verify(order.lines, order.totals);
    const info = {
      shop: shop(),
      ref: clean(order.ref),
      dateText: clean(order.dateText || (order.date || new Date()).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })),
      customer: { name: clean(order.customer.name), mobile: clean(order.customer.mobile), address: clean(order.customer.address) }
    };
    const doc = createDoc(info);
    let y = drawHeader(doc, info);
    y = drawCustomer(doc, info, y);
    y = drawItems(doc, info, data, y);
    drawTotals(doc, info, data, y);
    drawFooters(doc, info);
    const blob = doc.output("blob");
    if (!blob || !blob.size) throw new PdfError("output", "The PDF came out empty.");
    return { blob, fileName: fileName(info.ref), pages: doc.getNumberOfPages(), products: data.products, units: data.units, grandTotal: data.grandTotal };
  }

  return { load, build, verify, fileName, isReady, PdfError };
})();
