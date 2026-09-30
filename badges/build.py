#!/usr/bin/env python3
"""Vygeneruje odznaky úrovní (SVG + PNG @2x) a ikony rozšíření.

Dvě varianty na úroveň: minimální (rámeček s názvem úrovně, jako v ASCII diagramu)
a plná (šedé razítko s textem odpovědnosti, jako .disclaimer na webu).
Text je převeden na křivky, takže odznaky vypadají stejně i bez nainstalovaného
písma. Rozšíření kreslí tytéž tvary za běhu na canvas (extension/render.js). PNG kreslí headless Chrome ze SVG. Spuštění z kořene repozitáře:

    python3 badges/build.py
"""
import subprocess
import sys
import json
import shutil
import tempfile
import textwrap
import time
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
BADGES = ROOT / "badges"
EXT = ROOT / "extension"
MEDIUM = TTFont(BADGES / "JetBrainsMono-Medium.ttf")
EXTRABOLD = TTFont(BADGES / "JetBrainsMono-ExtraBold.ttf")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Stejné hodnoty jako v index.css: 16px písmo, 1ch = 9.6px, řádek 19.2px, rámeček 2px.
FONT_SIZE, CH, LINE, BORDER = 16, 9.6, 19.2, 2
MIN_W = round(2 * BORDER + 16 * CH)  # 158: rámeček ┌────────────────┐ z ASCII diagramu má 16 znaků
MIN_H = round(2 * BORDER + 2 * LINE)  # 42
FULL_COLS = 60  # šířka textu plné varianty; celý odznak 64ch = 616px se vejde na stránku Google Docs
FULL_W = round(2 * BORDER + (FULL_COLS + 4) * CH)  # 2ch odsazení po stranách jako .disclaimer

SCALE = ROOT / "scale"  # texty škály, jeden JSON na jazyk; kopírují se do rozšíření


def text_path(font, text, size, x, baseline):
    """SVG path textu, levý okraj x, účaří baseline (souřadnice SVG, y roste dolů)."""
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    pen, advance = SVGPathPen(glyphs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip(".")), 0
    for ch in text:
        glyph = glyphs[cmap[ord(ch)]]
        glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x + advance * scale, baseline)))
        advance += glyph.width
    return pen.getCommands()


def cap_height(font, size):
    return font["OS/2"].sCapHeight * size / font["head"].unitsPerEm


def svg(w, h, title, fill, body, stroke="#000"):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}">
<title>{title}</title>
<rect x="{BORDER / 2}" y="{BORDER / 2}" width="{w - BORDER}" height="{h - BORDER}" fill="{fill}" stroke="{stroke}" stroke-width="{BORDER}"/>
{body}</svg>
"""


def title_svg(title, subtitle, dark=False):
    """Hlavička jako na webu (tabulka .header): název 2rem verzálkami tučně, pod ním podtitul. Pro README."""
    fg, bg = ("#fff", "#000") if dark else ("#000", "#fff")
    w = round(2 * BORDER + 80 * CH)  # šířka obsahu webu
    h = round(2 * BORDER + 2 * LINE + 2 * LINE + LINE)  # odsazení, název (2 řádky), podtitul, odsazení
    x0 = BORDER + 2 * CH
    title_size = 2 * FONT_SIZE
    title_baseline = BORDER + LINE + LINE + cap_height(EXTRABOLD, title_size) / 2  # verzálky na střed dvou řádků
    subtitle_baseline = BORDER + LINE + 2 * LINE + LINE / 2 + cap_height(MEDIUM, FONT_SIZE) / 2
    body = (
        f'<path d="{text_path(EXTRABOLD, title.upper(), title_size, x0, title_baseline)}" fill="{fg}"/>\n'
        f'<path d="{text_path(MEDIUM, subtitle, FONT_SIZE, x0, subtitle_baseline)}" fill="{fg}"/>\n'
    )
    return svg(w, h, title, bg, body, stroke=fg)


def minimal_svg(n, name):
    label = f"{n} {name}"
    baseline = MIN_H / 2 + cap_height(MEDIUM, FONT_SIZE) / 2  # verzálky svisle na střed
    path = text_path(MEDIUM, label, FONT_SIZE, BORDER + CH, baseline)
    return svg(MIN_W, MIN_H, f"{label} – Škála AI Odpovědnosti", "#fff", f'<path d="{path}" fill="#000"/>\n')


def full_svg(n, name, responsibility, when, cols=FULL_COLS, dark=False):
    """Razítko jako .disclaimer na webu: tučný název, dvě mezery, text; zalomení po slovech na FULL_COLS znaků."""
    label = f"{n} {name}"
    fg, bg = ("#fff", "#111") if dark else ("#000", "#eee")  # barvy .disclaimer na webu
    w = round(2 * BORDER + (cols + 4) * CH)
    lines = textwrap.wrap(f"{label}  {responsibility} {when}", cols)
    h = round(2 * BORDER + 2 * LINE + len(lines) * LINE)
    x0, top = BORDER + 2 * CH, BORDER + LINE
    # Účaří: řádek má výšku LINE, ale písmo je vyšší (ascent+descent = 1.32em); Chrome centruje přesah.
    ascent = MEDIUM["hhea"].ascent / MEDIUM["head"].unitsPerEm * FONT_SIZE
    descent = -MEDIUM["hhea"].descent / MEDIUM["head"].unitsPerEm * FONT_SIZE
    first_baseline = top + (LINE - ascent - descent) / 2 + ascent
    paths = []
    for i, line in enumerate(lines):
        y = first_baseline + i * LINE
        if i == 0:
            paths.append(f'<path d="{text_path(EXTRABOLD, label, FONT_SIZE, x0, y)}" fill="{fg}"/>')
            line, x = line[len(label):], x0 + len(label) * CH
        else:
            x = x0
        paths.append(f'<path d="{text_path(MEDIUM, line, FONT_SIZE, x, y)}" fill="{fg}"/>')
    return svg(w, h, f"{label} – Škála AI Odpovědnosti", bg, "\n".join(paths) + "\n", stroke=fg), h


def icon_svg(px):
    """Ikona rozšíření: rámeček s textem AI, stejný vizuál jako odznak."""
    size, border, font = 128, 8, 56
    path = text_path(EXTRABOLD, "AI", font, (size - 2 * 0.6 * font) / 2, size / 2 + cap_height(EXTRABOLD, font) / 2)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{px}" height="{px}" viewBox="0 0 {size} {size}">
<rect x="{border / 2}" y="{border / 2}" width="{size - border}" height="{size - border}" fill="#fff" stroke="#000" stroke-width="{border}"/>
<path d="{path}" fill="#000"/>
</svg>
"""


