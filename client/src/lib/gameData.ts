/**
 * 手帳拼貼學院 — 雙卡記憶任務遊戲資料
 * 情境鉤子卡（情境編碼+3 主動回想+2 即時輸出+1）
 * 情感故事卡（故事綁定+3 情境編碼+1 即時輸出+2）
 */
import { EXPANDED_MNEMONIC_ITEMS } from "./expandedMnemonicData";
import { SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS } from "./scienceGeographyMnemonicData";

export type PackSubject = "english" | "history" | "chemistry" | "biology" | "geography" | "custom";
export type PackDifficulty = "basic" | "advanced";

export interface KnowledgeItem {
  id: string;
  term: string; // 知識點（單字 / 事件 / 元素）
  hint: string; // 意義 / 解釋（回想目標）
  extra?: string; // 補充
}

export interface SubjectPack {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  items: KnowledgeItem[];
  custom?: boolean; // 使用者自建卡包
  subject?: PackSubject;
  difficulty?: PackDifficulty;
}

export const SUBJECT_PACKS: SubjectPack[] = [
  {
    id: "english-basic",
    name: "英文高頻單字 · 初階",
    emoji: "📖",
    desc: "15 題｜先練常考抽象單字與清楚定義",
    subject: "english",
    difficulty: "basic",
    items: [
      { id: "e1", term: "procrastinate", hint: "拖延", extra: "動詞：把該做的事一直往後推" },
      { id: "e2", term: "ambiguous", hint: "模稜兩可的", extra: "形容詞：有多種解釋、不明確" },
      { id: "e3", term: "nostalgia", hint: "懷舊、鄉愁", extra: "名詞：對過去時光的想念" },
      { id: "e4", term: "resilient", hint: "有韌性的", extra: "形容詞：跌倒後能快速恢復" },
      { id: "e5", term: "meticulous", hint: "一絲不苟的", extra: "形容詞：對細節極度講究" },
    ],
  },
  {
    id: "history-basic",
    name: "歷史關鍵事件 · 初階",
    emoji: "🏛️",
    desc: "15 題｜從朝代建立到近代革命的核心年代",
    subject: "history",
    difficulty: "basic",
    items: [
      { id: "h1", term: "1789 法國大革命", hint: "攻佔巴士底監獄，革命爆發", extra: "自由與平等理念；1792 年廢除君主制" },
      { id: "h2", term: "1969 阿波羅 11 號", hint: "人類首次登月", extra: "阿姆斯壯的一小步" },
      { id: "h3", term: "1517 宗教改革", hint: "馬丁路德提出九十五條論綱", extra: "批判贖罪券的濫用" },
      { id: "h4", term: "1929 經濟大恐慌", hint: "華爾街股災後，經濟危機蔓延全球", extra: "黑色星期四是跌勢開端之一" },
      { id: "h5", term: "1453 君士坦丁堡陷落", hint: "東羅馬帝國滅亡", extra: "鄂圖曼帝國崛起" },
    ],
  },
  {
    id: "chemistry-basic",
    name: "化學元素特性 · 初階",
    emoji: "🧪",
    desc: "15 題｜常見元素、生活用途與基本性質",
    subject: "chemistry",
    difficulty: "basic",
    items: [
      { id: "c1", term: "Na 鈉", hint: "遇水劇烈反應，火焰呈黃色", extra: "活潑金屬，存於食鹽" },
      { id: "c2", term: "He 氦", hint: "最輕的惰性氣體，化性安定", extra: "會讓聲音聽起來尖細；不可刻意吸入" },
      { id: "c3", term: "Fe 鐵", hint: "易氧化生鏽，血紅素核心", extra: "人體必需微量元素" },
      { id: "c4", term: "Cl 氯", hint: "黃綠色有毒氣體；含氯藥劑可消毒", extra: "泳池刺鼻味多來自氯胺，不是氯氣本身" },
      { id: "c5", term: "Au 金", hint: "延展性極佳，抗腐蝕", extra: "一克金可拉成兩公里細絲" },
    ],
  },
];

const subjectPackConfig = [
  { subject: "english", basicId: "english-basic", advancedId: "english-advanced", name: "英文高頻單字", emoji: "📘", basicDesc: "15 題｜先練常考抽象單字與清楚定義", advancedDesc: "10 題｜進一步練多義字與學術字彙" },
  { subject: "history", basicId: "history-basic", advancedId: "history-advanced", name: "歷史關鍵事件", emoji: "🗺️", basicDesc: "15 題｜從朝代建立到近代革命的核心年代", advancedDesc: "10 題｜世界大戰、國際秩序與冷戰轉折" },
  { subject: "chemistry", basicId: "chemistry-basic", advancedId: "chemistry-advanced", name: "化學元素特性", emoji: "⚗️", basicDesc: "15 題｜常見元素、生活用途與基本性質", advancedDesc: "10 題｜材料、生理功能與安全風險" },
] as const;

for (const config of subjectPackConfig) {
  const expanded = EXPANDED_MNEMONIC_ITEMS
    .filter(item => item.subject === config.subject)
    .map(({ id, term, hint, extra }) => ({ id, term, hint, extra }));
  const basicPack = SUBJECT_PACKS.find(pack => pack.id === config.basicId);
  if (basicPack) {
    basicPack.desc = config.basicDesc;
    basicPack.items.push(...expanded.slice(0, 10));
  }
  SUBJECT_PACKS.push({
    id: config.advancedId,
    name: `${config.name} · 進階`,
    emoji: config.emoji,
    desc: config.advancedDesc,
    subject: config.subject,
    difficulty: "advanced",
    items: expanded.slice(10),
  });
}

