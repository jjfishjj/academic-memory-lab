/**
 * 風格備忘：手帳拼貼學院 — 訓練模板資料層
 * 三個新模板：諧音口訣創作家（橘黃系）、情境式劇本殺（紫藍系書頁感）、微動作記憶法（綠色系）
 * 便利貼雙色原則不變：情境類提示 = 亮黃、情感/故事類提示 = 玫瑰粉
 */
import { type KnowledgeItem } from "./gameData";

export interface TrainingTemplate {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  minutes: number;
  deliverable: string;
  stats: { label: string; value: number }[];
  path: string;
  accent: "amber" | "violet" | "green";
}

export const TRAINING_TEMPLATES: TrainingTemplate[] = [
  {
    id: "mnemonic",
    name: "諧音迷因與口訣創作家",
    emoji: "🎤",
    desc: "把年份、單字、流程變成順口溜、冷笑話或迷因",
    minutes: 6,
    deliverable: "創作一組口訣 + 立即提取測驗",
    stats: [
      { label: "音韻迴路", value: 2 },
      { label: "跨域連結", value: 2 },
      { label: "主動回想", value: 1 },
    ],
    path: "/train/mnemonic",
    accent: "amber",
  },
  {
    id: "roleplay",
    name: "情境式 AI 劇本殺",
    emoji: "🎭",
    desc: "把單字、歷史或概念包裝成角色扮演任務",
    minutes: 9,
    deliverable: "完成 1 段角色扮演 + 5 個核心詞觸發劇情",
    stats: [
      { label: "情境編碼", value: 3 },
      { label: "即時輸出", value: 2 },
      { label: "故事綁定", value: 1 },
    ],
    path: "/train/roleplay",
    accent: "violet",
  },
  {
    id: "gesture",
    name: "微動作記憶法指南",
    emoji: "🤸",
    desc: "把抽象概念綁定手勢、姿勢或小道具",
    minutes: 5,
    deliverable: "建立 5 個身體動作錨點 + 卡住提示",
    stats: [
      { label: "情境編碼", value: 1 },
      { label: "即時輸出", value: 2 },
      { label: "主動回想", value: 2 },
    ],
    path: "/train/gesture",
    accent: "green",
  },
];

/* ---------------- 諧音口訣：靈感工具 ---------------- */

export interface MnemonicStyle {
  id: string;
  name: string;
  emoji: string;
  tip: string;      // 創作提示
  example: string;  // 範例
}

export const MNEMONIC_STYLES: MnemonicStyle[] = [
  {
    id: "homophone",
    name: "諧音梗",
    emoji: "🔊",
    tip: "把發音拆開，找出聽起來像的中文詞，越冷越好記",
    example: "ambulance → 俺不能死（救護車來了）",
  },
  {
    id: "rhyme",
    name: "順口溜",
    emoji: "🎵",
    tip: "押韻 + 節奏，唸三遍就會卡在腦子裡",
    example: "一七八九法國吼，巴士底獄被攻破",
  },
  {
    id: "meme",
    name: "迷因化",
    emoji: "😂",
    tip: "套用你熟的迷因格式：沒人：…我：…／傳說中的…",
    example: "沒人：… 鈉：碰到水直接爆氣 🔥",
  },
  {
    id: "story-chain",
    name: "字頭串故事",
    emoji: "🔗",
    tip: "把每個字頭串成一句荒謬的話（適合流程與清單）",
    example: "氫鋰鈉鉀 → 輕的李娜真甲（活潑金屬排排站）",
  },
];

type MnemonicReferenceByStyle = Record<MnemonicStyle["id"], string>;

