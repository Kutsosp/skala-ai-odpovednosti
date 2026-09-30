/**
 * Škála AI Odpovědnosti – doplněk pro Google Docs, Sheets a Slides.
 * Postranní panel (sidebar.html) je tatáž aplikace jako okno rozšíření pro Chrome;
 * generuje ji addon/build.py z extension/. Tento soubor jen vkládá výsledek do dokumentu.
 */

function onInstall(e) {
  onOpen(e);
}

function onOpen(e) {
  ui().createAddonMenu().addItem("Určit úroveň a vložit odznak", "showSidebar").addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("sidebar").setTitle("Škála AI Odpovědnosti");
  ui().showSidebar(html);
}

/** Ui hostitelské aplikace. */
function ui() {
  return { docs: DocumentApp, sheets: SpreadsheetApp, slides: SlidesApp }[getHost()].getUi();
}

/** "docs" | "sheets" | "slides" podle toho, kde doplněk běží. */
function getHost() {
  const probes = [
    ["docs", () => DocumentApp.getActiveDocument()],
    ["sheets", () => SpreadsheetApp.getActiveSpreadsheet()],
    ["slides", () => SlidesApp.getActivePresentation()],
  ];
  for (const [host, probe] of probes) {
    try {
      if (probe()) return host;
    } catch (e) {
      // v jiném hostiteli metoda vyhodí výjimku
    }
  }
  throw new Error("Neznámý hostitel");
}

/**
 * Vloží PNG odznak do dokumentu. Volá se z postranního panelu (google.script.run) nebo přes
 * Apps Script API z rozšíření pro Chrome; to posílá docId, protože zde není aktivní dokument.
 * @param {{base64:string,width:number,height:number,where:string,url:string,label:string,title:string,alt:string,docId?:string}} b
 */
function insertBadge(b) {
  const blob = Utilities.newBlob(Utilities.base64Decode(b.base64), "image/png", `${b.label}.png`);
  if (b.docId) return insertIntoDoc(blob, b, DocumentApp.openById(b.docId));
  ({ docs: insertIntoDoc, sheets: insertIntoSheet, slides: insertIntoSlide })[getHost()](blob, b);
}

function insertIntoDoc(blob, b, doc = DocumentApp.getActiveDocument()) {
  let img = null;
  if (b.where === "cursor" && doc.getCursor()) img = doc.getCursor().insertInlineImage(blob);
  if (!img) img = doc.getBody().insertParagraph(0, "").appendInlineImage(blob); // první řádek dokumentu
  img.setWidth(b.width).setHeight(b.height).setLinkUrl(b.url).setAltTitle(b.alt).setAltDescription(b.title);
}

function insertIntoSlide(blob, b) {
  const page = SlidesApp.getActivePresentation().getSelection().getCurrentPage();
  const img = page.insertImage(blob).setLeft(20).setTop(20).setWidth(b.width).setHeight(b.height);
  img.setLinkUrl(b.url);
  img.setTitle(b.alt);
  img.setDescription(b.title);
}

// Obrázek v Tabulkách nemůže být odkazem, proto jde odkaz jako text do první volné buňky pod obrázkem.
function insertIntoSheet(blob, b) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const cell = sheet.getActiveCell();
  const img = sheet.insertImage(blob, cell.getColumn(), cell.getRow()).setWidth(b.width).setHeight(b.height);
  img.setAltTextTitle(b.alt).setAltTextDescription(b.title);
  let row = cell.getRow();
  for (let used = 0; used < b.height; row++) used += sheet.getRowHeight(row);
  const link = SpreadsheetApp.newRichTextValue().setText(b.label).setLinkUrl(b.url).build();
  sheet.getRange(row, cell.getColumn()).setRichTextValue(link);
}
