import type { MrtStation } from "@/lib/mrtData";

export interface MrtMnemonic {
  sound: string;
  scene: string;
  action: string;
  codeHook: string;
}

export interface PersonalMrtMnemonic {
  sound: string;
  favorite: boolean;
  quality?: MrtMnemonicQuality;
}

export type MrtMnemonicStyle = "humor" | "story" | "celebrity";
export type MrtMnemonicQuality = "good" | "okay" | "hard";
export type MrtStylePreferences = Record<MrtMnemonicStyle, number>;

export interface MrtMnemonicImport {
  mnemonics: Record<string, PersonalMrtMnemonic>;
  preferences?: Partial<MrtStylePreferences>;
}

const PERSONAL_KEY = "memodesk-mrt-personal-mnemonics";
export const MRT_PERSONAL_MNEMONICS_KEY = PERSONAL_KEY;
export const MRT_STYLE_PREFERENCES_KEY = "memodesk-mrt-style-preferences";

const EMPTY_STYLE_PREFERENCES: MrtStylePreferences = {
  humor: 0,
  story: 0,
  celebrity: 0,
};

export function loadMrtStylePreferences(): MrtStylePreferences {
  try {
    const raw = localStorage.getItem(MRT_STYLE_PREFERENCES_KEY);
    return { ...EMPTY_STYLE_PREFERENCES, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...EMPTY_STYLE_PREFERENCES };
  }
}

export function mnemonicStyleOf(text: string): MrtMnemonicStyle | null {
  if (text.startsWith("幽默型")) return "humor";
  if (text.startsWith("故事型")) return "story";
  if (text.startsWith("名人型")) return "celebrity";
  return null;
}

export function recordMrtStyleChoice(text: string): MrtStylePreferences {
  const style = mnemonicStyleOf(text);
  const next = loadMrtStylePreferences();
  if (style) next[style] += 1;
  localStorage.setItem(MRT_STYLE_PREFERENCES_KEY, JSON.stringify(next));
  localStorage.setItem("memodesk-local-updated-at", new Date().toISOString());
  return next;
}

