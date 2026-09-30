# Doplněk pro Google Docs, Sheets a Slides

Postranní panel je tatáž aplikace jako okno rozšíření pro Chrome (`extension/`): stejné otázky,
stejné kreslení odznaku a razítka, stejné texty. Liší se jen poslední krok: místo kopírování do
schránky vloží obrázek přímo do dokumentu s odkazem na škálu ([Code.gs](Code.gs)).

| Editor | Obrázek | Odkaz | Kam |
|---|---|---|---|
| Docs | vložený do dokumentu, s alternativním textem | na obrázku | začátek dokumentu nebo kurzor |
| Slides | na aktuálním snímku | na obrázku | levý horní roh snímku |
| Sheets | nad buňkami u vybrané buňky | jako text v první volné buňce pod obrázkem (obrázky v Tabulkách odkazem být nemohou) | vybraná buňka |

## Sestavení a nasazení

1. `python3 addon/build.py` vytvoří `addon/dist/` (sidebar.html s vloženým CSS, JS a texty, Code.gs, appsscript.json).
2. Jednorázově: `npm i -g @google/clasp`, `clasp login`, v `addon/dist/` spustit `clasp create --type docs --title "Škála AI Odpovědnosti"` (vytvoří `.clasp.json` se script ID; ten soubor je v .gitignore).
3. Každé nasazení: `cd addon/dist && clasp push`.
4. Vyzkoušení: v editoru Apps Scriptu (`clasp open`) → Nasadit → Testovací nasazení → Nainstalovat; otevřít libovolný dokument, menu Rozšíření → Škála AI Odpovědnosti.

## Zveřejnění

Doplněk vyžaduje při instalaci souhlas uživatele (přístup jen k aktuálnímu dokumentu). Cesty:

- **Interní (Workspace doména):** v Google Cloud projektu skriptu nastavit OAuth consent screen jako *Internal*, v Google Workspace Marketplace SDK vydat s viditelností *Private*. Bez kontroly Googlem; kolegové ve stejné doméně si doplněk nainstalují sami z Marketplace (záložka Interní aplikace). Vyžaduje Cloud projekt v organizaci, ne práva administrátora.
- **Veřejný:** consent screen *External*. V režimu *Testing* max. 100 uživatelů bez kontroly; veřejný záznam v Marketplace vyžaduje ověření OAuth a schválení Googlem.
