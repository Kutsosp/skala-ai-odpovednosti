#!/usr/bin/env python3
"""Sestaví aplikaci z extension/ do jednoho HTML souboru pro prostředí bez modulů a fetch():

  addon/dist/sidebar.html  – postranní panel doplňku Google (Apps Script servíruje jediný soubor v sandboxu)
  odznak.html              – dialog na webu (funguje i z disku přes file://, kde moduly nejdou)

Do souboru se vloží CSS, JavaScript i texty (scale/, extension/locales/). Spuštění z kořene repozitáře:

    python3 addon/build.py
    (cd addon/dist && clasp push -f)
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXT, SCALE, ADDON = ROOT / "extension", ROOT / "scale", ROOT / "addon"
DIST, API = ADDON / "dist", ADDON / "dist-api"
# Apps Script projekty (clasp). Vytvořeny jednou přes `clasp create`; .clasp.json se generuje, není v gitu.
CLASP = {
    "dist": {"scriptId": "1tAPmiOeRmFOXmvbCiBTteuTW5X5Fz6dxuseykNTwRFioShcHb6tchExF", "parentId": "1kda1r7p-i-_v6K517YP-vuhL8efTQIwV7WxAmJ4oGEU"},
    "dist-api": {"scriptId": "1YUPu3gW7R24d2B2zpF269B3ys5i7o8FRRODLc4W7mU83gkJ4BLwhr35H"},
}
GOOGLE_FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;800&display=swap">'
LOCAL_FONTS = '<link rel="stylesheet" href="extension/fonts.css">'


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


def bundle(host, fonts):
    """popup.html s vloženým CSS, texty a skriptem; body[data-host] říká skriptu, kde běží."""
    css = "\n".join(
        (EXT / f).read_text(encoding="utf-8").replace("@import url('fonts.css');", "")
        for f in ("reset.css", "index.css", "popup.css")
    )
    html = (EXT / "popup.html").read_text(encoding="utf-8")
    html = re.sub(r'<link rel="stylesheet" href="[^"]+">\n', "", html)
    html = html.replace("</head>", f"{fonts}\n<style>\n{css}\n</style>\n</head>")
    html = html.replace('<body data-host="extension">', f'<body data-host="{host}">')
    data = json.dumps(bundled_data(), ensure_ascii=False)
    return html.replace(
        '<script type="module" src="popup.js"></script>',
        f"<script>\nwindow.BUNDLED_DATA = {data};\n</script>\n<script>\n{bundled_js()}\n</script>",
    )


def main():
    DIST.mkdir(exist_ok=True)
    sidebar = bundle("addon", GOOGLE_FONTS)
    (DIST / "sidebar.html").write_text(sidebar, encoding="utf-8")
    for f in ("Code.gs", "appsscript.json"):
        shutil.copy(ADDON / f, DIST / f)
    print(f"addon/dist/: sidebar.html ({len(sidebar) // 1024} kB), Code.gs, appsscript.json")

    # Tentýž Code.gs jako API executable pro rozšíření (Zotero-style): jiný manifest, bez panelu.
    API.mkdir(exist_ok=True)
    shutil.copy(ADDON / "Code.gs", API / "Code.gs")
    shutil.copy(ADDON / "appsscript-api.json", API / "appsscript.json")
    print("addon/dist-api/: Code.gs, appsscript.json")

    for folder, ids in CLASP.items():
        clasp = ADDON / folder / ".clasp.json"
        if not clasp.exists():
            clasp.write_text(json.dumps({**ids, "rootDir": ""}, indent=2) + "\n")

    web = bundle("extension", LOCAL_FONTS)
    (ROOT / "odznak.html").write_text(web, encoding="utf-8")
    print(f"odznak.html ({len(web) // 1024} kB) pro dialog na webu")


if __name__ == "__main__":
    main()
