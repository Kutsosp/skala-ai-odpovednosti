# Vkládání do Google Docs, Sheets a Slides

Rozšíření pro Chrome přidá do horní nabídky Docs, Sheets i Slides položku „AI Škála“ (po vzoru Zotera,
`extension/docs.js`). Ta otevře panel s aplikací a vložení jde přes Apps Script API (`extension/google.js`)
do skriptu [Code.gs](Code.gs), nasazeného jako *API Executable*. Uživatel jednou potvrdí Googlu přístup.

| Editor | Obrázek | Odkaz | Kam |
|---|---|---|---|
| Docs | vložený do dokumentu, s alternativním textem | na obrázku | první řádek dokumentu |
| Slides | na aktuálním snímku (z URL) | na obrázku | levý horní roh snímku |
| Sheets | nad buňkami u vybrané buňky (z pole názvu buňky), na vybraném listu (z URL) | jako text v první volné buňce pod obrázkem (obrázky v Tabulkách odkazem být nemohou) | vybraná buňka |

## Nasazení změn Code.gs

```bash
python3 build.py && (cd apps-script/dist && clasp push -f)
```

Pak v editoru skriptu (`clasp open-script` v `apps-script/dist`): *Nasadit → Spravovat nasazení →* tužka
*→ Verze: Nová verze → Nasadit*. Bez nové verze volá rozšíření dál starý kód.

## Jednorázové nastavení (provedeno 2026-09-30)

1. **Google Cloud projekt** č. 947530174977, zapnuté *Apps Script API*.
2. **Google Auth Platform**: Branding vyplněn; Audience *External*, *Testing*, testovací uživatelé
   (max. 100, každý kolega musí být v seznamu; souhlas v režimu Testing vyprší po 7 dnech); Data Access:
   scopes `auth/documents`, `auth/spreadsheets`, `auth/presentations`.
3. **OAuth client** typu *Chrome Extension*, Item ID = `lpejomidbnlogocdgapmdmdolpefdkhc` (pevné ID dané
   polem `key` v `extension/manifest.json`; soukromý klíč má správce mimo repozitář pro pozdější nahrání
   do Chrome Web Store). Client ID je v manifestu, `oauth2.client_id`.
4. **Apps Script projekt** `1YUPu3gW7R24d2B2zpF269B3ys5i7o8FRRODLc4W7mU83gkJ4BLwhr35H` (script ID
   v `extension/config.js`), přepnutý na Cloud projekt z bodu 1, nasazení typu *API Executable* (kdokoli).

Cesta ven z omezení režimu Testing (seznam, 100 uživatelů, týdenní vypršení): ověření aplikace Googlem
(*Google Auth Platform → Verification Center*), zdarma, 1–2 týdny; potřebuje domovskou stránku a zásady
ochrany soukromí.
