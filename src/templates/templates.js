const imageModules = import.meta.glob("../assets/templates/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const imagesByName = Object.fromEntries(
  Object.entries(imageModules).map(([path, url]) => {
    const name = path.split("/").pop().replace(/\.(png|jpe?g|webp)$/i, "");
    return [name, url];
  })
);

function img(name) {
  const url = imagesByName[name];
  if (!url) {
    console.warn(`[templates] Missing image: ${name}`);
    return null;
  }
  return url;
}

const templates = [
  {
    id: "oden",
    label: "おでん",
    listName: "おでん TierList",
    tiers: [
      { id: "t_oden_s", name: "Tier1", cards: []},
      { id: "t_oden_a", name: "Tier2", cards: [] },
      { id: "t_vote", name: "VOTE", cards: [] },
      { id: "t_backlog", name: "Backlog", cards: [
        { id: "c_oden_daikon", title: "大根", imageUrl: img("food_oden_daikon") },
        { id: "c_oden_tamago", title: "玉子", imageUrl: img("food_oden_tamago") },
        { id: "c_oden_konnyaku", title: "こんにゃく", imageUrl: img("food_oden_konnyaku") },
        { id: "c_oden_atsuage", title: "厚揚げ", imageUrl: img("food_oden_atsuage") },
        { id: "c_oden_chikuwa", title: "ちくわ", imageUrl: img("food_oden_chikuwa") },
        { id: "c_oden_chikuwabu", title: "ちくわぶ", imageUrl: img("food_oden_chikuwabu") },
        { id: "c_oden_ganmodoki", title: "がんもどき", imageUrl: img("food_oden_ganmodoki") },
        { id: "c_oden_gyuusuji", title: "牛すじ", imageUrl: img("food_oden_gyuusuji") },
        { id: "c_oden_hanpen", title: "はんぺん", imageUrl: img("food_oden_hanpen") },
        { id: "c_oden_mochikinchaku", title: "もちきんちゃく", imageUrl: img("food_oden_mochikinchaku") },
        { id: "c_oden_satsumaage", title: "さつま揚げ", imageUrl: img("food_oden_satsumaage") },
        { id: "c_oden_shirataki", title: "しらたき", imageUrl: img("food_oden_shirataki") },
        { id: "c_oden_tako", title: "たこ", imageUrl: img("food_oden_tako") },
        { id: "c_oden_uinnna-", title: "ウインナー", imageUrl: img("food_oden_uinnna-") },
        { id: "c_oden_jagaimo", title: "じゃがいも", imageUrl: img("food_oden_jagaimo") },
        { id: "c_oden_tamagoyaki", title: "たまごやき", imageUrl: img("food_oden_tamagoyaki") },
      ] },
    ],
  },
  {
    id: "yakitori",
    label: "yakitori",
    listName: "yakitori Tier",
    tiers: [
      { id: "t_yakitori_s", name: "S", cards: [
        { id: "c_yakitori_tsukune", title: "Tsukune", imageUrl: "" },
        { id: "c_yakitori_negima", title: "Negima", imageUrl: "" },
      ]},
      { id: "t_yakitori_a", name: "A", cards: [
        { id: "c_yakitori_momo", title: "Momo", imageUrl: "" },
      ]},
      { id: "t_vote", name: "VOTE", cards: [] },
      { id: "t_backlog", name: "Backlog", cards: [] },
    ],
  },
  {
    id: "wagashi",
    label: "wagashi",
    listName: "wagashi Tier",
    tiers: [
      { id: "t_wagashi_s", name: "S", cards: [
        { id: "c_wagashi_taiyaki", title: "Taiyaki", imageUrl: "" },
        { id: "c_wagashi_ichigodaifuku", title: "Ichigo daifuku", imageUrl: "" },
      ]},
      { id: "t_wagashi_a", name: "A", cards: [
        { id: "c_wagashi_chagashi", title: "Chagashi", imageUrl: "" },
      ]},
      { id: "t_vote", name: "VOTE", cards: [] },
      { id: "t_backlog", name: "Backlog", cards: [] },
    ],
  },
];

function buildState(template) {
  const cards = {};
  const tiers = template.tiers.map((tier) => {
    const cardIds = [];
    tier.cards.forEach((card) => {
      cards[card.id] = {
        id: card.id,
        title: card.title,
        imageUrl: card.imageUrl || null,
      };
      cardIds.push(card.id);
    });
    return {
      id: tier.id,
      name: tier.name,
      cardIds,
    };
  });

  return {
    listName: template.listName || template.label || "Tier list",
    tiers,
    cards,
    voteCardId: null,
    voteSessionId: null,
  };
}

export function getTemplates() {
  return templates.map((t) => ({ id: t.id, label: t.label }));
}

export function getTemplateState(templateId) {
  const template = templates.find((t) => t.id === templateId);
  if (!template) return null;
  return buildState(template);
}

export function getResetState() {
  return {
    listName: "Tier list",
    tiers: [
      { id: "t_vote", name: "VOTE", cardIds: [] },
      { id: "t_backlog", name: "Backlog", cardIds: [] },
    ],
    cards: {},
    voteCardId: null,
    voteSessionId: null,
  };
}
