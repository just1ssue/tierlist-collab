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

  const allParticipants = [currentUser, ...othersPresence].filter(Boolean);

  if (allParticipants.length === 0) {
    lpBody.append(el("div", "text-muted", "No participants"));
    return;
  }

  for (const participant of allParticipants) {
    const participantEl = el("div", "participant");

    const avatar = el("div", "participant__avatar");
    const initial = (participant.displayName?.[0] || "?").toUpperCase();
    avatar.textContent = initial;
    avatar.style.backgroundColor = hashColor(participant.userId);
    avatar.style.color = "white";
    avatar.style.width = "36px";
    avatar.style.height = "36px";
    avatar.style.borderRadius = "50%";
    avatar.style.display = "flex";
    avatar.style.alignItems = "center";
    avatar.style.justifyContent = "center";
    avatar.style.fontSize = "14px";
    avatar.style.fontWeight = "bold";

    const info = el("div", "participant__info");
    const name = el("div", "participant__name", participant.displayName || "Guest");
    name.style.fontSize = "13px";
    name.style.fontWeight = "500";
    info.append(name);

    if (participant.draggingCardId) {
      const status = el("div", "participant__status", `🎯 Dragging card`);
      status.style.fontSize = "12px";
      status.style.color = "#666";
      info.append(status);
    }

    participantEl.append(avatar, info);
    participantEl.style.display = "flex";
    participantEl.style.gap = "12px";
    participantEl.style.padding = "8px 0";
    participantEl.style.alignItems = "center";

    lpBody.append(participantEl);
  }
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

export function renderLayout(root, { onShare }) {
  const app = el("div", "app");

  const header = el("header", "header");
  const left = el("div", "header__left");
  left.append(el("div", "brand", "TierList Collab"));
  const right = el("div", "header__right");
  const shareBtn = el("button", "btn btn--primary");
  shareBtn.textContent = "Share URL";
  shareBtn.addEventListener("click", onShare);
  right.append(shareBtn);
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
    el("div", "", "いまはローカル動作（Phase1）です。"),
    el("div", "help", "次のPhaseでマルチ（Liveblocks/Yjs）を入れます。")
  );
  leftPanel.append(info);

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
  
  mainHead.append(headActions);
  mainPanel.append(mainHead);
  const mainBody = el("div", "panel__body");
  mainPanel.append(mainBody);

  shell.append(leftPanel, mainPanel);
  container.append(shell);

  app.append(header, container);
  root.replaceChildren(app);

  return { app, mainBody, mainTitle, changeNameBtn, addCardBtn, addTierBtn, lpBody };
}
