import "./styles/app.css";

import { setGlobalYdoc } from "./state/store.js";
import { ydocToState, applyActionToYdoc } from "./realtime/yjs-bridge.js";
import { connectRoom, disconnectRoom } from "./realtime/provider.js";
import { getDefaultPresence, updatePresence, subscribeToPresence } from "./realtime/presence.js";
import { el, mountToast, renderLayout } from "./ui/render.js";

let state = null;
let currentRoom = null;
let currentYdoc = null;
let currentRoomId = null;
let presenceUnsubscribe = null;

/**
 * ルームに接続
 */
async function connectToRoom(roomId) {
  try {
    // 既存の接続を切断
    if (presenceUnsubscribe) {
      presenceUnsubscribe();
    }
    if (currentRoom) {
      disconnectRoom(currentRoom);
    }

    // 新しいルームに接続
    const { room, ydoc } = await connectRoom(roomId);
    currentRoom = room;
    currentYdoc = ydoc;
    currentRoomId = roomId;

    // グローバル Yjs Doc を設定
    setGlobalYdoc(ydoc);

    // 初期状態をロード
    state = ydocToState(ydoc);

    // Presence の初期化
    const presence = getDefaultPresence();
    updatePresence(room, presence);

    // Presence リスナー設定
    presenceUnsubscribe = subscribeToPresence(room, (others) => {
      renderApp(); // 参加者表示を更新
    });

    // Yjs Doc の変更をリッスン
    ydoc.on("update", () => {
      state = ydocToState(ydoc);
      renderApp();
    });

    return true;
  } catch (error) {
    console.error("Failed to connect to room:", error);
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
  const targetCardEl = event.target?.closest?.(".card");
  if (!targetCardEl || !tierBodyEl.contains(targetCardEl)) {
    return tier.cardIds.length; // 末尾
  }

  const targetId = targetCardEl.dataset.cardId;
  const baseIndex = tier.cardIds.indexOf(targetId);
  if (baseIndex === -1) return tier.cardIds.length;

  const rect = targetCardEl.getBoundingClientRect();
  const before = event.clientY < rect.top + rect.height / 2;
  return before ? baseIndex : baseIndex + 1;
}

function cardNode(card, metaText) {
  const cardEl = el("div", "card");
  cardEl.draggable = true;
  cardEl.dataset.cardId = card.id;

  cardEl.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", card.id);
    e.dataTransfer.effectAllowed = "move";

    // Presence更新：ドラッグ開始
    if (currentRoom) {
      updatePresence(currentRoom, {
        ...getDefaultPresence(),
        draggingCardId: card.id,
      });
    }
  });

  cardEl.addEventListener("dragend", (e) => {
    // Presence更新：ドラッグ終了
    if (currentRoom) {
      updatePresence(currentRoom, {
        ...getDefaultPresence(),
        draggingCardId: null,
      });
    }
  });

  // タイトル
  const title = el("div", "card__title", card.title);
  cardEl.append(title);

  // 画像コンテナ（常に存在）
  const imageContainer = el("div", "card__image-container");
  if (card.imageUrl) {
    const img = document.createElement("img");
    img.className = "card__thumb";
    img.src = card.imageUrl;
    img.alt = "";
    img.addEventListener("error", () => {
      img.remove();
      const meta = cardEl.querySelector(".card__meta");
      if (meta) meta.textContent = "画像を読み込めませんでした";
    });
    imageContainer.append(img);
  }
  cardEl.append(imageContainer);

  // メタテキストとボタン
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
  footer.append(actions);
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
      if (currentYdoc) {
        applyActionToYdoc(currentYdoc, "addTier", { name });
      }

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

      if (currentYdoc) {
        applyActionToYdoc(currentYdoc, "renameTier", { tierId: tier.id, name });
      }

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

      if (currentYdoc) {
        applyActionToYdoc(currentYdoc, "deleteTier", { tierId: tier.id });
      }

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

      if (currentYdoc) {
        applyActionToYdoc(currentYdoc, "updateCard", { cardId: card.id, title, imageUrl });
      }

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

      if (currentYdoc) {
        applyActionToYdoc(currentYdoc, "updateListName", { listName });
      }

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

      if (currentYdoc) {
        applyActionToYdoc(currentYdoc, "addCard", { title, imageUrl });
      }

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
      if (currentYdoc) {
        applyActionToYdoc(currentYdoc, "deleteCard", { cardId: card.id });
      }

      window.__toast?.success("カードを削除しました");
      return true;
    },
    secondaryText: "Cancel",
  });
}

