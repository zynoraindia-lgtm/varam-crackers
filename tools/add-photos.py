#!/usr/bin/env python3
"""
Link your own product photos to the website.

1. Put photos in  assets/images/products/  named by the product CODE from the
   price list, for example:
       17.jpg                    -> FLOWER POTS SMALL
       049.png                   -> 7CM ELECTRIC SPARKLERS
       086-rocket-bomb.jpg       -> code 86 is used twice, so add the name
       086-king-of-king.jpg
2. Run (from the website folder):   python tools/add-photos.py
   Add --dry-run to only show what would change.

Each photo is resized to 800x550 and saved as .webp (needs Pillow:
`pip install pillow`; without it the original file is linked as-is).
The matching product's  image:  in data/products.js is then updated.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "assets" / "images" / "products"
DATA = ROOT / "data" / "products.js"
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
SIZE = (800, 550)
DRY = "--dry-run" in sys.argv

try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def main():
    src = DATA.read_text(encoding="utf-8")
    rows = re.findall(r'\{ id: (\d+), serialNumber: "([^"]*)", name: ("(?:[^"\\]|\\.)*")', src)
    products = [{"id": int(i), "code": c.lstrip("0") or "0", "name": eval(n)} for i, c, n in rows]

    files = sorted(f for f in PHOTOS.iterdir() if f.suffix.lower() in EXTS) if PHOTOS.exists() else []
    if not files:
        print(f"No photos found in {PHOTOS}")
        return

    done, skipped = 0, []
    for f in files:
        m = re.match(r"^0*(\d+)(?:[-_ ]+(.*))?$", f.stem)
        if not m:
            skipped.append((f.name, "name must start with the product code, e.g. 17.jpg"))
            continue
        code, rest = m.group(1), slug(m.group(2) or "")
        matches = [p for p in products if p["code"] == code]
        if len(matches) > 1 and rest:
            matches = [p for p in matches if slug(p["name"]).startswith(rest) or rest in slug(p["name"])]
        if not matches:
            skipped.append((f.name, f"no product with code {code}" + (f" matching '{rest}'" if rest else "")))
            continue
        if len(matches) > 1:
            names = " / ".join(p["name"] for p in matches)
            skipped.append((f.name, f"code {code} is used by {names} — add the name, e.g. {code.zfill(3)}-{slug(matches[0]['name'])}{f.suffix}"))
            continue

        p = matches[0]
        out_name = f"{p['code'].zfill(3)}-{slug(p['name'])}.webp"
        out = PHOTOS / out_name
        if f.name == out_name:
            rel = f"assets/images/products/{out_name}"          # already processed earlier
        elif Image and not DRY:
            with Image.open(f) as im:
                im = ImageOps.exif_transpose(im).convert("RGB")
                ImageOps.fit(im, SIZE, Image.LANCZOS).save(out, "WEBP", quality=80, method=6)
            rel = f"assets/images/products/{out_name}"
        else:
            rel = f"assets/images/products/{out_name if Image else f.name}"

        pattern = re.compile(r'(\{ id: ' + str(p["id"]) + r',[^\n]*?image: )"[^"]*"')
        src, n = pattern.subn(lambda mm: f'{mm.group(1)}"{rel}"', src)
        if n:
            done += 1
            print(f"  ✓ {f.name:32} → #{p['code'].zfill(3)} {p['name']}")

    if not DRY and done:
        DATA.write_text(src, encoding="utf-8")
    print(f"\n{done} photo(s) {'would be ' if DRY else ''}linked." + ("" if Image else "  (Pillow not installed: photos linked without resizing)"))
    for name, why in skipped:
        print(f"  ✗ {name}: {why}")


if __name__ == "__main__":
    main()
