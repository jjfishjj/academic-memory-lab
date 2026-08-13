/**
 * 風格備忘：手帳拼貼學院 — 訓練模板資料層
 * 三個新模板：諧音口訣創作家（橘黃系）、情境式劇本殺（紫藍系書頁感）、微動作記憶法（綠色系）
 * 便利貼雙色原則不變：情境類提示 = 亮黃、情感/故事類提示 = 玫瑰粉
 */
import { type KnowledgeItem } from "./gameData";
import { getExpandedMnemonicReferences } from "./expandedMnemonicData";

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

/** 固定順序：[簡單、荒謬、考試型]。三元組型別避免內容增減後標籤錯位。 */
type MnemonicToneReferences = [simple: string, absurd: string, exam: string];
type MnemonicReferenceByStyle = Record<MnemonicStyle["id"], MnemonicToneReferences>;

/** 內建卡包的逐題參考答案；自訂卡包會改用下方的通用靈感模板。 */
const MNEMONIC_REFERENCES: Record<string, MnemonicReferenceByStyle> = {
  e1: {
    homophone: [
      "procrastinate →『不如開始，內拖』：嘴上說開始，心裡還在拖延",
      "pro-cras-ti-nate →『不趕事，拖到累』：事情越擱越多",
      "procrastinate →『拖個事呢』：把該做的事一再往後推，就是拖延",
    ],
    rhyme: [
      "Procrastinate 一直拖，今天不做明天多",
      "先滑手機再工作，滑到天黑才驚覺：作業還在等我",
      "想做卻不做，事情往後挪；procrastinate，就是一再拖延",
    ],
    meme: [
      "沒人：…… 我：先滑五分鐘。procrastinate：計畫通。",
      "截止日：明天見。procrastinate 的我：太好了，今天不用見。",
      "考題問 procrastinate：不是不會做，而是把該做的事往後拖。",
    ],
    "story-chain": [
      "P-R-O：怕任務、繞開它、偶爾才動手——這就是拖延",
      "PRO：Plan 先寫好、Rest 休息一下、Oops 已經半夜了",
      "定義鏈：看見該做的事 → 往後延 → 最後才動手＝procrastinate",
    ],
  },
  e2: {
    homophone: [
      "ambiguous →『俺比你更糊』：意思模糊、可以有多種解釋",
      "ambiguous →『按筆又擱置』：答案不明確，筆都不知道選哪個",
      "ambiguous →『俺比你更糊』：有多種解釋、不明確，就是模稜兩可",
    ],
    rhyme: [
      "Ambiguous 說不明，一句話有兩種情",
      "A 也行，B 也像，答案在岔路口原地晃",
      "講得模糊不清楚，ambiguous 有多種解釋可讀",
    ],
    meme: [
      "老師：答案是 A 還是 B？ambiguous：Yes。",
      "老師：只能選 A 或 B。ambiguous：我選『看情況』。",
      "考題看到 ambiguous：抓住『不明確、可有多種解釋』兩個關鍵。",
    ],
    "story-chain": [
      "A-M-B：A 面、模糊地帶、B 面——兩種解釋都說得通",
      "A 問答案，M 迷路了，B 又冒出來：結果還是不明確",
      "定義鏈：左右都像 → 沒有明確答案 → 可作多種解釋＝ambiguous",
    ],
  },
  e3: {
    homophone: [
      "nostalgia →『老是想家』：想起過去就湧上懷舊感",
      "nostalgia →『腦思舊呀』：大腦突然把童年回憶整季重播",
      "nostalgia →『那時的家』：對過去時光的想念，也就是懷舊或鄉愁",
    ],
    rhyme: [
      "Nostalgia 翻舊照，往日時光忘不掉",
      "老歌一響人定格，腦內十年前的 MV 自動播",
      "舊物、舊景、舊味道，nostalgia 是對過去的想念報到",
    ],
    meme: [
      "看到童年零食的我：nostalgia.exe 已啟動。",
      "老歌前奏才兩秒，我的大腦：十年前回憶全集立即上架。",
      "考題問 nostalgia：看到舊物而想念過去，答案是懷舊或鄉愁。",
    ],
    "story-chain": [
      "N-O-S：念起往事、Old days 重播、思念湧上來",
      "舊照片打開門 → 老歌跑出來 → 老朋友坐滿房間，回憶突然開同學會",
      "定義鏈：舊景觸發 → 想起往日時光 → 產生懷舊與鄉愁＝nostalgia",
    ],
  },
  e4: {
    homophone: [
      "resilient →『仍是力人』：受挫之後依然有力站起來",
      "resilient →『人是練的』：越受磨練，恢復力越強",
      "resilient →『立時彈』：受挫後能快速恢復、重新站起來",
    ],
    rhyme: [
      "Resilient 不怕摔，彈回原位再重來",
      "生活把我壓成餅，resilient 像彈簧咻一聲回原形",
      "遇到挫折能恢復，resilient 有韌性、站得住",
    ],
    meme: [
      "生活：把我擊倒。resilient 的我：復活時間 0 秒。",
      "困難：這次你完了。resilient：不好意思，我有無限復活存檔。",
      "考題看到 resilient：受挫後快速恢復，意思是有韌性的。",
    ],
    "story-chain": [
      "R-E-S：Recover 恢復、Endure 撐住、Stand 再站起來",
      "暴風吹彎小樹 → 樹幹變彈簧 → 天晴立刻站軍姿",
      "能力鏈：受到挫折 → 調整 → 快速復原＝resilient 有韌性",
    ],
  },
  e5: {
    homophone: [
      "meticulous →『每題扣螺絲』：每個細節都仔細鎖緊",
      "meticulous →『沒踢口漏絲』：連一根鬆掉的螺絲都不漏看",
      "meticulous →『每題都留心』：極度講究細節、一絲不苟",
    ],
    rhyme: [
      "Meticulous 看得細，一絲不苟抓到底",
      "逗號歪了一小步，meticulous 拿尺追到天涯路",
      "步驟逐項不疏忽，meticulous 對細節極度講究",
    ],
    meme: [
      "大家：差不多就好。meticulous：那個逗號歪了 0.1 mm。",
      "別人檢查一次就交件；meticulous：第七輪才剛熱身。",
      "考題問 meticulous：不是普通小心，是對細節一絲不苟。",
    ],
    "story-chain": [
      "M-E-T：每個細節、Examine 檢查、通通不漏掉",
      "拿放大鏡看字 → 用尺量逗號 → 再請螞蟻驗收細節",
      "特徵鏈：逐項檢查 → 不漏細節 → 一絲不苟＝meticulous",
    ],
  },
  h1: {
    homophone: [
      "1789 →『一起扒舊』：攻佔巴士底，開始扒掉舊制度",
      "一七八九 →『一起罷舊』：攻進巴士底，革命正式爆發",
      "1789 →『一起罷舊』：攻佔巴士底、革命爆發；1792 年才廢除君主制",
    ],
    rhyme: [
      "一七八九法國吼，巴士底獄被攻破",
      "國王椅子開始晃，人民怒火衝進巴士底高牆",
      "一七八九巴士底破，革命爆發；一七九二君主制落",
    ],
    meme: [
      "法國人民：日子過不下去。巴士底監獄：怎麼大家都來我家？",
      "波旁王朝：應該還穩吧？1789：系統通知，革命模式已啟動。",
      "考題版：1789 攻佔巴士底、法國大革命爆發；1792 年廢除君主制。",
    ],
    "story-chain": [
      "巴—王—自：攻巴士底、倒王朝、喊自由",
      "人民不滿舊制度 → 1789 攻佔巴士底 → 1792 王冠才滾出議會",
      "事件鏈：1789 攻巴士底、革命爆發 → 1792 廢除君主制",
    ],
  },
  h2: {
    homophone: [
      "1969 →『依舊溜久』：阿波羅一路溜到月球",
      "一九六九 →『要溜去月球』：阿姆斯壯準備出發",
      "1969 →『一腳留久』：阿波羅 11 號完成人類首次登月，阿姆斯壯踏出第一步",
    ],
    rhyme: [
      "一九六九上月球，阿姆斯壯第一步走",
      "月球本想安靜睡，阿波羅十一敲門說借過一下喂",
      "一九六九阿波羅十一，人類首次登月，阿姆斯壯第一步",
    ],
    meme: [
      "人類：地球逛膩了。阿波羅 11：那去月球吧。",
      "月球：今天應該很安靜。阿姆斯壯：哈囉，我來留下全人類的腳印。",
      "考題版：1969 阿波羅 11 號首次載人登月，第一步是阿姆斯壯。",
    ],
    "story-chain": [
      "阿—十—月：阿波羅、十一號、登月成功",
      "火箭衝出地球 → 月球鋪紅毯 → 阿姆斯壯用一小步完成宇宙打卡",
      "事件鏈：1969 阿波羅 11 升空 → 人類首次登月 → 阿姆斯壯第一步",
    ],
  },
  h3: {
    homophone: [
      "1517 →『要我一起』：馬丁路德邀大家一起改革",
      "一五一七 →『要悟一起』：看懂贖罪券問題，一起反思",
      "1517 →『一屋議題』：馬丁路德提出九十五條論綱，批判贖罪券濫用",
    ],
    rhyme: [
      "一五一七論綱貼，贖罪券制被挑戰",
      "別人抱怨寫一點，路德九十五條貼滿整面牆邊",
      "一五一七路德提九十五條，批贖罪券濫用，宗教改革掀浪潮",
    ],
    meme: [
      "教會：買券就安心。馬丁路德：我有 95 個問題。",
      "別人發一篇抱怨文；馬丁路德直接上傳九十五集長篇連載。",
      "考題版：1517 馬丁路德提出九十五條論綱，批判贖罪券的濫用。",
    ],
    "story-chain": [
      "馬—九—贖：馬丁路德、九十五條、批判贖罪券濫用",
      "贖罪券開店 → 路德抱來九十五張意見單 → 改革大門被敲到打開",
      "事件鏈：1517 贖罪券濫用爭議 → 九十五條論綱 → 宗教改革",
    ],
  },
  h4: {
    homophone: [
      "1929 →『依舊餓久』：大恐慌讓許多人窮餓很久",
      "一九二九 →『一跌餓久』：股市一跌，經濟低迷許久",
      "1929 →『一跌餓久』：華爾街股災後，經濟危機蔓延成全球大恐慌",
    ],
    rhyme: [
      "一九二九股市落，黑色星期全球縮",
      "股票溜滑梯不停，錢包跟工作一起跌到找不清",
      "一九二九華爾街跌，金融與實體危機交織，全球大恐慌蔓延",
    ],
    meme: [
      "華爾街：只是跌一下。全球經濟：我先躺很多年。",
      "1929 投資人的螢幕：沒有當機，只是數字集體跳樓。",
      "考題版：1929 華爾街股災是大恐慌的重要開端，危機隨後蔓延全球。",
    ],
    "story-chain": [
      "華—崩—蕭：華爾街、股市崩盤、全球蕭條",
      "股價坐溜滑梯 → 銀行關水龍頭 → 失業像骨牌一路倒遍全球",
      "事件鏈：1929 華爾街股災 → 銀行危機與失業惡化 → 全球大恐慌",
    ],
  },
  h5: {
    homophone: [
      "1453 →『要死我傷』：君士坦丁堡陷落，東羅馬終結",
      "一四五三 →『一世我散』：延續千年的帝國在此解散",
      "1453 →『要失我城』：君士坦丁堡陷落、東羅馬滅亡、鄂圖曼崛起",
    ],
    rhyme: [
      "一四五三城門破，東羅馬亡鄂圖坐",
      "千年老店門一晃，鄂圖曼搬來招牌當新店長",
      "一四五三君堡落，東羅馬亡，鄂圖曼帝國崛起",
    ],
    meme: [
      "東羅馬：我還能撐。鄂圖曼：城門已經打開了。",
      "君士坦丁堡 1453 更新：千年伺服器關機，鄂圖曼接手管理員。",
      "考題版：1453 君士坦丁堡陷落，東羅馬滅亡、鄂圖曼崛起。",
    ],
    "story-chain": [
      "君—東—鄂：君堡陷落、東羅馬亡、鄂圖曼興",
      "大砲敲城門 → 千年帝國拉下布幕 → 鄂圖曼抱著新招牌登台",
      "事件鏈：1453 鄂圖曼攻陷君堡 → 東羅馬滅亡 → 鄂圖曼崛起",
    ],
  },
  c1: {
    homophone: [
      "Na 鈉 →『哪！』一碰水就激動，火焰還變黃",
      "鈉 →『那個很炸』：遇水反應劇烈要小心",
      "Na 鈉 →『哪有安靜』：活潑金屬，遇水劇烈反應、焰色呈黃，也存在食鹽中",
    ],
    rhyme: [
      "鈉碰水，脾氣大；黃色火焰啪啦啪",
      "鈉見水就跳恰恰，還把整個舞台點成黃色啦",
      "Na 鈉是活潑金屬，遇水劇烈、焰色黃，食鹽裡也住",
    ],
    meme: [
      "沒人：…… 鈉：碰到水直接爆氣。",
      "水：交個朋友？鈉：可以，我會用爆炸級熱情歡迎你。",
      "考題版：Na 是活潑金屬，遇水劇烈反應，焰色為黃色，存在食鹽中。",
    ],
    "story-chain": [
      "水—黃—鹽：遇水劇烈、黃焰、存在食鹽",
      "鈉跳進水池 → 熱到四處亂跑 → 黃色警報燈照亮整間教室",
      "性質鏈：Na 鈉 → 遇水劇烈 → 黃色焰色 → 食鹽成分",
    ],
  },
  c2: {
    homophone: [
      "He 氦 →『嘿』！它很輕又淡定，是惰性氣體",
      "氦 →『還不理』：別的元素邀它反應，它還是不理",
      "He 氦 →『很輕』：最輕的惰性氣體、化性安定；不可刻意吸入",
    ],
    rhyme: [
      "氦氣輕，性情靜，聲道共振變高才聽來尖細",
      "氦坐氣球飛上天，拿著警示牌：別吸我來唱高音",
      "He 氦是最輕的惰性氣體、化性安定；吸入有缺氧風險",
    ],
    meme: [
      "其他元素：來反應啊！氦：不了，我是惰性氣體。",
      "元素派對忙配對；氦坐角落搭氣球升空：單身才是最高境界。",
      "考題版：He 是最輕的惰性氣體、化性安定；氦中聲速使聲道共振改變，非聲帶基頻升高。",
    ],
    "story-chain": [
      "輕—惰—尖：氣體輕、化性安定、聲道共振讓聲音聽來尖細",
      "氦拒絕反應邀請 → 搭氣球升天 → 舉牌提醒吸入可能缺氧",
      "性質鏈：He 氦 → 最輕惰性氣體 → 化性安定 → 不可刻意吸入",
    ],
  },
  c3: {
    homophone: [
      "Fe 鐵 →『飛』再遠也會氧化生鏽，血液裡也需要它",
      "鐵 →『貼著血』：血紅素核心少不了鐵",
      "Fe 鐵 →『非它不可』：易氧化生鏽，也是血紅素核心與人體必需微量元素",
    ],
    rhyme: [
      "鐵會鏽、血帶紅，人體缺它可不行",
      "鐵在欄杆忙生鏽，轉身進血液穿紅衣運氧到處走",
      "Fe 鐵易氧化生鏽，是血紅素核心，也是人體必需微量元素",
    ],
    meme: [
      "鐵：我很堅強。氧氣：那你怎麼又生鏽了？",
      "鐵在欄杆上忙生鏽，進血液立刻換紅制服當氧氣物流隊長。",
      "考題版：Fe 易氧化生鏽；在人體中是血紅素核心與必需微量元素。",
    ],
    "story-chain": [
      "鏽—血—必：會生鏽、在血紅素、人體必需",
      "小鐵人先在欄杆生鏽 → 跳進血液換紅衣 → 開氧氣運輸車",
      "性質鏈：Fe 鐵 → 易氧化生鏽 → 血紅素核心 → 人體必需",
    ],
  },
  c4: {
    homophone: [
      "Cl 氯 →『洗囉』！含氯藥劑能消毒，氯氣本身有毒",
      "氯 →『綠又嗆』：黃綠色氣體，聞起來很刺激",
      "Cl 氯 →『池裡』：黃綠色有毒氣體；含氯藥劑可用於泳池消毒",
    ],
    rhyme: [
      "氯氣黃綠且有毒，含氯藥劑池裡消毒",
      "氯穿黃綠衣進泳池，細菌嚇到集體辦理退池",
      "Cl 氯是黃綠色有毒氣體；含氯藥劑可消毒，泳池刺鼻味多來自氯胺",
    ],
    meme: [
      "細菌：游泳囉！含氯消毒劑：今天泳池由我管理。",
      "氯一進泳池，細菌群組立刻顯示：全體被管理員強制登出。",
      "考題版：Cl₂ 是黃綠色有毒氣體；含氯藥劑可消毒，泳池刺鼻味多來自氯胺。",
    ],
    "story-chain": [
      "黃—毒—消：氯氣黃綠有毒、含氯藥劑可消毒",
      "氯穿黃綠制服走進泳池 → 鼻子拉警報 → 細菌拖行李逃跑",
      "性質鏈：Cl₂ 氯氣黃綠有毒 → 含氯藥劑消毒 → 氯胺造成泳池刺鼻味",
    ],
  },
  c5: {
    homophone: [
      "Au 金 →『喔！』金不怕腐蝕，還能拉得很長",
      "Au →『好拉喔』：延展性極佳，一克能拉兩公里",
      "Au 金 →『禁鏽』：延展性極佳、抗腐蝕，一克可拉成約兩公里細絲",
    ],
    rhyme: [
      "黃金延展不怕蝕，一克拉成兩公里",
      "一克黃金伸懶腰，直接從教室一路拉到兩公里外報到",
      "Au 金延展性極佳又抗腐蝕，一克可拉成約兩公里細絲",
    ],
    meme: [
      "其他金屬：我生鏽了。金：抱歉，我抗腐蝕。",
      "一克黃金：我很少。延展性：沒關係，我把你拉到兩公里那麼長。",
      "考題版：Au 的延展性極佳且抗腐蝕，一克金可拉成約兩公里細絲。",
    ],
    "story-chain": [
      "延—抗—長：延展性佳、抗腐蝕、能拉長絲",
      "金師傅穿防鏽衣 → 被壓成薄箔 → 又伸成兩公里超長麵線",
      "性質鏈：Au 金 → 可成箔與長絲 → 延展性佳 → 抗腐蝕",
    ],
  },
};

