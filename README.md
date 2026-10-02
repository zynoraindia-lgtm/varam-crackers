# Varam Crackers — Online Catalogue & WhatsApp Ordering

A fast, frontend-only website (HTML + CSS + JavaScript). There's no backend, database, login or payment. Customers browse the 2026 price list, add products to a cart and send the complete order to the shop on WhatsApp.

## Pages

- **`index.html` — Home.** The 3D fireworks page: the Auto Bomb, fireworks, sound, and a **Light the fuse** blast. Its menu links to every other page, and the cart icon shows the same cart as the rest of the site. It's built from the `home-3d-source` folder next to this one. To change the home page, see that folder's README.
- **`products.html` — Products.** Starts with the **Varam Gift Boxes** poster cards (₹500, ₹1000 gift boxes and the ₹2000 LEO, ₹5000 MASTER and ₹10000 VARAM combo packs) with quantity buttons, and a tap on a poster opens it full size with the list of items inside. Below that, all 132 items of the new price list (123 products + 5 gift boxes + 4 combo packs) as one spreadsheet-style price list (no photos): Code · Product Name · Pack · Price · Quantity · Amount, grouped by category, with search, filters and a cart total at the bottom. The quantity typed in a row goes straight into the cart. Press **Enter** to jump to the next row.
- **`cart.html` and `checkout.html` — Cart and Checkout.** Review the order, enter details, and send it on WhatsApp.
- **`contact.html` — Contact & Order Help.** WhatsApp, phone numbers, the shop address with directions, and the six ordering steps.

## Open it

- **On your computer:** double-click `index.html`. It works without internet or a server.
- **Online:** upload the whole folder to any static host:
  - **Netlify:** drag the folder onto app.netlify.com/drop
  - **Vercel:** `vercel` in this folder, or import it from GitHub
  - **GitHub Pages:** push the folder to a repo, then turn on Pages (branch: `main`, folder: `/root`)

## Change business details — `js/config.js`

Everything about the shop is set in one place: the name, WhatsApp number, phone numbers and address.

```js
whatsappNumber: "918489351529",   // 91 + 10-digit number, digits only
phone: "84893 51529",
altPhones: ["95975 02916", "63834 11911"],
address: "No.5, Sivakasi to Virudhunagar Road, Mathiyasenai, Sivakasi - 626130",
```

## Change products or prices — `data/products.js`

All 132 items of the price list (`MRP VARAM 2026 (3).pdf`) are stored in this one file, and every page reads them from here.

```js
{ id: 17, serialNumber: "17", name: "FLOWER POTS SMALL", pack: "1 Box", mrp: 90, price: 45, category: "flower-pots", image: "" },
```

- `price` is the rupee amount for **one pack** (a number with no ₹ sign). It is the **50% discount price** from the PDF, which is what the customer pays.
- `mrp` is the MRP column of the PDF. It's kept for reference only; the website doesn't show it.
- `pack` is what one unit contains, as printed in the PDF (for example "1 Box").
- The customer picks **how many packs** they want. Each line's subtotal is `price × quantity`.
- `id` must stay unique, because it's what the cart saves. Here `id` is the same as the PDF code. If you renumber ids, raise `cartVersion` in `js/config.js` so old saved carts are cleared.

## Gift boxes

The 5 gift boxes (codes 124–128, category `gift-boxes`) and 4 combo packs (codes 129–132, category `combo-packs`) are at the end of `data/products.js`. Any item with a `poster:` is shown as a poster card at the top of the Products page; the rest are normal rows in the price list. The posters are matched by price:

| Poster | Item |
|---|---|
| ₹500 | 124 · 30 ITEMS VARAM GIFT BOX |
| ₹1000 | 126 · 50 ITEMS VARAM GIFT BOX |
| ₹2000 | 129 · LEO COMBO PACK |
| ₹5000 | 131 · MASTER COMBO PACK |
| ₹10000 | 132 · VARAM COMBO PACK |

The 40, 60 and 70 items gift boxes (₹750, ₹1250, ₹1500) and the METRO COMBO PACK (₹3000) have no poster yet. To add one, make the three files below for it and add `image`, `poster` and `card` to its line (copy them from a box that has a poster). The original posters are in the `GiftBox` folder. The site uses resized copies in `assets/images/products/`:

- `giftbox-<price>.webp`: full poster, opened when a customer taps a box
- `giftbox-<price>-card.webp`: the card on the Products page
- `giftbox-<price>-thumb.webp`: the small photo in the Cart and Checkout

To change a box's price or item count, edit its `price` and `items` in `data/products.js`. To replace a poster, overwrite those three files. Note: the item lists printed on the current posters (27, 39, 58, 80 and 87 items) are from the old price list and don't match the new PDF's item counts, so new posters are worth making.

## Product photos

The Products page is a price-list table and doesn't show photos. The Cart and Checkout pages still show a small photo per product: a free-licence photo from Unsplash, matched to the product's type and colour (green/red/blue sparklers are colour-adjusted versions). The photos load from Unsplash's CDN at the right size for each screen. They're **illustrative only**, and the site says so on the Products page and in the footer. Credits are in `PHOTO-CREDITS.md`.

- If a photo can't load (offline, or blocked), the product automatically shows its drawn illustration instead.
- **To use your own photos:** save them in `assets/images/products/` named by the product code (for example `17.jpg`, `049.png`). Then run `python tools/add-photos.py` from this folder. It resizes each photo to 800×550 WebP and links it to the right product in `data/products.js`. Add `--dry-run` to preview first.
- To set one photo by hand, change that product's `image:` to a file path or a web address. Use `image: ""` to show the illustration.

## Folder structure

```
index.html (3D home)  products.html  cart.html  checkout.html  contact.html
css/   style.css, responsive.css
js/    config.js (shop info) · ui.js · cart.js · products.js · checkout.js · whatsapp.js · icons.js · app.js
data/  products.js (catalogue — single source of truth)
assets/ logo/, icons/, images/ (products/ = your own photos, home/ = 3D home page image), fonts/ (self-hosted, SIL OFL)
tools/ add-photos.py (links your own product photos)
```

## Notes from the PDF

- Source: `MRP VARAM 2026 (3).pdf` (Sep 2026). It lists MRP and a 50% discount price; the website shows the discount price.
- Product names, packs and prices were copied exactly as printed, including the PDF's spellings ("ROTATING SPARLERS", "28 GAINT", "24 DELUX GEINT", "RAINBO ROCK ARGO").
- New in this list: AUTO BOMB (85), CLASSIC BOMB (86), BABY ROCKET (89), the new gift boxes and the combo packs. The codes after 84 moved up, and every code is now unique.
- The cart is saved in the browser (`localStorage["crackersCart"]`). Customer name, mobile and address are **not stored**; they're only used to build the WhatsApp message.
