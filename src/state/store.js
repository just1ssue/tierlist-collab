import { createInitialState } from "./model.js";

const KEY = "tierlist-collab:v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.cards || !parsed.tiers) return createInitialState();
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
