#!/usr/bin/env python3
"""Sestaví z extension/ dva výstupy:

  odznak.html        – aplikace v jednom souboru pro dialog na webu (CSS, skript i texty vložené;
                       funguje i při otevření index.html z disku, kde moduly a fetch() nejdou)
  apps-script/dist/  – Code.gs + manifest pro `clasp push` (API executable volané rozšířením)

Spuštění z kořene repozitáře:

    python3 apps-script/build.py
    (cd apps-script/dist && clasp push -f)
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXT, SCALE, HERE = ROOT / "extension", ROOT / "scale", ROOT / "apps-script"
DIST = HERE / "dist"
# Apps Script projekt (vytvořen jednou přes `clasp create`); .clasp.json se generuje, není v gitu.
SCRIPT_ID = "1YUPu3gW7R24d2B2zpF269B3ys5i7o8FRRODLc4W7mU83gkJ4BLwhr35H"


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


def bundle():
    """popup.html s vloženým CSS, texty a skriptem; písmo z extension/fonts.css."""
    css = "\n".join(
        (EXT / f).read_text(encoding="utf-8").replace("@import url('fonts.css');", "")
        for f in ("reset.css", "index.css", "popup.css")
    )
    html = (EXT / "popup.html").read_text(encoding="utf-8")
    html = re.sub(r'<link rel="stylesheet" href="[^"]+">\n', "", html)
    html = html.replace("</head>", f'<link rel="stylesheet" href="extension/fonts.css">\n<style>\n{css}\n</style>\n</head>')
    data = json.dumps(bundled_data(), ensure_ascii=False)
    return html.replace(
        '<script type="module" src="popup.js"></script>',
        f"<script>\nwindow.BUNDLED_DATA = {data};\n</script>\n<script>\n{bundled_js()}\n</script>",
    )


def main():
    web = bundle()
    (ROOT / "odznak.html").write_text(web, encoding="utf-8")
    print(f"odznak.html ({len(web) // 1024} kB)")

    DIST.mkdir(exist_ok=True)
    for f in ("Code.gs", "appsscript.json"):
        shutil.copy(HERE / f, DIST / f)
    clasp = DIST / ".clasp.json"
    if not clasp.exists():
        clasp.write_text(json.dumps({"scriptId": SCRIPT_ID, "rootDir": ""}, indent=2) + "\n")
    print("apps-script/dist/: Code.gs, appsscript.json")


if __name__ == "__main__":
    main()
