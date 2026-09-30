import { availableLanguages, pickLanguage, rememberLanguage, applyUi, t } from "./i18n.js";
import { renderBadge, renderStamp, toBlob, cssSize } from "./render.js";

const $ = (id) => document.getElementById(id);
let scale, ui, questions; // aktuální jazyk
let index = 0;
let level = null;
let cols = 60; // šířka textu razítka ve znacích
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
  for (const b of document.querySelectorAll("#widths button")) b.classList.toggle("active", Number(b.dataset.cols) === cols);
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

// Do schránky jde HTML (Gmail…), čistý obrázek (aplikace, které berou jen obrázky) a prostý text
// (pole bez formátování). Obrázek je data URI: zobrazí se i bez rozšíření a bez načítání z webu.
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

function flash(button) {
  const original = button.textContent;
  button.textContent = ui.copied;
  setTimeout(() => (button.textContent = original), 1500);
}

function useLanguage(lang) {
  ({ scale, ui } = lang);
  questions = scale.questions.flat();
  document.documentElement.lang = lang.code;
  document.title = $("title").textContent = scale.title;
  $("version").textContent = `v${scale.scaleVersion}`;
  applyUi(ui, { title: scale.title, url: scale.url });
  $("lang").value = lang.code;
  if (level) finish(level.n); // překreslit výsledek v novém jazyce
  else showQuestion();
}

$("yes").onclick = () => (++index === questions.length ? finish(3) : showQuestion());
$("no").onclick = () => finish(Math.floor(index / 3));
for (const b of document.querySelectorAll("#widths button")) b.onclick = () => ((cols = Number(b.dataset.cols)), drawStamp());
$("copy-badge").onclick = (e) => copyImage(badge).then(() => flash(e.target));
$("copy-stamp").onclick = (e) => copyImage(stamp).then(() => flash(e.target));
$("copy-text").onclick = (e) => navigator.clipboard.writeText(t(ui.plainText, vars())).then(() => flash(e.target));
$("restart").onclick = (e) => (e.preventDefault(), restart());
document.addEventListener("keydown", (e) => {
  if ($("quiz").hidden) return;
  if (e.key === "a" || e.key === "A") $("yes").click();
  if (e.key === "n" || e.key === "N") $("no").click();
});

const languages = await availableLanguages();
for (const l of languages) $("lang").append(new Option(l.name, l.code));
$("lang").onchange = () => {
  rememberLanguage($("lang").value);
  useLanguage(languages.find((l) => l.code === $("lang").value));
};
useLanguage(pickLanguage(languages));
