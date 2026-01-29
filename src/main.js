import "./styles/app.css";

import * as Y from "yjs";
import { setGlobalYdoc } from "./state/store.js";
import { sanitizeImageUrl } from "./state/model.js";
import { ydocToState, applyActionToYdoc } from "./realtime/yjs-bridge.js";
import { connectRoom } from "./realtime/provider.js";
import { getDefaultPresence, updatePresence, subscribeToPresence } from "./realtime/presence.js";
import { el, mountToast, renderLayout, renderParticipants, renderTemplateButtons, renderLobby } from "./ui/render.js";
import { getTemplates, getTemplateState, getResetState } from "./templates/templates.js";

let state = null;
let currentRoom = null;
let currentYdoc = null;
let currentRoomId = null;
let presenceUnsubscribe = null;
let currentUser = null;
let othersPresence = [];
let participantsBody = null;
let voteUI = null;
let currentVoteCardId = null;
let currentVoteSessionId = null;

function getSafeImageUrl(url) {
  return sanitizeImageUrl(url);
}

function getVoteTier() {
  return state?.tiers?.find((tier) => tier.id === "t_vote") || null;
}

function getVoteCardId() {
  const voteTier = getVoteTier();
  return Array.isArray(voteTier?.cardIds) ? voteTier.cardIds[0] || null : null;
}

function findCardTierId(cardId) {
  if (!state?.tiers) return null;
  const tier = state.tiers.find((t) => Array.isArray(t.cardIds) && t.cardIds.includes(cardId));
  return tier ? tier.id : null;
}

function moveCardToTier(cardId, toTierId) {
  const fromTierId = findCardTierId(cardId);
  if (!fromTierId) return false;
  const toTier = state.tiers.find((t) => t.id === toTierId);
  const toIndex = Array.isArray(toTier?.cardIds) ? toTier.cardIds.length : 0;
  safeApplyAction("moveCard", { cardId, fromTierId, toTierId, toIndex });
  return true;
}

function renderParticipantsNow() {
  if (!participantsBody) return;
  renderParticipants(participantsBody, currentUser, othersPresence);
}

/**
 * Yjs Doc に対してアクションを実行（エラーハンドリング付き）
 */
function safeApplyAction(actionName, params) {
  try {
    if (!currentYdoc) {
      console.warn(`[main] safeApplyAction: currentYdoc not available for ${actionName}`);
      return;
    }
    console.log(`[main] Executing action: ${actionName}`, params);
    applyActionToYdoc(currentYdoc, actionName, params);
    console.log(`[main] Action executed successfully: ${actionName}`);
    
    // アクション実行後、Yjs Doc の内容を state に反映
    state = ydocToState(currentYdoc);
    // Yjs の更新は自動的に Liveblocks に同期される（LiveblocksYjsProvider経由）
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[main] Error executing action ${actionName}:`, errorMsg);
    window.__toast?.error(`操作に失敗しました: ${errorMsg}`);
  }
}

/**
 * ルームに接続
 */
async function connectToRoom(roomId) {
  try {
    console.log("[main] connectToRoom: Connecting to room:", roomId);
    // 既存の接続を切断
    if (presenceUnsubscribe) {
      presenceUnsubscribe();
    }

    // 新しいルームに接続
    console.log("[main] connectToRoom: Calling connectRoom()");
    const { room, ydoc } = await connectRoom(roomId);
    console.log("[main] connectToRoom: Got room and ydoc");
    currentRoom = room;
    currentYdoc = ydoc;
    currentRoomId = roomId;

    // グローバル Yjs Doc を設定
    setGlobalYdoc(ydoc);
    console.log("[main] connectToRoom: setGlobalYdoc done");

    // 初期状態をロード
    console.log("[main] connectToRoom: Loading state from ydoc");
    state = ydocToState(ydoc);
    console.log("[main] connectToRoom: State loaded:", state);
    if (!state.tiers?.some((t) => t.id === "t_vote")) {
      safeApplyAction("ensureVoteTier", {});
    }

    // Presence の初期化
    console.log("[main] connectToRoom: Initializing presence");
    const presence = getDefaultPresence();
    currentUser = presence;
    updatePresence(room, presence);
    console.log("[main] connectToRoom: Presence updated");

    // Presence リスナー設定
    console.log("[main] connectToRoom: Setting presence listener");
    presenceUnsubscribe = subscribeToPresence(room, (others) => {
      console.log("[main] Presence updated, others:", others.length);
    othersPresence = others;
    renderParticipantsNow();
    updateVoteUI();
  });
    console.log("[main] connectToRoom: Presence listener set");

    // Yjs Doc の変更をリッスン
    console.log("[main] connectToRoom: Setting Yjs doc listener");
    ydoc.on("update", () => {
      console.log("[main] Yjs Doc updated");
      state = ydocToState(ydoc);
      renderApp();
    });

    console.log("[main] connectToRoom: Room connection established");
    return true;
  } catch (error) {
    console.error("[main] connectToRoom: Error:", error);
    window.__toast?.error("ルーム接続に失敗しました");
    return false;
  }
}

/**
 * 現在のルームを取得
 */
function getRoomId() {
  const hash = window.location.hash;
  if (hash.startsWith("#room/")) {
    return hash.slice(6);
  }
  return null;
}

/**
 * ルームIDを変更（URL更新）
 */
function setRoomId(roomId) {
  window.location.hash = `#room/${roomId}`;
}

function onShare() {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => window.__toast?.success("コピーしました"))
    .catch(() => window.__toast?.error("コピーに失敗しました"));
}

