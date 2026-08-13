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

/* ---------------- 諧音口訣：每個知識點的專屬範例（四風格） ---------------- */

/** key = KnowledgeItem.id，value = { 風格id: 範例口訣 } */
export const MNEMONIC_EXAMPLES: Record<string, Record<string, string>> = {
  // 英文高頻單字
  e1: {
    homophone: "procrastinate → 「不可拉屎、忍耐」——一直忍、一直拖，就是拖延",
    rhyme: "拖拖拉拉 procrastinate，今天的事明天再 late",
    meme: "沒人：… 我：deadline 前一晚才開工 → procrastinate 本人",
    "story-chain": "pro-cras-ti-nate：專業級（pro）的人，把明天（cras 拉丁文=明天）當作提交日（nate 聯想 late）",
  },
  e2: {
    homophone: "ambiguous → 「安必贵吗？」——問了半天也沒人說清楚，模稜兩可",
    rhyme: "ambiguous 意思霧煞煞，一句話有兩種解法",
    meme: "傳說中的已讀回一個「嗯」→ 最 ambiguous 的回覆",
    "story-chain": "ambi（兩邊）+ guous：兩邊都說得通 → 模稜兩可",
  },
  e3: {
    homophone: "nostalgia → 「腦是他家」——腦袋一直住著過去的回憶，懷舊",
    rhyme: "nostalgia 想當年，老照片翻不完",
    meme: "沒人：… 我半夜：重看小學畢業影片哭到不行 → nostalgia 發作",
    "story-chain": "nost（回家 nostos）+ algia（痛）：想家想到心痛 → 鄉愁",
  },
  e4: {
    homophone: "resilient → 「累死你也還挺」——怎麼摔都彈回來，超有韌性",
    rhyme: "resilient 打不倒，跌倒再站笑一笑",
    meme: "傳說中的不倒翁：推一次彈一次 → resilient 本翁",
    "story-chain": "re（再次）+ sili（跳 salire）+ ent：再次跳起來的人 → 有韌性",
  },
  e5: {
    homophone: "meticulous → 「摸踢Q了嗎」——每個細節都要摸過踢過檢查過，一絲不苟",
    rhyme: "meticulous 細節控，一個標點都不放鬆",
    meme: "沒人：… 我交報告前：第 37 次檢查字距 → meticulous 晚期",
    "story-chain": "meti-cu-lous：每天（meti 諧音每提）提醒自己 check（cu）漏洞（lous）→ 一絲不苟",
  },
  // 歷史關鍵事件
  h1: {
    homophone: "1789 → 「一起爬酒（17 爬 89）」——巴黎人一起爬上巴士底獄慶祝革命",
    rhyme: "一七八九法國吼，巴士底獄被攻破",
    meme: "沒人：… 巴黎市民 1789：今天就把王朝掀了 🔥",
    "story-chain": "1-7-8-9：一位國王、七月盛夏、八方民怨、九死一生 → 法國大革命",
  },
  h2: {
    homophone: "1969 → 「一腳踏上六九月球」——阿姆斯壯一腳踩出人類一大步",
    rhyme: "一九六九登月球，一小步變一大步",
    meme: "傳說中的打卡照鼻祖：1969 月球表面一枚腳印 📸",
    "story-chain": "19-69：19 歲的夢想，69 億人抬頭看同一顆月亮 → 阿波羅 11 號",
  },
  h3: {
    homophone: "1517 → 「一屋一起」抗議——馬丁路德把九十五條釘在教堂門上，一屋人一起看",
    rhyme: "一五一七路德吼，九十五條門上釘",
    meme: "沒人：… 馬丁路德：直接把 95 條抱怨貼公告欄 → 宗教改革",
    "story-chain": "15-17：15 世紀的舊制度，被 17 吋的鐵鎚釘出裂縫 → 九十五條論綱",
  },
  h4: {
    homophone: "1929 → 「一舅兒喊救（19 兒 29）」——華爾街股民哀嚎救命，大恐慌",
    rhyme: "一九二九股市倒，黑色星期四全球哭",
    meme: "傳說中的一夜歸零：1929 華爾街開盤即崩盤 📉",
    "story-chain": "19-29：19 樓的股票經紀人，29 秒內看著財富蒸發 → 經濟大恐慌",
  },
  h5: {
    homophone: "1453 → 「一世我散（14 我 53）」——東羅馬皇帝嘆：千年帝國就此解散",
    rhyme: "一四五三城牆破，東羅馬帝國成往事",
    meme: "沒人：… 鄂圖曼大砲：對君士坦丁堡城牆一鍵開砸 💥",
    "story-chain": "14-53：14 層城牆、53 天圍城 → 君士坦丁堡陷落，帝國落幕",
  },
  // 化學元素特性
  c1: {
    homophone: "Na 鈉 → 「Na（那）個人下水就炸毛」——遇水劇烈反應的暴躁黃色火焰哥",
    rhyme: "鈉鈉鈉，碰水炸，黃色火焰頂呱呱",
    meme: "沒人：… 鈉：碰到水直接爆氣 🔥",
    "story-chain": "N-a：Never add（絕不要加）水！它住在鹽罐裡才乖",
  },
  c2: {
    homophone: "He 氦 → 「嘿～」吸一口聲音變高的搞笑氣體",
    rhyme: "氦氣輕，氦氣懶，誰來邀約都不反應",
    meme: "傳說中的邊緣人：氦——最輕、最懶、誰都不理，但派對必備 🎈",
    "story-chain": "H-e：High（音調變高）+ easy（懶得反應）→ 最輕的惰性氣體",
  },
  c3: {
    homophone: "Fe 鐵 → 「Fe（廢）了」——放著不管就生鏽報廢的鐵",
    rhyme: "鐵在血中扛氧氣，出門淋雨就生鏽",
    meme: "沒人：… 鐵：淋一場雨就開始擺爛長鏽 🟤",
    "story-chain": "F-e：Ferrum 的縮寫——Fighter（血紅素裡的氧氣搬運工）+ easily rusted（容易生鏽）",
  },
  c4: {
    homophone: "Cl 氯 → 「氯＝綠」——黃綠色的消毒大隊長，游泳池都是他的味道",
    rhyme: "氯氣綠，氯氣嗆，消毒殺菌他最強",
    meme: "傳說中的游泳池香水：Cl 氯——聞到就想戴泳鏡 🏊",
    "story-chain": "C-l：Clean（消毒）+ lime green（黃綠色）→ 刺激性消毒氣體",
  },
  c5: {
    homophone: "Au 金 → 「Au（嗷）嗚！」——看到金子忍不住嚎叫，怎麼拉都拉不斷",
    rhyme: "金子軟，金子韌，一克拉出兩公里",
    meme: "沒人：… 金：放一萬年也不生鏽，躺著保值 ✨",
    "story-chain": "A-u：Amazing（延展性驚人）+ unbreakable value（抗腐蝕保值）→ 黃金",
  },
};

