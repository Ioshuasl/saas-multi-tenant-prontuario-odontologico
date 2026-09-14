"""Converte frontend/public/logo.jpg (checkerboard) em assets transparentes Clivra."""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT_DIR = PUBLIC / "brand"
SRC = PUBLIC / "logo.jpg"
ASSETS = Path(
    r"C:\Users\kenio\.cursor\projects\c-Users-kenio-projetos-pessoais-saas-multi-tenant-prontuario-odontologico\assets"
)


def is_checker_bg(r: int, g: int, b: int) -> bool:
    """Detecta branco / cinza claro do checkerboard (não a marca burgundy)."""
    mx, mn = max(r, g, b), min(r, g, b)
    chroma = mx - mn
    # quase cinza/branco
    if chroma <= 22 and mn >= 150:
        return True
    # célula típica #CCC
    if chroma <= 16 and 175 <= mx <= 230:
        return True
    return False


def cutout(src: Path) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            if is_checker_bg(r, g, b):
                continue
            # fringe: quase-cinza um pouco mais escuro perto da marca → alpha parcial
            mx, mn = max(r, g, b), min(r, g, b)
            chroma = mx - mn
            if chroma <= 28 and mn >= 120:
                # residual checker — descarta
                continue
            opx[x, y] = (r, g, b, 255)

    # limpa ruído de 1px
    cleaned = despeckle(out, min_neighbors=2)
    bbox = cleaned.getbbox()
    if not bbox:
        raise RuntimeError("cutout vazio — ajuste limiar do checkerboard")

    pad = 24
    x0, y0, x1, y1 = bbox
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(w, x1 + pad), min(h, y1 + pad)
    mark = cleaned.crop((x0, y0, x1, y1))

    side = max(mark.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(
        mark,
        ((side - mark.size[0]) // 2, (side - mark.size[1]) // 2),
        mark,
    )
    # anti-alias leve na alpha
    r, g, b, a = canvas.split()
    a = a.filter(ImageFilter.GaussianBlur(radius=0.35))
    return Image.merge("RGBA", (r, g, b, a)).resize((1024, 1024), Image.Resampling.LANCZOS)


def despeckle(img: Image.Image, min_neighbors: int) -> Image.Image:
    w, h = img.size
    px = img.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] < 16:
                continue
            n = 0
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] >= 16:
                        n += 1
            if n >= min_neighbors:
                opx[x, y] = px[x, y]
    return out


def find_font(size: int):
    for path in (
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\seguisb.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def make_wordmark(
    icon: Image.Image,
    text_color: tuple[int, int, int, int],
    filename: str,
    mark_size: int = 256,
    font_size: int = 168,
    gap: int = 40,
) -> Path:
    mark = icon.resize((mark_size, mark_size), Image.Resampling.LANCZOS)
    font = find_font(font_size)
    probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    tb = probe.textbbox((0, 0), "Clivra", font=font)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    pad_x, pad_y = 32, 32
    width = pad_x * 2 + mark_size + gap + tw
    height = pad_y * 2 + max(mark_size, th + 16)
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    img.paste(mark, (pad_x, (height - mark_size) // 2), mark)
    draw = ImageDraw.Draw(img)
    ty = (height - th) // 2 - tb[1]
    draw.text((pad_x + mark_size + gap, ty), "Clivra", font=font, fill=text_color)
    path = OUT_DIR / filename
    img.save(path, "PNG")
    print("saved", path, img.size)
    return path


def checker(size: tuple[int, int], cell: int = 16) -> Image.Image:
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    px = img.load()
    for y in range(size[1]):
        for x in range(size[0]):
            px[x, y] = (
                (220, 220, 220, 255)
                if ((x // cell) + (y // cell)) % 2 == 0
                else (255, 255, 255, 255)
            )
    return img


def save_preview(src: Path, name: str) -> None:
    im = Image.open(src).convert("RGBA")
    if im.size[0] > 900:
        ratio = 900 / im.size[0]
        im = im.resize((900, int(im.size[1] * ratio)), Image.Resampling.LANCZOS)
    elif im.size[0] < 200:
        im = im.resize((im.size[0] * 6, im.size[1] * 6), Image.Resampling.NEAREST)
    bg = checker(im.size)
    bg.paste(im, (0, 0), im)
    ASSETS.mkdir(parents=True, exist_ok=True)
    bg.convert("RGB").save(ASSETS / f"preview-{name}", "PNG")
    print("preview", name)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"missing {SRC}")

    icon = cutout(SRC)
    icon_path = OUT_DIR / "logo-icon.png"
    icon.save(icon_path, "PNG")
    print("saved", icon_path)

    # também em public/logo.png (PNG transparente da fonte do usuário)
    icon.save(PUBLIC / "logo.png", "PNG")
    print("saved", PUBLIC / "logo.png")

    icon.resize((32, 32), Image.Resampling.LANCZOS).save(PUBLIC / "favicon.png", "PNG")
    icon.resize((48, 48), Image.Resampling.LANCZOS).save(OUT_DIR / "favicon.png", "PNG")
    icon.resize((180, 180), Image.Resampling.LANCZOS).save(PUBLIC / "apple-icon.png", "PNG")
    icon.save(PUBLIC / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("saved favicons")

    make_wordmark(icon, (26, 26, 26, 255), "logo-wordmark.png")
    make_wordmark(icon, (255, 255, 255, 255), "logo-wordmark-light.png")
    make_wordmark(icon, (74, 15, 22, 255), "logo-wordmark-burgundy.png")

    for name in (
        "logo-icon.png",
        "logo-wordmark.png",
        "logo-wordmark-light.png",
        "logo-wordmark-burgundy.png",
        "favicon.png",
    ):
        save_preview(OUT_DIR / name, name)

    # QA em fundo claro e escuro
    for label, bg in (("qa-dark", (20, 10, 12)), ("qa-light", (247, 245, 242))):
        canvas = Image.new("RGB", (512, 512), bg)
        m = icon.resize((360, 360), Image.Resampling.LANCZOS)
        canvas.paste(m, (76, 76), m)
        canvas.save(ASSETS / f"{label}-logo.png")
        print("qa", label)

    print("DONE")


if __name__ == "__main__":
    main()
