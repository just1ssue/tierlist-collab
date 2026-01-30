import titleLogo from "../assets/title.png";
import goodIcon from "../assets/good.png";
import badIcon from "../assets/bad.png";

export function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

export function mountToast() {
  const toasts = el("div", "toasts");
  const toast = (type, msg) => {
    const t = el("div", `toast toast--${type}`);
    t.textContent = msg;
    toasts.append(t);
    setTimeout(() => t.remove(), 2800);
  };
  window.__toast = {
    success: (m) => toast("success", m),
    error: (m) => toast("error", m),
  };
  return toasts;
}

export function renderParticipants(lpBody, currentUser, othersPresence) {
  // 参加者リストをクリア
  lpBody.innerHTML = "";

  // currentUser と othersPresence を統一したフォーマットに
  const allParticipants = [
    currentUser,
    ...othersPresence.map(other => other.user || other) // user プロパティがあれば展開
  ].filter(Boolean);

  if (allParticipants.length === 0) {
    lpBody.append(el("div", "text-muted", "No participants"));
    return;
  }

  for (const participant of allParticipants) {
    const participantEl = el("div", "participant");

    const avatar = el("div", "participant__avatar");
    const initial = (participant.displayName?.[0] || "?").toUpperCase();
    avatar.textContent = initial;
    
    // userId が存在することを確認
    if (!participant.userId) {
      console.warn("[render] participant missing userId:", participant);
      continue;
    }
    
    avatar.style.backgroundColor = hashColor(participant.userId);

    const info = el("div", "participant__info");
    const name = el("div", "participant__name", participant.displayName || "Guest");
    info.append(name);

    if (participant.draggingCardId) {
      const status = el("div", "participant__status", `🎯 Dragging card`);
      info.append(status);
    }

    participantEl.append(avatar, info);
    lpBody.append(participantEl);
  }
}

export function renderTemplateButtons(container, templates, onApply, onReset) {
  container.innerHTML = "";

  const grid = el("div", "template-grid");
  templates.forEach((template) => {
    const btn = el("button", "btn btn--secondary btn--template", template.label);
    btn.type = "button";
    btn.addEventListener("click", () => onApply(template.id));
    grid.append(btn);
  });

  const resetBtn = el("button", "btn btn--ghost btn--template template-reset", "Reset");
  resetBtn.type = "button";
  resetBtn.addEventListener("click", onReset);

  container.append(grid, resetBtn);
  return { resetBtn };
}

export function renderLobby(root) {
  const app = el("div", "app");

  const header = el("header", "header");
  const left = el("div", "header__left");
  const brand = el("div", "brand");
  const brandImg = document.createElement("img");
  brandImg.className = "brand__img";
  brandImg.src = titleLogo;
  brandImg.alt = "TierList Collab";
  brand.append(brandImg);
  left.append(brand);
  header.append(left);

  const container = el("div", "container");
  const lobby = el("div", "lobby");
  const panel = el("div", "panel lobby__panel");

  const head = el("div", "panel__head", "Welcome");
  const body = el("div", "panel__body");
  body.append(el("div", "lobby__title", "ルームを作成 / 参加"));
  body.append(el("div", "help", "サーバ側の存在チェックは行いません。入力IDが新規作成になる場合があります。"));

  const createBtn = el("button", "btn btn--primary lobby__btn", "ルームを作成");

  const divider = el("div", "lobby__divider", "または");

  const joinWrap = el("div", "lobby__join");
  const input = document.createElement("input");
  input.className = "input";
  input.placeholder = "room_abc12345";
  joinWrap.append(input);

  const joinBtn = el("button", "btn btn--secondary lobby__btn", "ルームに参加");
  joinWrap.append(joinBtn);

  body.append(createBtn, divider, joinWrap);
  panel.append(head, body);
  lobby.append(panel);
  container.append(lobby);

  app.append(header, container);
  root.replaceChildren(app);

  return { createBtn, joinBtn, input };
}

