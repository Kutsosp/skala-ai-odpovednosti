// Google Docs: přidá do horní nabídky položku „AI Škála“ (po vzoru Zotera) a po kliknutí otevře
// panel s aplikací rozšíření (popup.html?host=docs). Vložení do dokumentu jde přes google.js.
//
// Závislost na značkování Googlu je držena na minimu: id „docs-menubar“ (stabilní roky) a
// klonování existující položky, aby vzhled dodal Google, ne my. Když nabídka není k nalezení,
// zůstane plovoucí tlačítko vpravo dole.

const MENU_ID = "skala-menu";
const PANEL_ID = "skala-panel";
const LABEL = chrome.i18n.getMessage("menuLabel") || "AI Škála";

const docId = () => location.pathname.match(/\/document\/d\/([^/]+)/)?.[1];

function panelUrl() {
  return chrome.runtime.getURL(`popup.html?host=docs&doc=${docId()}`);
}

function togglePanel(anchor) {
  const open = document.getElementById(PANEL_ID);
  if (open) return open.remove();
  const frame = document.createElement("iframe");
  frame.id = PANEL_ID;
  frame.src = panelUrl();
  frame.title = LABEL;
  frame.allow = "clipboard-write";
  const r = anchor.getBoundingClientRect();
  const width = Math.min(480, window.innerWidth - 16);
  const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
  Object.assign(frame.style, {
    position: "fixed", top: `${r.bottom + 4}px`, left: `${left}px`, width: `${width}px`,
    height: `${Math.min(760, window.innerHeight - r.bottom - 16)}px`,
    border: "2px solid #000", background: "#fff", zIndex: 2147483647, boxShadow: "0 8px 24px rgba(0,0,0,.3)",
  });
  document.body.append(frame);
  const close = (e) => {
    if (e.type === "keydown" ? e.key !== "Escape" : frame.contains(e.target) || anchor.contains(e.target)) return;
    frame.remove();
    document.removeEventListener("mousedown", close, true);
    document.removeEventListener("keydown", close, true);
  };
  document.addEventListener("mousedown", close, true);
  document.addEventListener("keydown", close, true);
}

/** Vloží položku do horní nabídky Docs. Vrací true, když se to podařilo (nebo už tam je). */
function injectMenu() {
  const bar = document.getElementById("docs-menubar");
  if (!bar) return false;
  if (document.getElementById(MENU_ID)) return true;
  const template = document.getElementById("docs-help-menu") || bar.lastElementChild;
  if (!template) return false;
  const item = template.cloneNode(false); // jen obal s třídami Googlu, bez obsahu a bez id
  item.id = MENU_ID;
  item.textContent = LABEL;
  item.setAttribute("role", "menuitem");
  item.setAttribute("aria-haspopup", "true");
  item.classList.remove("goog-control-hover", "goog-control-open", "goog-control-focused");
  // Stavy najetí a otevření řídí u Googlu jejich skript; klon není registrovaný, tak je řídíme sami.
  item.addEventListener("mouseenter", () => item.classList.add("goog-control-hover"));
  item.addEventListener("mouseleave", () => item.classList.remove("goog-control-hover"));
  item.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePanel(item);
  });
  template.before(item);
  return true;
}

/** Záložní vstup, když se nabídka nenajde: plovoucí tlačítko. */
function injectFallbackButton() {
  if (document.getElementById(MENU_ID)) return;
  const b = document.createElement("button");
  b.id = MENU_ID;
  b.textContent = LABEL;
  Object.assign(b.style, {
    position: "fixed", right: "16px", bottom: "16px", zIndex: 2147483647, padding: "6px 12px",
    font: "600 14px 'JetBrains Mono', monospace", background: "#fff", color: "#000", border: "2px solid #000", cursor: "pointer",
  });
  b.addEventListener("click", () => togglePanel(b));
  document.body.append(b);
}

if (docId()) {
  if (!injectMenu()) {
    // Docs staví nabídku po načtení; sledujeme DOM, po 15 s to vzdáme a dáme tlačítko.
    const observer = new MutationObserver(() => injectMenu() && observer.disconnect());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      if (!injectMenu()) injectFallbackButton();
    }, 15000);
  }
}
