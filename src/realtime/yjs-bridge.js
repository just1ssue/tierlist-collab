import * as Y from "yjs";

/**
 * Yjs Doc から state 形式に変換
 */
export function ydocToState(ydoc) {
  const appMap = ydoc.getMap("app");

  return {
    listName: appMap.get("listName") || "Tier list",
    voteCardId: appMap.get("voteCardId") || null,
    voteSessionId: appMap.get("voteSessionId") || null,
    cards: mapToObject(appMap.get("cards")),
    tiers: arrayToState(appMap.get("tiers")),
  };
}

/**
 * state から Yjs Doc に変換（初期化用）
 */
export function stateToYdoc(ydoc, state) {
  const appMap = ydoc.getMap("app");

  const safeState = state || {};
  const safeTiers = Array.isArray(safeState.tiers) ? safeState.tiers : [];
  const safeCards = safeState.cards && typeof safeState.cards === "object" ? safeState.cards : {};

  appMap.set("listName", safeState.listName || "Tier list");
  appMap.set("voteCardId", safeState.voteCardId || null);
  appMap.set("voteSessionId", safeState.voteSessionId || null);

  const tiersArray = new Y.Array();
  safeTiers.forEach((tier) => {
    tiersArray.push([objectToYMap(tier || {})]);
  });
  appMap.set("tiers", tiersArray);

  const cardsMap = new Y.Map();
  Object.entries(safeCards).forEach(([cardId, card]) => {
    cardsMap.set(cardId, objectToYMap(card || {}));
  });
  appMap.set("cards", cardsMap);
}

/**
 * Y.Map を plain object に変換
 */
function mapToObject(ymap) {
  if (!ymap) return {};
  const result = {};
  ymap.forEach((value, key) => {
    result[key] = valueToPlain(value);
  });
  return result;
}

/**
 * Y.Array を state 形式の配列に変換
 */
function arrayToState(yarray) {
  if (!yarray) return [];
  const result = [];
  yarray.forEach((item) => {
    result.push(valueToPlain(item));
  });
  return result;
}

/**
 * Yjs 値を plain value に変換
 */
function valueToPlain(value) {
  if (value instanceof Y.Map) {
    return mapToObject(value);
  } else if (value instanceof Y.Array) {
    return arrayToState(value);
  }
  return value;
}

/**
 * Plain object を Y.Map に変換
 */
function objectToYMap(obj) {
  const ymap = new Y.Map();
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      ymap.set(key, objectToYMap(value));
    } else if (Array.isArray(value)) {
      const yarray = new Y.Array();
      value.forEach((item) => {
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          yarray.push([objectToYMap(item)]);
        } else {
          yarray.push([item]);
        }
      });
      ymap.set(key, yarray);
    } else {
      ymap.set(key, value);
    }
  });
  return ymap;
}

/**
 * action を Yjs Doc に適用（wrapper）
 * state を変更する代わりに、Yjs Doc を直接操作
 */
