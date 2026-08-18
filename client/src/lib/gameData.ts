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
  sessionSize?: number; // 每回合從完整題庫隨機抽出的題數
  custom?: boolean; // 使用者自建卡包
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
      { id: "e6", term: "inevitable", hint: "不可避免的", extra: "形容詞：無論如何都會發生" },
      { id: "e7", term: "perspective", hint: "觀點、視角", extra: "名詞：看待事情的方式" },
      { id: "e8", term: "compromise", hint: "妥協、折衷", extra: "雙方各退一步達成協議" },
      { id: "e9", term: "significant", hint: "重要的、顯著的", extra: "具有明顯影響或意義" },
      { id: "e10", term: "sustainable", hint: "永續的", extra: "能長期維持且不耗盡資源" },
      { id: "e11", term: "consequence", hint: "後果、結果", extra: "某個行動造成的影響" },
      { id: "e12", term: "acquire", hint: "獲得、習得", extra: "經由努力取得知識或物品" },
    ],
    sessionSize: 6,
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
      { id: "h6", term: "1492 哥倫布航抵美洲", hint: "開啟歐洲大航海與殖民時代", extra: "西班牙王室資助航行" },
      { id: "h7", term: "1776 美國獨立宣言", hint: "十三州宣布脫離英國", extra: "主張天賦人權" },
      { id: "h8", term: "1914 第一次世界大戰", hint: "塞拉耶佛事件引爆歐洲戰爭", extra: "同盟國對協約國" },
      { id: "h9", term: "1945 聯合國成立", hint: "二戰後建立國際和平合作組織", extra: "總部設於紐約" },
      { id: "h10", term: "1949 中華人民共和國成立", hint: "中國近代政權重大轉折", extra: "國共內戰後的政治變局" },
      { id: "h11", term: "1989 柏林圍牆倒塌", hint: "東西德分裂走向終結", extra: "冷戰結束的重要象徵" },
      { id: "h12", term: "1991 蘇聯解體", hint: "冷戰兩極格局正式終結", extra: "十五個加盟共和國獨立" },
    ],
    sessionSize: 6,
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
      { id: "c6", term: "O 氧", hint: "支持燃燒，也是細胞呼吸所需", extra: "約占空氣體積 21%" },
      { id: "c7", term: "C 碳", hint: "有鑽石與石墨等同素異形體", extra: "有機化合物的骨架元素" },
      { id: "c8", term: "Ca 鈣", hint: "構成骨骼牙齒並參與肌肉收縮", extra: "鹼土金屬" },
      { id: "c9", term: "Cu 銅", hint: "導電性佳，表面氧化形成綠色銅鏽", extra: "常用於電線" },
      { id: "c10", term: "K 鉀", hint: "維持神經與肌肉正常運作", extra: "活潑金屬，香蕉含量豐富" },
      { id: "c11", term: "Si 矽", hint: "半導體產業的核心材料", extra: "地殼含量第二多的元素" },
      { id: "c12", term: "Hg 汞", hint: "常溫唯一液態金屬，具有毒性", extra: "舊式溫度計曾使用" },
    ],
    sessionSize: 6,
  },
  {
    id: "biology",
    name: "生物核心概念",
    emoji: "🧬",
    desc: "細胞、遺傳、生理與生態的高頻考點",
    sessionSize: 6,
    items: [
      { id: "b1", term: "粒線體", hint: "進行有氧呼吸並產生 ATP", extra: "常被稱為細胞的發電廠" },
      { id: "b2", term: "核糖體", hint: "依照 mRNA 資訊合成蛋白質", extra: "由 rRNA 與蛋白質組成" },
      { id: "b3", term: "減數分裂", hint: "產生染色體數目減半的配子", extra: "增加遺傳多樣性" },
      { id: "b4", term: "自然選擇", hint: "適應環境的個體留下較多後代", extra: "達爾文演化論核心機制" },
      { id: "b5", term: "光合作用", hint: "利用光能將二氧化碳與水合成葡萄糖", extra: "釋放氧氣" },
      { id: "b6", term: "抗體", hint: "辨識並結合特定抗原", extra: "由 B 細胞分化的漿細胞製造" },
      { id: "b7", term: "恆定性", hint: "維持體內環境在穩定範圍", extra: "如體溫與血糖調節" },
      { id: "b8", term: "生態系", hint: "生物群集與非生物環境的互動系統", extra: "能量流動、物質循環" },
      { id: "b9", term: "DNA 複製", hint: "以半保留方式複製遺傳資訊", extra: "發生於細胞分裂前" },
      { id: "b10", term: "酵素", hint: "降低活化能、加速生化反應", extra: "具有受質專一性" },
    ],
  },
  {
    id: "geography",
    name: "地理關鍵概念",
    emoji: "🌏",
    desc: "地形、氣候、人口與永續發展一次整理",
    sessionSize: 6,
    items: [
      { id: "g1", term: "板塊聚合邊界", hint: "板塊互相靠近，常形成山脈或海溝", extra: "地震與火山活動頻繁" },
      { id: "g2", term: "季風", hint: "風向隨季節規律改變", extra: "海陸熱力差異造成" },
      { id: "g3", term: "都市化", hint: "都市人口比例上升、都市範圍擴張", extra: "伴隨產業與生活型態改變" },
      { id: "g4", term: "人口扶養比", hint: "依賴人口相對於工作年齡人口的比例", extra: "衡量人口負擔" },
      { id: "g5", term: "河川襲奪", hint: "一條河川因侵蝕奪取另一河川上游", extra: "常形成風口與斷頭河" },
      { id: "g6", term: "熱島效應", hint: "都市氣溫高於周圍郊區", extra: "建材吸熱與人為排熱所致" },
      { id: "g7", term: "產業群聚", hint: "相關企業集中以共享資源並降低成本", extra: "矽谷是典型例子" },
      { id: "g8", term: "碳足跡", hint: "產品或活動生命週期的溫室氣體排放量", extra: "可用二氧化碳當量表示" },
      { id: "g9", term: "沖積扇", hint: "河流出山口後流速降低形成扇形堆積", extra: "扇頂礫石較粗" },
      { id: "g10", term: "人口遷移推拉力", hint: "原居地排斥與目的地吸引共同促成移動", extra: "工作機會是常見拉力" },
    ],
  },
  {
    id: "physics",
    name: "物理觀念題庫",
    emoji: "⚡",
    desc: "力學、電磁、波動與熱學的概念辨識",
    sessionSize: 6,
    items: [
      { id: "p1", term: "牛頓第一運動定律", hint: "合力為零時物體維持靜止或等速直線運動", extra: "又稱慣性定律" },
      { id: "p2", term: "作用力與反作用力", hint: "大小相等、方向相反且作用在不同物體", extra: "牛頓第三運動定律" },
      { id: "p3", term: "動量守恆", hint: "孤立系統總動量在碰撞前後不變", extra: "適用於彈性與非彈性碰撞" },
      { id: "p4", term: "歐姆定律", hint: "定溫下電壓等於電流乘以電阻", extra: "V = IR" },
      { id: "p5", term: "電磁感應", hint: "磁通量改變時產生感應電動勢", extra: "發電機的原理" },
      { id: "p6", term: "全反射", hint: "光由光密介質射向光疏介質且入射角超過臨界角", extra: "光纖傳輸的原理" },
      { id: "p7", term: "共振", hint: "外力頻率接近固有頻率時振幅大增", extra: "鞦韆與樂器皆可觀察" },
      { id: "p8", term: "比熱", hint: "單位質量物質升高一度所需熱量", extra: "水的比熱大，能調節氣候" },
      { id: "p9", term: "都卜勒效應", hint: "波源與觀察者相對運動造成頻率改變", extra: "救護車靠近時音調較高" },
      { id: "p10", term: "位能", hint: "物體因位置或形變儲存的能量", extra: "重力位能 mgh" },
    ],
  },
  {
    id: "idioms",
    name: "國文成語辨析",
    emoji: "🪶",
    desc: "容易望文生義或混用的常考成語",
    sessionSize: 6,
    items: [
      { id: "i1", term: "差強人意", hint: "大致上還能使人滿意", extra: "不是『令人不滿意』" },
      { id: "i2", term: "不刊之論", hint: "正確而不可更改的言論", extra: "刊：削除、修改" },
      { id: "i3", term: "明日黃花", hint: "過時或失去新聞價值的事物", extra: "不是指未來會盛開的花" },
      { id: "i4", term: "目無全牛", hint: "技藝純熟，運用自如", extra: "出自庖丁解牛" },
      { id: "i5", term: "首當其衝", hint: "最先受到攻擊或災難", extra: "不是最先衝出去" },
      { id: "i6", term: "七月流火", hint: "天氣逐漸轉涼", extra: "火指心宿二西沉" },
      { id: "i7", term: "文不加點", hint: "文思敏捷，寫作一氣呵成", extra: "點：塗改" },
      { id: "i8", term: "炙手可熱", hint: "氣焰權勢很盛", extra: "不宜用來形容熱門商品" },
      { id: "i9", term: "久假不歸", hint: "長期借用而不歸還", extra: "假：借" },
      { id: "i10", term: "洛陽紙貴", hint: "著作廣泛流傳、風行一時", extra: "出自左思《三都賦》" },
    ],
  },
  {
    id: "japanese",
    name: "日語生活單字",
    emoji: "🗾",
    desc: "旅行與日常對話最常使用的基礎詞彙",
    sessionSize: 6,
    items: [
      { id: "j1", term: "ありがとう", hint: "謝謝", extra: "arigatou" },
      { id: "j2", term: "すみません", hint: "不好意思、對不起", extra: "sumimasen" },
      { id: "j3", term: "駅（えき）", hint: "車站", extra: "eki" },
      { id: "j4", term: "切符（きっぷ）", hint: "車票", extra: "kippu" },
      { id: "j5", term: "美味しい（おいしい）", hint: "好吃的", extra: "oishii" },
      { id: "j6", term: "大丈夫（だいじょうぶ）", hint: "沒問題、不要緊", extra: "daijoubu" },
      { id: "j7", term: "入口（いりぐち）", hint: "入口", extra: "iriguchi" },
      { id: "j8", term: "出口（でぐち）", hint: "出口", extra: "deguchi" },
      { id: "j9", term: "いくら", hint: "多少錢", extra: "ikura" },
      { id: "j10", term: "お願いします", hint: "拜託了、麻煩您", extra: "onegaishimasu" },
    ],
  },
];

/** Fisher–Yates 洗牌；每次開始任務都產生不同順序。 */
export function createSessionItems(items: KnowledgeItem[], size = 6): KnowledgeItem[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(Math.max(1, size), shuffled.length));
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
