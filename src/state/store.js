import { createInitialState } from "./model.js";

const KEY = "tierlist-collab:v1";

// グローバル参照（realtime sync用）
let globalYdoc = null;

export function setGlobalYdoc(ydoc) {
  globalYdoc = ydoc;
}

export function getGlobalYdoc() {
  return globalYdoc;
}

export function loadState() {
  try {
    // フォールバック：localStorage
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
  // ローカルストレージにも保存（フォールバック用）
  localStorage.setItem(KEY, JSON.stringify(state));

  // Yjs Doc がある場合は applyActionToYdoc を使用すること
  // （本来は store.js では Yjs への直接書き込みはしない）
}