function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export function renderLayout(root, { onShare, onShareRoomId }) {
  const app = el("div", "app");

  const header = el("header", "header");
  const left = el("div", "header__left");
  const brand = el("div", "brand");
  const brandImg = document.createElement("img");
  brandImg.className = "brand__img";
  brandImg.src = titleLogo;
  brandImg.alt = "TierList Collab";
  brand.append(brandImg);
  left.append(brand);
  const right = el("div", "header__right");
  const shareBtn = el("button", "btn btn--primary");
  shareBtn.textContent = "Share URL";
  shareBtn.addEventListener("click", onShare);
  const shareRoomBtn = el("button", "btn btn--secondary");
  shareRoomBtn.textContent = "Share Room ID";
  shareRoomBtn.addEventListener("click", onShareRoomId);
  right.append(shareBtn, shareRoomBtn);
  header.append(left, right);

  const container = el("div", "container");
  const shell = el("div", "shell");

  const leftPanel = el("aside", "panel");
  leftPanel.append(el("div", "panel__head", "Participants"));
  const lpBody = el("div", "panel__body");
  lpBody.append(el("div", "", "Guest-local"));
  leftPanel.append(lpBody);
  leftPanel.append(el("div", "panel__head", "Room Info"));
  const info = el("div", "panel__body");
  info.append(
    el("div", "", "現在機能拡張中 Phase3。"),
    el("div", "help", "悪意に対応したいです")
  );
  leftPanel.append(info);
  leftPanel.append(el("div", "panel__head", "Templates"));
  const templatesBody = el("div", "panel__body");
  leftPanel.append(templatesBody);

  const mainPanel = el("main", "panel");
  const mainHead = el("div", "panel__head");
  mainHead.style.display = "flex";
  mainHead.style.justifyContent = "space-between";
  mainHead.style.alignItems = "center";
  const mainTitle = el("div", "");
  mainHead.append(mainTitle);
  
  const headActions = el("div");
  headActions.style.display = "flex";
  headActions.style.gap = "8px";
  
  const changeNameBtn = el("button", "btn btn--secondary");
  changeNameBtn.textContent = "Name Change";
  changeNameBtn.style.fontSize = "13px";
  changeNameBtn.style.padding = "6px 12px";
  headActions.append(changeNameBtn);
  
  const addTierBtn = el("button", "btn btn--secondary");
  addTierBtn.textContent = "Add Tier";
  addTierBtn.style.fontSize = "13px";
  addTierBtn.style.padding = "6px 12px";
  headActions.append(addTierBtn);
  
  const addCardBtn = el("button", "btn btn--secondary");
  addCardBtn.textContent = "Add Card";
  addCardBtn.style.fontSize = "13px";
  addCardBtn.style.padding = "6px 12px";
  headActions.append(addCardBtn);

  const exportBtn = el("button", "btn btn--secondary");
  exportBtn.textContent = "Export PNG";
  exportBtn.style.fontSize = "13px";
  exportBtn.style.padding = "6px 12px";
  headActions.append(exportBtn);
  
  mainHead.append(headActions);
  mainPanel.append(mainHead);
  const mainBody = el("div", "panel__body");
  mainPanel.append(mainBody);

  const rightPanel = el("aside", "panel vote-panel");
  rightPanel.append(el("div", "panel__head", "VOTE"));
  const voteBody = el("div", "panel__body vote-panel__body");
  const voteSlot = el("div", "vote-slot");
  const voteImg = document.createElement("img");
  voteImg.className = "vote-slot__img";
  voteImg.alt = "";
  voteImg.referrerPolicy = "no-referrer";
  voteImg.loading = "lazy";
  voteImg.decoding = "async";
  voteImg.draggable = false;
  voteSlot.append(voteImg);
  const voteTitle = el("div", "vote-slot__title", "No card");

  const voteButtons = el("div", "vote-buttons");
  const goodBtn = el("button", "vote-btn");
  const goodImg = document.createElement("img");
  goodImg.src = goodIcon;
  goodImg.alt = "Good";
  goodBtn.append(goodImg);
  const goodCount = el("div", "vote-count", "0");

  const badBtn = el("button", "vote-btn");
  const badImg = document.createElement("img");
  badImg.src = badIcon;
  badImg.alt = "Bad";
  badBtn.append(badImg);
  const badCount = el("div", "vote-count", "0");

  const goodWrap = el("div", "vote-group");
  goodWrap.append(goodBtn, goodCount);
  const badWrap = el("div", "vote-group");
  badWrap.append(badBtn, badCount);
  voteButtons.append(goodWrap, badWrap);

  voteBody.append(voteSlot, voteTitle, voteButtons);
  rightPanel.append(voteBody);

  shell.append(leftPanel, mainPanel, rightPanel);
  container.append(shell);

  app.append(header, container);
  root.replaceChildren(app);

  return {
    app,
    mainBody,
    mainTitle,
    changeNameBtn,
    addCardBtn,
    addTierBtn,
    exportBtn,
    lpBody,
    templatesBody,
    voteSlot,
    voteImg,
    voteTitle,
    goodBtn,
    badBtn,
    goodCount,
    badCount,
  };
}
