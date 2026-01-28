import { createClient } from "@liveblocks/client";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";

const publicKey = import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY;

if (!publicKey) {
  throw new Error("VITE_LIVEBLOCKS_PUBLIC_KEY is not set");
}

console.log("[provider] Creating Liveblocks client with publicApiKey");
const client = createClient({ publicApiKey: publicKey });

/**
 * Liveblocks の Room と Yjs Doc を接続（LiveblocksYjsProvider使用）
 * @param {string} roomId - ルームID
 * @returns {Promise<{room, ydoc, provider}>}
 */
export async function connectRoom(roomId) {
  try {
    console.log("[provider] Connecting to room:", roomId);
    const roomWrapper = client.enterRoom(roomId, {
      initialPresence: {},
    });
    console.log("[provider] Room wrapper created");
    
    const room = roomWrapper.room;
    console.log("[provider] Room obtained from wrapper");

    // Yjs Doc を作成
    const ydoc = new Y.Doc();
    console.log("[provider] Yjs Doc created");

    // LiveblocksYjsProvider を使用して、Yjs と Liveblocks を統合
    // これにより、Yjs の更新が自動的に Liveblocks room に同期される
    console.log("[provider] Creating LiveblocksYjsProvider...");
    const provider = new LiveblocksYjsProvider(room, ydoc, {
      resyncInterval: 5000, // 5秒ごとに同期確認
    });
    console.log("[provider] LiveblocksYjsProvider created");

    // provider を接続
    console.log("[provider] Connecting provider...");
    provider.connect();
    console.log("[provider] Provider connected to Liveblocks room");

    // appMap の初期化
    console.log("[provider] Setting up Yjs structure...");
    const appMap = ydoc.getMap("app");
    
    // appMap が空の場合のみ初期状態を作成
    if (appMap.size === 0) {
      console.log("[provider] appMap is empty, creating initial structure");
      const tiersArray = new Y.Array();
      const backlogTier = new Y.Map([
        ["id", "t_backlog"],
        ["name", "Backlog"],
        ["cardIds", new Y.Array()],
      ]);
      tiersArray.push([backlogTier]);

      appMap.set("listName", "Tier list");
      appMap.set("tiers", tiersArray);
      appMap.set("cards", new Y.Map());
      console.log("[provider] Initial structure created");
    } else {
      console.log("[provider] appMap already has data, size:", appMap.size);
    }

    console.log("[provider] connectRoom completed successfully");
    return {
      room,
      ydoc,
      provider,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[provider] Error in connectRoom:", errorMsg);
    console.error("[provider] Full error object:", error);
    throw error;
  }
}
