import "./styles/app.css";

import { loadState, saveState } from "./state/store.js";
import { addCard, moveCard, addTier, renameTier, deleteTier, moveTierUp, moveTierDown } from "./state/actions.js";
import { el, mountToast, renderLayout } from "./ui/render.js";

let state = loadState();

function onShare() {
  navigator.clipboard
    .writeText(location.href)
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
  });

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
    cardEl.append(img);
  }

  const body = el("div", "card__body");
  body.append(el("div", "card__title", card.title));
  body.append(el("div", "card__meta", metaText));
  cardEl.append(body);

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
      const res = addTier(state, { name: input.value });
      if (res.error) {
        err.textContent = res.error;
        window.__toast?.error(res.error);
        return false; // 閉じない
      }
      saveState(state);
      window.__toast?.success("Tierを追加しました");
      renderApp();
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
      const res = renameTier(state, { tierId: tier.id, name: input.value });
      if (res.error) {
        err.textContent = res.error;
        window.__toast?.error(res.error);
        return false;
      }
      saveState(state);
      window.__toast?.success("Tier名を更新しました");
      renderApp();
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
      const res = deleteTier(state, { tierId: tier.id });
      if (res.error) {
        window.__toast?.error(res.error);
        return false;
      }
      saveState(state);
      window.__toast?.success("Tierを削除しました（カードはBacklogへ移動）");
      renderApp();
      return true;
    },
    secondaryText: "Cancel",
  });
}

function renderBoard(mainBody) {
  const board = el("div", "board");

  // Board上部に「Add Tier」ボタン（CSS追加なしで置く）
  const toolbar = el("div");
  toolbar.style.display = "flex";
  toolbar.style.justifyContent = "flex-end";
  toolbar.style.marginBottom = "12px";
  const addTierBtn = el("button", "btn btn--secondary");
  addTierBtn.textContent = "Add Tier";
  addTierBtn.addEventListener("click", showAddTierModal);
  toolbar.append(addTierBtn);
  board.append(toolbar);

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
        const res = moveTierUp(state, { tierId: tier.id });
        if (res.error) {
          window.__toast?.error(res.error);
          return;
        }
        saveState(state);
        window.__toast?.success("Tierを移動しました");
        renderApp();
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
        const res = moveTierDown(state, { tierId: tier.id });
        if (res.error) {
          window.__toast?.error(res.error);
          return;
        }
        saveState(state);
        window.__toast?.success("Tierを移動しました");
        renderApp();
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

      moveCard(state, { cardId, fromTierId, toTierId, toIndex });
      saveState(state);
      renderApp();
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

function renderAddForm(rightBody) {
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
  const addBtn = el("button", "btn btn--secondary");
  addBtn.textContent = "Add Card";

  addBtn.addEventListener("click", () => {
    err.textContent = "";
    const res = addCard(state, { title: titleInput.value, imageUrl: urlInput.value });
    if (res.error) {
      err.textContent = res.error;
      window.__toast?.error(res.error);
      return;
    }
    saveState(state);
    titleInput.value = "";
    urlInput.value = "";
    window.__toast?.success("カードを追加しました");
    renderApp();
  });

  titleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addBtn.click();
  });
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addBtn.click();
  });

  rightBody.replaceChildren(titleField, urlField, err, addBtn);
}

function renderApp() {
  const root = document.getElementById("app");
  if (!root) {
    console.error('No #app element found. Check index.html for <div id="app"></div>.');
    return;
  }

  const { mainBody, rightBody } = renderLayout(root, { onShare });

  const toasts = mountToast();
  root.querySelector(".app").append(toasts);

  renderBoard(mainBody);
  renderAddForm(rightBody);
}

renderApp();
