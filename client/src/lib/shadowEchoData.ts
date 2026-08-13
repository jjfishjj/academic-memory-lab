export type ShadowLanguage = "English" | "日本語" | "中文";
export type ShadowDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type ShadowCategory = "城市生活" | "旅行交通" | "咖啡餐飲" | "成長激勵";

export type ShadowLesson = {
  id: string;
  language: ShadowLanguage;
  difficulty: ShadowDifficulty;
  category: ShadowCategory;
  sentence: string;
  ipa: string;
  chunks: string[];
  tip: string;
  targetSeconds: number;
};

export const LANGUAGE_CODES: Record<ShadowLanguage, string> = {
  English: "en-US",
  日本語: "ja-JP",
  中文: "zh-TW",
};

export const SHADOW_CATEGORIES: ShadowCategory[] = ["城市生活", "旅行交通", "咖啡餐飲", "成長激勵"];
export const SHADOW_DIFFICULTIES: ShadowDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

export const SHADOW_LESSONS: ShadowLesson[] = [
  { id: "en-city-01", language: "English", difficulty: "Intermediate", category: "城市生活", sentence: "The city comes alive after dark.", ipa: "/ðə ˈsɪti kʌmz əˈlaɪv ˈæftər dɑːrk/", chunks: ["The city", "comes alive", "after dark"], tip: "重音放在 CITY、ALIVE、DARK。", targetSeconds: 3.1 },
  { id: "en-transit-01", language: "English", difficulty: "Beginner", category: "旅行交通", sentence: "Could you show me the nearest station?", ipa: "/kʊd juː ʃoʊ miː ðə ˈnɪrəst ˈsteɪʃən/", chunks: ["Could you show me", "the nearest", "station"], tip: "把 COULD YOU 自然連音，重音落在 NEAREST STATION。", targetSeconds: 3.8 },
  { id: "en-cafe-01", language: "English", difficulty: "Beginner", category: "咖啡餐飲", sentence: "I'd like a coffee with oat milk, please.", ipa: "/aɪd laɪk ə ˈkɔːfi wɪð oʊt mɪlk pliːz/", chunks: ["I'd like a coffee", "with oat milk", "please"], tip: "LIKE、COFFEE、OAT MILK 是資訊重點。", targetSeconds: 4 },
  { id: "en-transit-02", language: "English", difficulty: "Intermediate", category: "旅行交通", sentence: "The next flight leaves at seven thirty.", ipa: "/ðə nekst flaɪt liːvz æt ˈsevən ˈθɜːrti/", chunks: ["The next flight", "leaves at", "seven thirty"], tip: "NEXT FLIGHT 與 SEVEN THIRTY 要清楚有力。", targetSeconds: 3.7 },
  { id: "en-growth-01", language: "English", difficulty: "Advanced", category: "成長激勵", sentence: "Every small step makes a real difference.", ipa: "/ˈevri smɔːl step meɪks ə riːl ˈdɪfrəns/", chunks: ["Every small step", "makes a real", "difference"], tip: "保持節奏，拉開 SMALL STEP 與 DIFFERENCE。", targetSeconds: 3.9 },
  { id: "ja-city-01", language: "日本語", difficulty: "Intermediate", category: "城市生活", sentence: "夜になると、街が生き生きとしてきます。", ipa: "よるになると、まちがいきいきとしてきます", chunks: ["夜になると", "街が", "生き生きとしてきます"], tip: "「夜」「街」「生き生き」清楚分段。", targetSeconds: 4.5 },
  { id: "ja-transit-01", language: "日本語", difficulty: "Beginner", category: "旅行交通", sentence: "一番近い駅を教えていただけますか。", ipa: "いちばんちかいえきを おしえていただけますか", chunks: ["一番近い駅を", "教えて", "いただけますか"], tip: "保持禮貌語尾的自然下降。", targetSeconds: 4.8 },
  { id: "ja-cafe-01", language: "日本語", difficulty: "Beginner", category: "咖啡餐飲", sentence: "オーツミルクのコーヒーをお願いします。", ipa: "おーつみるくの こーひーを おねがいします", chunks: ["オーツミルクの", "コーヒーを", "お願いします"], tip: "長音不要縮短，語尾自然收尾。", targetSeconds: 4.2 },
  { id: "ja-growth-01", language: "日本語", difficulty: "Advanced", category: "成長激勵", sentence: "小さな一歩が大きな違いを生みます。", ipa: "ちいさないっぽが おおきなちがいをうみます", chunks: ["小さな一歩が", "大きな違いを", "生みます"], tip: "「一歩」短促，「大きな違い」放慢。", targetSeconds: 4.7 },
  { id: "zh-city-01", language: "中文", difficulty: "Intermediate", category: "城市生活", sentence: "入夜之後，整座城市都活了起來。", ipa: "rù yè zhī hòu, zhěng zuò chéng shì dōu huó le qǐ lái", chunks: ["入夜之後", "整座城市", "都活了起來"], tip: "「入夜」「城市」「活起來」是三個節奏錨點。", targetSeconds: 3.8 },
  { id: "zh-transit-01", language: "中文", difficulty: "Beginner", category: "旅行交通", sentence: "可以告訴我最近的車站在哪裡嗎？", ipa: "kě yǐ gào sù wǒ zuì jìn de chē zhàn zài nǎ lǐ ma", chunks: ["可以告訴我", "最近的車站", "在哪裡嗎"], tip: "問句尾音微微上揚，不要每個字都等長。", targetSeconds: 4.2 },
  { id: "zh-cafe-01", language: "中文", difficulty: "Beginner", category: "咖啡餐飲", sentence: "我想要一杯燕麥奶咖啡，謝謝。", ipa: "wǒ xiǎng yào yì bēi yàn mài nǎi kā fēi, xiè xie", chunks: ["我想要一杯", "燕麥奶咖啡", "謝謝"], tip: "量詞與品項連在一起，禮貌語尾放輕。", targetSeconds: 3.8 },
  { id: "zh-growth-01", language: "中文", difficulty: "Advanced", category: "成長激勵", sentence: "每一個小小的行動，都能帶來真正的改變。", ipa: "měi yí gè xiǎo xiǎo de xíng dòng, dōu néng dài lái zhēn zhèng de gǎi biàn", chunks: ["每一個小小的行動", "都能帶來", "真正的改變"], tip: "前半穩定鋪陳，重點落在「真正的改變」。", targetSeconds: 5 },
];

export function lessonsFor(language: ShadowLanguage, difficulty?: ShadowDifficulty, category?: ShadowCategory) {
  const exact = SHADOW_LESSONS.filter((lesson) => lesson.language === language && (!difficulty || lesson.difficulty === difficulty) && (!category || lesson.category === category));
  return exact.length ? exact : SHADOW_LESSONS.filter((lesson) => lesson.language === language);
}

export function dailyLessonIds(date = new Date()) {
  const daySeed = Number(`${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`);
  return [0, 1, 2].map((offset) => SHADOW_LESSONS[(daySeed + offset * 5) % SHADOW_LESSONS.length].id);
}
