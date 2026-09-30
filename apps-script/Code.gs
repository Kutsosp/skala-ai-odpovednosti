/**
 * Škála AI Odpovědnosti – Apps Script volaný rozšířením pro Chrome přes Apps Script API
 * (nasazení typu API Executable). Vloží PNG odznak do Google Docs, Sheets nebo Slides s odkazem na škálu.
 * Rozšíření posílá id dokumentu a místo vložení, protože zde není žádný „aktivní“ dokument.
 */

/**
 * @param {{kind:"docs"|"sheets"|"slides", docId:string, base64:string, width:number, height:number,
 *          url:string, label:string, title:string, alt:string, gid?:string, range?:string, pageId?:string}} b
 */
function insertBadge(b) {
  const blob = Utilities.newBlob(Utilities.base64Decode(b.base64), "image/png", `${b.label}.png`);
  const insert = { docs: insertIntoDoc, sheets: insertIntoSheet, slides: insertIntoSlide }[b.kind];
  if (!insert) throw new Error(`Neznámý typ dokumentu: ${b.kind}`);
  insert(blob, b);
}

/** Docs: první řádek dokumentu, odkaz na obrázku. */
function insertIntoDoc(blob, b) {
  const doc = DocumentApp.openById(b.docId);
  const img = doc.getBody().insertParagraph(0, "").appendInlineImage(blob);
  img.setWidth(b.width).setHeight(b.height).setLinkUrl(b.url).setAltTitle(b.alt).setAltDescription(b.title);
}

/** Slides: aktuální snímek (pageId z URL), jinak první; odkaz na obrázku. */
function insertIntoSlide(blob, b) {
  const pres = SlidesApp.openById(b.docId);
  const page = (b.pageId && pres.getSlideById(b.pageId)) || pres.getSlides()[0];
  const img = page.insertImage(blob).setLeft(20).setTop(20).setWidth(b.width).setHeight(b.height);
  img.setLinkUrl(b.url);
  img.setTitle(b.alt);
  img.setDescription(b.title);
}

/**
 * Sheets: vybraný list (gid z URL) a buňka (z pole názvu), jinak A1 prvního listu. Obrázek v Tabulkách
 * nemůže být odkazem, proto jde odkaz jako text do první volné buňky pod obrázkem.
 */
function insertIntoSheet(blob, b) {
  const ss = SpreadsheetApp.openById(b.docId);
  const sheet = (b.gid && ss.getSheets().find((s) => String(s.getSheetId()) === String(b.gid))) || ss.getSheets()[0];
  let cell;
  try {
    cell = sheet.getRange(b.range || "A1");
  } catch (e) {
    cell = sheet.getRange("A1"); // pojmenovaná oblast nebo nečitelný výběr
  }
  const img = sheet.insertImage(blob, cell.getColumn(), cell.getRow()).setWidth(b.width).setHeight(b.height);
  img.setAltTextTitle(b.alt).setAltTextDescription(b.title);
  let row = cell.getRow();
  for (let used = 0; used < b.height; row++) used += sheet.getRowHeight(row);
  const link = SpreadsheetApp.newRichTextValue().setText(b.label).setLinkUrl(b.url).build();
  sheet.getRange(row, cell.getColumn()).setRichTextValue(link);
}