def render(src: Path, png: Path, width, height, scale):
    png.unlink(missing_ok=True)
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as profile:
        proc = subprocess.Popen(
            [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={profile}",
             f"--window-size={width},{height}", f"--force-device-scale-factor={scale}",
             f"--screenshot={png}", src.as_uri()],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        # Chrome po uložení snímku často neskončí, takže čekáme na soubor a pak ho ukončíme sami.
        for _ in range(600):
            if png.exists() and png.stat().st_size > 0:
                break
            time.sleep(0.1)
        else:
            proc.kill()
            sys.exit(f"Chrome nevytvořil {png}")
        time.sleep(0.2)  # nechat dopsat
        proc.kill()
        proc.wait()


def emit(out, slug, markup, w, h):
    svg_path, png_path = out / f"{slug}.svg", out / f"{slug}.png"
    svg_path.write_text(markup, encoding="utf-8")
    render(svg_path, png_path, w, h, 2)
    print(f"{slug}: {w}x{h} svg, {2 * w}x{2 * h} png")


def main():
    for code in json.loads((SCALE / "index.json").read_text()):
        scale = json.loads((SCALE / f"{code}.json").read_text(encoding="utf-8"))
        out = BADGES / code
        out.mkdir(exist_ok=True)
        for lv in scale["levels"]:
            slug = f"{lv['n']}-{lv['slug']}"
            emit(out, slug, minimal_svg(lv["n"], lv["name"]), MIN_W, MIN_H)
            markup, h = full_svg(lv["n"], lv["name"], lv["responsibility"], lv["when"])
            emit(out, f"{slug}-full", markup, FULL_W, h)


    for px in (16, 48, 128):
        icon = EXT / "icons" / f"icon{px}.svg"
        icon.write_text(icon_svg(px), encoding="utf-8")
        render(icon, EXT / "icons" / f"icon{px}.png", px, px, 1)
        icon.unlink()
    print("icons: 16, 48, 128")

    # Hlavička pro README, světlá a tmavá varianta (GitHub přepíná podle nastavení čtenáře)
    (ROOT / "assets").mkdir(exist_ok=True)
    cs = json.loads((SCALE / "cs.json").read_text(encoding="utf-8"))
    subtitle = cs["subtitle"]
    for name, dark in (("title.svg", False), ("title-dark.svg", True)):
        (ROOT / "assets" / name).write_text(title_svg(cs["title"], subtitle, dark), encoding="utf-8")
    # Razítko pro README ve stejné šířce jako hlavička (80ch), světlé a tmavé
    lv = cs["levels"][2]
    for name, dark in (("stamp.svg", False), ("stamp-dark.svg", True)):
        markup, _ = full_svg(lv["n"], lv["name"], lv["responsibility"], lv["when"], cols=76, dark=dark)
        (ROOT / "assets" / name).write_text(markup, encoding="utf-8")
    print("assets/title.svg, assets/title-dark.svg, assets/stamp.svg, assets/stamp-dark.svg")


if __name__ == "__main__":
    sys.exit(main())
