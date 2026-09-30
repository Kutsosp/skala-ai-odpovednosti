#!/usr/bin/env python3
"""Sestaví postranní panel doplňku z aplikace rozšíření: addon/dist/sidebar.html.

Apps Script servíruje jediný HTML soubor v sandboxu bez relativních URL, proto se sem
vloží CSS, JavaScript i texty (scale/, extension/locales/) přímo. Písmo jde z Google Fonts.
Spuštění z kořene repozitáře:

    python3 addon/build.py
    (cd addon/dist && clasp push)
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXT, SCALE, ADDON = ROOT / "extension", ROOT / "scale", ROOT / "addon"
DIST = ADDON / "dist"
FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;800&display=swap">'


def bundled_data():
    codes = json.loads((SCALE / "index.json").read_text())
    return {
        "index": codes,
        "scale": {c: json.loads((SCALE / f"{c}.json").read_text(encoding="utf-8")) for c in codes},
        "ui": {c: json.loads((EXT / "locales" / f"{c}.json").read_text(encoding="utf-8")) for c in codes},
    }


def bundled_js():
    """render.js + i18n.js + popup.js jako jeden klasický skript: bez import/export, v async IIFE (top-level await)."""
    parts = []
    for name in ("render.js", "i18n.js", "popup.js"):
        src = (EXT / name).read_text(encoding="utf-8")
        src = re.sub(r'^import .*? from "\./.*?";\n', "", src, flags=re.M)
        src = re.sub(r"^export (async function|function|const) ", r"\1 ", src, flags=re.M)
        parts.append(f"// ---- {name}\n{src}")
    return "(async () => {\n" + "\n".join(parts) + "\n})();"


def main():
    DIST.mkdir(exist_ok=True)
    css = "\n".join(
        (EXT / f).read_text(encoding="utf-8").replace("@import url('fonts.css');", "")
        for f in ("reset.css", "index.css", "popup.css")
    )
    html = (EXT / "popup.html").read_text(encoding="utf-8")
    html = re.sub(r'<link rel="stylesheet" href="[^"]+">\n', "", html)
    html = html.replace("</head>", f"{FONTS}\n<style>\n{css}\n</style>\n</head>")
    html = html.replace('<body data-host="extension">', '<body data-host="addon">')
    data = json.dumps(bundled_data(), ensure_ascii=False)
    html = html.replace(
        '<script type="module" src="popup.js"></script>',
        f"<script>\nwindow.BUNDLED_DATA = {data};\n</script>\n<script>\n{bundled_js()}\n</script>",
    )
    (DIST / "sidebar.html").write_text(html, encoding="utf-8")
    for f in ("Code.gs", "appsscript.json"):
        shutil.copy(ADDON / f, DIST / f)
    print(f"addon/dist/: sidebar.html ({len(html) // 1024} kB), Code.gs, appsscript.json")


if __name__ == "__main__":
    main()
