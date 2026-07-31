/**
 * 手帳拼貼學院 — 雙卡記憶任務遊戲資料
 * 情境鉤子卡（情境編碼+3 主動回想+2 即時輸出+1）
 * 情感故事卡（故事綁定+3 情境編碼+1 即時輸出+2）
 */

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
}

export const SUBJECT_PACKS: SubjectPack[] = [
  {
    id: "english",
    name: "英文高頻單字",
    emoji: "📖",
    desc: "學測 / 多益常考抽象單字，最難死背的那種",
    items: [
      { id: "e1", term: "procrastinate", hint: "拖延", extra: "動詞：把該做的事一直往後推" },
      { id: "e2", term: "ambiguous", hint: "模稜兩可的", extra: "形容詞：有多種解釋、不明確" },
      { id: "e3", term: "nostalgia", hint: "懷舊、鄉愁", extra: "名詞：對過去時光的想念" },
      { id: "e4", term: "resilient", hint: "有韌性的", extra: "形容詞：跌倒後能快速恢復" },
      { id: "e5", term: "meticulous", hint: "一絲不苟的", extra: "形容詞：對細節極度講究" },
    ],
  },
  {
    id: "history",
    name: "歷史關鍵事件",
    emoji: "🏛️",
    desc: "年份與事件總是配對失敗？把它們放進場景吧",
    items: [
      { id: "h1", term: "1789 法國大革命", hint: "攻佔巴士底監獄，推翻波旁王朝", extra: "自由、平等、博愛" },
      { id: "h2", term: "1969 阿波羅 11 號", hint: "人類首次登月", extra: "阿姆斯壯的一小步" },
      { id: "h3", term: "1517 宗教改革", hint: "馬丁路德發表九十五條論綱", extra: "挑戰贖罪券制度" },
      { id: "h4", term: "1929 經濟大恐慌", hint: "華爾街股市崩盤，全球蕭條", extra: "黑色星期四" },
      { id: "h5", term: "1453 君士坦丁堡陷落", hint: "東羅馬帝國滅亡", extra: "鄂圖曼帝國崛起" },
    ],
  },
  {
    id: "chemistry",
    name: "化學元素特性",
    emoji: "🧪",
    desc: "元素符號和特性像亂碼？給它們一點人設",
    items: [
      { id: "c1", term: "Na 鈉", hint: "遇水劇烈反應，火焰呈黃色", extra: "活潑金屬，存於食鹽" },
      { id: "c2", term: "He 氦", hint: "最輕的惰性氣體，不易反應", extra: "吸入聲音會變高" },
      { id: "c3", term: "Fe 鐵", hint: "易氧化生鏽，血紅素核心", extra: "人體必需微量元素" },
      { id: "c4", term: "Cl 氯", hint: "黃綠色刺激性氣體，可消毒", extra: "游泳池的味道" },
      { id: "c5", term: "Au 金", hint: "延展性極佳，抗腐蝕", extra: "一克金可拉成兩公里細絲" },
    ],
  },
];

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
