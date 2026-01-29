if (!import.meta.env.DEV) {
  // No debug UI in production builds.
} else {
  const toggleEl = document.createElement("div");
  toggleEl.id = "debugToggle";
  toggleEl.textContent = "DEBUG";
  toggleEl.style.position = "fixed";
  toggleEl.style.bottom = "10px";
  toggleEl.style.left = "10px";
  toggleEl.style.background = "rgba(0,0,0,0.8)";
  toggleEl.style.color = "#0f0";
  toggleEl.style.padding = "8px 12px";
  toggleEl.style.fontSize = "12px";
  toggleEl.style.zIndex = "99999";
  toggleEl.style.fontFamily = "'Courier New', monospace";
  toggleEl.style.borderRadius = "4px";
  toggleEl.style.border = "1px solid #0f0";
  toggleEl.style.cursor = "pointer";
  toggleEl.style.userSelect = "none";
  toggleEl.style.fontWeight = "bold";

  const debugEl = document.createElement("div");
  debugEl.id = "debug";
  debugEl.style.position = "fixed";
  debugEl.style.bottom = "50px";
  debugEl.style.left = "10px";
  debugEl.style.background = "rgba(0,0,0,0.9)";
  debugEl.style.color = "#0f0";
  debugEl.style.padding = "10px";
  debugEl.style.fontSize = "11px";
  debugEl.style.maxWidth = "350px";
  debugEl.style.maxHeight = "500px";
  debugEl.style.overflowY = "auto";
  debugEl.style.zIndex = "99998";
  debugEl.style.fontFamily = "'Courier New', monospace";
  debugEl.style.borderRadius = "4px";
  debugEl.style.border = "1px solid #0f0";
  debugEl.style.display = "none";

  document.body.append(toggleEl, debugEl);

  const logs = [];
  let debugVisible = false;

  toggleEl.addEventListener("click", () => {
    debugVisible = !debugVisible;
    debugEl.style.display = debugVisible ? "block" : "none";
    toggleEl.textContent = debugVisible ? "CLOSE" : "DEBUG";
  });

  const originalLog = console.log;
  const originalError = console.error;

  function safeStringify(value) {
    const seen = new WeakSet();
    try {
      return JSON.stringify(value, (_key, val) => {
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return "[Circular]";
          seen.add(val);
        }
        return val;
      });
    } catch {
      return "[Unserializable]";
    }
  }

  function formatArgs(args) {
    return args
      .map((a) => (typeof a === "object" ? safeStringify(a) : String(a)))
      .join(" ");
  }

  console.log = function (...args) {
    originalLog(...args);
    logs.unshift(formatArgs(args));
    if (logs.length > 30) logs.pop();
    debugEl.textContent = logs.join("\n");
  };

  console.error = function (...args) {
    originalError(...args);
    logs.unshift(`ERROR ${formatArgs(args)}`);
    if (logs.length > 30) logs.pop();
    debugEl.textContent = logs.join("\n");
  };

  console.log("[debug] enabled");
}