const newSubjectConfig = [
  { subject: "biology", name: "生物核心概念", emoji: "🧬", basicDesc: "10 題｜細胞、遺傳與分子生物基礎", advancedDesc: "10 題｜生理、演化與生態整合" },
  { subject: "geography", name: "地理關鍵概念", emoji: "🌏", basicDesc: "10 題｜地形、氣候與板塊作用", advancedDesc: "10 題｜人口、產業與永續發展" },
] as const;

for (const config of newSubjectConfig) {
  const items = SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS
    .filter(item => item.subject === config.subject)
    .map(({ id, term, hint, extra }) => ({ id, term, hint, extra }));
  SUBJECT_PACKS.push(
    { id: `${config.subject}-basic`, name: `${config.name} · 初階`, emoji: config.emoji, desc: config.basicDesc, subject: config.subject, difficulty: "basic", items: items.slice(0, 10) },
    { id: `${config.subject}-advanced`, name: `${config.name} · 進階`, emoji: config.emoji, desc: config.advancedDesc, subject: config.subject, difficulty: "advanced", items: items.slice(10) },
  );
}

export interface CampusScene {
  id: string;
  name: string;
  emoji: string;
  spots: string[]; // 場景內可掛鉤的物件
}

export const CAMPUS_SCENES: CampusScene[] = [
  { id: "library", name: "圖書館", emoji: "📚", spots: ["還書箱", "靠窗座位", "影印機", "字典區書架", "檯燈"] },
  { id: "cafeteria", name: "學生食堂", emoji: "🍜", spots: ["打菜阿姨的勺子", "微波爐", "飲料販賣機", "餐盤回收台", "靠門圓桌"] },
  { id: "dorm", name: "宿舍", emoji: "🛏️", spots: ["上鋪的梯子", "陽台曬衣架", "室友的鬧鐘", "冰箱", "門後鏡子"] },
  { id: "field", name: "操場", emoji: "🏃", spots: ["百米起跑線", "籃球框", "司令台", "單槓", "跑道終點線"] },
  { id: "classroom", name: "教室", emoji: "🏫", spots: ["黑板溝的粉筆灰", "老師的講桌", "最後一排座位", "掃地用具櫃", "窗邊的風扇"] },
];

/** localStorage 自訂卡包 */
const CUSTOM_PACKS_KEY = "memodesk-custom-packs";

export function loadCustomPacks(): SubjectPack[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PACKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

export function saveCustomPacks(packs: SubjectPack[]) {
  try { localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(packs)); } catch { /* ignore */ }
}

export function addCustomPack(pack: SubjectPack) {
  const packs = loadCustomPacks();
  packs.unshift(pack);
  saveCustomPacks(packs);
}

export function deleteCustomPack(id: string) {
  saveCustomPacks(loadCustomPacks().filter((p) => p.id !== id));
}

/**
 * 解析使用者貼上的知識點文字：
 * 每行一個知識點，「詞彙 意思」以第一個空白/Tab/｜/｜分隔；
 * 支援「詞彙：意思」「詞彙,意思」等常見格式。
 */
export function parsePastedItems(text: string): KnowledgeItem[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.slice(0, 20).map((line, i) => {
    const m = line.split(/[\t|，,：:—-]+| {2,}| /).map((s) => s.trim()).filter(Boolean);
    const term = m[0] ?? line;
    const hint = m.slice(1).join(" ") || "（自己補上意思會更好記）";
    return { id: `u${Date.now()}-${i}`, term, hint };
  });
}

export interface Emotion {
  id: string;
  name: string;
  emoji: string;
  storyStarter: string; // 故事模板開頭
}

export const EMOTIONS: Emotion[] = [
  { id: "surprise", name: "驚訝", emoji: "😲", storyStarter: "我萬萬沒想到，" },
  { id: "funny", name: "爆笑", emoji: "🤣", storyStarter: "全班笑到停不下來，因為" },
  { id: "awkward", name: "尷尬", emoji: "😳", storyStarter: "那一刻空氣凝結了，" },
  { id: "touched", name: "感動", emoji: "🥹", storyStarter: "我眼眶突然一熱，" },
];

export interface StatGain {
  label: string;
  value: number;
}

export const HOOK_CARD_STATS: StatGain[] = [
  { label: "情境編碼", value: 3 },
  { label: "主動回想", value: 2 },
  { label: "即時輸出", value: 1 },
];

export const STORY_CARD_STATS: StatGain[] = [
  { label: "故事綁定", value: 3 },
  { label: "情境編碼", value: 1 },
  { label: "即時輸出", value: 2 },
];

/** localStorage 能力值 */
export interface GymStats {
  情境編碼: number;
  故事綁定: number;
  主動回想: number;
  即時輸出: number;
  completedRuns: number;
  bestCombo: number;
}

const STATS_KEY = "memodesk-gym-stats";

export function loadStats(): GymStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return { ...defaultStats(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultStats();
}

export function defaultStats(): GymStats {
  return { 情境編碼: 0, 故事綁定: 0, 主動回想: 0, 即時輸出: 0, completedRuns: 0, bestCombo: 0 };
}

export function saveStats(s: GymStats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
