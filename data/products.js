/* =====================================================================
   VARAM CRACKERS — PRODUCT CATALOGUE  (single source of truth)
   ---------------------------------------------------------------------
   Source : "MRP VARAM 2026 (3).pdf" (new price list, Sep 2026)
            123 products in 13 sections + 5 Gift Boxes + 4 Combo Packs = 132
   Every page (Home, Products, Cart, Checkout) reads from THIS file only.

   HOW TO UPDATE A PRODUCT
   • Change a price ........ edit  price: 250        (number, rupees, no ₹ sign)
                              price = the 50% DISCOUNT PRICE from the PDF
                              (this is what the customer pays).
                              mrp   = the MRP column of the PDF (kept for
                              reference only — the website does not show it).
   • Change a name ......... edit  name: "..."
   • Change the pack ....... edit  pack: "1 Box"    (what ONE unit contains)
   • Change a photo ........ set image: to a new picture:
                              - your own photo:  "assets/images/products/017.webp"
                                (or run tools/add-photos.py — see README)
                              - any web address: "https://…"
                              - leave image: "" to show the drawn illustration
     The current photos are free-licence images from Unsplash (unsplash.com),
     chosen to match each product's type and colour. They are illustrative —
     the actual product/packaging can look different.
   • Add a product ......... copy one line, give it a NEW unique id, set its
                              serialNumber (the CODE printed on the price list)
                              and a category id from CATEGORIES below.
   • Remove a product ...... delete its line.

   NOTE  "id" must be unique (it is what the cart stores). Here id = the PDF
         code. If you ever renumber ids, also raise cartVersion in
         js/config.js so old saved carts don't point at the wrong product.
   ===================================================================== */

/* Categories = the section headings of the PDF.
   Gift Boxes and Combo Packs are listed first so they open the price list.
   icon  : which built-in illustration is used for products without a photo
   hue   : colour tint (0-360) of the illustration background               */
const CATEGORIES = [
  { id: "gift-boxes", name: "Gift Boxes", icon: "star", hue: 330 },
  { id: "combo-packs", name: "Combo Packs", icon: "star", hue: 48 },
  { id: "single-sound", name: "Single Sound Crackers", icon: "cracker", hue: 8 },
  { id: "paper-bomb", name: "Paper Bomb", icon: "paperbomb", hue: 22 },
  { id: "ground-chakkar", name: "Ground Chakkar", icon: "chakkar", hue: 38 },
  { id: "flower-pots", name: "Flower Pots", icon: "flowerpot", hue: 330 },
  { id: "twinkling-stars", name: "Twinkling Stars", icon: "star", hue: 48 },
  { id: "kids-crackers", name: "Kids Crackers", icon: "kids", hue: 290 },
  { id: "sparklers", name: "Sparklers", icon: "sparkler", hue: 42 },
  { id: "classic-matches", name: "Classic Matches", icon: "matches", hue: 14 },
  { id: "festival-crackers", name: "Festival Crackers", icon: "wala", hue: 355 },
  { id: "bomb", name: "Bomb", icon: "bomb", hue: 2 },
  { id: "rockets", name: "Rockets", icon: "rocket", hue: 210 },
  { id: "fountains", name: "Fountains", icon: "fountain", hue: 30 },
  { id: "fancy-items", name: "Fancy Items", icon: "skyshot", hue: 270 }
];

