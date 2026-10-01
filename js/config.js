/* =====================================================================
   SHOP CONFIGURATION — all editable business information lives HERE.
   Change a value once and every page (header, footer, contact section,
   WhatsApp order message) updates automatically.
   ===================================================================== */
const SHOP_CONFIG = {
  shopName: "Varam Crackers",
  tagline: "More Sound · More Light · More Varam",
  location: "Sivakasi",

  /* WhatsApp number that RECEIVES the orders.
     Digits only: country code (91) + 10-digit mobile number. No +, spaces or dashes. */
  whatsappNumber: "918489351529",

  /* Numbers shown on the website (display format is free text). */
  phone: "84893 51529",
  altPhones: ["95975 02916", "63834 11911"],

  address: "No.5, Sivakasi to Virudhunagar Road, Mathiyasenai, Sivakasi - 626130",

  priceListLabel: "2026 Price List",
  copyrightYear: 2026,

  /* Cart settings */
  maxQtyPerItem: 999,          // highest quantity a customer can select per product
  cartStorageKey: "crackersCart",
  cartVersion: 2               // change this number to empty every visitor's saved cart once
};
