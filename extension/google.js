// Volání Apps Scriptu nasazeného jako API executable, s tokenem uživatele z chrome.identity.
// Uživatel dává souhlas jednou (stejně jako u Zotera); token si Chrome pamatuje.
import { SCRIPT_ID } from "./config.js";

async function token(interactive) {
  const r = await chrome.identity.getAuthToken({ interactive });
  return typeof r === "string" ? r : r.token; // starší Chrome vrací řetězec
}

async function call(fn, params, t) {
  const res = await fetch(`https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({ function: fn, parameters: params }),
  });
  return res;
}

/** Spustí funkci skriptu; při neplatném tokenu ho zahodí a zkusí jednou znovu. */
export async function runScript(fn, ...params) {
  let t = await token(true);
  let res = await call(fn, params, t);
  if (res.status === 401) {
    await chrome.identity.removeCachedAuthToken({ token: t });
    t = await token(true);
    res = await call(fn, params, t);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error.details?.[0]?.errorMessage || data.error.message || `HTTP ${res.status}`);
  return data.response?.result;
}
