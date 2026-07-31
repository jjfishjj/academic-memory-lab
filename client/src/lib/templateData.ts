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
