import { BASE_URL, LEVELS, QUESTIONS } from "./scale.js";

const $ = (id) => document.getElementById(id);
let index = 0;
let level = null;

function showQuestion() {
  const from = LEVELS[Math.floor(index / 3)];
  const to = LEVELS[Math.floor(index / 3) + 1];
  $("step").textContent = `Otázka ${index + 1} z ${QUESTIONS.length}`;
  $("transition").textContent = `${from.n} ${from.name} → ${to.n} ${to.name}`;
  $("question").textContent = QUESTIONS[index];
}

function finish(n) {
  level = LEVELS[n];
  $("badge").src = `badges/${level.slug}.svg`;
  $("badge").alt = label();
  $("stamp").textContent = label();
  $("full-text").textContent = `${level.responsibility} ${level.when}`;
  $("quiz").hidden = true;
  $("result").hidden = false;
}

function restart() {
  index = 0;
  $("result").hidden = true;
  $("quiz").hidden = false;
  showQuestion();
}

const label = () => `${level.n} ${level.name}`;
const title = () => `${label()} – Škála AI Odpovědnosti. ${level.responsibility} Kliknutím otevřete vysvětlení škály.`;
const plainText = () => `${label()} – ${level.responsibility} ${level.when} (${BASE_URL})`;

const blobToDataUrl = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

const fetchPng = (suffix = "") => fetch(`badges/${level.slug}${suffix}.png`).then((r) => r.blob());

// Do schránky jde HTML (pro Docs, Gmail…), čistý obrázek (pro aplikace, které berou jen obrázky)
// a prostý text (pro pole bez formátování). Cíl vložení si vybere, co umí.
const write = (html, png) =>
  navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plainText()], { type: "text/plain" }),
      "image/png": png,
    }),
  ]);

// Odznak: obrázek vložený jako data URI (zobrazí se i bez rozšíření a bez načítání z webu) obalený odkazem.
async function copyMinimal() {
  const png = await fetchPng();
  const html =
    `<a href="${BASE_URL}" title="${title()}">` +
    `<img src="${await blobToDataUrl(png)}" width="158" height="42" alt="${label()} – Škála AI Odpovědnosti" title="${title()}">` +
    `</a>`;
  await write(html, png);
}

// Razítko: skutečný text v orámované buňce, takže se zalamuje podle šířky dokumentu a dá se upravovat.
// Obrázková podoba (badges/*-full.png) jde jen jako záložní image/png.
async function copyFull() {
  const font = `'JetBrains Mono','Roboto Mono','Courier New',monospace`;
  const html =
    `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%"><tr>` +
    `<td style="border:2px solid #000;background:#eee;padding:14px 19px;font-family:${font};font-size:14px;line-height:1.4;color:#000">` +
    `<a href="${BASE_URL}" title="${title()}" style="color:#000;text-decoration:none"><b>${label()}</b></a>` +
    `&nbsp;&nbsp;${level.responsibility} ${level.when}` +
    `</td></tr></table>`;
  await write(html, await fetchPng("-full"));
}

function flash(button, text) {
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => (button.textContent = original), 1500);
}

$("yes").onclick = () => (++index === QUESTIONS.length ? finish(3) : showQuestion());
$("no").onclick = () => finish(Math.floor(index / 3));
$("copy-minimal").onclick = (e) => copyMinimal().then(() => flash(e.target, "Zkopírováno"));
$("copy-full").onclick = (e) => copyFull().then(() => flash(e.target, "Zkopírováno"));
$("copy-text").onclick = (e) => navigator.clipboard.writeText(plainText()).then(() => flash(e.target, "Zkopírováno"));
$("restart").onclick = (e) => (e.preventDefault(), restart());
document.addEventListener("keydown", (e) => {
  if ($("quiz").hidden) return;
  if (e.key === "a" || e.key === "A") $("yes").click();
  if (e.key === "n" || e.key === "N") $("no").click();
});

showQuestion();
