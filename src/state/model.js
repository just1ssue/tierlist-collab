export function createInitialState() {
  const now = Date.now();
  const c1 = { id: "c1", title: "例: カード", imageUrl: null, createdAt: now };
  const c2 = { id: "c2", title: "画像つき", imageUrl: "https://picsum.photos/400/300", createdAt: now + 1 };

  return {
    cards: { [c1.id]: c1, [c2.id]: c2 },
    tiers: [
      { id: "t_backlog", name: "Backlog", cardIds: ["c1"] },
      { id: "t_s", name: "S", cardIds: ["c2"] },
      { id: "t_a", name: "A", cardIds: [] },
      { id: "t_b", name: "B", cardIds: [] },
    ],
  };
}

export function newId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizeImageUrl(url) {
  const u = (url ?? "").trim();
  if (!u) return null;
  if (!/^https?:\/\/.+/i.test(u)) return null;
  return u;
}

