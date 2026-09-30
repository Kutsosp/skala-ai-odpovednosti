# Škála AI Odpovědnosti

Systém, který týmům umožňuje efektivně začlenit LLM nástroje do každodenní spolupráce: autor umístěním dokumentu na škálu (PŘEPOSLÁNO, NÁSTŘEL, OVĚŘENO, PODEPSÁNO) jasně komunikuje, jakou odpovědnost za obsah přebírá a na co je připraven přijímat zpětnou vazbu.

Celý dokument: [accountability.md](accountability.md)

## Odznaky

Ve složce [badges/](badges/) je pro každý jazyk (`badges/cs/`) a úroveň odznak ve dvou variantách, každý jako SVG a PNG (2× rozlišení):

| Varianta | Soubor | Popis |
|---|---|---|
| Odznak | `2-overeno.svg`, `2-overeno.png` | Rámeček s názvem úrovně, 158×42 px |
| Razítko | `2-overeno-full.svg`, `2-overeno-full.png` | Šedé razítko s textem odpovědnosti, 618 px široké |

Text je v SVG převeden na křivky, takže odznaky vypadají stejně bez ohledu na nainstalovaná písma. Generuje je `python3 badges/build.py` (potřebuje `fonttools` a Google Chrome) z textů ve složce [scale/](scale/).

## Texty a překlady

Veškeré texty jsou mimo kód: obsah škály (názvy úrovní, odpovědnost, otázky) v [scale/](scale/) a texty rozhraní rozšíření v [extension/locales/](extension/locales/), jeden JSON na jazyk. Nový jazyk = dva soubory a řádek v `scale/index.json`; rozšíření ho nabídne v přepínači jazyka automaticky. Zdrojem pravdy pro češtinu zůstává [accountability.md](accountability.md).

## Odznak na webu

Kdo nechce instalovat nic, použije tlačítko *Určit úroveň a vytvořit odznak* na [webu](https://kutsosp.github.io/skala-ai-odpovednosti/#odznak). Otevře v dialogu tutéž aplikaci jako rozšíření (`extension/popup.html` v iframe) a zkopíruje odznak do schránky.

## Rozšíření pro Chrome

Složka [extension/](extension/) obsahuje rozšíření, které položí devět otázek ze škály, určí úroveň a zkopíruje odznak do schránky. Odznak i razítko kreslí rozšíření za běhu písmem JetBrains Mono (razítko ve třech šířkách), takže vypadají všude stejně. Vloží se (⌘V / Ctrl+V) do Google Docs, e-mailu nebo zprávy jako obrázek s odkazem na tuto stránku a v dokumentu se dají zmenšit tažením za rohy. Google Docs odkazy na obrázcích zahazuje, proto rozšíření volitelně přidá textový odkaz pod obrázek.

Instalace: `chrome://extensions` → zapnout *Režim pro vývojáře* → *Načíst rozbalené* → vybrat složku `extension/`.

## Doplněk pro Google Docs, Sheets a Slides

Google Docs zahazuje odkazy na vložených obrázcích, proto existuje i doplněk ([addon/](addon/)), který vloží odznak přímo do dokumentu s odkazem na škálu. Postranní panel doplňku je tatáž aplikace jako okno rozšíření (sestavuje ji `python3 addon/build.py` ze složky `extension/`). Nasazení a zveřejnění: [addon/README.md](addon/README.md).
