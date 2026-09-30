import { availableLanguages, pickLanguage, rememberLanguage, applyUi, t } from "./i18n.js";
import { renderBadge, renderStamp, toBlob, cssSize } from "./render.js";
import { runScript } from "./google.js";

// Stejný kód běží ve třech hostitelích:
//  extension – okno rozšíření a dialog na webu: kopíruje do schránky
//  docs      – panel vložený rozšířením do Google Docs: vkládá přes Apps Script API (google.js)
//  addon     – postranní panel doplňku Google Docs/Sheets/Slides: vkládá přes google.script.run
const query = new URLSearchParams(location.search);
const HOST = query.get("host") || document.body.dataset.host || "extension";
document.body.dataset.host = HOST; // pro CSS (popup.css)
if (window.top !== window.self) document.body.dataset.embedded = ""; // iframe na webu nebo v Docs
const $ = (id) => document.getElementById(id);
let scale, ui, questions; // aktuální jazyk
let index = 0;
let level = null;
let cols = 60; // šířka textu razítka ve znacích
let where = "start"; // doplněk v Docs: začátek dokumentu / u kurzoru
let editor = HOST === "docs" ? "docs" : null; // "docs" | "sheets" | "slides"
let badge = null, stamp = null; // vykreslené canvasy

const label = () => `${level.n} ${level.name}`;
const stampText = () => `${level.responsibility} ${level.when}`;
const vars = () => ({ label: label(), title: scale.title, url: scale.url, responsibility: level.responsibility, text: stampText() });

function showQuestion() {
  const from = scale.levels[Math.floor(index / 3)];
  const to = scale.levels[Math.floor(index / 3) + 1];
  $("step").textContent = t(ui.questionOf, { n: index + 1, total: questions.length });
  $("transition").textContent = `${from.n} ${from.name} → ${to.n} ${to.name}`;
  $("question").textContent = questions[index];
}

async function drawStamp() {
  stamp = await renderStamp(label(), stampText(), cols);
  $("stamp").src = stamp.toDataURL();
  $("cols-readout").textContent = t(ui.colsReadout, { n: cols, px: cssSize(stamp).width });
}

async function finish(n) {
  level = scale.levels[n];
  badge = await renderBadge(label());
  $("badge").src = badge.toDataURL();
  $("badge").alt = $("stamp").alt = label();
  await drawStamp();
  $("quiz").hidden = true;
  $("result").hidden = false;
}

function restart() {
  index = 0;
  $("result").hidden = true;
  $("quiz").hidden = false;
  showQuestion();
}

const blobToDataUrl = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

// Rozšíření: do schránky jde HTML (Gmail…), čistý obrázek (aplikace, které berou jen obrázky)
// a prostý text (pole bez formátování). Obrázek je data URI: zobrazí se i bez rozšíření.
async function copyImage(c) {
  const png = await toBlob(c);
  const { width, height } = cssSize(c);
  const title = t(ui.linkTitle, vars());
  const html =
    `<a href="${scale.url}" title="${title}">` +
    `<img src="${await blobToDataUrl(png)}" width="${width}" height="${height}" alt="${t(ui.altText, vars())}" title="${title}">` +
    `</a>`;
  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([t(ui.plainText, vars())], { type: "text/plain" }),
      "image/png": png,
    }),
  ]);
}

// Vložení do dokumentu: obrázek jde jako base64 do Apps Scriptu (addon/Code.gs), který ho uloží
// přímo do dokumentu s odkazem. Z doplňku přes google.script.run, z Docs panelu přes Apps Script API.
function insertImage(c, button) {
  const { width, height } = cssSize(c);
  const params = {
    base64: c.toDataURL().split(",")[1], width, height, where, url: scale.url,
    label: label(), title: t(ui.linkTitle, vars()), alt: t(ui.altText, vars()), docId: query.get("doc"),
  };
  const run =
    HOST === "addon"
      ? new Promise((resolve, reject) => google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).insertBadge(params))
      : runScript("insertBadge", params);
  button.disabled = true;
  return run.then(() => flash(button, ui.inserted), (e) => flash(button, e.message, 4000)).finally(() => (button.disabled = false));
}

function flash(button, text, ms = 1500) {
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => (button.textContent = original), ms);
}

function useLanguage(lang) {
  ({ scale, ui } = lang);
  questions = scale.questions.flat();
  document.documentElement.lang = lang.code;
  document.title = $("title").textContent = scale.title;
  applyUi(ui, { title: scale.title, url: scale.url });
  $("lang").value = lang.code;
  if (editor) $("insert-hint").textContent = ui[`insertHint_${HOST === "docs" ? "docsapi" : editor}`] ?? "";
  if (level) finish(level.n); // překreslit výsledek v novém jazyce
  else showQuestion();
}

$("yes").onclick = () => (++index === questions.length ? finish(3) : showQuestion());
$("no").onclick = () => finish(Math.floor(index / 3));
$("cols").oninput = (e) => ((cols = Number(e.target.value)), drawStamp());
$("copy-badge").onclick = (e) => copyImage(badge).then(() => flash(e.target, ui.copied));
$("copy-stamp").onclick = (e) => copyImage(stamp).then(() => flash(e.target, ui.copied));
$("copy-text").onclick = (e) => navigator.clipboard.writeText(t(ui.plainText, vars())).then(() => flash(e.target, ui.copied));
$("insert-badge").onclick = (e) => insertImage(badge, e.target);
$("insert-stamp").onclick = (e) => insertImage(stamp, e.target);
for (const b of document.querySelectorAll("#place button")) {
  b.onclick = () => {
    where = b.dataset.where;
    for (const o of document.querySelectorAll("#place button")) o.classList.toggle("active", o === b);
  };
}
$("restart").onclick = (e) => (e.preventDefault(), restart());
document.addEventListener("keydown", (e) => {
  if ($("quiz").hidden) return;
  if (e.key === "a" || e.key === "A") $("yes").click();
  if (e.key === "n" || e.key === "N") $("no").click();
});

if (HOST !== "extension") {
  $("copy-actions").hidden = true;
  $("insert-actions").hidden = false;
}
if (HOST === "addon") {
  google.script.run.withSuccessHandler((host) => {
    editor = host;
    $("place").hidden = host !== "docs";
    if (ui) $("insert-hint").textContent = ui[`insertHint_${host}`] ?? "";
  }).getHost();
}

const languages = await availableLanguages();
for (const l of languages) $("lang").append(new Option(l.name, l.code));
$("lang").onchange = () => {
  rememberLanguage($("lang").value);
  useLanguage(languages.find((l) => l.code === $("lang").value));
};
useLanguage(pickLanguage(languages));