/** 自建卡包 fallback：依風格自動生成範例句型（帶入知識點名稱與意思） */
export function fallbackMnemonicExample(styleId: string, term: string, hint: string): string {
  switch (styleId) {
    case "homophone":
      return `把「${term}」的發音拆開唸唸看，找一個聽起來像的中文詞，再接上「${hint}」。例：ambulance → 俺不能死（救護車來了）`;
    case "rhyme":
      return `用「${term}」和「${hint}」編兩句押韻的話，唸三遍。例：拖拖拉拉 procrastinate，今天的事明天再 late`;
    case "meme":
      return `套迷因格式：「沒人：… 我：${hint}的時候 → ${term} 本人」`;
    case "story-chain":
      return `把「${term}」拆成幾段（字首/音節），每段聯想一個畫面，串成一句荒謬的話，最後指向「${hint}」`;
    default:
      return `用你最順口的方式，把「${term} = ${hint}」編成一句忘不掉的話`;
  }
}

/** 取得某知識點在某風格下的範例：官方卡包有專屬範例，自建卡包用 fallback */
export function getMnemonicExample(styleId: string, item: KnowledgeItem): { text: string; isTailored: boolean } {
  const tailored = MNEMONIC_EXAMPLES[item.id]?.[styleId];
  if (tailored) return { text: tailored, isTailored: true };
  return { text: fallbackMnemonicExample(styleId, item.term, item.hint), isTailored: false };
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
