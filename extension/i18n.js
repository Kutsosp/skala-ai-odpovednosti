// Texty: obsah škály (scale/<jazyk>.json, kopie ze složky scale/ v repozitáři) a texty rozhraní
// (locales/<jazyk>.json). SCALE_SOURCE lze později přesměrovat na vzdálený zdroj se stejnou strukturou.

const SCALE_SOURCE = "scale/";
const UI_SOURCE = "locales/";
const STORAGE_KEY = "language";

const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${url}: ${r.status}`))));

/** Jazyky, pro které existuje obsah škály i texty rozhraní. */
export async function availableLanguages() {
  const codes = await json(`${SCALE_SOURCE}index.json`);
  const found = await Promise.all(
    codes.map((code) =>
      Promise.all([json(`${SCALE_SOURCE}${code}.json`), json(`${UI_SOURCE}${code}.json`)])
        .then(([scale, ui]) => ({ code, name: scale.languageName, scale, ui }))
        .catch(() => null),
    ),
  );
  return found.filter(Boolean);
}

/** Uložený jazyk, jinak jazyk prohlížeče, jinak první dostupný. */
export function pickLanguage(languages) {
  const saved = localStorage.getItem(STORAGE_KEY);
  const browser = navigator.language.slice(0, 2);
  return languages.find((l) => l.code === saved) || languages.find((l) => l.code === browser) || languages[0];
}

export const rememberLanguage = (code) => localStorage.setItem(STORAGE_KEY, code);

/** Dosadí {klíč} z vars. */
export const t = (template, vars = {}) => template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

/** Vyplní prvky s data-i18n="klíč" (a data-i18n-title pro title). Klíče končící na Html se vkládají jako HTML. */
export function applyUi(ui, vars = {}) {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    const key = el.dataset.i18n;
    const text = t(ui[key] ?? key, vars);
    if (key.endsWith("Html")) el.innerHTML = text;
    else el.textContent = text;
  }
  for (const el of document.querySelectorAll("[data-i18n-title]")) {
    el.title = t(ui[el.dataset.i18nTitle] ?? el.dataset.i18nTitle, { ...vars, ...el.dataset });
  }
}