/** 內建卡包的逐題參考答案；自訂卡包會改用下方的通用靈感模板。 */
const MNEMONIC_REFERENCES: Record<string, MnemonicReferenceByStyle> = {
  e1: {
    homophone: "procrastinate → 不若趕快死耐拖：越拖越不想做",
    rhyme: "Procrastinate 一直拖，今天不做明天多",
    meme: "沒人：…… 我：先滑五分鐘。procrastinate：計畫通。",
    "story-chain": "P-R-O：怕任務、繞開它、偶爾才動手——這就是拖延",
  },
  e2: {
    homophone: "ambiguous → 俺比你更『模糊』：意思模稜兩可",
    rhyme: "Ambiguous 說不明，一句話有兩種情",
    meme: "老師：答案是 A 還是 B？ ambiguous：Yes。",
    "story-chain": "A-M-B：A 面、B 面，中間還很模糊",
  },
  e3: {
    homophone: "nostalgia → 老家思家：想起過去就鼻酸",
    rhyme: "Nostalgia 翻舊照，往日時光忘不掉",
    meme: "看到童年零食的我：nostalgia.exe 已啟動。",
    "story-chain": "N-O-S：念舊、Old days、思念湧上來",
  },
  e4: {
    homophone: "resilient → 仍是力人：跌倒還能站起來",
    rhyme: "Resilient 不怕摔，彈回原位再重來",
    meme: "生活：把我擊倒。 resilient 的我：復活時間 0 秒。",
    "story-chain": "R-E-S：Recover、重新站穩、繼續走",
  },
  e5: {
    homophone: "meticulous → 每題扣螺絲：細節一個都不放過",
    rhyme: "Meticulous 看得細，一絲不苟抓到底",
    meme: "大家：差不多就好。 meticulous：那個逗號歪了 0.1 mm。",
    "story-chain": "M-E-T：每個、Element、通通仔細檢查",
  },
  h1: {
    homophone: "1789 → 一起扒酒：法國人攻進巴士底",
    rhyme: "一七八九法國吼，巴士底獄被攻破",
    meme: "法國人民：沒有麵包？那就直接革命。",
    "story-chain": "自平博：自由、平等、博愛，推翻舊王朝",
  },
  h2: {
    homophone: "1969 → 依舊溜久：阿波羅一路溜到月球",
    rhyme: "一九六九上月球，阿姆斯壯第一步走",
    meme: "人類：地球逛膩了。阿波羅 11：那去月球吧。",
    "story-chain": "阿登月：阿波羅、登陸、月球第一步",
  },
  h3: {
    homophone: "1517 → 要我一起：馬丁路德邀大家一起改革",
    rhyme: "一五一七論綱貼，贖罪券制被挑戰",
    meme: "教會：買券就安心。馬丁路德：我有 95 個問題。",
    "story-chain": "馬九贖：馬丁路德、九十五條、反對贖罪券",
  },
  h4: {
    homophone: "1929 → 依舊餓久：大恐慌讓大家窮很久",
    rhyme: "一九二九股市落，黑色星期全球縮",
    meme: "華爾街：只是跌一下。全球經濟：我先躺十年。",
    "story-chain": "華崩蕭：華爾街、崩盤、全球蕭條",
  },
  h5: {
    homophone: "1453 → 要死我傷：君士坦丁堡陷落令人傷",
    rhyme: "一四五三城門破，東羅馬亡鄂圖坐",
    meme: "東羅馬：我還能撐。鄂圖曼：城門已讀不回。",
    "story-chain": "君東鄂：君堡陷落、東羅馬亡、鄂圖曼興",
  },
  c1: {
    homophone: "Na 鈉 → 哪！一碰水就炸，火焰還變黃",
    rhyme: "鈉碰水，脾氣大；黃色火焰啪啦啪",
    meme: "沒人：…… 鈉：碰到水直接爆氣 🔥",
    "story-chain": "水黃鹽：遇水反應、黃焰、藏在食鹽",
  },
  c2: {
    homophone: "He 氦 → 嘿！它很淡定，是不太反應的惰性氣體",
    rhyme: "氦氣輕，性情靜，吸一口來聲音高",
    meme: "其他元素：來反應啊！氦：不了，我是惰性氣體。",
    "story-chain": "輕惰高：最輕、惰性、吸入聲音高",
  },
  c3: {
    homophone: "Fe 鐵 → 飛鐵也會鏽，血紅素裡不能少",
    rhyme: "鐵會鏽、血帶紅，人體缺它可不行",
    meme: "鐵：我很堅強。氧氣：那你怎麼又生鏽了？",
    "story-chain": "鏽血必：會生鏽、在血紅素、人體必需",
  },
  c4: {
    homophone: "Cl 氯 → 洗唷！氯拿來消毒，卻有刺激氣味",
    rhyme: "氯氣黃綠味刺鼻，游泳池裡負責洗",
    meme: "細菌：游泳囉！氯：今天泳池由我消毒。",
    "story-chain": "黃刺消：黃綠色、刺激性、可以消毒",
  },
  c5: {
    homophone: "Au 金 → 喔！金不怕腐蝕，還能拉得超長",
    rhyme: "黃金延展不怕蝕，一克拉成兩公里",
    meme: "其他金屬：我生鏽了。金：抱歉，我抗腐蝕。",
    "story-chain": "延抗長：延展性、抗腐蝕、能拉長絲",
  },
};