export function getMnemonicReferences(item: KnowledgeItem, style: MnemonicStyle): string[] {
  const tailored = MNEMONIC_REFERENCES[item.id]?.[style.id];
  const expanded = getExpandedMnemonicReferences(item.id, style.id as "homophone" | "rhyme" | "meme" | "story-chain");
  const generic: Record<MnemonicStyle["id"], string> = {
    homophone: `${item.term} → 把讀音拆成中文近音，再接上「${item.hint}」的畫面`,
    rhyme: `${item.term} 記心頭，${item.hint} 不會漏`,
    meme: `沒人：…… ${item.term}：我就是「${item.hint}」本人。`,
    "story-chain": `${item.term} → 抓出關鍵字頭，串成一幕和「${item.hint}」有關的荒謬故事`,
  };
  const alternate: Record<MnemonicStyle["id"], string> = {
    homophone: `把「${item.term}」唸快一點，想像近音角色大喊：${item.hint}！`,
    rhyme: `${item.term} 唸三遍，${item.hint} 就出現`,
    meme: `傳說中的 ${item.term}：表面很普通，實際上是「${item.hint}」。`,
    "story-chain": `先抓「${item.term}」的三個關鍵字頭，再讓它們依序演出「${item.hint}」`,
  };
  const visual: Record<MnemonicStyle["id"], string> = {
    homophone: `${item.term} → 用最像的中文聲音，配上一幕「${item.hint}」的誇張畫面`,
    rhyme: `看到 ${item.term} 不發愁，想到「${item.hint}」就點頭`,
    meme: `老師：請解釋 ${item.term}。我：這不就是「${item.hint}」的迷因本因？`,
    "story-chain": `${item.term} 的字頭排隊出發，最後一起找到「${item.hint}」`,
  };

  return tailored ?? expanded ?? [generic[style.id], alternate[style.id], visual[style.id]];
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