export function sortMrtSuggestionsByPreference(
  suggestions: string[],
  preferences = loadMrtStylePreferences()
): string[] {
  return suggestions
    .map((text, index) => ({
      text,
      index,
      score: preferences[mnemonicStyleOf(text) ?? "humor"] ?? 0,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.text);
}

export function qualityAdjustedPreferences(
  mnemonics: Record<string, PersonalMrtMnemonic>,
  preferences = loadMrtStylePreferences()
): MrtStylePreferences {
  const next = { ...preferences };
  Object.values(mnemonics).forEach(item => {
    const style = mnemonicStyleOf(item.sound);
    if (!style || !item.quality) return;
    next[style] +=
      item.quality === "good" ? 3 : item.quality === "okay" ? 1 : -2;
  });
  return next;
}

export function parseMrtMnemonicImport(value: unknown): MrtMnemonicImport {
  if (!value || typeof value !== "object")
    throw new Error("匯入檔不是有效物件");
  const payload = value as { mnemonics?: unknown; preferences?: unknown };
  if (!payload.mnemonics || typeof payload.mnemonics !== "object")
    throw new Error("匯入檔缺少 mnemonics");
  const allowedQuality = new Set(["good", "okay", "hard"]);
  const mnemonics: Record<string, PersonalMrtMnemonic> = {};
  Object.entries(payload.mnemonics as Record<string, unknown>).forEach(
    ([code, raw]) => {
      if (!raw || typeof raw !== "object")
        throw new Error(`${code} 的聯想格式錯誤`);
      const item = raw as {
        sound?: unknown;
        favorite?: unknown;
        quality?: unknown;
      };
      if (typeof item.sound !== "string" || !item.sound.trim())
        throw new Error(`${code} 缺少聯想文字`);
      if (
        item.quality !== undefined &&
        !allowedQuality.has(String(item.quality))
      )
        throw new Error(`${code} 的品質值無效`);
      mnemonics[code] = {
        sound: item.sound.trim(),
        favorite: Boolean(item.favorite),
        quality: item.quality as MrtMnemonicQuality | undefined,
      };
    }
  );
  const preferences =
    payload.preferences && typeof payload.preferences === "object"
      ? (payload.preferences as Partial<MrtStylePreferences>)
      : undefined;
  return { mnemonics, preferences };
}

export function loadPersonalMrtMnemonics(): Record<
  string,
  PersonalMrtMnemonic
> {
  try {
    const value = localStorage.getItem(PERSONAL_KEY);
    const parsed = value ? JSON.parse(value) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function savePersonalMrtMnemonic(
  code: string,
  value: PersonalMrtMnemonic
): Record<string, PersonalMrtMnemonic> {
  const next = { ...loadPersonalMrtMnemonics(), [code]: value };
  localStorage.setItem(PERSONAL_KEY, JSON.stringify(next));
  localStorage.setItem("memodesk-local-updated-at", new Date().toISOString());
  return next;
}

export function deletePersonalMrtMnemonic(
  code: string
): Record<string, PersonalMrtMnemonic> {
  const next = { ...loadPersonalMrtMnemonics() };
  delete next[code];
  localStorage.setItem(PERSONAL_KEY, JSON.stringify(next));
  localStorage.setItem("memodesk-local-updated-at", new Date().toISOString());
  return next;
}

export function updatePersonalMrtMnemonics(
  updater: (
    current: Record<string, PersonalMrtMnemonic>
  ) => Record<string, PersonalMrtMnemonic>
): Record<string, PersonalMrtMnemonic> {
  const next = updater(loadPersonalMrtMnemonics());
  localStorage.setItem(PERSONAL_KEY, JSON.stringify(next));
  localStorage.setItem("memodesk-local-updated-at", new Date().toISOString());
  return next;
}

const digitImages: Record<string, string> = {
  "0": "甜甜圈",
  "1": "蠟燭",
  "2": "天鵝",
  "3": "耳朵",
  "4": "帆船",
  "5": "鉤子",
  "6": "口哨",
  "7": "鐮刀",
  "8": "雪人",
  "9": "氣球",
};

const lineImages: Record<MrtStation["lineId"], string> = {
  BR: "棕色熊",
  R: "紅玫瑰",
  G: "綠茶",
  O: "橘子",
  BL: "藍鯨",
  Y: "黃香蕉",
};

const wordImages: Array<[string, string]> = [
  ["台北101／世貿", "一百零一支抬背棒，把獅帽抬進世貿"],
  ["廣慈／奉天宮", "光吃鳳梨酥，奉給天宮的神仙"],
  ["南港軟體園區", "南瓜扛著軟糖，在園區寫軟體"],
  ["南港展覽館", "南瓜港口展開一座懶人館"],
  ["新北產業園區", "新杯子裝滿產業，滾進圓圓園區"],
  ["大安森林公園", "大鵪鶉在森林公園大喊安啦"],
  ["國父紀念館", "果腹後去紀念館找國父"],
  ["新店區公所", "新墊子鋪滿區公所"],
  ["台北小巨蛋", "抬背的小巨人抱著巨蛋"],
  ["中正紀念堂", "鐘整點響，紀念堂開始震動"],
  ["忠孝復興", "棕熊笑著復興一座城"],
  ["南京復興", "南京人拿金斧復興城市"],
  ["忠孝新生", "棕熊笑迎新生入學"],
  ["松江南京", "松鼠跳江，游到南京"],
  ["民權西路", "名犬一路向西奔跑"],
  ["新埔民生", "新噗噗車載滿花生"],
  ["台北車站", "抬背包衝進車站"],
  ["三重國小", "三隻重重的鍋在國小跳舞"],
  ["三和國中", "三盒便當送進國中"],
  ["三民高中", "三名高中生一起擊掌"],
  ["徐匯中學", "徐徐吹來的風匯集中學"],
  ["亞東醫院", "牙痛就往醫院衝"],
  ["萬芳社區", "萬朵芳香花塞滿社區"],
  ["萬芳醫院", "萬朵芳香花飄進醫院"],
  ["科技大樓", "一棵雞在科技大樓打電腦"],
  ["松山機場", "松鼠從松山機場起飛"],
  ["大湖公園", "大壺茶倒滿整座公園"],
  ["永安市場", "永遠安全的市場"],
  ["台電大樓", "抬著閃電爬上大樓"],
  ["中山國中", "鐘聲響遍中山國中"],
];

const charImages: Record<string, string> = {
  動: "凍豆腐",
  物: "禮物",
  園: "圓球",
  木: "木馬",
  柵: "柵欄",
  萬: "萬花筒",
  芳: "芳香花",
  辛: "星星",
  亥: "海浪",
  麟: "麒麟",
  光: "雷射光",
  六: "溜溜球",
  張: "帳篷",
  犁: "犁田牛",
  大: "大象",
  安: "鵪鶉",
  南: "南瓜",
  京: "金雞",
  復: "斧頭",
  興: "猩猩",
  中: "時鐘",
  山: "山羊",
  國: "鍋子",
  松: "松鼠",
  機: "公雞",
  場: "長頸鹿",
  直: "尺子",
  劍: "寶劍",
  路: "馬路",
  西: "西瓜",
  湖: "水壺",
  港: "港口",
  墘: "鉗子",
  文: "蚊子",
  德: "德國香腸",
  內: "牛奶",
  葫: "葫蘆",
  洲: "粥",
  東: "冬瓜",
  軟: "軟糖",
  體: "體操人",
  展: "展開扇",
  覽: "纜車",
  館: "罐頭",
  象: "大象",
  台: "抬桌子",
  北: "背包",
  世: "獅子",
  貿: "帽子",
  信: "信封",
  義: "義大利麵",
  森: "森林",
  林: "淋浴",
  門: "大門",
  正: "蒸籠",
  紀: "記事本",
  念: "黏土",
  堂: "糖果",
  醫: "醫生",
  院: "庭院",
  車: "火車",
  雙: "雙胞胎",
  連: "蓮花",
  民: "名牌",
  權: "拳頭",
  圓: "圓球",
  潭: "彈簧",
  士: "武士",
  芝: "芝麻",
  明: "明燈",
  石: "石頭",
  牌: "撲克牌",
  唭: "七顆糖",
  哩: "鯉魚",
  岸: "鵝卵岸",
  奇: "奇異果",
  岩: "岩石",
  投: "投籃",
  崗: "鋼盔",
  忠: "棕熊",
  關: "關公",
  渡: "肚子",
  竹: "竹子",
  圍: "圍巾",
  紅: "紅帽",
  樹: "大樹",
  淡: "雞蛋水",
  新: "新鞋",
  店: "墊子",
  區: "蛆寶寶",
  公: "公雞",
  所: "鎖頭",
  七: "七喜",
  坪: "蘋果",
  景: "眼鏡",
  美: "草莓",
  隆: "恐龍",
  古: "鼓",
  亭: "蜻蜓",
  小: "小鳥",
  巨: "巨人",
  蛋: "雞蛋",
  三: "山羊",
  和: "盒子",
  頂: "屋頂",
  溪: "吸管",
  行: "行李箱",
  天: "天鵝",
  橋: "翹翹板",
  菜: "青菜",
  寮: "飲料",
  重: "重槌",
  先: "仙人",
  嗇: "塞子",
  頭: "大頭",
  前: "錢幣",
  庄: "西裝",
  莊: "西裝",
  輔: "斧頭",
  丹: "紅丹",
  鳳: "鳳梨",
  迴: "迴旋鏢",
  龍: "恐龍",
  蘆: "蘆筍",
  板: "木板",
  海: "海浪",
  府: "老虎",
  江: "薑餅人",
  子: "紫葡萄",
  翠: "翡翠",
  寺: "獅子",
  善: "扇子",
  導: "導盲犬",
  敦: "盾牌",
  化: "畫筆",
  市: "柿子",
  政: "蒸籠",
  永: "泳圈",
  春: "彈簧",
  後: "猴子",
  埤: "皮球",
  昆: "昆蟲",
  陽: "羊",
  十: "石獅",
  四: "寺廟",
  秀: "袖子",
  朗: "狼",
  平: "瓶子",
  原: "猿猴",
  幸: "星星",
  福: "蝙蝠",
  產: "鏟子",
  業: "葉子",
  碧: "碧玉",
  奉: "鳳梨",
  慈: "瓷碗",
  廣: "光碟",
  社: "蛇",
  生: "花生",
};

function stationSound(name: string): string {
  const exact = wordImages.find(([word]) => word === name);
  if (exact) return exact[1];
  const images = Array.from(name.replace(/[／\s]/g, "")).map(
    char => charImages[char] ?? `${char}字招牌`
  );
  return images.slice(0, 5).join("＋");
}

export function getMrtMnemonic(
  station: MrtStation,
  personal?: Record<string, PersonalMrtMnemonic>
): MrtMnemonic {
  const number = station.code.replace(/^[A-Z]+/, "");
  const numberImages = Array.from(number)
    .map(digit => digitImages[digit] ?? digit)
    .join("＋");
  const sound =
    personal?.[station.code]?.sound.trim() || stationSound(station.name);
  const branch = station.branch ? `，最後闖進「${station.branch}」月台` : "";
  return {
    sound,
    scene: `想像「${sound}」突然擠進捷運，車門上亮出 ${station.code}${branch}。畫面越誇張越好記。`,
    action: `念三拍「${station.code}｜${station.name}｜${sound.split("＋")[0]}」，同時用手比出車門打開。`,
    codeHook: `${station.code}＝${lineImages[station.lineId]}＋${numberImages}。先看路線顏色角色，再看數字道具。`,
  };
}

export function getMrtSegmentMovie(
  stations: MrtStation[],
  personal?: Record<string, PersonalMrtMnemonic>
): string {
  const scenes = stations.map(station => {
    const lead = getMrtMnemonic(station, personal).sound.split("＋")[0];
    return `${station.code} ${station.name}的「${lead}」跳上車`;
  });
  return `${scenes.join("，接著")}。最後全車一起大喊「${stations.map(station => station.name).join("、")}」衝到終點！`;
}

export function offlineMrtCandidates(station: MrtStation): string[] {
  const base = getMrtMnemonic(station).sound;
  return [
    `幽默型：${base}搶著擠進 ${station.code} 車門，跌成一團還大喊「${station.name}到了！」`,
    `故事型：主角拿著${base}，沿月台找到 ${station.code} 門牌，終於抵達${station.name}。`,
    `名人型：想像你最熟悉的名人抱著${base}，在 ${station.code} 宣布下一站是${station.name}。`,
  ];
}

export function speakMrtMnemonic(
  station: MrtStation,
  mnemonic: MrtMnemonic
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window))
    return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(
    `${station.code}。${station.name}。${mnemonic.sound}`
  );
  utterance.lang = "zh-TW";
  utterance.rate = 0.78;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
  return true;
}