const PRODUCTS = [

  /* ── SINGLE SOUND CRACKERS ── */
  { id: 1, serialNumber: "1", name: "2 3/4\" KURUVI", pack: "1 Pkt", mrp: 16, price: 8, category: "single-sound", image: "https://images.unsplash.com/photo-1508128719453-5c03af767bcf?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 2, serialNumber: "2", name: "3 1/2\" LAKSHMI", pack: "1 Pkt", mrp: 30, price: 15, category: "single-sound", image: "https://images.unsplash.com/photo-1700623066425-f917e61f7636?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 3, serialNumber: "3", name: "4\" LAKSHMI MEGA DELUXE", pack: "1 Pkt", mrp: 80, price: 40, category: "single-sound", image: "https://images.unsplash.com/photo-1768889097721-cbe9741445bd?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 4, serialNumber: "4", name: "5\" LAKSHMI", pack: "1 Pkt", mrp: 120, price: 60, category: "single-sound", image: "https://images.unsplash.com/photo-1504713514062-dbf54eca0963?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 5, serialNumber: "5", name: "5\" LAKSHMI (THAR)", pack: "1 Pkt", mrp: 140, price: 70, category: "single-sound", image: "https://images.unsplash.com/photo-1700623066425-f917e61f7636?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 6, serialNumber: "6", name: "6\" LAKSHMI", pack: "1 Pkt", mrp: 160, price: 80, category: "single-sound", image: "https://images.unsplash.com/photo-1768889097721-cbe9741445bd?auto=format&fit=crop&w=640&h=440&q=70&flip=h&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 7, serialNumber: "7", name: "2 SOUND", pack: "1 Pkt", mrp: 90, price: 45, category: "single-sound", image: "https://images.unsplash.com/photo-1504713514062-dbf54eca0963?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },

  /* ── PAPER BOMB ── */
  { id: 8, serialNumber: "8", name: "ADIYAL 1/4KG", pack: "1 Pcs", mrp: 100, price: 50, category: "paper-bomb", image: "https://images.unsplash.com/photo-1504713514062-dbf54eca0963?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 9, serialNumber: "9", name: "ADIYAL 1/2KG", pack: "1 Pcs", mrp: 200, price: 100, category: "paper-bomb", image: "https://images.unsplash.com/photo-1768889097721-cbe9741445bd?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.38&fp-y=.5&fp-z=1.4" },
  { id: 10, serialNumber: "10", name: "MONEY BANK SMALL", pack: "1 Pcs", mrp: 40, price: 20, category: "paper-bomb", image: "https://images.unsplash.com/photo-1700623066425-f917e61f7636?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.62&fp-y=.5&fp-z=1.4" },
  { id: 11, serialNumber: "11", name: "MONEY BANK SMALL (3 PCS)", pack: "1 Box", mrp: 140, price: 70, category: "paper-bomb", image: "https://images.unsplash.com/photo-1504713514062-dbf54eca0963?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.62&fp-y=.5&fp-z=1.4&flip=h" },

  /* ── GROUND CHAKKAR ── */
  { id: 12, serialNumber: "12", name: "CHAKKAR BIG (10 PCS)", pack: "1 Box", mrp: 80, price: 40, category: "ground-chakkar", image: "https://images.unsplash.com/photo-1773312544875-61b83a1f67be?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 13, serialNumber: "13", name: "CHAKKAR BIG (5PCS)", pack: "1 Box", mrp: 40, price: 20, category: "ground-chakkar", image: "https://images.unsplash.com/photo-1773312544875-61b83a1f67be?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 14, serialNumber: "14", name: "CHAKKAR SPECIAL (10 PCS)", pack: "1 Box", mrp: 180, price: 90, category: "ground-chakkar", image: "https://images.unsplash.com/photo-1773312544875-61b83a1f67be?auto=format&fit=crop&w=640&h=440&q=70&flip=h&hue=120" },
  { id: 15, serialNumber: "15", name: "CHAKKAR DLX (10 PCS)", pack: "1 Box", mrp: 300, price: 150, category: "ground-chakkar", image: "https://images.unsplash.com/photo-1773312544875-61b83a1f67be?auto=format&fit=crop&w=640&h=440&q=70&hue=280" },
  { id: 16, serialNumber: "16", name: "DISCO WHEEL", pack: "1 Box", mrp: 200, price: 100, category: "ground-chakkar", image: "https://images.unsplash.com/photo-1636838679357-cbcd37e1aec5?auto=format&fit=crop&w=640&h=440&q=70" },

  /* ── FLOWER POTS ── */
  { id: 17, serialNumber: "17", name: "FLOWER POTS SMALL", pack: "1 Box", mrp: 90, price: 45, category: "flower-pots", image: "https://images.unsplash.com/photo-1508128626258-eed4f38767a1?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 18, serialNumber: "18", name: "FLOWER POTS BIG", pack: "1 Box", mrp: 170, price: 85, category: "flower-pots", image: "https://images.unsplash.com/photo-1708328648954-b6daa50322d7?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 19, serialNumber: "19", name: "FLOWER POTS SPL", pack: "1 Box", mrp: 250, price: 125, category: "flower-pots", image: "https://images.unsplash.com/photo-1625456809070-da1680787f5c?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 20, serialNumber: "20", name: "FLOWER POTS ASOKA", pack: "1 Box", mrp: 320, price: 160, category: "flower-pots", image: "https://images.unsplash.com/photo-1780318565517-434d2e7b5052?auto=format&fit=crop&w=640&h=440&q=70&hue=120" },
  { id: 21, serialNumber: "21", name: "COLOR COTTI", pack: "1 Box", mrp: 540, price: 270, category: "flower-pots", image: "https://images.unsplash.com/photo-1636986541043-edeab0b36bda?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 22, serialNumber: "22", name: "COLOR COTTI DELUX", pack: "1 Box", mrp: 600, price: 300, category: "flower-pots", image: "https://images.unsplash.com/photo-1636986541043-edeab0b36bda?auto=format&fit=crop&w=640&h=440&q=70&flip=h&hue=60" },

  /* ── TWINKLING STARS ── */
  { id: 23, serialNumber: "23", name: "TWINKLING STAR 1 1/2'(10 PCS)", pack: "1 Box", mrp: 50, price: 25, category: "twinkling-stars", image: "https://images.unsplash.com/photo-1508564733209-edec8a954e40?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 24, serialNumber: "24", name: "TWINKLING STAR 1 1/2'(5 PCS)", pack: "1 Box", mrp: 20.4, price: 10, category: "twinkling-stars", image: "https://images.unsplash.com/photo-1508564733209-edec8a954e40?auto=format&fit=crop&w=640&h=440&q=70&flip=h&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 25, serialNumber: "25", name: "TWINKLING STAR 4'", pack: "1 Box", mrp: 140, price: 70, category: "twinkling-stars", image: "https://images.unsplash.com/photo-1660131478614-504ca69a9329?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 26, serialNumber: "26", name: "TWINKLING STAR 4' (5 PCS)", pack: "1 Box", mrp: 60, price: 30, category: "twinkling-stars", image: "https://images.unsplash.com/photo-1660131478614-504ca69a9329?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },

  /* ── KIDS CRACKERS ── */
  { id: 27, serialNumber: "27", name: "MOBILE RING GUN", pack: "1 Box", mrp: 400, price: 200, category: "kids-crackers", image: "https://images.unsplash.com/photo-1727895948998-22fdd2abb7ef?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 28, serialNumber: "28", name: "MUSICAL GUN & RING GUN", pack: "1 Box", mrp: 470, price: 235, category: "kids-crackers", image: "https://images.unsplash.com/photo-1728897061818-e84496a03966?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 29, serialNumber: "29", name: "GUN & RING", pack: "1 Box", mrp: 320, price: 160, category: "kids-crackers", image: "https://images.unsplash.com/photo-1761404821641-3d3e946ff62b?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 30, serialNumber: "30", name: "ROLL CAP", pack: "1 Box", mrp: 110, price: 55, category: "kids-crackers", image: "https://images.unsplash.com/photo-1728897061818-e84496a03966?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 31, serialNumber: "31", name: "SONNY RING CAP", pack: "1 Box", mrp: 20, price: 10, category: "kids-crackers", image: "https://images.unsplash.com/photo-1761404821641-3d3e946ff62b?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 32, serialNumber: "32", name: "PENCIL", pack: "1 Pcs", mrp: 640, price: 320, category: "kids-crackers", image: "https://images.unsplash.com/photo-1540003078194-08b0cbffd945?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 33, serialNumber: "33", name: "OLD IS GOLD (25 PCS)", pack: "1 Box", mrp: 320, price: 160, category: "kids-crackers", image: "https://images.unsplash.com/photo-1761057292517-74dfb48ede46?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 34, serialNumber: "34", name: "HELICOPTER (5 PCS)", pack: "1 Box", mrp: 200, price: 100, category: "kids-crackers", image: "https://images.unsplash.com/photo-1636838679357-cbcd37e1aec5?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 35, serialNumber: "35", name: "HELICOPTER (1 PCS)", pack: "1 Pcs", mrp: 24, price: 12, category: "kids-crackers", image: "https://images.unsplash.com/photo-1636838679357-cbcd37e1aec5?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 36, serialNumber: "36", name: "PHOTO FLASH", pack: "1 Box", mrp: 180, price: 90, category: "kids-crackers", image: "https://images.unsplash.com/photo-1779633208301-1c447bd0ad98?auto=format&fit=crop&w=640&h=440&q=70&sat=-100&bri=8" },
  { id: 37, serialNumber: "37", name: "BATHI", pack: "1 Pkt", mrp: 20, price: 10, category: "kids-crackers", image: "https://images.unsplash.com/photo-1766395405040-d0bc5f9c1074?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 38, serialNumber: "38", name: "SMOKI STICK SMALL (2PCS)", pack: "1 Box", mrp: 36, price: 18, category: "kids-crackers", image: "https://images.unsplash.com/photo-1519066473994-a7506988851d?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 39, serialNumber: "39", name: "CARTOONS", pack: "1 Pcs", mrp: 30, price: 15, category: "kids-crackers", image: "https://images.unsplash.com/photo-1700601589928-8937ebf649fa?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 40, serialNumber: "40", name: "POPS (1 PCS)", pack: "1 Pcs", mrp: 24, price: 12, category: "kids-crackers", image: "https://images.unsplash.com/photo-1762107470765-a70bbbf57b85?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 41, serialNumber: "41", name: "PENCIL", pack: "1 Box", mrp: 200, price: 100, category: "kids-crackers", image: "https://images.unsplash.com/photo-1540003078194-08b0cbffd945?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 42, serialNumber: "42", name: "PHOTO FLASH (1 PCS)", pack: "1 Pcs", mrp: 40, price: 20, category: "kids-crackers", image: "https://images.unsplash.com/photo-1779633208301-1c447bd0ad98?auto=format&fit=crop&w=640&h=440&q=70&sat=-100&bri=8&flip=h" },
  { id: 43, serialNumber: "43", name: "ELECTRIC STONE", pack: "1 Box", mrp: 50, price: 25, category: "kids-crackers", image: "https://images.unsplash.com/photo-1609827481403-f5e60468bf0f?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 44, serialNumber: "44", name: "MAGIC POPS", pack: "1 Box", mrp: 40, price: 20, category: "kids-crackers", image: "https://images.unsplash.com/photo-1761490676980-1f118ab2a25d?auto=format&fit=crop&w=640&h=440&q=70&hue=280" },
  { id: 45, serialNumber: "45", name: "ZEE BOOM BAA", pack: "1 Box", mrp: 40, price: 20, category: "kids-crackers", image: "https://images.unsplash.com/photo-1597243508456-d8cb4178de17?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 46, serialNumber: "46", name: "KIT KAT", pack: "1 Box", mrp: 60, price: 30, category: "kids-crackers", image: "https://images.unsplash.com/photo-1761363825703-9b33061e1166?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 47, serialNumber: "47", name: "MAGIC BUTTERFLY", pack: "1 Box", mrp: 200, price: 100, category: "kids-crackers", image: "https://images.unsplash.com/photo-1746853772470-90df836a9463?auto=format&fit=crop&w=640&h=440&q=70&hue=280" },
  { id: 48, serialNumber: "48", name: "MAGIC BUTTERFLY SINGLE", pack: "1 Box", mrp: 30, price: 15, category: "kids-crackers", image: "https://images.unsplash.com/photo-1746853772470-90df836a9463?auto=format&fit=crop&w=640&h=440&q=70" },

  /* ── SPARKLERS ── */
  { id: 49, serialNumber: "49", name: "7CM ELECTRIC SPARKLERS", pack: "1 Box", mrp: 26, price: 13, category: "sparklers", image: "https://images.unsplash.com/photo-1572979440672-16af53b49b52?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 50, serialNumber: "50", name: "7CM CRACKLING SPARKLERS", pack: "1 Box", mrp: 24, price: 12, category: "sparklers", image: "https://images.unsplash.com/photo-1689315988645-ac59fc62976f?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 51, serialNumber: "51", name: "7CM GREEN SPARKLERS", pack: "1 Box", mrp: 36, price: 18, category: "sparklers", image: "https://images.unsplash.com/photo-1779633208301-1c447bd0ad98?auto=format&fit=crop&w=640&h=440&q=70&hue=120" },
  { id: 52, serialNumber: "52", name: "7CM RED SPARKLERS", pack: "1 Box", mrp: 40, price: 20, category: "sparklers", image: "https://images.unsplash.com/photo-1779633208301-1c447bd0ad98?auto=format&fit=crop&w=640&h=440&q=70&hue=-30&sat=80" },
  { id: 53, serialNumber: "53", name: "10CM ELECTRIC SPARKLERS", pack: "1 Box", mrp: 40, price: 20, category: "sparklers", image: "https://images.unsplash.com/photo-1610473651479-296bff40c60f?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 54, serialNumber: "54", name: "10CM CRACKLING SPARKLERS", pack: "1 Box", mrp: 44, price: 22, category: "sparklers", image: "https://images.unsplash.com/photo-1574380965762-d7af37362e0c?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 55, serialNumber: "55", name: "10CM GREEN SPARKLERS", pack: "1 Box", mrp: 52, price: 26, category: "sparklers", image: "https://images.unsplash.com/photo-1610473651479-296bff40c60f?auto=format&fit=crop&w=640&h=440&q=70&hue=120" },
  { id: 56, serialNumber: "56", name: "10CM RED SPARKLERS", pack: "1 Box", mrp: 56, price: 28, category: "sparklers", image: "https://images.unsplash.com/photo-1610473651479-296bff40c60f?auto=format&fit=crop&w=640&h=440&q=70&hue=-30&sat=80" },
  { id: 57, serialNumber: "57", name: "15CM ELECTRIC SPARKLERS", pack: "1 Box", mrp: 100, price: 50, category: "sparklers", image: "https://images.unsplash.com/photo-1779633208301-1c447bd0ad98?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 58, serialNumber: "58", name: "15CM CRACKLING SPARKLERS", pack: "1 Box", mrp: 90, price: 45, category: "sparklers", image: "https://images.unsplash.com/photo-1761363825703-9b33061e1166?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 59, serialNumber: "59", name: "15CM GREEN SPARKLERS", pack: "1 Box", mrp: 92, price: 46, category: "sparklers", image: "https://images.unsplash.com/photo-1594019183989-942fa6fba919?auto=format&fit=crop&w=640&h=440&q=70&hue=120" },
  { id: 60, serialNumber: "60", name: "15CM RED SPARKLERS", pack: "1 Box", mrp: 98, price: 49, category: "sparklers", image: "https://images.unsplash.com/photo-1594019183989-942fa6fba919?auto=format&fit=crop&w=640&h=440&q=70&hue=-30&sat=80" },
  { id: 61, serialNumber: "61", name: "30CM ELECTRIC SPARKLERS", pack: "1 Box", mrp: 90, price: 45, category: "sparklers", image: "https://images.unsplash.com/photo-1549933797-2e90eb26f201?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 62, serialNumber: "62", name: "30CM CRACKLING SPARKLERS", pack: "1 Box", mrp: 100, price: 50, category: "sparklers", image: "https://images.unsplash.com/photo-1689315988645-ac59fc62976f?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 63, serialNumber: "63", name: "30CM GREEN SPARKLERS", pack: "1 Box", mrp: 100, price: 50, category: "sparklers", image: "https://images.unsplash.com/photo-1762107470765-a70bbbf57b85?auto=format&fit=crop&w=640&h=440&q=70&hue=120" },
  { id: 64, serialNumber: "64", name: "30CM RED SPARKLERS", pack: "1 Box", mrp: 120, price: 60, category: "sparklers", image: "https://images.unsplash.com/photo-1762107470765-a70bbbf57b85?auto=format&fit=crop&w=640&h=440&q=70&hue=-30&sat=80" },
  { id: 65, serialNumber: "65", name: "TUBE 50CM ELECTRIC SPARKLERS (5 PCS)", pack: "1 Box", mrp: 380, price: 190, category: "sparklers", image: "https://images.unsplash.com/photo-1779633208301-1c447bd0ad98?auto=format&fit=crop&w=640&h=440&q=70&flip=h&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 66, serialNumber: "66", name: "TUBE 50CM CRACKLING SPARKLERS (5 PCS)", pack: "1 Box", mrp: 420, price: 210, category: "sparklers", image: "https://images.unsplash.com/photo-1574380965762-d7af37362e0c?auto=format&fit=crop&w=640&h=440&q=70&flip=h&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 67, serialNumber: "67", name: "ROTATING SPARLERS", pack: "1 Pcs", mrp: 440, price: 220, category: "sparklers", image: "https://images.unsplash.com/photo-1746853772470-90df836a9463?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },

  /* ── CLASSIC MATCHES ── */
  { id: 68, serialNumber: "68", name: "LAPTOP BIG", pack: "1 Box", mrp: 700, price: 350, category: "classic-matches", image: "https://images.unsplash.com/photo-1490447519689-42dc651e8eb3?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 69, serialNumber: "69", name: "LAPTOP SMALL", pack: "1 Box", mrp: 400, price: 200, category: "classic-matches", image: "https://images.unsplash.com/photo-1515283736202-cbe98351a5d8?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 70, serialNumber: "70", name: "MAX BOX (3 PCS)", pack: "1 Box", mrp: 50, price: 25, category: "classic-matches", image: "https://images.unsplash.com/photo-1755212488869-7814a4249d5a?auto=format&fit=crop&w=640&h=440&q=70" },

  /* ── FESTIVAL CRACKERS ── */
  { id: 71, serialNumber: "71", name: "BIJILI (50 PCS)", pack: "1 Pkt", mrp: 50, price: 25, category: "festival-crackers", image: "https://images.unsplash.com/photo-1558981087-2a179c8252b4?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 72, serialNumber: "72", name: "RED BIJILI (100 PCS)", pack: "1 Pkt", mrp: 100, price: 50, category: "festival-crackers", image: "https://images.unsplash.com/photo-1558981087-2a179c8252b4?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 73, serialNumber: "73", name: "STRIPPED BIJILI (100 PCS)", pack: "1 Pkt", mrp: 120, price: 60, category: "festival-crackers", image: "https://images.unsplash.com/photo-1558981087-2a179c8252b4?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 74, serialNumber: "74", name: "28 CHORSA", pack: "1 Pkt", mrp: 36, price: 18, category: "festival-crackers", image: "https://images.unsplash.com/photo-1504713514062-dbf54eca0963?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.38&fp-y=.5&fp-z=1.4&flip=h" },
  { id: 75, serialNumber: "75", name: "24 DELUX GEINT", pack: "1 Pkt", mrp: 140, price: 70, category: "festival-crackers", image: "https://images.unsplash.com/photo-1700623066425-f917e61f7636?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5&flip=h" },
  { id: 76, serialNumber: "76", name: "28 GAINT", pack: "1 Pkt", mrp: 60, price: 30, category: "festival-crackers", image: "https://images.unsplash.com/photo-1768889097721-cbe9741445bd?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.62&fp-y=.5&fp-z=1.4&flip=h" },
  { id: 77, serialNumber: "77", name: "28 DELUX 4\"", pack: "1 Pkt", mrp: 220, price: 110, category: "festival-crackers", image: "https://images.unsplash.com/photo-1558527816-f6fce1cb5499?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 78, serialNumber: "78", name: "56 GAINT", pack: "1 Pkt", mrp: 120, price: 60, category: "festival-crackers", image: "https://images.unsplash.com/photo-1768889097721-cbe9741445bd?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 79, serialNumber: "79", name: "1000 WALA UV", pack: "1 Pcs", mrp: 560, price: 280, category: "festival-crackers", image: "https://images.unsplash.com/photo-1597243508456-d8cb4178de17?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 80, serialNumber: "80", name: "1000 WALA (SHORT)", pack: "1 Pcs", mrp: 400, price: 200, category: "festival-crackers", image: "https://images.unsplash.com/photo-1597243508456-d8cb4178de17?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 81, serialNumber: "81", name: "2000 WALA (SHORT)", pack: "1 Pcs", mrp: 800, price: 400, category: "festival-crackers", image: "https://images.unsplash.com/photo-1558527816-f6fce1cb5499?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 82, serialNumber: "82", name: "2000 WALA", pack: "1 Pcs", mrp: 1100, price: 550, category: "festival-crackers", image: "https://images.unsplash.com/photo-1504713514062-dbf54eca0963?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5&flip=h" },
  { id: 83, serialNumber: "83", name: "5000 WALA UV (SHORT)", pack: "1 Pcs", mrp: 2000, price: 1000, category: "festival-crackers", image: "https://images.unsplash.com/photo-1700623066425-f917e61f7636?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.38&fp-y=.5&fp-z=1.4" },
  { id: 84, serialNumber: "84", name: "10000 WALA (SHORT)", pack: "1 Pcs", mrp: 4000, price: 2000, category: "festival-crackers", image: "https://images.unsplash.com/photo-1768889097721-cbe9741445bd?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.38&fp-y=.5&fp-z=1.4&flip=h" },

  /* ── BOMB ── */
  { id: 85, serialNumber: "85", name: "AUTO BOMB", pack: "1 Box", mrp: 280, price: 140, category: "bomb", image: "https://images.unsplash.com/photo-1504713514062-dbf54eca0963?auto=format&fit=crop&w=640&h=440&q=70&sat=20" },
  { id: 86, serialNumber: "86", name: "CLASSIC BOMB", pack: "1 Box", mrp: 360, price: 180, category: "bomb", image: "https://images.unsplash.com/photo-1768889097721-cbe9741445bd?auto=format&fit=crop&w=640&h=440&q=70&sat=20&flip=h" },
  { id: 87, serialNumber: "87", name: "TOP POWER BOMB", pack: "1 Box", mrp: 720, price: 360, category: "bomb", image: "https://images.unsplash.com/photo-1768889097721-cbe9741445bd?auto=format&fit=crop&w=640&h=440&q=70&sat=20" },
  { id: 88, serialNumber: "88", name: "KING OF KING", pack: "1 Box", mrp: 360, price: 180, category: "bomb", image: "https://images.unsplash.com/photo-1700623066425-f917e61f7636?auto=format&fit=crop&w=640&h=440&q=70&sat=20&flip=h" },

  /* ── ROCKETS ── */
  { id: 89, serialNumber: "89", name: "BABY ROCKET", pack: "1 Box", mrp: 140, price: 70, category: "rockets", image: "https://images.unsplash.com/photo-1593956661646-a38a9a460f20?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 90, serialNumber: "90", name: "ROCKET BOMB", pack: "1 Box", mrp: 140, price: 70, category: "rockets", image: "https://images.unsplash.com/photo-1593956661646-a38a9a460f20?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 91, serialNumber: "91", name: "ROCKET", pack: "1 Box", mrp: 120, price: 60, category: "rockets", image: "https://images.unsplash.com/photo-1639222113099-786f0148fea8?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 92, serialNumber: "92", name: "TWO SOUND ROCKET", pack: "1 Box", mrp: 250, price: 125, category: "rockets", image: "https://images.unsplash.com/photo-1593956661646-a38a9a460f20?auto=format&fit=crop&w=640&h=440&q=70&flip=h&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },

  /* ── FOUNTAINS ── */
  { id: 93, serialNumber: "93", name: "SIREN SMALL (3PCS)", pack: "1 Box", mrp: 360, price: 180, category: "fountains", image: "https://images.unsplash.com/photo-1562300069-bc05b840c7a2?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 94, serialNumber: "94", name: "WATER QUEEN 4\"", pack: "1 Pcs", mrp: 340, price: 170, category: "fountains", image: "https://images.unsplash.com/photo-1562300069-bc05b840c7a2?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 95, serialNumber: "95", name: "TRICOLOR", pack: "1 Box", mrp: 680, price: 340, category: "fountains", image: "https://images.unsplash.com/photo-1598817123719-b2407ba2f6d9?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 96, serialNumber: "96", name: "MOTU PATLU (STARVEL)", pack: "1 Pcs", mrp: 880, price: 440, category: "fountains", image: "https://images.unsplash.com/photo-1625456809070-da1680787f5c?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 97, serialNumber: "97", name: "EMU EGG (STARVEL)", pack: "1 Box", mrp: 600, price: 300, category: "fountains", image: "https://images.unsplash.com/photo-1708328648954-b6daa50322d7?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 98, serialNumber: "98", name: "BADA PEACOCK", pack: "1 Pcs", mrp: 800, price: 400, category: "fountains", image: "https://images.unsplash.com/photo-1636986541043-edeab0b36bda?auto=format&fit=crop&w=640&h=440&q=70&hue=120&flip=h" },
  { id: 99, serialNumber: "99", name: "2000 WATS (OWL)", pack: "1 Pcs", mrp: 500, price: 250, category: "fountains", image: "https://images.unsplash.com/photo-1675453319750-77af38e9695c?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 100, serialNumber: "100", name: "5000 WATS (OWL)", pack: "1 Pcs", mrp: 400, price: 200, category: "fountains", image: "https://images.unsplash.com/photo-1675453319750-77af38e9695c?auto=format&fit=crop&w=640&h=440&q=70&flip=h&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 101, serialNumber: "101", name: "COLOR SHOWER (OWL)", pack: "1 Pcs", mrp: 340, price: 170, category: "fountains", image: "https://images.unsplash.com/photo-1636986541043-edeab0b36bda?auto=format&fit=crop&w=640&h=440&q=70&hue=300" },
  { id: 102, serialNumber: "102", name: "KUDAM SHOWER (OWL)", pack: "1 Pcs", mrp: 500, price: 250, category: "fountains", image: "https://images.unsplash.com/photo-1780318565517-434d2e7b5052?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 103, serialNumber: "103", name: "CYLINDER RED", pack: "1 Pcs", mrp: 360, price: 180, category: "fountains", image: "https://images.unsplash.com/photo-1764471443909-ecd2b8ec1530?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 104, serialNumber: "104", name: "CYLINDER BLUE", pack: "1 Box", mrp: 360, price: 180, category: "fountains", image: "https://images.unsplash.com/photo-1764471443909-ecd2b8ec1530?auto=format&fit=crop&w=640&h=440&q=70&hue=205" },
  { id: 105, serialNumber: "105", name: "VENNILA (ARGO)", pack: "1 Box", mrp: 440, price: 220, category: "fountains", image: "https://images.unsplash.com/photo-1675453319750-77af38e9695c?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.38&fp-y=.5&fp-z=1.4" },
  { id: 106, serialNumber: "106", name: "CHOTTA BEAM (ARGO)", pack: "1 Box", mrp: 280, price: 140, category: "fountains", image: "https://images.unsplash.com/photo-1708328648954-b6daa50322d7?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 107, serialNumber: "107", name: "JELLY (ARGO)", pack: "1 Box", mrp: 120, price: 60, category: "fountains", image: "https://images.unsplash.com/photo-1636986541043-edeab0b36bda?auto=format&fit=crop&w=640&h=440&q=70&hue=180" },
  { id: 108, serialNumber: "108", name: "KUR KURE (ARGO)", pack: "1 Box", mrp: 180, price: 90, category: "fountains", image: "https://images.unsplash.com/photo-1598817123719-b2407ba2f6d9?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 109, serialNumber: "109", name: "POPS (5 PCS)", pack: "1 Box", mrp: 120, price: 60, category: "fountains", image: "https://images.unsplash.com/photo-1762107470765-a70bbbf57b85?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 110, serialNumber: "110", name: "SIREN MEGA (3PCS)", pack: "1 Box", mrp: 440, price: 220, category: "fountains", image: "https://images.unsplash.com/photo-1780318565517-434d2e7b5052?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 111, serialNumber: "111", name: "FOUNTAIN 3 IN 1", pack: "1 Pcs", mrp: 440, price: 220, category: "fountains", image: "https://images.unsplash.com/photo-1625456809070-da1680787f5c?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },

  /* ── FANCY ITEMS ── */
  { id: 112, serialNumber: "112", name: "7 SHOT (5PCS)", pack: "1 Box", mrp: 280, price: 140, category: "fancy-items", image: "https://images.unsplash.com/photo-1639222113099-786f0148fea8?auto=format&fit=crop&w=640&h=440&q=70&flip=h" },
  { id: 113, serialNumber: "113", name: "7 SHOT (1 PCS)", pack: "1 Pcs", mrp: 50, price: 25, category: "fancy-items", image: "https://images.unsplash.com/photo-1639222113099-786f0148fea8?auto=format&fit=crop&w=640&h=440&q=70&crop=focalpoint&fp-x=.5&fp-y=.5&fp-z=1.5" },
  { id: 114, serialNumber: "114", name: "RAINBO ROCK ARGO", pack: "1 Box", mrp: 600, price: 300, category: "fancy-items", image: "https://images.unsplash.com/photo-1700623066321-b6ea7f6db261?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 115, serialNumber: "115", name: "2\" PIPE (3PCS) STARVEL", pack: "1 Box", mrp: 980, price: 490, category: "fancy-items", image: "https://images.unsplash.com/photo-1700623065993-9e62198d187f?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 116, serialNumber: "116", name: "2\" PIPE (3 PCS)", pack: "1 Box", mrp: 520, price: 260, category: "fancy-items", image: "https://images.unsplash.com/photo-1700623066384-555c048e50e2?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 117, serialNumber: "117", name: "2\" PIPE", pack: "1 Pcs", mrp: 220, price: 110, category: "fancy-items", image: "https://images.unsplash.com/photo-1709389136422-05c9ae1f2d69?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 118, serialNumber: "118", name: "4\" PIPE SILVER", pack: "1 Pcs", mrp: 980, price: 490, category: "fancy-items", image: "https://images.unsplash.com/photo-1761016883021-0d86e968ec96?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 119, serialNumber: "119", name: "30 SHOT CRACKLING COLOR", pack: "1 Pcs", mrp: 880, price: 440, category: "fancy-items", image: "https://images.unsplash.com/photo-1596507457950-42e74da81258?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 120, serialNumber: "120", name: "25 SHOT RIDER", pack: "1 Pcs", mrp: 500, price: 250, category: "fancy-items", image: "https://images.unsplash.com/photo-1777216620823-4be997fb056d?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 121, serialNumber: "121", name: "60 SHOT CRACKLING COLOR", pack: "1 Pcs", mrp: 2400, price: 1200, category: "fancy-items", image: "https://images.unsplash.com/photo-1659526454680-751b02e3fbcf?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 122, serialNumber: "122", name: "120 SHOT CRACKLING COLOR", pack: "1 Pcs", mrp: 4800, price: 2400, category: "fancy-items", image: "https://images.unsplash.com/photo-1572098688575-0db28b6a165b?auto=format&fit=crop&w=640&h=440&q=70" },
  { id: 123, serialNumber: "123", name: "240 SHOT CRACKLING COLOR", pack: "1 Pcs", mrp: 9600, price: 4800, category: "fancy-items", image: "https://images.unsplash.com/photo-1535087419977-e933e68008ba?auto=format&fit=crop&w=640&h=440&q=70" },

  /* ── GIFT BOXES ── (posters: assets/images/products/giftbox-<price>.webp — originals in the GiftBox folder)
     Products with a poster: are shown as poster cards at the top of the Products page.
     items = number of crackers in the box, as printed in the PDF name */
  { id: 124, serialNumber: "124", name: "30 ITEMS VARAM GIFT BOX", pack: "1 Box", price: 500, category: "gift-boxes", items: 30, image: "assets/images/products/giftbox-500-thumb.webp", poster: "assets/images/products/giftbox-500.webp", card: "assets/images/products/giftbox-500-card.webp" },
  { id: 125, serialNumber: "125", name: "40 ITEMS VARAM GIFT BOX", pack: "1 Box", price: 750, category: "gift-boxes", items: 40, image: "" },
  { id: 126, serialNumber: "126", name: "50 ITEMS VARAM GIFT BOX", pack: "1 Box", price: 1000, category: "gift-boxes", items: 50, image: "assets/images/products/giftbox-1000-thumb.webp", poster: "assets/images/products/giftbox-1000.webp", card: "assets/images/products/giftbox-1000-card.webp" },
  { id: 127, serialNumber: "127", name: "60 ITEMS VARAM GIFT BOX", pack: "1 Box", price: 1250, category: "gift-boxes", items: 60, image: "" },
  { id: 128, serialNumber: "128", name: "70 ITEMS VARAM GIFT BOX", pack: "1 Box", price: 1500, category: "gift-boxes", items: 70, image: "" },

  /* ── COMBO PACKS ── (LEO / MASTER / VARAM use the ₹2000 / ₹5000 / ₹10000 posters) */
  { id: 129, serialNumber: "129", name: "LEO COMBO PACK", pack: "1 Box", price: 2000, category: "combo-packs", image: "assets/images/products/giftbox-2000-thumb.webp", poster: "assets/images/products/giftbox-2000.webp", card: "assets/images/products/giftbox-2000-card.webp" },
  { id: 130, serialNumber: "130", name: "METRO COMBO PACK", pack: "1 Box", price: 3000, category: "combo-packs", image: "" },
  { id: 131, serialNumber: "131", name: "MASTER COMBO PACK", pack: "1 Box", price: 5000, category: "combo-packs", image: "assets/images/products/giftbox-5000-thumb.webp", poster: "assets/images/products/giftbox-5000.webp", card: "assets/images/products/giftbox-5000-card.webp" },
  { id: 132, serialNumber: "132", name: "VARAM COMBO PACK", pack: "1 Box", price: 10000, category: "combo-packs", image: "assets/images/products/giftbox-10000-thumb.webp", poster: "assets/images/products/giftbox-10000.webp", card: "assets/images/products/giftbox-10000-card.webp" }
];
