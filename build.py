#!/usr/bin/env python3
"""Sestaví web a skript pro Google z extension/ a scale/:

  odznak.html          – aplikace v jednom souboru pro dialog na webu (CSS, skript i texty vložené;
                         funguje i při otevření index.html z disku, kde moduly a fetch() nejdou)
  <levelsPath>/*.html  – stránka pro každou úroveň; na ni odkazují odznaky a razítka (uroven/2-overeno.html)
  apps-script/dist/    – Code.gs + manifest pro `clasp push` (API executable volané rozšířením)

Spuštění z kořene repozitáře:

    python3 build.py
    (cd apps-script/dist && clasp push -f)
"""
import html
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXT, SCALE, GAS = ROOT / "extension", ROOT / "scale", ROOT / "apps-script"
DIST = GAS / "dist"
# Apps Script projekt (vytvořen jednou přes `clasp create`); .clasp.json se generuje, není v gitu.
SCRIPT_ID = "1YUPu3gW7R24d2B2zpF269B3ys5i7o8FRRODLc4W7mU83gkJ4BLwhr35H"


def languages():
    return [json.loads((SCALE / f"{c}.json").read_text(encoding="utf-8")) for c in json.loads((SCALE / "index.json").read_text())]


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
    page = (EXT / "popup.html").read_text(encoding="utf-8")
    page = re.sub(r'<link rel="stylesheet" href="[^"]+">\n', "", page)
    page = page.replace("</head>", f'<link rel="stylesheet" href="extension/fonts.css">\n<style>\n{css}\n</style>\n</head>')
    data = json.dumps(bundled_data(), ensure_ascii=False)
    return page.replace(
        '<script type="module" src="popup.js"></script>',
        f"<script>\nwindow.BUNDLED_DATA = {data};\n</script>\n<script>\n{bundled_js()}\n</script>",
    )


LEVEL_PAGE = """<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{n} {name} – {title}</title>
<meta name="description" content="{responsibility}">
<link rel="icon" type="image/png" sizes="128x128" href="../extension/icons/icon128.png">
<link rel="stylesheet" href="../reset.css">
<link rel="stylesheet" href="../index.css">
<style>
  .disclaimer {{
    border: var(--border-thickness) solid var(--text-color);
    background: var(--background-color-alt);
    padding: var(--line-height) 2ch;
    margin: calc(2 * var(--line-height)) 0;
  }}
  .disclaimer p {{ margin: 0; }}
  .disclaimer .stamp {{ text-transform: uppercase; font-weight: var(--font-weight-bold); margin-right: 1ch; }}
  .header th, .header td.width-min {{ white-space: nowrap; }}
</style>
</head>
<body>

<table class="header">
  <tr>
    <td colspan="2" rowspan="2" class="width-auto">
      <h1 class="title">{title}</h1>
      <span class="subtitle">{subtitle}</span>
    </td>
    <th>{version_label}</th>
    <td class="width-min">v{version}</td>
  </tr>
  <tr>
    <th>{author_label}</th>
    <td class="width-min">{author}</td>
  </tr>
</table>

{intro}

<div class="disclaimer">
  <p><span class="stamp">{n} {name}</span>{responsibility} {when}</p>
</div>

{committed}

<p><a href="../index.html#urovne">{more}</a></p>

</body>
</html>
"""


def level_pages(scale):
    """Jedna stránka na úroveň: hlavička, co je škála, razítko úrovně a otázky, kterými se k ní autor zavázal."""
    out = ROOT / scale["levelsPath"]
    out.mkdir(exist_ok=True)
    e = html.escape
    intro = "\n\n".join(f"<p>{e(p)}</p>" for p in scale["intro"])
    for lv in scale["levels"]:
        questions = [q for group in scale["questions"][: lv["n"]] for q in group]
        if questions:
            committed = f"<p>{e(scale['page']['committed'])}</p>\n\n<ol>\n" + "\n".join(f"  <li>{e(q)}</li>" for q in questions) + "\n</ol>"
        else:
            committed = f"<p>{e(scale['page']['committedNone'])}</p>"
        page = LEVEL_PAGE.format(
            lang=scale["language"], title=e(scale["title"]), subtitle=e(scale["subtitle"]),
            version_label=e(scale["page"]["version"]), version=e(scale["scaleVersion"]),
            author_label=e(scale["page"]["author"]), author=e(scale["author"]),
            n=lv["n"], name=e(lv["name"]), responsibility=e(lv["responsibility"]), when=e(lv["when"]),
            intro=intro, committed=committed, more=e(scale["page"]["more"]),
        )
        (out / f"{lv['n']}-{lv['slug']}.html").write_text(page, encoding="utf-8")
    return out


def main():
    # rozšíření musí být samostatné: texty škály má jako kopii
    shutil.copytree(SCALE, EXT / "scale", dirs_exist_ok=True, ignore=shutil.ignore_patterns("README.md"))
    web = bundle()
    (ROOT / "odznak.html").write_text(web, encoding="utf-8")
    print(f"odznak.html ({len(web) // 1024} kB)")

    for scale in languages():
        out = level_pages(scale)
        print(f"{out.relative_to(ROOT)}/: {len(scale['levels'])} stránek úrovní ({scale['language']})")

    DIST.mkdir(exist_ok=True)
    for f in ("Code.gs", "appsscript.json"):
        shutil.copy(GAS / f, DIST / f)
    clasp = DIST / ".clasp.json"
    if not clasp.exists():
        clasp.write_text(json.dumps({"scriptId": SCRIPT_ID, "rootDir": ""}, indent=2) + "\n")
    print("apps-script/dist/: Code.gs, appsscript.json")


if __name__ == "__main__":
    main()
