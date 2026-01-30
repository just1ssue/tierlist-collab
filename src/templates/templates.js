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
    label: "やきとり",
    listName: "やきとり TierList",
    tiers: [
      { id: "t_yakitori_s", name: "Tier1", cards: [] },
      { id: "t_yakitori_a", name: "Tier2", cards: [] },
      { id: "t_vote", name: "VOTE", cards: [] },
      { id: "t_backlog", name: "Backlog", cards: [
        { id: "c_yakitori_tsukune", title: "つくね", imageUrl: "" },
        { id: "c_yakitori_negima", title: "ねぎま", imageUrl: "" },
        { id: "c_yakitori_momo", title: "もも", imageUrl: "" },
        { id: "c_yakitori_shishitou", title: "ししとう", imageUrl: "" },
        { id: "c_yakitori_shiitake", title: "しいたけ", imageUrl: "" },
        { id: "c_yakitori_kokoro", title: "こころ", imageUrl: "" },
        { id: "c_yakitori_seseri", title: "せせり", imageUrl: "" },
        { id: "c_yakitori_reba", title: "レバー", imageUrl: "" },
        { id: "c_yakitori_kawa", title: "かわ", imageUrl: "" },
        { id: "c_yakitori_sasami", title: "ささみ", imageUrl: "" },
        { id: "c_yakitori_bonjiri", title: "ぼんじり", imageUrl: "" },
        { id: "c_yakitori_sunagimo", title: "砂ぎも", imageUrl: "" },
        { id: "c_yakitori_mune", title: "むね", imageUrl: "" },
        { id: "c_yakitori_tebasaki", title: "手羽先", imageUrl: "" },
        { id: "c_yakitori_yagen_nankotsu", title: "やげんなんこつ", imageUrl: "" },
        { id: "c_yakitori_nankotsu", title: "なんこつ", imageUrl: "" },
        { id: "c_yakitori_butabara", title: "豚バラ", imageUrl: "" },
        { id: "c_yakitori_negi", title: "ねぎ", imageUrl: "" },
      ] },
    ],
  },
  {
    id: "lolng",
    label: "LoL",
    listName: "LoL許せないやつ TierList",
    tiers: [
      { id: "t_lolng_1", name: "最悪", cards: [] },
      { id: "t_lolng_2", name: "犯罪", cards: [] },
      { id: "t_lolng_3", name: "インチキ", cards: [] },
      { id: "t_lolng_4", name: "グレーライン", cards: [] },
      { id: "t_lolng_5", name: "無罪", cards: [] },
      { id: "t_vote", name: "VOTE", cards: [] },
      { id: "t_backlog", name: "Backlog", cards: [
        { id: "c_lolng_001", title: "アイバーン", imageUrl: "" },
        { id: "c_lolng_002", title: "アカリ", imageUrl: "" },
        { id: "c_lolng_003", title: "アクシャン", imageUrl: "" },
        { id: "c_lolng_004", title: "アジール", imageUrl: "" },
        { id: "c_lolng_005", title: "アッシュ", imageUrl: "" },
        { id: "c_lolng_006", title: "アニビア", imageUrl: "" },
        { id: "c_lolng_007", title: "アニー", imageUrl: "" },
        { id: "c_lolng_008", title: "アフェリオス", imageUrl: "" },
        { id: "c_lolng_009", title: "アムム", imageUrl: "" },
        { id: "c_lolng_010", title: "アリスター", imageUrl: "" },
        { id: "c_lolng_011", title: "アンベッサ", imageUrl: "" },
        { id: "c_lolng_012", title: "アーゴット", imageUrl: "" },
        { id: "c_lolng_013", title: "アーリ", imageUrl: "" },
        { id: "c_lolng_014", title: "イブリン", imageUrl: "" },
        { id: "c_lolng_015", title: "イラオイ", imageUrl: "" },
        { id: "c_lolng_016", title: "イレリア", imageUrl: "" },
        { id: "c_lolng_017", title: "ウディア", imageUrl: "" },
        { id: "c_lolng_018", title: "ウーコン", imageUrl: "" },
        { id: "c_lolng_019", title: "エイトロックス", imageUrl: "" },
        { id: "c_lolng_020", title: "エコー", imageUrl: "" },
        { id: "c_lolng_021", title: "エズリアル", imageUrl: "" },
        { id: "c_lolng_022", title: "エリス", imageUrl: "" },
        { id: "c_lolng_023", title: "オラフ", imageUrl: "" },
        { id: "c_lolng_024", title: "オリアナ", imageUrl: "" },
        { id: "c_lolng_025", title: "オレリオン・ソル", imageUrl: "" },
        { id: "c_lolng_026", title: "オーロラ", imageUrl: "" },
        { id: "c_lolng_027", title: "オーン", imageUrl: "" },
        { id: "c_lolng_028", title: "カイ＝サ", imageUrl: "" },
        { id: "c_lolng_029", title: "カサディン", imageUrl: "" },
        { id: "c_lolng_030", title: "カシオペア", imageUrl: "" },
        { id: "c_lolng_031", title: "カタリナ", imageUrl: "" },
        { id: "c_lolng_032", title: "カミール", imageUrl: "" },
        { id: "c_lolng_033", title: "カリスタ", imageUrl: "" },
        { id: "c_lolng_034", title: "カルマ", imageUrl: "" },
        { id: "c_lolng_035", title: "カ・サンテ", imageUrl: "" },
        { id: "c_lolng_036", title: "カーサス", imageUrl: "" },
        { id: "c_lolng_037", title: "カ＝ジックス", imageUrl: "" },
        { id: "c_lolng_038", title: "ガリオ", imageUrl: "" },
        { id: "c_lolng_039", title: "ガレン", imageUrl: "" },
        { id: "c_lolng_040", title: "ガングプランク", imageUrl: "" },
        { id: "c_lolng_041", title: "キヤナ", imageUrl: "" },
        { id: "c_lolng_042", title: "キンドレッド", imageUrl: "" },
        { id: "c_lolng_043", title: "クイン", imageUrl: "" },
        { id: "c_lolng_044", title: "クレッド", imageUrl: "" },
        { id: "c_lolng_045", title: "グウェン", imageUrl: "" },
        { id: "c_lolng_046", title: "グラガス", imageUrl: "" },
        { id: "c_lolng_047", title: "グレイブス", imageUrl: "" },
        { id: "c_lolng_048", title: "ケイトリン", imageUrl: "" },
        { id: "c_lolng_049", title: "ケイル", imageUrl: "" },
        { id: "c_lolng_050", title: "ケイン", imageUrl: "" },
        { id: "c_lolng_051", title: "ケネン", imageUrl: "" },
        { id: "c_lolng_052", title: "コグ＝マウ", imageUrl: "" },
        { id: "c_lolng_053", title: "コーキ", imageUrl: "" },
        { id: "c_lolng_054", title: "サイオン", imageUrl: "" },
        { id: "c_lolng_055", title: "サイラス", imageUrl: "" },
        { id: "c_lolng_056", title: "サミーラ", imageUrl: "" },
        { id: "c_lolng_057", title: "ザイラ", imageUrl: "" },
        { id: "c_lolng_058", title: "ザック", imageUrl: "" },
        { id: "c_lolng_059", title: "ザヤ", imageUrl: "" },
        { id: "c_lolng_060", title: "ザーヘン", imageUrl: "" },
        { id: "c_lolng_061", title: "シェン", imageUrl: "" },
        { id: "c_lolng_062", title: "シャコ", imageUrl: "" },
        { id: "c_lolng_063", title: "シンジド", imageUrl: "" },
        { id: "c_lolng_064", title: "シンドラ", imageUrl: "" },
        { id: "c_lolng_065", title: "シン・ジャオ", imageUrl: "" },
        { id: "c_lolng_066", title: "シヴァーナ", imageUrl: "" },
        { id: "c_lolng_067", title: "シヴィア", imageUrl: "" },
        { id: "c_lolng_068", title: "ジェイス", imageUrl: "" },
        { id: "c_lolng_069", title: "ジグス", imageUrl: "" },
        { id: "c_lolng_070", title: "ジャックス", imageUrl: "" },
        { id: "c_lolng_071", title: "ジャンナ", imageUrl: "" },
        { id: "c_lolng_072", title: "ジャーヴァンⅣ", imageUrl: "" },
        { id: "c_lolng_073", title: "ジリアン", imageUrl: "" },
        { id: "c_lolng_074", title: "ジン", imageUrl: "" },
        { id: "c_lolng_075", title: "ジンクス", imageUrl: "" },
        { id: "c_lolng_076", title: "スウェイン", imageUrl: "" },
        { id: "c_lolng_077", title: "スカーナー", imageUrl: "" },
        { id: "c_lolng_078", title: "スモルダー", imageUrl: "" },
        { id: "c_lolng_079", title: "スレッシュ", imageUrl: "" },
        { id: "c_lolng_080", title: "セジュアニ", imageUrl: "" },
        { id: "c_lolng_081", title: "セト", imageUrl: "" },
        { id: "c_lolng_082", title: "セナ", imageUrl: "" },
        { id: "c_lolng_083", title: "セラフィーン", imageUrl: "" },
        { id: "c_lolng_084", title: "ゼド", imageUrl: "" },
        { id: "c_lolng_085", title: "ゼラス", imageUrl: "" },
        { id: "c_lolng_086", title: "ゼリ", imageUrl: "" },
        { id: "c_lolng_087", title: "ソナ", imageUrl: "" },
        { id: "c_lolng_088", title: "ソラカ", imageUrl: "" },
        { id: "c_lolng_089", title: "ゾーイ", imageUrl: "" },
        { id: "c_lolng_090", title: "タム・ケンチ", imageUrl: "" },
        { id: "c_lolng_091", title: "タリック", imageUrl: "" },
        { id: "c_lolng_092", title: "タリヤ", imageUrl: "" },
        { id: "c_lolng_093", title: "タロン", imageUrl: "" },
        { id: "c_lolng_094", title: "ダイアナ", imageUrl: "" },
        { id: "c_lolng_095", title: "ダリウス", imageUrl: "" },
        { id: "c_lolng_096", title: "チョ＝ガス", imageUrl: "" },
        { id: "c_lolng_097", title: "ツイステッド・フェイト", imageUrl: "" },
        { id: "c_lolng_098", title: "ティーモ", imageUrl: "" },
        { id: "c_lolng_099", title: "トゥイッチ", imageUrl: "" },
        { id: "c_lolng_100", title: "トランドル", imageUrl: "" },
        { id: "c_lolng_101", title: "トリスターナ", imageUrl: "" },
        { id: "c_lolng_102", title: "トリンダメア", imageUrl: "" },
        { id: "c_lolng_103", title: "ドクター・ムンド", imageUrl: "" },
        { id: "c_lolng_104", title: "ドレイヴン", imageUrl: "" },
        { id: "c_lolng_105", title: "ナサス", imageUrl: "" },
        { id: "c_lolng_106", title: "ナフィーリ", imageUrl: "" },
        { id: "c_lolng_107", title: "ナミ", imageUrl: "" },
        { id: "c_lolng_108", title: "ナー", imageUrl: "" },
        { id: "c_lolng_109", title: "ニダリー", imageUrl: "" },
        { id: "c_lolng_110", title: "ニーコ", imageUrl: "" },
        { id: "c_lolng_111", title: "ニーラ", imageUrl: "" },
        { id: "c_lolng_112", title: "ヌヌ＆ウィルンプ", imageUrl: "" },
        { id: "c_lolng_113", title: "ノクターン", imageUrl: "" },
        { id: "c_lolng_114", title: "ノーチラス", imageUrl: "" },
        { id: "c_lolng_115", title: "ハイマーディンガー", imageUrl: "" },
        { id: "c_lolng_116", title: "バード", imageUrl: "" },
        { id: "c_lolng_117", title: "パイク", imageUrl: "" },
        { id: "c_lolng_118", title: "パンテオン", imageUrl: "" },
        { id: "c_lolng_119", title: "ビクター", imageUrl: "" },
        { id: "c_lolng_120", title: "フィオラ", imageUrl: "" },
        { id: "c_lolng_121", title: "フィズ", imageUrl: "" },
        { id: "c_lolng_122", title: "フィドルスティックス", imageUrl: "" },
        { id: "c_lolng_123", title: "フェイ", imageUrl: "" },
        { id: "c_lolng_124", title: "ブライアー", imageUrl: "" },
        { id: "c_lolng_125", title: "ブラウム", imageUrl: "" },
        { id: "c_lolng_126", title: "ブラッドミア", imageUrl: "" },
        { id: "c_lolng_127", title: "ブランド", imageUrl: "" },
        { id: "c_lolng_128", title: "ブリッツクランク", imageUrl: "" },
        { id: "c_lolng_129", title: "ヘカリム", imageUrl: "" },
        { id: "c_lolng_130", title: "ベイガー", imageUrl: "" },
        { id: "c_lolng_131", title: "ベル＝ヴェス", imageUrl: "" },
        { id: "c_lolng_132", title: "ボリベア", imageUrl: "" },
        { id: "c_lolng_133", title: "ポッピー", imageUrl: "" },
        { id: "c_lolng_134", title: "マオカイ", imageUrl: "" },
        { id: "c_lolng_135", title: "マスター・イー", imageUrl: "" },
        { id: "c_lolng_136", title: "マルザハール", imageUrl: "" },
        { id: "c_lolng_137", title: "マルファイト", imageUrl: "" },
        { id: "c_lolng_138", title: "ミス・フォーチュン", imageUrl: "" },
        { id: "c_lolng_139", title: "ミリオ", imageUrl: "" },
        { id: "c_lolng_140", title: "メル", imageUrl: "" },
        { id: "c_lolng_141", title: "モルガナ", imageUrl: "" },
        { id: "c_lolng_142", title: "モルデカイザー", imageUrl: "" },
        { id: "c_lolng_143", title: "ヤスオ", imageUrl: "" },
        { id: "c_lolng_144", title: "ユナラ", imageUrl: "" },
        { id: "c_lolng_145", title: "ユーミ", imageUrl: "" },
        { id: "c_lolng_146", title: "ヨネ", imageUrl: "" },
        { id: "c_lolng_147", title: "ヨリック", imageUrl: "" },
        { id: "c_lolng_148", title: "ライズ", imageUrl: "" },
        { id: "c_lolng_149", title: "ラカン", imageUrl: "" },
        { id: "c_lolng_150", title: "ラックス", imageUrl: "" },
        { id: "c_lolng_151", title: "ラムス", imageUrl: "" },
        { id: "c_lolng_152", title: "ランブル", imageUrl: "" },
        { id: "c_lolng_153", title: "リサンドラ", imageUrl: "" },
        { id: "c_lolng_154", title: "リリア", imageUrl: "" },
        { id: "c_lolng_155", title: "リヴェン", imageUrl: "" },
        { id: "c_lolng_156", title: "リー・シン", imageUrl: "" },
        { id: "c_lolng_157", title: "ルシアン", imageUrl: "" },
        { id: "c_lolng_158", title: "ルブラン", imageUrl: "" },
        { id: "c_lolng_159", title: "ルル", imageUrl: "" },
        { id: "c_lolng_160", title: "レオナ", imageUrl: "" },
        { id: "c_lolng_161", title: "レク＝サイ", imageUrl: "" },
        { id: "c_lolng_162", title: "レナータ・グラスク", imageUrl: "" },
        { id: "c_lolng_163", title: "レネクトン", imageUrl: "" },
        { id: "c_lolng_164", title: "レル", imageUrl: "" },
        { id: "c_lolng_165", title: "レンガー", imageUrl: "" },
        { id: "c_lolng_166", title: "ワーウィック", imageUrl: "" },
        { id: "c_lolng_167", title: "ヴァイ", imageUrl: "" },
        { id: "c_lolng_168", title: "ヴァルス", imageUrl: "" },
        { id: "c_lolng_169", title: "ヴィエゴ", imageUrl: "" },
        { id: "c_lolng_170", title: "ヴェイン", imageUrl: "" },
        { id: "c_lolng_171", title: "ヴェックス", imageUrl: "" },
        { id: "c_lolng_172", title: "ヴェル＝コズ", imageUrl: "" },
      ] },
    ],
  },

]

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
