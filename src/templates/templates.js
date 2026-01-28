import odenAtsuage from "../assets/templates/food_oden_atsuage.png";
import odenChikuwa from "../assets/templates/food_oden_chikuwa.png";
import odenChikuwabu from "../assets/templates/food_oden_chikuwabu.png";
import odenDaikon from "../assets/templates/food_oden_daikon.png";
import odenGanmodoki from "../assets/templates/food_oden_ganmodoki.png";
import odenGyuusuji from "../assets/templates/food_oden_gyuusuji.png";
import odenHanpen from "../assets/templates/food_oden_hanpen.png";
import odenKonnyaku from "../assets/templates/food_oden_konnyaku.png";
import odenMochikinchaku from "../assets/templates/food_oden_mochikinchaku.png";
import odenSatsumaage from "../assets/templates/food_oden_satsumaage.png";
import odenShirataki from "../assets/templates/food_oden_shirataki.png";
import odenTamago from "../assets/templates/food_oden_tamago.png";

const templates = [
  {
    id: "oden",
    label: "おでん",
    listName: "おでん Tier",
    tiers: [
      { id: "t_backlog", name: "Backlog", cards: [] },
      {
        id: "t_oden_s",
        name: "S",
        cards: [
          { id: "c_oden_daikon", title: "大根", imageUrl: odenDaikon },
          { id: "c_oden_tamago", title: "たまご", imageUrl: odenTamago },
          { id: "c_oden_konnyaku", title: "こんにゃく", imageUrl: odenKonnyaku },
          { id: "c_oden_atsuage", title: "厚揚げ", imageUrl: odenAtsuage },
          { id: "c_oden_chikuwa", title: "ちくわ", imageUrl: odenChikuwa },
          { id: "c_oden_chikuwabu", title: "ちくわぶ", imageUrl: odenChikuwabu },
          { id: "c_oden_ganmodoki", title: "がんもどき", imageUrl: odenGanmodoki },
          { id: "c_oden_gyuusuji", title: "牛すじ", imageUrl: odenGyuusuji },
          { id: "c_oden_hanpen", title: "はんぺん", imageUrl: odenHanpen },
          { id: "c_oden_mochikinchaku", title: "餅巾着", imageUrl: odenMochikinchaku },
          { id: "c_oden_satsumaage", title: "さつま揚げ", imageUrl: odenSatsumaage },
          { id: "c_oden_shirataki", title: "しらたき", imageUrl: odenShirataki },
        ],
      },
      {
        id: "t_oden_a",
        name: "A",
        cards: [],
      },
    ],
  },
  {
    id: "yakitori",
    label: "yakitori",
    listName: "yakitori Tier",
    tiers: [
      { id: "t_backlog", name: "Backlog", cards: [] },
      {
        id: "t_yakitori_s",
        name: "S",
        cards: [
          { id: "c_yakitori_tsukune", title: "Tsukune", imageUrl: "" },
          { id: "c_yakitori_negima", title: "Negima", imageUrl: "" },
        ],
      },
      {
        id: "t_yakitori_a",
        name: "A",
        cards: [
          { id: "c_yakitori_momo", title: "Momo", imageUrl: "" },
        ],
      },
    ],
  },
  {
    id: "wagashi",
    label: "wagashi",
    listName: "wagashi Tier",
    tiers: [
      { id: "t_backlog", name: "Backlog", cards: [] },
      {
        id: "t_wagashi_s",
        name: "S",
        cards: [
          { id: "c_wagashi_taiyaki", title: "Taiyaki", imageUrl: "" },
          { id: "c_wagashi_ichigodaifuku", title: "Ichigo daifuku", imageUrl: "" },
        ],
      },
      {
        id: "t_wagashi_a",
        name: "A",
        cards: [
          { id: "c_wagashi_chagashi", title: "Chagashi", imageUrl: "" },
        ],
      },
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
    tiers: [{ id: "t_backlog", name: "Backlog", cardIds: [] }],
    cards: {},
  };
}
