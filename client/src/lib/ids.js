// /src/lib/ids.js
import { v4 as uuidv4 } from "uuid";

function getOrSetLocalStorage(key) {
  let id = localStorage.getItem(key);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Persistent per-browser ID (shared by all tabs; survives reloads) */
export function getBrowserId() {
  return getOrSetLocalStorage("browserId");
}

/** Per-tab ID (unique per tab; resets on refresh) */
export function getTabId() {
  let id = sessionStorage.getItem("tabId");
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem("tabId", id);
  }
  return id;
}