function renderBoard(mainBody) {
  if (!state) return;

  const board = el("div", "board");

  for (const tier of state.tiers) {
    const tierEl = el("section", "tier");
    tierEl.dataset.tierId = tier.id;

    const head = el("div", "tier__head");
    head.append(el("div", "tier__name", tier.name));

    const actions = el("div", "tier__actions");

    // 上移動（Backlogは移動不可）
    const upBtn = el("button", "iconbtn");
    upBtn.textContent = "↑";
    upBtn.title = "Move Up";
    upBtn.disabled = tier.id === "t_backlog";
    upBtn.style.opacity = tier.id === "t_backlog" ? "0.35" : "1";
    upBtn.style.cursor = tier.id === "t_backlog" ? "not-allowed" : "pointer";
    if (tier.id !== "t_backlog") {
      upBtn.addEventListener("click", () => {
        if (currentYdoc) {
          applyActionToYdoc(currentYdoc, "moveTierUp", { tierId: tier.id });
          window.__toast?.success("Tierを移動しました");
        }
      });
    }

    // 下移動（Backlogは移動不可）
    const downBtn = el("button", "iconbtn");
    downBtn.textContent = "↓";
    downBtn.title = "Move Down";
    downBtn.disabled = tier.id === "t_backlog";
    downBtn.style.opacity = tier.id === "t_backlog" ? "0.35" : "1";
    downBtn.style.cursor = tier.id === "t_backlog" ? "not-allowed" : "pointer";
    if (tier.id !== "t_backlog") {
      downBtn.addEventListener("click", () => {
        if (currentYdoc) {
          applyActionToYdoc(currentYdoc, "moveTierDown", { tierId: tier.id });
          window.__toast?.success("Tierを移動しました");
        }
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
    delBtn.disabled = tier.id === "t_backlog";
    delBtn.style.opacity = tier.id === "t_backlog" ? "0.35" : "1";
    delBtn.style.cursor = tier.id === "t_backlog" ? "not-allowed" : "pointer";
    if (tier.id !== "t_backlog") {
      delBtn.addEventListener("click", () => showDeleteTierModal(tier));
    }

    actions.append(upBtn, downBtn, editBtn, delBtn);
    head.append(actions);

    const body = el("div", "tier__body");
    body.dataset.tierId = tier.id;

    body.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    body.addEventListener("drop", (e) => {
      e.preventDefault();

      const cardId = e.dataTransfer.getData("text/plain");
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

      if (currentYdoc) {
        applyActionToYdoc(currentYdoc, "moveCard", { cardId, fromTierId, toTierId, toIndex });
      }
    });

    if (tier.cardIds.length === 0) {
      body.append(el("div", "drop-hint", "ここにドロップ"));
    } else {
      for (const cid of tier.cardIds) {
        const c = state.cards[cid];
        if (!c) continue;
        body.append(cardNode(c, c.imageUrl ? "" : "画像なし"));
      }
    }

    tierEl.append(head, body);
    board.append(tierEl);
  }

  mainBody.replaceChildren(board);
}

function renderApp() {
  const root = document.getElementById("app");
  if (!root) {
    console.error('No #app element found. Check index.html for <div id="app"></div>.');
    return;
  }

  if (!state) {
    root.textContent = "ルームを読み込み中...";
    return;
  }

  const { mainBody, mainTitle, changeNameBtn, addCardBtn, addTierBtn } = renderLayout(root, { onShare });

  // タイトル更新（空欄の場合はデフォルト値）
  mainTitle.textContent = state.listName || "Tier list";

  // ボタンイベント設定
  changeNameBtn.addEventListener("click", showChangeListNameModal);
  addCardBtn.addEventListener("click", showAddCardModal);
  addTierBtn.addEventListener("click", showAddTierModal);

  const toasts = mountToast();
  root.querySelector(".app").append(toasts);

  renderBoard(mainBody);
}

/**
 * 初期化とルーティング
 */
async function initApp() {
  // ルームIDを取得
  let roomId = getRoomId();

  if (!roomId) {
    // ルームIDがない場合は作成
    roomId = `room_${Math.random().toString(36).slice(2, 10)}`;
    setRoomId(roomId);
    return; // URL変更後、リロードされるのでここで終了
  }

  // ルームに接続
  const connected = await connectToRoom(roomId);
  if (!connected) {
    const root = document.getElementById("app");
    if (root) {
      root.textContent = "ルーム接続に失敗しました。ページをリロードしてください。";
    }
    return;
  }

  // 初回レンダリング
  renderApp();
}

// アプリを起動
initApp();

// ハッシュ変更時にリロード
window.addEventListener("hashchange", () => {
  location.reload();
});