function onShareRoomId() {
  const roomId = getRoomId();
  if (!roomId) {
    window.__toast?.error("ルームIDが見つかりません");
    return;
  }
  navigator.clipboard
    .writeText(roomId)
    .then(() => window.__toast?.success("ルームIDをコピーしました"))
    .catch(() => window.__toast?.error("コピーに失敗しました"));
}
function applyTemplateById(templateId) {
  const state = getTemplateState(templateId);
  if (!state) {
    window.__toast?.error("Template not found.");
    return;
  }
  const ok = window.confirm("テンプレートを読み込みます。現在の内容は上書きされますがよろしいですか？");
  if (!ok) return;
  safeApplyAction("applyTemplate", { state });
  window.__toast?.success("Template applied.");
}

function resetTemplate() {
  const ok = window.confirm("リセットします。現在の内容は上書きされますがよろしいですか？");
  if (!ok) return;
  const state = getResetState();
  safeApplyAction("applyTemplate", { state });
  window.__toast?.success("Reset done.");
}

function newVoteSessionId() {
  return `vs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function resetVoteSession() {
  const sessionId = newVoteSessionId();
  safeApplyAction("setVoteSession", { sessionId });
  if (currentRoom && currentUser) {
    const newPresence = { ...currentUser, vote: null, voteSessionId: sessionId };
    currentUser = newPresence;
    updatePresence(currentRoom, newPresence);
  }
  currentVoteSessionId = sessionId;
  updateVoteUI();
}

function setVoteCard(cardId) {
  if (!state) return;
  const voteTier = getVoteTier();
  const currentCardId = getVoteCardId();
  if (currentCardId === cardId) return;

  // If there is already a vote card, move it back to backlog.
  if (currentCardId) {
    moveCardToTier(currentCardId, "t_backlog");
  }

  if (cardId) {
    moveCardToTier(cardId, "t_vote");
  }

  resetVoteSession();
}

function updateVoteUI() {
  if (!voteUI || !state) return;
  const {
    voteSlot,
    voteImg,
    voteTitle,
    goodBtn,
    badBtn,
    goodCount,
    badCount,
  } = voteUI;

  const cardId = getVoteCardId();
  const card = cardId ? state.cards[cardId] : null;
  const hasCard = !!card;

  if (hasCard) {
    voteSlot.classList.remove("is-empty");
    const safeUrl = getSafeImageUrl(card.imageUrl);
    if (safeUrl) {
      voteImg.style.display = "block";
      voteImg.src = safeUrl;
    } else {
      voteImg.style.display = "none";
      voteImg.src = "";
    }
    voteTitle.textContent = card.title || "";
    voteSlot.draggable = true;
    voteSlot.dataset.cardId = cardId;
  } else {
    voteSlot.classList.add("is-empty");
    voteImg.style.display = "none";
    voteImg.src = "";
    voteTitle.textContent = "No card";
    voteSlot.draggable = false;
    voteSlot.dataset.cardId = "";
  }

  goodBtn.disabled = !hasCard;
  badBtn.disabled = !hasCard;

  const all = [currentUser, ...othersPresence.map((o) => o.user || o)].filter(Boolean);
  const sessionId = state.voteSessionId || null;
  const likeCount = hasCard
    ? all.filter((u) => u.vote === "like" && u.voteSessionId === sessionId).length
    : 0;
  const badCountValue = hasCard
    ? all.filter((u) => u.vote === "dislike" && u.voteSessionId === sessionId).length
    : 0;
  goodCount.textContent = String(likeCount);
  badCount.textContent = String(badCountValue);

  const voteValue = currentUser?.vote || null;
  goodBtn.classList.toggle("is-active", voteValue === "like");
  badBtn.classList.toggle("is-active", voteValue === "dislike");
}


/**
 * シンプルなモーダル（CSSは既存の .modal-backdrop / .modal を使用）
 * - Escで閉じる
 * - 背景クリックで閉じる
 */
function openModal({ title, contentNode, primaryText, onPrimary, secondaryText = "Cancel" }) {
  const backdrop = el("div", "modal-backdrop");
  const modal = el("div", "modal");

  const head = el("div", "modal__head");
  head.append(el("div", "modal__title", title));
  const closeBtn = el("button", "iconbtn");
  closeBtn.textContent = "✕";
  head.append(closeBtn);

  const body = el("div", "modal__body");
  body.append(contentNode);

  const foot = el("div", "modal__foot");
  const cancel = el("button", "btn btn--ghost");
  cancel.textContent = secondaryText;

  const ok = el("button", "btn btn--primary");
  ok.textContent = primaryText;

  foot.append(cancel, ok);
  modal.append(head, body, foot);
  backdrop.append(modal);
  document.body.append(backdrop);

  const cleanup = () => {
    window.removeEventListener("keydown", onKey);
    backdrop.remove();
  };

  const onKey = (e) => {
    if (e.key === "Escape") cleanup();
  };
  window.addEventListener("keydown", onKey);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) cleanup();
  });
  closeBtn.addEventListener("click", cleanup);
  cancel.addEventListener("click", cleanup);

  ok.addEventListener("click", async () => {
    const res = await onPrimary();
    // onPrimary側が false を返したら閉じない（入力エラーなど）
    if (res === false) return;
    cleanup();
  });

  return { close: cleanup };
}

/** ドロップ位置（挿入index）を決める */
function computeDropIndex({ tier, tierBodyEl, event }) {
  const cardIds = Array.isArray(tier?.cardIds) ? tier.cardIds : [];
  const targetCardEl = event.target?.closest?.(".card");
  if (!targetCardEl || !tierBodyEl.contains(targetCardEl)) {
    return cardIds.length; // 末尾
  }

  const targetId = targetCardEl.dataset.cardId;
  const baseIndex = cardIds.indexOf(targetId);
  if (baseIndex === -1) return cardIds.length;

  const rect = targetCardEl.getBoundingClientRect();
  const before = event.clientY < rect.top + rect.height / 2;
  return before ? baseIndex : baseIndex + 1;
}

function getDragCardId(event) {
  if (!event?.dataTransfer) return "";
  return (
    event.dataTransfer.getData("application/x-tier-card") ||
    event.dataTransfer.getData("text/plain") ||
    ""
  );
}

function cardNode(card, metaText) {
  const cardEl = el("div", "card");
  cardEl.draggable = true;
  cardEl.dataset.cardId = card.id;

  cardEl.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("application/x-tier-card", card.id);
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "move";

    // Presence更新：ドラッグ開始
    if (currentRoom && currentUser) {
      const newPresence = {
        ...currentUser,
        draggingCardId: card.id,
      };
      currentUser = newPresence;
      updatePresence(currentRoom, newPresence);
      renderParticipantsNow();
      console.log("[main] Drag started:", card.id);
    }
  });

  cardEl.addEventListener("dragend", (e) => {
    // ドラッグ終了：常に draggingCardId をクリア
    console.log("[main] dragend fired for card:", card.id, "current dragging:", currentUser?.draggingCardId);
    
    if (currentRoom && currentUser) {
      // 次のフレームで更新（dropイベントの処理完了を待つ）
      setTimeout(() => {
        if (currentUser.draggingCardId === card.id) {
          const newPresence = {
            ...currentUser,
            draggingCardId: null,
          };
          currentUser = newPresence;
          updatePresence(currentRoom, newPresence);
          renderParticipantsNow();
          console.log("[main] draggingCardId cleared via dragend");
        }
      }, 0);
    }
  });

  // タイトル
  const header = el("div", "card__header");
  const title = el("div", "card__title", card.title);
  header.append(title);

  // 画像コンテナ（常に存在）
  const imageContainer = el("div", "card__image-container");
  const safeUrl = getSafeImageUrl(card.imageUrl);
  if (safeUrl) {
    const img = document.createElement("img");
    img.className = "card__thumb";
    img.src = safeUrl;
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;
    img.addEventListener("error", () => {
      img.remove();
      const meta = cardEl.querySelector(".card__meta");
      if (meta) meta.textContent = "画像を読み込めませんでした";
    });
    imageContainer.append(img);
  }
  cardEl.append(imageContainer);

  // メタテキストとボタン,
  const footer = el("div", "card__footer");
  footer.append(el("div", "card__meta", metaText));
  
  const actions = el("div", "card__actions");
  const editBtn = el("button", "card__btn");
  editBtn.textContent = "✎";
  editBtn.title = "Edit Card";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showEditCardModal(card);
  });

  const delBtn = el("button", "card__btn");
  delBtn.textContent = "🗑";
  delBtn.title = "Delete Card";
  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showDeleteCardModal(card);
  });

  actions.append(editBtn, delBtn);
  header.append(actions);
  cardEl.append(header);
  cardEl.append(footer);

  return cardEl;
}

function showAddTierModal() {
  const wrap = el("div");
  const field = el("div", "field");
  field.append(el("div", "label", "Tier name (1〜24文字)"));
  const input = document.createElement("input");
  input.className = "input";
  input.placeholder = "例: C";
  field.append(input);

  const err = el("div", "error");
  wrap.append(field, err);

  openModal({
    title: "Add Tier",
    contentNode: wrap,
    primaryText: "Add",
    onPrimary: () => {
      err.textContent = "";
      const name = (input.value ?? "").trim();
      if (!name || name.length > 24) {
        err.textContent = "Tier名は1〜24文字で入力してください。";
        window.__toast?.error(err.textContent);
        return false;
      }

      // Yjs Doc に適用
      safeApplyAction("addTier", { name });

      window.__toast?.success("Tierを追加しました");
      return true;
    },
  });

  // 即入力できるように
  setTimeout(() => input.focus(), 0);
}

function showRenameTierModal(tier) {
  const wrap = el("div");
  const field = el("div", "field");
  field.append(el("div", "label", "Tier name (1〜24文字)"));
  const input = document.createElement("input");
  input.className = "input";
  input.value = tier.name;
  field.append(input);

  const err = el("div", "error");
  wrap.append(field, err);

  openModal({
    title: "Rename Tier",
    contentNode: wrap,
    primaryText: "Save",
    onPrimary: () => {
      err.textContent = "";
      const name = (input.value ?? "").trim();
      if (!name || name.length > 24) {
        err.textContent = "Tier名は1〜24文字で入力してください。";
        window.__toast?.error(err.textContent);
        return false;
      }

      safeApplyAction("renameTier", { tierId: tier.id, name });

      window.__toast?.success("Tier名を更新しました");
      return true;
    },
  });

  setTimeout(() => input.focus(), 0);
}

function showDeleteTierModal(tier) {
  const wrap = el("div");
  wrap.append(
    el("div", "", `「${tier.name}」を削除します。`),
    el("div", "help", "このTier内のカードは Backlog の末尾に移動します。")
  );

  openModal({
    title: "Delete Tier",
    contentNode: wrap,
    primaryText: "Delete",
    onPrimary: () => {
      if (tier.id === "t_backlog") {
        window.__toast?.error("Backlogは削除できません。");
        return false;
      }

      safeApplyAction("deleteTier", { tierId: tier.id });

      window.__toast?.success("Tierを削除しました（カードはBacklogへ移動）");
      return true;
    },
    secondaryText: "Cancel",
  });
}

function showEditCardModal(card) {
  const wrap = el("div");
  
  const titleField = el("div", "field");
  titleField.append(el("div", "label", "Title (required)"));
  const titleInput = document.createElement("input");
  titleInput.className = "input";
  titleInput.value = card.title;
  titleField.append(titleInput);

  const urlField = el("div", "field");
  urlField.append(el("div", "label", "Image URL (optional)"));
  const urlInput = document.createElement("input");
  urlInput.className = "input";
  urlInput.value = card.imageUrl ?? "";
  urlInput.placeholder = "https://...";
  urlField.append(urlInput);
  urlField.append(el("div", "help", "http/httpsのみ。空白で画像を削除します。"));

  const err = el("div", "error");
  wrap.append(titleField, urlField, err);

  openModal({
    title: "Edit Card",
    contentNode: wrap,
    primaryText: "Save",
    onPrimary: () => {
      err.textContent = "";
      const title = (titleInput.value ?? "").trim();
      if (!title) {
        err.textContent = "タイトルは必須です。";
        window.__toast?.error(err.textContent);
        return false;
      }

      const imageUrl = urlInput.value;
      const safeUrl = imageUrl ? getSafeImageUrl(imageUrl) : null;
      if (imageUrl && !safeUrl) {
        err.textContent = "Image URL は http/https のみ許可しています";
        window.__toast?.error(err.textContent);
        return false;
      }

      safeApplyAction("updateCard", { cardId: card.id, title, imageUrl: safeUrl });

      window.__toast?.success("カードを更新しました");
      return true;
    },
  });

  setTimeout(() => titleInput.focus(), 0);
}

function showChangeListNameModal() {
  const wrap = el("div");
  const field = el("div", "field");
  field.append(el("div", "label", "List Name (1〜50文字)"));
  const input = document.createElement("input");
  input.className = "input";
  input.value = state.listName;
  field.append(input);

  const err = el("div", "error");
  wrap.append(field, err);

  openModal({
    title: "Change List Name",
    contentNode: wrap,
    primaryText: "Save",
    onPrimary: () => {
      err.textContent = "";
      const listName = (input.value ?? "").trim();
      if (!listName || listName.length > 50) {
        err.textContent = "リスト名は1〜50文字で入力してください。";
        window.__toast?.error(err.textContent);
        return false;
      }

      safeApplyAction("updateListName", { listName });

      window.__toast?.success("リスト名を更新しました");
      return true;
    },
  });

  setTimeout(() => input.focus(), 0);
}

function showAddCardModal() {
  const wrap = el("div");
  
  const titleField = el("div", "field");
  titleField.append(el("div", "label", "Title (required)"));
  const titleInput = document.createElement("input");
  titleInput.className = "input";
  titleInput.placeholder = "例: Ashe";
  titleField.append(titleInput);

  const urlField = el("div", "field");
  urlField.append(el("div", "label", "Image URL (optional)"));
  const urlInput = document.createElement("input");
  urlInput.className = "input";
  urlInput.placeholder = "https://...";
  urlField.append(urlInput);
  urlField.append(el("div", "help", "http/httpsのみ。読み込み失敗時はフォールバックします。"));

  const err = el("div", "error");
  wrap.append(titleField, urlField, err);

  openModal({
    title: "Add Card",
    contentNode: wrap,
    primaryText: "Add",
    onPrimary: () => {
      err.textContent = "";
      const title = (titleInput.value ?? "").trim();
      if (!title) {
        err.textContent = "タイトルは必須です。";
        window.__toast?.error(err.textContent);
        return false;
      }

      const imageUrl = urlInput.value;
      const safeUrl = imageUrl ? getSafeImageUrl(imageUrl) : null;
      if (imageUrl && !safeUrl) {
        err.textContent = "Image URL は http/https のみ許可しています";
        window.__toast?.error(err.textContent);
        return false;
      }

      safeApplyAction("addCard", { title, imageUrl: safeUrl });

      window.__toast?.success("カードを追加しました");
      return true;
    },
  });

  setTimeout(() => titleInput.focus(), 0);
}

function showDeleteCardModal(card) {
  const wrap = el("div");
  wrap.append(
    el("div", "", `「${card.title}」を削除します。`)
  );

  openModal({
    title: "Delete Card",
    contentNode: wrap,
    primaryText: "Delete",
    onPrimary: () => {
      safeApplyAction("deleteCard", { cardId: card.id });

      window.__toast?.success("カードを削除しました");
      return true;
    },
    secondaryText: "Cancel",
  });
}

function renderBoard(mainBody) {
  if (!state) {
    console.warn("[main] renderBoard: state is null");
    return;
  }

  console.log("[main] renderBoard: state =", state);
  console.log("[main] renderBoard: tiers =", state.tiers);

  try {
    const board = el("div", "board");

    const backlogTier = state.tiers.find((tier) => tier.id === "t_backlog");
    const orderedTiers = [
      ...state.tiers.filter((tier) => tier.id !== "t_backlog" && tier.id !== "t_vote"),
      ...(backlogTier ? [backlogTier] : []),
    ];
    const colorTiers = orderedTiers.filter((tier) => tier.id !== "t_backlog");
    const totalTiers = Math.max(1, colorTiers.length);
    const tierColor = (index) => {
      if (totalTiers === 1) return "hsl(0, 85%, 70%)";
      const ratio = index / (totalTiers - 1);
      const hue = 0 + (120 * ratio);
      return `hsl(${hue}, 85%, 70%)`;
    };

    let colorIndex = 0;
    orderedTiers.forEach((tier) => {
      const tierEl = el("section", "tier");
      tierEl.dataset.tierId = tier.id;
      if (!Array.isArray(tier.cardIds)) {
        tier.cardIds = [];
      }

    const label = el("div", "tier__label");
    const isBacklog = tier.id === "t_backlog";
    if (isBacklog) {
      label.style.background = "#8a8f98";
    } else {
      label.style.background = tierColor(colorIndex);
      colorIndex += 1;
    }
    const name = el("div", "tier__label-name", tier.name);
    const actions = el("div", "tier__actions");

    // 上移動（Backlogは移動不可）
    const upBtn = el("button", "iconbtn");
    upBtn.textContent = "↑";
    upBtn.title = "Move Up";
    upBtn.disabled = isBacklog;
    upBtn.style.opacity = isBacklog ? "0.35" : "1";
    upBtn.style.cursor = isBacklog ? "not-allowed" : "pointer";
    if (!isBacklog) {
      upBtn.addEventListener("click", () => {
        safeApplyAction("moveTierUp", { tierId: tier.id });
        window.__toast?.success("Tierを移動しました");
      });
    }

    // 下移動（Backlogは移動不可）
    const downBtn = el("button", "iconbtn");
    downBtn.textContent = "↓";
    downBtn.title = "Move Down";
    const isLastNonBacklog = !isBacklog && orderedTiers[orderedTiers.length - 1]?.id === "t_backlog";
    const isJustAboveBacklog = !isBacklog && orderedTiers[orderedTiers.length - 2]?.id === tier.id;
    const downDisabled = isBacklog || (isLastNonBacklog && isJustAboveBacklog);
    downBtn.disabled = downDisabled;
    downBtn.style.opacity = downDisabled ? "0.35" : "1";
    downBtn.style.cursor = downDisabled ? "not-allowed" : "pointer";
    if (!downDisabled) {
      downBtn.addEventListener("click", () => {
        safeApplyAction("moveTierDown", { tierId: tier.id });
        window.__toast?.success("Tierを移動しました");
      });
    }

    // 編集
    const editBtn = el("button", "iconbtn");
    editBtn.textContent = "✎";
    editBtn.title = "Rename Tier";
    editBtn.addEventListener("click", () => showRenameTierModal(tier));

    // 削除（Backlogは削除不可）
    const delBtn = el("button", "iconbtn");
    delBtn.textContent = "🗑";
    delBtn.title = "Delete Tier";
    delBtn.disabled = isBacklog;
    delBtn.style.opacity = isBacklog ? "0.35" : "1";
    delBtn.style.cursor = isBacklog ? "not-allowed" : "pointer";
    if (!isBacklog) {
      delBtn.addEventListener("click", () => showDeleteTierModal(tier));
    }

    actions.append(upBtn, downBtn, editBtn, delBtn);
    label.append(name, actions);

    const body = el("div", "tier__body");
    body.dataset.tierId = tier.id;

    body.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    body.addEventListener("drop", (e) => {
      e.preventDefault();

      const cardId = getDragCardId(e);
      if (!cardId) return;

      const fromTier = state.tiers.find((t) => t.cardIds.includes(cardId));
      if (!fromTier) return;

      const toTierId = tier.id;
      const fromTierId = fromTier.id;

      let toIndex = computeDropIndex({ tier, tierBodyEl: body, event: e });

      // 同一Tier内移動のindexズレ補正
      if (fromTierId === toTierId) {
        const fromIndex = tier.cardIds.indexOf(cardId);
        if (fromIndex !== -1 && fromIndex < toIndex) toIndex -= 1;
      }

      safeApplyAction("moveCard", { cardId, fromTierId, toTierId, toIndex });
      if (fromTierId === "t_vote" || toTierId === "t_vote") {
        resetVoteSession();
      }
      console.log("[main] Drop completed for card:", cardId);
    });

    if (tier.cardIds.length === 0) {
      body.append(el("div", "drop-hint", "ここにドロップ"));
    } else {
      for (const cid of tier.cardIds) {
        const c = state.cards[cid];
        if (!c) continue;
        const safeUrl = getSafeImageUrl(c.imageUrl);
        body.append(cardNode({ ...c, imageUrl: safeUrl }, safeUrl ? "" : "画像なし"));
      }
    }

    tierEl.append(label, body);
    board.append(tierEl);
  });

  mainBody.replaceChildren(board);
  console.log("[main] renderBoard: completed successfully");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[main] renderBoard error:", errorMsg);
    console.error("[main] renderBoard error details:", error);
    mainBody.replaceChildren(el("div", "", `Error rendering board: ${errorMsg}`));
  }
}

function renderApp() {
  try {
    console.log("[main] renderApp: starting, state =", state);
    
    const root = document.getElementById("app");
    if (!root) {
      console.error('No #app element found. Check index.html for <div id="app"></div>.');
      return;
    }

    if (!state) {
      root.textContent = "ルームを読み込み中...";
      return;
    }

    const {
      mainBody,
      mainTitle,
      changeNameBtn,
      addCardBtn,
      addTierBtn,
      lpBody,
      templatesBody,
      voteSlot,
      voteImg,
      voteTitle,
      goodBtn,
      badBtn,
      goodCount,
      badCount,
    } = renderLayout(root, { onShare, onShareRoomId });

    // 参加者リストを描画
    participantsBody = lpBody;
    renderParticipantsNow();

    const templates = getTemplates();
    renderTemplateButtons(templatesBody, templates, applyTemplateById, resetTemplate);

    voteUI = { voteSlot, voteImg, voteTitle, goodBtn, badBtn, goodCount, badCount };

    const nextVoteCardId = getVoteCardId();
    if (currentVoteCardId !== nextVoteCardId || currentVoteSessionId !== state.voteSessionId) {
      currentVoteCardId = nextVoteCardId;
      currentVoteSessionId = state.voteSessionId || null;
      if (currentRoom && currentUser) {
        const newPresence = {
          ...currentUser,
          vote: null,
          voteSessionId: currentVoteSessionId,
        };
        currentUser = newPresence;
        updatePresence(currentRoom, newPresence);
      }
    }

    voteSlot.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    voteSlot.addEventListener("dragstart", (e) => {
      const cardId = getVoteCardId();
      if (!cardId) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData("application/x-tier-card", cardId);
      e.dataTransfer.setData("text/plain", cardId);
      e.dataTransfer.effectAllowed = "move";
      voteSlot.classList.add("is-over");
    });
    voteSlot.addEventListener("dragend", () => {
      voteSlot.classList.remove("is-over");
    });
    voteSlot.addEventListener("dragenter", (e) => {
      e.preventDefault();
      voteSlot.classList.add("is-over");
    });
    voteSlot.addEventListener("dragleave", () => {
      voteSlot.classList.remove("is-over");
    });
    voteSlot.addEventListener("drop", (e) => {
      e.preventDefault();
      voteSlot.classList.remove("is-over");
      const cardId = getDragCardId(e);
      if (!cardId) return;
      if (!state.cards[cardId]) {
        window.__toast?.error("カードが見つかりません");
        return;
      }
      setVoteCard(cardId);
    });

    goodBtn.addEventListener("click", () => {
      if (!getVoteCardId() || !currentRoom || !currentUser) return;
      const next = currentUser.vote === "like" ? null : "like";
      const newPresence = {
        ...currentUser,
        vote: next,
        voteSessionId: state.voteSessionId || null,
      };
      currentUser = newPresence;
      updatePresence(currentRoom, newPresence);
      updateVoteUI();
    });

    badBtn.addEventListener("click", () => {
      if (!getVoteCardId() || !currentRoom || !currentUser) return;
      const next = currentUser.vote === "dislike" ? null : "dislike";
      const newPresence = {
        ...currentUser,
        vote: next,
        voteSessionId: state.voteSessionId || null,
      };
      currentUser = newPresence;
      updatePresence(currentRoom, newPresence);
      updateVoteUI();
    });

    // タイトル更新（空欄の場合はデフォルト値）
    mainTitle.textContent = state.listName || "Tier list";

    // ボタンイベント設定
    changeNameBtn.addEventListener("click", showChangeListNameModal);
    addCardBtn.addEventListener("click", showAddCardModal);
    addTierBtn.addEventListener("click", showAddTierModal);

    const toasts = mountToast();
    root.querySelector(".app").append(toasts);

    renderBoard(mainBody);
    updateVoteUI();
    console.log("[main] renderApp: completed successfully");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[main] renderApp error:", errorMsg);
    console.error("[main] renderApp error details:", error);
  }
}

/**
 * 初期化とルーティング
 */
async function initApp() {
  console.log("[main] initApp started");
  // ルームIDを取得
  let roomId = getRoomId();
  console.log("[main] Current roomId:", roomId);

  if (!roomId) {
    const root = document.getElementById("app");
    if (!root) return;
    const { createBtn, joinBtn, input } = renderLobby(root);

    const toasts = mountToast();
    root.querySelector(".app").append(toasts);

    const goToRoom = (id) => {
      const trimmed = (id || "").trim();
      if (!trimmed) {
        window.__toast?.error("ルームIDを入力してください");
        return;
      }
      setRoomId(trimmed);
    };

    createBtn.addEventListener("click", () => {
      const newId = `room_${Math.random().toString(36).slice(2, 10)}`;
      console.log("[main] Generated new roomId:", newId);
      setRoomId(newId);
    });

    joinBtn.addEventListener("click", () => goToRoom(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") goToRoom(input.value);
    });

    return;
  }

  // ルームに接続
  console.log("[main] Connecting to room:", roomId);
  const connected = await connectToRoom(roomId);
  console.log("[main] Connection result:", connected);
  
  if (!connected) {
    const root = document.getElementById("app");
    if (root) {
      root.textContent = "ルーム接続に失敗しました。ページをリロードしてください。";
    }
    return;
  }

  // 初回レンダリング
  console.log("[main] Rendering app");
  renderApp();
}

// アプリを起動
initApp();

// ハッシュ変更時にリロード（無限ループ防止用に1回限りに）
let hashChangeHandled = false;
window.addEventListener("hashchange", () => {
  if (!hashChangeHandled) {
    hashChangeHandled = true;
    location.reload();
  }
});
