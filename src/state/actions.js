import { newId, sanitizeImageUrl } from "./model.js";

export function addCard(state, { title, imageUrl }) {
  const t = (title ?? "").trim();
  if (!t) return { state, error: "Title は必須です。" };

  const url = (imageUrl ?? "").trim();
  const safeUrl = url ? sanitizeImageUrl(url) : null;
  if (url && !safeUrl) return { state, error: "Image URL は http/https のみ許可です。" };

  const id = newId("c");
  state.cards[id] = { id, title: t, imageUrl: safeUrl, createdAt: Date.now() };

  const backlog = state.tiers.find((x) => x.id === "t_backlog") ?? state.tiers[0];
  backlog.cardIds.push(id);

  return { state, error: null };
}

export function moveCard(state, { cardId, fromTierId, toTierId, toIndex }) {
  const from = state.tiers.find((t) => t.id === fromTierId);
  const to = state.tiers.find((t) => t.id === toTierId);
  if (!from || !to) return state;

  const fromIdx = from.cardIds.indexOf(cardId);
  if (fromIdx >= 0) from.cardIds.splice(fromIdx, 1);

  const idx = Math.max(0, Math.min(toIndex, to.cardIds.length));
  to.cardIds.splice(idx, 0, cardId);
  return state;
}

/** Tier名の簡易バリデーション */
function sanitizeTierName(name) {
  const n = (name ?? "").trim();
  if (!n) return null;
  if (n.length > 24) return null; // UIが崩れにくい上限（必要なら後で調整）
  return n;
}

/**
 * Tier追加（Backlogは固定。基本は末尾追加）
 */
export function addTier(state, { name }) {
  const n = sanitizeTierName(name);
  if (!n) return { state, error: "Tier名は1〜24文字で入力してください。" };

  const id = newId("t");
  state.tiers.push({ id, name: n, cardIds: [] });
  return { state, error: null };
}

/**
 * Tier名変更
 */
export function renameTier(state, { tierId, name }) {
  const n = sanitizeTierName(name);
  if (!n) return { state, error: "Tier名は1〜24文字で入力してください。" };

  const t = state.tiers.find((x) => x.id === tierId);
  if (!t) return { state, error: "Tierが見つかりません。" };

  // Backlogもリネームは可（嫌ならここで弾く）
  t.name = n;
  return { state, error: null };
}

/**
 * Tier削除：そのTierのカードは Backlog へ移動してから削除する
 * - Backlog自体は削除不可
 */
export function deleteTier(state, { tierId }) {
  if (tierId === "t_backlog") return { state, error: "Backlogは削除できません。" };

  const idx = state.tiers.findIndex((x) => x.id === tierId);
  if (idx === -1) return { state, error: "Tierが見つかりません。" };

  const backlog = state.tiers.find((x) => x.id === "t_backlog") ?? state.tiers[0];
  const target = state.tiers[idx];

  // カードをBacklog末尾へ退避（順序維持）
  for (const cid of target.cardIds) {
    backlog.cardIds.push(cid);
  }

  state.tiers.splice(idx, 1);
  return { state, error: null };
}
