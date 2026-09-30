# Texty škály

Jeden soubor na jazyk (`cs.json`, `en.json`, …), seznam jazyků v `index.json`. Odsud čtou texty
odznaky (`badges/build.py`) i rozšíření (`extension/`, kam se složka kopíruje při buildu).
Zdrojem pravdy pro češtinu zůstává `accountability.md`; sem se změny přepisují.

Přidání jazyka: vytvořit `scale/<kód>.json` a `extension/locales/<kód>.json` (texty rozhraní)
a přidat kód do `index.json`. Rozšíření jazyk nabídne automaticky.