export function applyActionToYdoc(ydoc, actionName, params) {
  try {
    console.log(`[yjs-bridge] Applying action: ${actionName}`, params);
    
    const appMap = ydoc.getMap("app");
    let cardsMap = appMap.get("cards");
    if (!(cardsMap instanceof Y.Map)) {
      cardsMap = new Y.Map();
      appMap.set("cards", cardsMap);
    }
    let tiersArray = appMap.get("tiers");
    if (!(tiersArray instanceof Y.Array)) {
      tiersArray = new Y.Array();
      appMap.set("tiers", tiersArray);
    }

    console.log(`[yjs-bridge] appMap: ${!!appMap}, cardsMap: ${!!cardsMap}, tiersArray: ${!!tiersArray}`);

    const ensureBacklogLast = () => {
      const tierArray = tiersArray.toArray();
      const idx = tierArray.findIndex((t) => t instanceof Y.Map && t.get("id") === "t_backlog");
      if (idx === -1 || idx === tierArray.length - 1) return;
      const backlogPlain = valueToPlain(tierArray[idx]);
      tiersArray.delete(idx, 1);
      tiersArray.insert(tiersArray.length, [objectToYMap(backlogPlain)]);
    };

    if (actionName === "addCard") {
    const { title, imageUrl } = params;
    const id = `c_${Math.random().toString(36).slice(2, 10)}`;
    const card = new Y.Map();
    card.set("id", id);
    card.set("title", title);
    card.set("imageUrl", imageUrl || null);
    card.set("createdAt", Date.now());
    cardsMap.set(id, card);

    // Backlog に追加
    if (tiersArray && tiersArray.length > 0) {
      const backlog = tiersArray.get(0);
      if (backlog && backlog instanceof Y.Map) {
        const cardIds = backlog.get("cardIds");
        if (cardIds instanceof Y.Array) {
          cardIds.push([id]);
        }
      }
    }
  } else if (actionName === "deleteCard") {
    const { cardId } = params;
    cardsMap.delete(cardId);
    if (appMap.get("voteCardId") === cardId) {
      appMap.set("voteCardId", null);
    }

    // すべての Tier から削除
    if (tiersArray) {
      tiersArray.forEach((tier) => {
        if (tier instanceof Y.Map) {
          const cardIds = tier.get("cardIds");
          if (cardIds instanceof Y.Array) {
            const idx = cardIds.toArray().indexOf(cardId);
            if (idx >= 0) {
              cardIds.delete(idx, 1);
            }
          }
        }
      });
    }
  } else if (actionName === "updateCard") {
    const { cardId, title, imageUrl } = params;
    const card = cardsMap.get(cardId);
    if (card instanceof Y.Map) {
      card.set("title", title);
      card.set("imageUrl", imageUrl || null);
    }
  } else if (actionName === "updateListName") {
    const { listName } = params;
    appMap.set("listName", listName || "Tier list");
  } else if (actionName === "addTier") {
    const { name } = params;
    const id = `t_${Math.random().toString(36).slice(2, 10)}`;
    const tier = new Y.Map();
    tier.set("id", id);
    tier.set("name", name);
    tier.set("cardIds", new Y.Array());
    tiersArray.push([tier]);
  } else if (actionName === "renameTier") {
    const { tierId, name } = params;
    if (tiersArray) {
      const tierArray = tiersArray.toArray();
      const tier = tierArray.find((t) => t instanceof Y.Map && t.get("id") === tierId);
      if (tier) {
        tier.set("name", name);
      }
    }
  } else if (actionName === "deleteTier") {
    const { tierId } = params;
    if (tiersArray) {
      const tierArray = tiersArray.toArray();
      const idx = tierArray.findIndex((t) => t instanceof Y.Map && t.get("id") === tierId);
      if (idx >= 0 && idx > 0) {
        // Backlog でなければ削除
        const backlog = tierArray[0];
        const tier = tierArray[idx];
        if (tier instanceof Y.Map && backlog instanceof Y.Map) {
          const cardIds = tier.get("cardIds");
          const backlogCardIds = backlog.get("cardIds");
          if (cardIds instanceof Y.Array && backlogCardIds instanceof Y.Array) {
            cardIds.toArray().forEach((cardId) => {
              backlogCardIds.push([cardId]);
            });
          }
        }
        tiersArray.delete(idx, 1);
      }
    }
  } else if (actionName === "moveTierUp") {
    const { tierId } = params;
    if (tiersArray) {
      if (tierId === "t_backlog") return;
      ensureBacklogLast();
      const tierArray = tiersArray.toArray();
      const idx = tierArray.findIndex((t) => t instanceof Y.Map && t.get("id") === tierId);
      if (idx > 0) {
        const current = tierArray[idx];
        const prev = tierArray[idx - 1];
        if (prev instanceof Y.Map && prev.get("id") === "t_backlog") return;
        const currentPlain = valueToPlain(current);
        const prevPlain = valueToPlain(prev);
        tiersArray.delete(idx - 1, 2);
        tiersArray.insert(idx - 1, [objectToYMap(currentPlain), objectToYMap(prevPlain)]);
      }
    }
  } else if (actionName === "moveTierDown") {
    const { tierId } = params;
    if (tiersArray) {
      if (tierId === "t_backlog") return;
      ensureBacklogLast();
      const tierArray = tiersArray.toArray();
      const idx = tierArray.findIndex((t) => t instanceof Y.Map && t.get("id") === tierId);
      if (idx >= 0 && idx < tierArray.length - 1) {
        const current = tierArray[idx];
        const next = tierArray[idx + 1];
        if (next instanceof Y.Map && next.get("id") === "t_backlog") return;
        const currentPlain = valueToPlain(current);
        const nextPlain = valueToPlain(next);
        tiersArray.delete(idx, 2);
        tiersArray.insert(idx, [objectToYMap(nextPlain), objectToYMap(currentPlain)]);
      }
    }
  } else if (actionName === "moveCard") {
    const { cardId, fromTierId, toTierId, toIndex } = params;
    if (tiersArray) {
      const tierArray = tiersArray.toArray();

      // fromTier から削除
      const fromTier = tierArray.find(
        (t) => t instanceof Y.Map && t.get("id") === fromTierId
      );
      if (fromTier instanceof Y.Map) {
        const cardIds = fromTier.get("cardIds");
        if (cardIds instanceof Y.Array) {
          const fromIdx = cardIds.toArray().indexOf(cardId);
          if (fromIdx >= 0) {
            cardIds.delete(fromIdx, 1);
          }
        }
      }

      // toTier に追加
      const toTier = tierArray.find((t) => t instanceof Y.Map && t.get("id") === toTierId);
      if (toTier instanceof Y.Map) {
        const cardIds = toTier.get("cardIds");
        if (cardIds instanceof Y.Array) {
          const idx = Math.max(0, Math.min(toIndex, cardIds.length));
          cardIds.insert(idx, [cardId]);
        }
      }
    }
  } else if (actionName === "setVoteCard") {
    const { cardId } = params;
    appMap.set("voteCardId", cardId || null);
  } else if (actionName === "setVoteSession") {
    const { sessionId } = params;
    appMap.set("voteSessionId", sessionId || null);
  } else if (actionName === "ensureVoteTier") {
    const tierArray = tiersArray.toArray();
    const hasVote = tierArray.some((t) => t instanceof Y.Map && t.get("id") === "t_vote");
    if (!hasVote) {
      const tier = new Y.Map();
      tier.set("id", "t_vote");
      tier.set("name", "VOTE");
      tier.set("cardIds", new Y.Array());
      tiersArray.push([tier]);
    }
  } else if (actionName === "applyTemplate") {
    const { state } = params;
    if (!state) {
      throw new Error("applyTemplate requires a state payload");
    }
    stateToYdoc(ydoc, state);
  }
    console.log(`[yjs-bridge] Action applied successfully: ${actionName}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[yjs-bridge] Error applying action ${actionName}:`, errorMsg);
    console.error(`[yjs-bridge] Error details:`, error);
    throw error;
  }
}
