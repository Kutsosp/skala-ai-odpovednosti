# Škála AI Odpovědnosti

Systém, který týmům umožňuje efektivně začlenit LLM nástroje do každodenní spolupráce: autor umístěním dokumentu na škálu (PŘEPOSLÁNO, NÁSTŘEL, OVĚŘENO, PODEPSÁNO) jasně komunikuje, jakou odpovědnost za obsah přebírá a na co je připraven přijímat zpětnou vazbu.

Celý dokument: [accountability.md](accountability.md) · web: [kutsosp.github.io/skala-ai-odpovednosti](https://kutsosp.github.io/skala-ai-odpovednosti/)

## Jak označit dokument

Odpovězte na devět otázek ze škály, aplikace určí úroveň a dá vám **odznak** (rámeček s názvem úrovně) nebo **razítko** (šedý rámeček s textem odpovědnosti, volitelná šířka). Obojí je obrázek kreslený písmem JetBrains Mono, takže vypadá všude stejně, a nese odkaz na vysvětlení škály. Tři cesty ke stejné aplikaci:

| Kde | Jak | Co udělá |
|---|---|---|
| **Web** | tlačítko *Určit úroveň a vytvořit odznak* na [webu](https://kutsosp.github.io/skala-ai-odpovednosti/#odznak) | zkopíruje odznak do schránky; vložíte ⌘V / Ctrl+V do e-mailu, zprávy, dokumentu |
| **Rozšíření pro Chrome** | ikona rozšíření, nebo v Google Docs položka *AI Škála* v horní nabídce | ze schránky jako web; v Docs vloží odznak s odkazem rovnou na první řádek dokumentu |
| **Doplněk Google** | Sheets / Slides / Docs: menu *Rozšíření → Škála AI Odpovědnosti* | vloží odznak do dokumentu z postranního panelu |

Google Docs zahazuje odkazy na obrázcích vložených ze schránky, proto Docs cesty vkládají obrázek přes Apps Script ([addon/Code.gs](addon/Code.gs)), který ho uloží přímo do dokumentu s odkazem.

## Instalace rozšíření pro Chrome

1. Stáhněte zip z [Releases](https://github.com/Kutsosp/skala-ai-odpovednosti/releases) a rozbalte ho (nebo použijte složku `extension/` z tohoto repozitáře).
2. `chrome://extensions` → zapnout *Režim pro vývojáře* → *Načíst rozbalené* → vybrat rozbalenou složku.
3. Pro vkládání do Google Docs vás Google při prvním použití požádá o souhlas s úpravou dokumentů. Dokud je aplikace v testovacím režimu, musí být váš účet mezi testovacími uživateli (přidává správce Cloud projektu, max. 100).

ID rozšíření je pevné (`lpejomidbnlogocdgapmdmdolpefdkhc`, dané polem `key` v manifestu), aby fungovalo přihlášení k Googlu na každém počítači stejně.

## Struktura repozitáře

| Složka | Obsah |
|---|---|
| [scale/](scale/) | texty škály (úrovně, otázky), jeden JSON na jazyk; zdroj pro odznaky, rozšíření i doplněk |
| [badges/](badges/) | hotové odznaky a razítka (SVG s textem převedeným na křivky, PNG 2×) po jazycích; `build.py` je generuje |
| [extension/](extension/) | rozšíření pro Chrome; `popup.html` je zároveň aplikace pro web a doplněk; texty rozhraní v `locales/` |
| [addon/](addon/) | Apps Script pro Google Docs/Sheets/Slides a `build.py`, který z `extension/` sestaví postranní panel; nasazení viz [addon/README.md](addon/README.md) |

## Texty a překlady

Veškeré texty jsou mimo kód: obsah škály v [scale/](scale/), texty rozhraní v [extension/locales/](extension/locales/), název a popis rozšíření v `extension/_locales/`. Nový jazyk = tyto soubory a řádek v `scale/index.json`; rozšíření ho nabídne v přepínači jazyka automaticky. Zdrojem pravdy pro češtinu zůstává [accountability.md](accountability.md).

## Vývoj

```bash
python3 badges/build.py   # odznaky ze scale/*.json (fonttools + Google Chrome), kopie scale/ do extension/
python3 addon/build.py    # addon/dist (doplněk) a addon/dist-api (API pro rozšíření), pak clasp push -f
git tag v1.1.0 && git push --tags   # GitHub Action přiloží zip rozšíření k vydání
```

Styl: [The Monospace Web](https://owickstrom.github.io/the-monospace-web/) (Oskar Wickström, MIT). Písmo JetBrains Mono (OFL).
