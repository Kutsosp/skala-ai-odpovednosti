# Vkládání do Google Docs, Sheets a Slides

Kód na straně Googlu je jeden soubor, [Code.gs](Code.gs): vloží PNG odznak do dokumentu s odkazem
na škálu. Nasazuje se dvěma způsoby ze stejného zdroje (`python3 addon/build.py`):

| Složka | Co to je | Kdo to volá | Pro koho |
|---|---|---|---|
| `dist/` | doplněk s postranním panelem (sidebar.html = aplikace z `extension/`) | menu Rozšíření v Docs/Sheets/Slides | Sheets a Slides; kdo nemá rozšíření pro Chrome |
| `dist-api/` | API executable bez panelu | rozšíření pro Chrome z položky „Škála“ v horní nabídce Docs (`extension/docs.js`, `google.js`) | hlavní cesta v Docs, po vzoru Zotera |

| Editor | Obrázek | Odkaz | Kam |
|---|---|---|---|
| Docs | vložený do dokumentu, s alternativním textem | na obrázku | začátek dokumentu (z rozšíření vždy), nebo kurzor (z panelu) |
| Slides | na aktuálním snímku | na obrázku | levý horní roh snímku |
| Sheets | nad buňkami u vybrané buňky | jako text v první volné buňce pod obrázkem (obrázky v Tabulkách odkazem být nemohou) | vybraná buňka |

## A. Rozšíření pro Chrome → Docs (Zotero-style)

Rozšíření přidá do horní nabídky Docs položku „AI Škála“, ta otevře panel s aplikací a vložení jde přes
Apps Script API. Uživatel jednou potvrdí přístup Googlu (stejně jako u Zotera). Jednorázové nastavení:

1. **Google Cloud projekt** (console.cloud.google.com → nový projekt). Zapnout *Apps Script API*
   (APIs & Services → Library).
2. **OAuth consent screen**: External, režim Testing, přidat testovací uživatele (max. 100). Scope
   `https://www.googleapis.com/auth/documents`.
3. **OAuth client ID** typu *Chrome Extension*, Item ID = `mnkcmhbncdclkfacojppflcljmaeoabe`
   (pevné ID rozšíření dané polem `key` v manifest.json). Client ID zapsat do `extension/manifest.json`
   → `oauth2.client_id`.
4. **Apps Script projekt**: `cd addon/dist-api && clasp create --type standalone --title "Škála AI Odpovědnosti API"`,
   pak `clasp push -f`. V editoru skriptu (`clasp open-script`) → Nastavení projektu → *Změnit projekt*
   Google Cloud → zadat číslo projektu z bodu 1. Pak Nasadit → Nové nasazení → typ *API Executable*
   (přístup: kdokoli) → Nasadit. Script ID (Nastavení projektu) zapsat do `extension/config.js`.
5. Znovu načíst rozšíření v `chrome://extensions`, otevřít libovolný Google Doc: v nabídce je „Škála“.

Při každé změně Code.gs: `python3 addon/build.py && (cd addon/dist-api && clasp push -f)` a v editoru
skriptu *Nasadit → Spravovat nasazení → upravit → nová verze*.

## B. Doplněk s panelem (Sheets, Slides)

1. `cd addon/dist && clasp create --type docs --title "Škála AI Odpovědnosti"` (jednorázově), `clasp push -f`.
2. Test: otevřít dokument, k němuž je skript připojen, menu Rozšíření → Škála AI Odpovědnosti. Pro
   Sheets/Slides v editoru skriptu Nasadit → Testovací nasazení → Nainstalovat.
3. Zveřejnění: OAuth consent screen *Internal* (Workspace) a v Google Workspace Marketplace SDK
   viditelnost *Private* (bez kontroly Googlem, kolegové ve stejné doméně), nebo *External* + Testing
   (100 uživatelů) / veřejný záznam s ověřením.
