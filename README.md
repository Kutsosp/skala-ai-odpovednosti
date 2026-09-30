# Škála AI Odpovědnosti

Systém, který týmům umožňuje efektivně začlenit LLM nástroje do každodenní spolupráce: autor umístěním dokumentu na škálu (PŘEPOSLÁNO, NÁSTŘEL, OVĚŘENO, PODEPSÁNO) jasně komunikuje, jakou odpovědnost za obsah přebírá a na co je připraven přijímat zpětnou vazbu.

Celý dokument: [accountability.md](accountability.md)

## Odznaky

Ve složce [badges/](badges/) je pro každou úroveň odznak ve dvou variantách, každý jako SVG a PNG (2× rozlišení):

| Varianta | Soubor | Popis |
|---|---|---|
| Odznak | `2-overeno.svg`, `2-overeno.png` | Rámeček s názvem úrovně, 158×42 px |
| Razítko | `2-overeno-full.svg`, `2-overeno-full.png` | Šedé razítko s textem odpovědnosti, 618 px široké |

Text je v SVG převeden na křivky, takže odznaky vypadají stejně bez ohledu na nainstalovaná písma. Generuje je `python3 badges/build.py` (potřebuje `fonttools` a Google Chrome).

## Rozšíření pro Chrome

Složka [extension/](extension/) obsahuje rozšíření, které položí devět otázek ze škály, určí úroveň a zkopíruje odznak do schránky. Odznak i razítko kreslí rozšíření za běhu písmem JetBrains Mono (razítko ve třech šířkách), takže vypadají všude stejně. Vloží se (⌘V / Ctrl+V) do Google Docs, e-mailu nebo zprávy jako obrázek s odkazem na tuto stránku a v dokumentu se dají zmenšit tažením za rohy. Google Docs odkazy na obrázcích zahazuje, proto rozšíření volitelně přidá textový odkaz pod obrázek.

Instalace: `chrome://extensions` → zapnout *Režim pro vývojáře* → *Načíst rozbalené* → vybrat složku `extension/`.
