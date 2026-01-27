import "./styles/app.css";

import { loadState, saveState } from "./state/store.js";
import { addCard, moveCard } from "./state/actions.js";
import { el, mountToast, renderLayout } from "./ui/render.js";

let state = loadState();

function onShare() {
  navigator.clipboard.writeText(location.href)
    .then(() => window.__toast?.success("コピーしました"))
    .catch(() => window.__toast?.error("コピーに失敗しました"));
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

function renderBoard(mainBody) {
  const board = el("div", "board");

  for (const tier of state.tiers) {
    const tierEl = el("section", "tier");
    tierEl.dataset.tierId = tier.id;

    const head = el("div", "tier__head");
    head.append(el("div", "tier__name", tier.name));
    const actions = el("div", "tier__actions");
    actions.append(el("div", "help", "DnDで移動できます"));
    head.append(actions);

    const body = el("div", "tier__body");

    // Drop handlers
    body.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    body.addEventListener("drop", (e) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData("text/plain");
      if (!cardId) return;

      // どのTierから来たか探す
      const fromTier = state.tiers.find(t => t.cardIds.includes(cardId));
      const toTierId = tier.id;
      if (!fromTier) return;

      moveCard(state, {
        cardId,
        fromTierId: fromTier.id,
        toTierId,
        toIndex: tier.cardIds.length, // とりあえず末尾へ（最小実装）
      });
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

  rightBody.replaceChildren(titleField, urlField, err, addBtn);
}

function renderApp() {
  const root = document.getElementById("app");
  const { mainBody, rightBody } = renderLayout(root, { onShare });
  const toasts = mountToast();
  root.querySelector(".app").append(toasts);

  renderBoard(mainBody);
  renderAddForm(rightBody);
}

renderApp();