export function getMnemonicReferences(item: KnowledgeItem, style: MnemonicStyle): string[] {
  const tailored = MNEMONIC_REFERENCES[item.id]?.[style.id];
  const generic: MnemonicReferenceByStyle = {
    homophone: `${item.term} → 把讀音拆成中文近音，再接上「${item.hint}」的畫面`,
    rhyme: `${item.term} 記心頭，${item.hint} 不會漏`,
    meme: `沒人：…… ${item.term}：我就是「${item.hint}」本人。`,
    "story-chain": `${item.term} → 抓出關鍵字頭，串成一幕和「${item.hint}」有關的荒謬故事`,
  };

  return tailored ? [tailored, generic[style.id]] : [generic[style.id]];
}

/* ---------------- 劇本殺：劇本設定 ---------------- */

export interface RoleplayScript {
  id: string;
  name: string;
  emoji: string;
  role: string;     // 玩家角色
  setting: string;  // 場景設定
  mission: string;  // 任務目標（核心詞如何觸發劇情）
}

export const ROLEPLAY_SCRIPTS: RoleplayScript[] = [
  {
    id: "detective",
    name: "深夜校園偵探",
    emoji: "🕵️",
    role: "你是被緊急召來的王牌偵探",
    setting: "深夜的校園發生離奇事件，線索散落在五個角落",
    mission: "每個核心詞都是一條關鍵線索——說出它的意義才能解鎖下一條",
  },
  {
    id: "timetravel",
    name: "時空旅行修復員",
    emoji: "⏳",
    role: "你是時間局派來的歷史修復員",
    setting: "時間線被打亂了，重要的知識碎片掉進了錯誤的年代",
    mission: "每個核心詞是一塊時空碎片——講出它的故事才能放回原位",
  },
  {
    id: "survival",
    name: "無人島求生專家",
    emoji: "🏝️",
    role: "你是墜機後唯一清醒的求生專家",
    setting: "無人島上物資有限，你的知識就是活下去的關鍵",
    mission: "每個核心詞是一件救命工具——說明它的用途才能使用它",
  },
  {
    id: "auction",
    name: "神秘拍賣會鑑定師",
    emoji: "🔨",
    role: "你是拍賣會請來的傳奇鑑定師",
    setting: "五件神秘拍品即將開拍，真偽只有你能辨別",
    mission: "每個核心詞是一件拍品——鑑定出它的真正價值才能落槌",
  },
];

/* ---------------- 微動作：動作靈感 ---------------- */

export interface GestureIdea {
  id: string;
  name: string;
  emoji: string;
  desc: string;
}

export const GESTURE_IDEAS: GestureIdea[] = [
  { id: "hand", name: "手勢", emoji: "✋", desc: "比出形狀、數字、方向：像用手畫出概念的樣子" },
  { id: "pose", name: "姿勢", emoji: "🧍", desc: "全身定格：站姿、蹲姿、伸展——身體記得比腦子牢" },
  { id: "touch", name: "觸碰身體部位", emoji: "👆", desc: "摸頭=概念A、拍肩=概念B：把身體變成鍵盤" },
  { id: "prop", name: "小道具", emoji: "🖊️", desc: "轉筆、敲桌、捏橡皮擦：手邊的東西都是記憶開關" },
  { id: "rhythm", name: "節奏拍打", emoji: "🥁", desc: "用拍手或敲桌的節奏編碼：三短一長=某個公式" },
];

/* ---------------- 共用：模板能力值累計 ---------------- */

const TEMPLATE_STATS_KEY = "memodesk-template-stats";

export interface TemplateStats {
  [key: string]: number;
}

export function loadTemplateStats(): TemplateStats {
  try {
    const raw = localStorage.getItem(TEMPLATE_STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function addTemplateStats(gains: { label: string; value: number }[], runsKey: string) {
  try {
    const s = loadTemplateStats();
    for (const g of gains) s[g.label] = (s[g.label] ?? 0) + g.value;
    s[runsKey] = (s[runsKey] ?? 0) + 1;
    localStorage.setItem(TEMPLATE_STATS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

/** 取知識點的前 N 個（劇本殺固定 5 個核心詞、微動作固定 5 個錨點） */
export function takeItems(items: KnowledgeItem[], n: number): KnowledgeItem[] {
  return items.slice(0, n);
}
