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
  mainPanel.append(el("div", "panel__head", "Tier Board"));
  const mainBody = el("div", "panel__body");
  mainPanel.append(mainBody);

  const rightPanel = el("aside", "panel");
  rightPanel.append(el("div", "panel__head", "Add Card"));
  const rightBody = el("div", "panel__body");
  rightPanel.append(rightBody);

  shell.append(leftPanel, mainPanel, rightPanel);
  container.append(shell);

  app.append(header, container);
  root.replaceChildren(app);

  return { app, mainBody, rightBody };
}
