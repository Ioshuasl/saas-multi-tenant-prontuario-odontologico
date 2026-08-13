"""Vetoriza a referência FDI e recorta os 32 dentes permanentes."""

from __future__ import annotations

import json
import re
from pathlib import Path

import cv2
import numpy as np
import vtracer
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC_PNG = ROOT / "frontend/src/packages/clinico/assets/odontogram/reference-fdi.png"
OUT_DIR = ROOT / "frontend/src/packages/clinico/assets/odontogram"
PUBLIC_DIR = ROOT / "frontend/public/odontogram"
GLYPH_DIR = OUT_DIR / "glyphs"

UPPER = [
    "18", "17", "16", "15", "14", "13", "12", "11",
    "21", "22", "23", "24", "25", "26", "27", "28",
]
LOWER = [
    "48", "47", "46", "45", "44", "43", "42", "41",
    "31", "32", "33", "34", "35", "36", "37", "38",
]


def preprocess(gray: np.ndarray) -> np.ndarray:
    _, binary = cv2.threshold(gray, 230, 255, cv2.THRESH_BINARY_INV)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 3))
    return cv2.dilate(binary, kernel, iterations=1)


def find_teeth(mask: np.ndarray) -> list[dict]:
    num, _labels, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=8)
    h, w = mask.shape
    blobs: list[dict] = []
    for i in range(1, num):
        x, y, bw, bh, area = stats[i]
        if area < 800 or area > 8000:
            continue
        if bh < 70 or bw < 24 or bw > 90:
            continue
        cx, cy = centroids[i]
        blobs.append(
            {
                "x": int(x),
                "y": int(y),
                "w": int(bw),
                "h": int(bh),
                "cx": float(cx),
                "cy": float(cy),
                "area": int(area),
            }
        )
    if len(blobs) < 32:
        raise SystemExit(f"esperava >=32 dentes, achei {len(blobs)}")
    mid_y = h / 2
    upper = sorted([b for b in blobs if b["cy"] < mid_y], key=lambda b: b["cx"])
    lower = sorted([b for b in blobs if b["cy"] >= mid_y], key=lambda b: b["cx"])
    upper = sorted(upper, key=lambda b: b["area"], reverse=True)[:16]
    lower = sorted(lower, key=lambda b: b["area"], reverse=True)[:16]
    upper.sort(key=lambda b: b["cx"])
    lower.sort(key=lambda b: b["cx"])
    if len(upper) != 16 or len(lower) != 16:
        raise SystemExit(f"fileiras incompletas: upper={len(upper)} lower={len(lower)}")
    return upper + lower


def expand(box: dict, img_w: int, img_h: int, pad: int = 4) -> dict:
    x = max(0, box["x"] - pad)
    y = max(0, box["y"] - pad)
    r = min(img_w, box["x"] + box["w"] + pad)
    b = min(img_h, box["y"] + box["h"] + pad)
    return {"x": x, "y": y, "w": r - x, "h": b - y, "cx": box["cx"], "cy": box["cy"]}


def to_ink_png(gray: np.ndarray, dest: Path) -> None:
    ink = np.where(gray < 230, 0, 255).astype(np.uint8)
    Image.fromarray(ink).save(dest)


def vectorize_png(src: Path, dest: Path) -> None:
    vtracer.convert_image_to_svg_py(
        str(src),
        str(dest),
        colormode="binary",
        hierarchical="stacked",
        mode="spline",
        filter_speckle=2,
        color_precision=6,
        layer_difference=16,
        corner_threshold=60,
        length_threshold=4.0,
        max_iterations=10,
        splice_threshold=45,
        path_precision=3,
    )


def tidy_svg(svg_text: str, ink: str = "#5c6d7e") -> str:
    svg_text = re.sub(r'fill="#0{3,8}"', f'fill="{ink}"', svg_text)
    svg_text = re.sub(r'fill="#000000"', f'fill="{ink}"', svg_text)
    svg_text = re.sub(r'fill="black"', f'fill="{ink}"', svg_text)
    return svg_text


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    GLYPH_DIR.mkdir(parents=True, exist_ok=True)

    image = Image.open(SRC_PNG).convert("RGB")
    rgb = np.array(image)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    mask = preprocess(gray)
    h, w = gray.shape
    boxes = [expand(b, w, h, pad=6) for b in find_teeth(mask)]
    codes = UPPER + LOWER

    work_png = OUT_DIR / "_work-full.png"
    to_ink_png(gray, work_png)
    full_svg = OUT_DIR / "reference-fdi.svg"
    vectorize_png(work_png, full_svg)
    full_svg.write_text(tidy_svg(full_svg.read_text(encoding="utf-8")), encoding="utf-8")
    (PUBLIC_DIR / "reference-fdi.svg").write_text(full_svg.read_text(encoding="utf-8"), encoding="utf-8")
    (PUBLIC_DIR / "reference-fdi.png").write_bytes(SRC_PNG.read_bytes())

    regions = []
    for code, box in zip(codes, boxes, strict=True):
        crop = image.crop((box["x"], box["y"], box["x"] + box["w"], box["y"] + box["h"]))
        crop_gray = cv2.cvtColor(np.array(crop.convert("RGB")), cv2.COLOR_RGB2GRAY)
        crop_png = GLYPH_DIR / f"{code}.png"
        to_ink_png(crop_gray, crop_png)
        crop_svg = GLYPH_DIR / f"{code}.svg"
        vectorize_png(crop_png, crop_svg)
        crop_svg.write_text(tidy_svg(crop_svg.read_text(encoding="utf-8")), encoding="utf-8")
        regions.append(
            {
                "code": code,
                "x": box["x"],
                "y": box["y"],
                "w": box["w"],
                "h": box["h"],
                "cx": round(box["cx"], 1),
                "cy": round(box["cy"], 1),
                "arch": "upper" if code in UPPER else "lower",
            }
        )

    meta = {"width": w, "height": h, "teeth": regions}
    (OUT_DIR / "reference-fdi.regions.json").write_text(
        json.dumps(meta, indent=2), encoding="utf-8"
    )
    ts_path = ROOT / "frontend/src/packages/clinico/helpers/OdontogramReferenceRegions.ts"
    teeth_ts = ",\n".join(
        "  {\n"
        f"    code: '{r['code']}',\n"
        f"    x: {r['x']},\n"
        f"    y: {r['y']},\n"
        f"    w: {r['w']},\n"
        f"    h: {r['h']},\n"
        f"    arch: '{r['arch']}',\n"
        "  }"
        for r in regions
    )
    ts_path.write_text(
        "export type OdontogramReferenceTooth = {\n"
        "  code: string;\n"
        "  x: number;\n"
        "  y: number;\n"
        "  w: number;\n"
        "  h: number;\n"
        "  arch: 'upper' | 'lower';\n"
        "};\n\n"
        f"export const ODONTOGRAM_REFERENCE_SIZE = {{ width: {w}, height: {h} }} as const;\n\n"
        "export const ODONTOGRAM_REFERENCE_TEETH: OdontogramReferenceTooth[] = [\n"
        f"{teeth_ts},\n"
        "];\n",
        encoding="utf-8",
    )
    print(f"ok: {len(regions)} dentes, chart {w}x{h}")
    for row in (UPPER, LOWER):
        print(" ".join(row))


if __name__ == "__main__":
    main()
