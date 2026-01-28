/**
 * ユーザーの一意なID生成（初回のみ）
 */
function getUserId() {
  let userId = sessionStorage.getItem("tierlist-userId");
  if (!userId) {
    // 簡易UUID生成（依存なし）
    userId = `user_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
    sessionStorage.setItem("tierlist-userId", userId);
  }
  return userId;
}

/**
 * デフォルトの Presence オブジェクトを生成
 */
export function getDefaultPresence() {
  return {
    userId: getUserId(),
    displayName: `Guest-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    cursor: null,
    draggingCardId: null,
    editingTierId: null,
    lastActive: Date.now(),
  };
}

/**
 * 他のユーザーのPresenceをフォーマット（表示用）
 */
export function formatPresence(others) {
  return others.map((other) => ({
    userId: other.id,
    user: other.presence,
  }));
}

/**
 * Presence のサブスクライバーを設定
 * @param {Object} room - Liveblocks Room
 * @param {Function} onPresenceChange - コールバック(others)
 */
export function subscribeToPresence(room, onPresenceChange) {
  const unsubscribe = room.subscribe("others", (others) => {
    if (onPresenceChange) {
      onPresenceChange(formatPresence(others));
    }
  });

  return unsubscribe;
}

/**
 * Presence を更新
 */
export function updatePresence(room, presence) {
  room.updatePresence(presence);
}
