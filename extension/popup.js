import { BASE_URL, LEVELS, QUESTIONS } from "./scale.js";
import { renderBadge, renderStamp, toBlob, cssSize } from "./render.js";

const $ = (id) => document.getElementById(id);
const WIDTHS = { narrow: 40, medium: 60, wide: 80 }; // šířka textu razítka ve znacích
let index = 0;
let level = null;
let cols = WIDTHS.medium;
let badge = null, stamp = null; // vykreslené canvasy

function showQuestion() {
  const from = LEVELS[Math.floor(index / 3)];
  const to = LEVELS[Math.floor(index / 3) + 1];
  $("step").textContent = `Otázka ${index + 1} z ${QUESTIONS.length}`;
  $("transition").textContent = `${from.n} ${from.name} → ${to.n} ${to.name}`;
  $("question").textContent = QUESTIONS[index];
}

const label = () => `${level.n} ${level.name}`;
const stampText = () => `${level.responsibility} ${level.when}`;
const title = () => `${label()} – Škála AI Odpovědnosti. ${level.responsibility} Kliknutím otevřete vysvětlení škály.`;
const plainText = () => `${label()} – ${stampText()} (${BASE_URL})`;

async function drawStamp() {
  stamp = await renderStamp(label(), stampText(), cols);
  $("stamp").src = stamp.toDataURL();
  for (const b of document.querySelectorAll("#widths button")) b.classList.toggle("active", WIDTHS[b.dataset.w] === cols);
}

async function finish(n) {
  level = LEVELS[n];
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

// Do schránky jde HTML (Docs, Gmail…), čistý obrázek (aplikace, které berou jen obrázky)
// a prostý text (pole bez formátování). Cíl vložení si vybere, co umí.
// Obrázek je data URI: zobrazí se i bez rozšíření a bez načítání z webu. Odkaz na obrázku
// Google Docs zahodí, proto je volitelně i textový odkaz pod obrázkem.
async function copyImage(c) {
  const png = await toBlob(c);
  const { width, height } = cssSize(c);
  let html =
    `<a href="${BASE_URL}" title="${title()}">` +
    `<img src="${await blobToDataUrl(png)}" width="${width}" height="${height}" alt="${label()} – Škála AI Odpovědnosti" title="${title()}">` +
    `</a>`;
  if ($("caption").checked) {
    html += `<br><a href="${BASE_URL}" title="${title()}" style="font-family:'JetBrains Mono','Roboto Mono','Courier New',monospace;font-size:11px;color:#666">${BASE_URL.replace("https://", "")}</a>`;
  }
  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plainText()], { type: "text/plain" }),
      "image/png": png,
    }),
  ]);
}

function flash(button, text) {
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => (button.textContent = original), 1500);
}

$("yes").onclick = () => (++index === QUESTIONS.length ? finish(3) : showQuestion());
$("no").onclick = () => finish(Math.floor(index / 3));
for (const b of document.querySelectorAll("#widths button")) b.onclick = () => ((cols = WIDTHS[b.dataset.w]), drawStamp());
$("copy-badge").onclick = (e) => copyImage(badge).then(() => flash(e.target, "Zkopírováno"));
$("copy-stamp").onclick = (e) => copyImage(stamp).then(() => flash(e.target, "Zkopírováno"));
$("copy-text").onclick = (e) => navigator.clipboard.writeText(plainText()).then(() => flash(e.target, "Zkopírováno"));
$("restart").onclick = (e) => (e.preventDefault(), restart());
document.addEventListener("keydown", (e) => {
  if ($("quiz").hidden) return;
  if (e.key === "a" || e.key === "A") $("yes").click();
  if (e.key === "n" || e.key === "N") $("no").click();
});

showQuestion();
