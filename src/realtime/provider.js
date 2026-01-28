import { createClient } from "@liveblocks/client";
import * as Y from "yjs";

const publicKey = import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY;

if (!publicKey) {
  throw new Error("VITE_LIVEBLOCKS_PUBLIC_KEY is not set");
}

const client = createClient({ publicKey });

/**
 * Liveblocks の Room と Yjs Doc を接続
 * @param {string} roomId - ルームID
 * @returns {Promise<{room, ydoc, provider}>}
 */
export async function connectRoom(roomId) {
  const room = client.enterRoom(roomId, {
    initialPresence: {},
  });

  // Yjs Doc を作成
  const ydoc = new Y.Doc();

  // 簡易的な Yjs-Liveblocks 同期
  // （本格的には @liveblocks/yjs を使用することを推奨）
  let isSyncing = false;

  /**
   * サーバーからの更新を受け取り、Yjs Doc に反映
   */
  room.subscribe("others", () => {
    // Presence などの更新があった場合
  });

  /**
   * Yjs Doc の更新をサーバーに送信
   */
  ydoc.on("update", (update) => {
    if (isSyncing) return; // 無限ループ防止

    room.batch(() => {
      // Doc の全内容をjson化してstorage に保存
      const appMap = ydoc.getMap("app");
      room.updateStorage({
        listName: appMap.get("listName") || "Tier list",
        tiers: Y.toJSON(appMap.get("tiers")) || [],
        cards: Y.toJSON(appMap.get("cards")) || {},
      });
    });
  });

  /**
   * Room のストレージから Yjs Doc を初期化
   */
  await new Promise((resolve) => {
    room.subscribe("storage-status", (status) => {
      if (status === "synchronized") {
        resolve();
      }
    });
  });

  // ストレージからデータをロード
  const appMap = ydoc.getMap("app");
  const storage = room.getStorage();
  if (storage) {
    isSyncing = true;
    appMap.set("listName", storage.listName || "Tier list");
    appMap.set("tiers", new Y.Array());
    appMap.set("cards", new Y.Map());

    // tiers をロード
    const tiersArray = appMap.get("tiers");
    if (storage.tiers && Array.isArray(storage.tiers)) {
      storage.tiers.forEach((tier) => {
        tiersArray.push([new Y.Map(Object.entries(tier))]);
      });
    }

    // cards をロード
    const cardsMap = appMap.get("cards");
    if (storage.cards && typeof storage.cards === "object") {
      Object.entries(storage.cards).forEach(([cardId, card]) => {
        cardsMap.set(cardId, new Y.Map(Object.entries(card)));
      });
    }
    isSyncing = false;
  } else {
    // 初期状態をセット
    appMap.set("listName", "Tier list");
    appMap.set("tiers", new Y.Array());
    appMap.set("cards", new Y.Map());
  }

  return {
    room,
    ydoc,
    provider: {
      connect: () => {},
      disconnect: () => room.leave(),
      destroy: () => room.leave(),
    },
  };
}

/**
 * Room から切断
 */
export function disconnectRoom(room) {
  if (room) {
    room.leave();
  }
}

export { client };
