import { newId, sanitizeImageUrl } from "./model.js";

export function addCard(state, { title, imageUrl }) {
  const t = (title ?? "").trim();
  if (!t) return { state, error: "Title は必須です。" };

  const url = (imageUrl ?? "").trim();
  const safeUrl = url ? sanitizeImageUrl(url) : null;
  if (url && !safeUrl) return { state, error: "Image URL は http/https のみ許可です。" };

  const id = newId("c");
  state.cards[id] = { id, title: t, imageUrl: safeUrl, createdAt: Date.now() };

  const backlog = state.tiers.find(x => x.id === "t_backlog") ?? state.tiers[0];
  backlog.cardIds.push(id);

  return { state, error: null };
}

export function moveCard(state, { cardId, fromTierId, toTierId, toIndex }) {
  const from = state.tiers.find(t => t.id === fromTierId);
  const to = state.tiers.find(t => t.id === toTierId);
  if (!from || !to) return state;

  const fromIdx = from.cardIds.indexOf(cardId);
  if (fromIdx >= 0) from.cardIds.splice(fromIdx, 1);

  const idx = Math.max(0, Math.min(toIndex, to.cardIds.length));
  to.cardIds.splice(idx, 0, cardId);
  return state;
}
