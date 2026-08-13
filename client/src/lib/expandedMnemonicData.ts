export type ExpandedSubject = "english" | "history" | "chemistry" | "biology" | "geography";
export type ExpandedStyleId = "homophone" | "rhyme" | "meme" | "story-chain";

export interface ExpandedMnemonicItem {
  id: string;
  subject: ExpandedSubject;
  term: string;
  hint: string;
  extra: string;
  sound: string;
  image: string;
  anchor: string;
  chain: string;
}

/**
 * 第二批離線題庫：每題四個人工校正素材，再組成
 * 4 種記憶模式 × [簡單、荒謬、考試型] = 12 句。
 */
export const EXPANDED_MNEMONIC_ITEMS: ExpandedMnemonicItem[] = [
  // English e6–e25
  { id: "e6", subject: "english", term: "inevitable", hint: "不可避免的", extra: "形容詞：一定會發生、無法避開", sound: "一來必到", image: "命運快遞繞過十道門，最後仍把包裹送到你手上", anchor: "inevitable 表示無法避免、必然發生", chain: "事件逼近 → 無法躲開 → 必然發生" },
  { id: "e7", subject: "english", term: "reluctant", hint: "不情願的", extra: "形容詞：勉強去做、不太願意", sound: "人拉著看", image: "雙腳黏在地板上，被三個朋友拉去上台", anchor: "reluctant 表示不情願、勉強的", chain: "心裡拒絕 → 動作遲疑 → 勉強答應" },
  { id: "e8", subject: "english", term: "obsolete", hint: "過時的、淘汰的", extra: "形容詞：被新技術或做法取代", sound: "喔！不使用", image: "傳真機戴著退休帽，在智慧型手機店門口排隊", anchor: "obsolete 表示已過時、被淘汰", chain: "新事物出現 → 舊功能不用 → 遭到淘汰" },
  { id: "e9", subject: "english", term: "vulnerable", hint: "脆弱、易受傷害的", extra: "形容詞：容易受到攻擊或影響", sound: "防護不能", image: "紙盔甲遇到一滴雨就宣布全面破防", anchor: "vulnerable 表示脆弱、易受傷害", chain: "保護不足 → 容易受攻擊 → 可能受傷" },
  { id: "e10", subject: "english", term: "contemplate", hint: "深思、仔細考慮", extra: "動詞：長時間認真思考", sound: "空著腦袋想", image: "一顆大腦坐在會議室，和八個自己開整晚會議", anchor: "contemplate 表示深思、仔細考慮", chain: "停下來 → 多角度思考 → 再做決定" },
  { id: "e11", subject: "english", term: "deteriorate", hint: "惡化、衰退", extra: "動詞：情況或品質逐漸變差", sound: "低到又累", image: "健康值坐溜滑梯，從滿格一路滑到紅色警報", anchor: "deteriorate 表示逐漸惡化、衰退", chain: "狀況下降 → 問題加重 → 品質變差" },
  { id: "e12", subject: "english", term: "substantial", hint: "大量的、實質的", extra: "形容詞：數量可觀或重要而真實", sound: "塞不下喔", image: "報告厚到書包拉鍊投降，桌子也被壓彎", anchor: "substantial 可表示大量的、可觀的或實質的", chain: "份量很大 → 影響明顯 → 並非微不足道" },
  { id: "e13", subject: "english", term: "skeptical", hint: "懷疑的", extra: "形容詞：不輕易相信、需要證據", sound: "是假的喔", image: "偵探拿放大鏡檢查連早餐蛋餅都有沒有證據", anchor: "skeptical 表示抱持懷疑、不輕信", chain: "聽到主張 → 要求證據 → 暫不相信" },
  { id: "e14", subject: "english", term: "compassion", hint: "同情、關懷", extra: "名詞：理解他人痛苦並想提供幫助", sound: "看別人傷", image: "看到同學跌倒，愛心立刻穿上救護背心衝出去", anchor: "compassion 是理解他人痛苦並願意關懷幫助", chain: "看見痛苦 → 產生同理 → 願意幫助" },
  { id: "e15", subject: "english", term: "versatile", hint: "多才多藝、用途廣的", extra: "形容詞：能適應多種工作或用途", sound: "萬事都行", image: "一支筆同時變成雨傘、湯匙、吉他和火箭", anchor: "versatile 表示多才多藝或用途廣泛", chain: "能力多元 → 適應不同任務 → 用途廣泛" },
  { id: "e16", subject: "english", term: "authentic", hint: "真實的、正宗的", extra: "形容詞：不是仿冒，真誠可信", sound: "喔，是真的", image: "真品拿出身分證，仿冒品當場戴假鬍子逃跑", anchor: "authentic 表示真實、正宗或真誠的", chain: "來源可查 → 並非仿冒 → 真實可信" },
  { id: "e17", subject: "english", term: "fluctuate", hint: "波動、起伏", extra: "動詞：數值不斷上下變化", sound: "浮來去欸", image: "物價搭雲霄飛車，一秒衝頂下一秒俯衝", anchor: "fluctuate 表示數值上下波動", chain: "數值上升 → 接著下降 → 持續起伏" },
  { id: "e18", subject: "english", term: "coherent", hint: "連貫、條理清楚的", extra: "形容詞：想法彼此連接且容易理解", sound: "口合一喔", image: "散落句子排成火車，每節車廂都接得剛剛好", anchor: "coherent 表示連貫且有條理", chain: "想法排序 → 前後連接 → 容易理解" },
  { id: "e19", subject: "english", term: "intricate", hint: "錯綜複雜的", extra: "形容詞：包含許多細節與交錯部分", sound: "硬拆開", image: "一百條耳機線在抽屜裡結成一座迷宮", anchor: "intricate 表示細節繁多、錯綜複雜", chain: "細節眾多 → 彼此交錯 → 結構複雜" },
  { id: "e20", subject: "english", term: "allocate", hint: "分配、撥給", extra: "動詞：按計畫分派時間、金錢或資源", sound: "挪給它", image: "資源隊長拿披薩尺，把時間和預算切成整齊小塊", anchor: "allocate 表示分配或撥給資源", chain: "盤點資源 → 按需求分派 → 各自取得份額" },
  { id: "e21", subject: "english", term: "profound", hint: "深刻的、深遠的", extra: "形容詞：具有很深意義或影響", sound: "破防很深", image: "一句話鑽進心底地下十八層，還在牆上刻字", anchor: "profound 表示意義深刻或影響深遠", chain: "超越表面 → 深入核心 → 影響長久" },
  { id: "e22", subject: "english", term: "feasible", hint: "可行的", extra: "形容詞：實際上能夠完成或實施", sound: "可以走", image: "計畫穿上鞋子，真的走過成本、時間和技術三道關卡", anchor: "feasible 表示實際可行、能夠實施", chain: "條件具備 → 能夠執行 → 計畫可行" },
  { id: "e23", subject: "english", term: "consensus", hint: "共識", extra: "名詞：團體經討論形成共同意見", sound: "看誰先說", image: "十張嘴吵成一團，最後共同舉起同一張答案牌", anchor: "consensus 是團體形成的共同意見", chain: "多人討論 → 協調差異 → 形成共識" },
  { id: "e24", subject: "english", term: "diligent", hint: "勤奮的", extra: "形容詞：持續認真努力、不偷懶", sound: "一直練", image: "別人睡覺時，鉛筆自己戴頭燈繼續寫題目", anchor: "diligent 表示勤奮、持續認真努力", chain: "固定投入 → 認真完成 → 長期不懈" },
  { id: "e25", subject: "english", term: "transient", hint: "短暫的", extra: "形容詞：只存在很短時間", sound: "轉瞬間", image: "彩虹才打卡一秒，就提著行李下班", anchor: "transient 表示短暫、很快消逝", chain: "短暫出現 → 停留不久 → 很快消失" },

  // History h6–h25
  { id: "h6", subject: "history", term: "前 221 秦統一六國", hint: "秦王政完成統一，建立皇帝制度與中央集權帝國", extra: "西元前 221 年；統一文字、度量衡與貨幣", sound: "前二二一，秦合一", image: "六國拼圖被秦始皇啪一聲拼成完整地圖", anchor: "西元前 221 年秦統一六國，推行文字、度量衡與貨幣統一", chain: "滅六國 → 建帝國 → 推行制度統一" },
  { id: "h7", subject: "history", term: "前 202 漢朝建立", hint: "劉邦建立漢朝，定都長安", extra: "楚漢相爭結束，西漢開始", sound: "二零二，劉邦就位", image: "楚漢棋盤收起來，劉邦把長安旗插上王座", anchor: "西元前 202 年劉邦建立漢朝並定都長安", chain: "楚漢相爭 → 劉邦勝出 → 西漢建立" },
  { id: "h8", subject: "history", term: "618 唐朝建立", hint: "李淵建立唐朝，定都長安", extra: "隋末群雄並起後建立新王朝", sound: "六一八，李淵發", image: "李淵按下六一八開機鍵，長安城亮起唐朝招牌", anchor: "618 年李淵建立唐朝、定都長安", chain: "隋末動亂 → 李淵起兵 → 唐朝建立" },
  { id: "h9", subject: "history", term: "960 宋朝建立", hint: "趙匡胤陳橋兵變，建立北宋", extra: "定都開封；杯酒釋兵權強化中央", sound: "九六零，宋開鈴", image: "陳橋黃袍像快遞包裹，直接套到趙匡胤身上", anchor: "960 年趙匡胤經陳橋兵變建立北宋，定都開封", chain: "陳橋兵變 → 黃袍加身 → 北宋建立" },
  { id: "h10", subject: "history", term: "1215 大憲章", hint: "英王約翰接受《大憲章》，王權受到法律限制", extra: "英國憲政發展的重要里程碑", sound: "一二一五，王也受制", image: "國王的皇冠被一條寫著法律的安全帶扣住", anchor: "1215 年英王約翰接受《大憲章》，確認王權亦受法律約束", chain: "貴族施壓 → 簽署大憲章 → 限制王權" },
  { id: "h11", subject: "history", term: "1492 哥倫布航行", hint: "哥倫布率船隊橫渡大西洋抵達加勒比海", extra: "並非第一位到達美洲的人；開啟持續的歐洲殖民交流", sound: "一四九二，航向加勒比", image: "三艘船把大西洋當超大藍色跑步機一直划", anchor: "1492 年哥倫布抵達加勒比海，促成歐洲與美洲持續接觸", chain: "橫渡大西洋 → 抵達加勒比 → 跨大西洋交流擴大" },
  { id: "h12", subject: "history", term: "1648 西發里亞和約", hint: "結束三十年戰爭，重整歐洲政治秩序", extra: "常被視為近代主權國家體系的重要節點", sound: "一路是發，戰火停下", image: "歐洲各國把三十年份的戰火塞進和約滅火器", anchor: "1648 年西發里亞和約結束三十年戰爭，重整歐洲秩序", chain: "宗教戰爭 → 和約談判 → 主權秩序發展" },
  { id: "h13", subject: "history", term: "1688 光榮革命", hint: "英國議會迎立威廉與瑪麗，詹姆士二世退位", extra: "1689《權利法案》強化議會權力", sound: "一路發發，議會發話", image: "議會拿手電筒照皇冠，國王只好把權力說明書交出來", anchor: "1688 年光榮革命後，1689《權利法案》強化議會權力", chain: "政權更替 → 權利法案 → 君主立憲深化" },
  { id: "h14", subject: "history", term: "1776 美國獨立宣言", hint: "北美十三州宣布脫離英國", extra: "宣言主張人生而平等與不可剝奪權利", sound: "一起起義，宣布獨立", image: "十三州同時按下退群鍵，群組名稱改成美利堅", anchor: "1776 年北美十三州發表《獨立宣言》，宣布脫離英國", chain: "殖民衝突 → 發表宣言 → 爭取獨立" },
  { id: "h15", subject: "history", term: "1815 維也納會議", hint: "拿破崙戰爭後列強重整歐洲秩序", extra: "追求勢力均衡與正統原則", sound: "一八一五，列強排舞", image: "歐洲地圖被列強當拼圖，在舞會桌上重新排列", anchor: "1815 年維也納會議以勢力均衡與正統原則重整歐洲", chain: "拿破崙戰敗 → 列強會議 → 重建均勢" },
  { id: "h16", subject: "history", term: "1840 鴉片戰爭", hint: "清朝與英國爆發第一次鴉片戰爭", extra: "1842《南京條約》為戰後重要不平等條約", sound: "一八四零，戰船駛臨", image: "英國砲艦敲開清朝港口，條約卷軸跟著滾進來", anchor: "1840 年第一次鴉片戰爭爆發，1842 年清朝簽訂《南京條約》", chain: "貿易衝突 → 鴉片戰爭 → 南京條約" },
  { id: "h17", subject: "history", term: "1868 明治維新", hint: "日本明治政府推動政治、軍事、經濟與教育改革", extra: "廢藩置縣、富國強兵與殖產興業", sound: "一八六八，明治起跑", image: "日本把武士刀、工廠和教科書一起塞進改革火箭", anchor: "1868 年明治維新展開，推動廢藩置縣、殖產興業與富國強兵", chain: "政權更替 → 制度改革 → 近代化加速" },
  { id: "h18", subject: "history", term: "1911 辛亥革命", hint: "武昌起義引發革命，各省陸續響應", extra: "1912 中華民國成立，清帝退位", sound: "一九一一，武昌一擊", image: "武昌第一聲槍響像群組通知，各省接連按下響應", anchor: "1911 年武昌起義引發辛亥革命；1912 年中華民國成立、清帝退位", chain: "武昌起義 → 各省響應 → 帝制終結" },
  { id: "h19", subject: "history", term: "1914 第一次世界大戰", hint: "奧匈皇儲遇刺後，歐洲同盟體系連鎖捲入戰爭", extra: "戰爭延續至 1918 年", sound: "一九一四，一刺開戰", image: "一張同盟骨牌倒下，整個歐洲地圖跟著連環倒", anchor: "1914 年薩拉熱窩事件成為導火線，同盟體系使戰爭擴大", chain: "皇儲遇刺 → 動員宣戰 → 世界大戰" },
  { id: "h20", subject: "history", term: "1919 凡爾賽條約", hint: "協約國與德國簽訂一戰後和約", extra: "重劃疆界並對德國課以嚴格條件；國際聯盟成立於戰後體系", sound: "一九一九，和約要求", image: "德國收到一張超長戰後帳單，捲軸一路滾出宮殿", anchor: "1919 年《凡爾賽條約》處理對德和約，構成一戰後秩序的一部分", chain: "一戰停火 → 巴黎和會 → 凡爾賽體系" },
  { id: "h21", subject: "history", term: "1939 第二次世界大戰", hint: "德國入侵波蘭後，英法對德宣戰", extra: "歐洲戰事爆發；亞洲戰爭已有更早背景", sound: "一九三九，德軍波蘭走", image: "坦克越過波蘭邊界，英法的宣戰警鈴立刻大響", anchor: "1939 年德國入侵波蘭，英法對德宣戰，歐洲二戰爆發", chain: "入侵波蘭 → 英法宣戰 → 歐洲全面戰爭" },
  { id: "h22", subject: "history", term: "1945 聯合國成立", hint: "《聯合國憲章》生效，聯合國正式成立", extra: "目標包括維護國際和平與安全", sound: "一九四五，聯手護世", image: "各國把破掉的地球搬進會議室，一起貼上和平膠帶", anchor: "1945 年《聯合國憲章》生效，聯合國正式成立", chain: "二戰浩劫 → 簽署憲章 → 聯合國成立" },
  { id: "h23", subject: "history", term: "1949 中華人民共和國成立", hint: "中華人民共和國中央人民政府宣告成立", extra: "10 月 1 日於北京舉行開國大典", sound: "一九四九，北京立國", image: "北京城門掛上新國號，日曆翻到十月一日", anchor: "1949 年 10 月 1 日中華人民共和國中央人民政府宣告成立", chain: "內戰局勢 → 北京宣告 → 新政權成立" },
  { id: "h24", subject: "history", term: "1961 柏林圍牆興建", hint: "東德封鎖東西柏林邊界並築牆", extra: "圍牆成為冷戰分裂的重要象徵", sound: "一九六一，一牆隔離", image: "柏林一夜長出巨大拉鍊，城市被硬生生分成兩半", anchor: "1961 年東德興建柏林圍牆，成為冷戰分裂象徵", chain: "人口外流 → 邊界封鎖 → 圍牆象徵冷戰" },
  { id: "h25", subject: "history", term: "1989 柏林圍牆開放", hint: "東德放寬旅行限制後，民眾湧向關卡，圍牆開放", extra: "象徵東歐劇變與冷戰秩序瓦解", sound: "一九八九，一起扒牆", image: "柏林人帶著小鐵鎚，把冷戰牆敲成紀念品", anchor: "1989 年柏林圍牆開放，象徵冷戰分裂走向終結", chain: "改革壓力 → 關卡開放 → 圍牆倒下" },

  // Chemistry c6–c25
  { id: "c6", subject: "chemistry", term: "H 氫", hint: "最輕的元素，常以 H₂ 分子存在", extra: "可燃；燃燒生成水，但與空氣混合可能爆炸", sound: "輕輕的氫", image: "氫氣球背著第一名獎牌，點火就變成水滴煙火", anchor: "H 是最輕元素；H₂ 可燃，與氧反應生成水", chain: "質量最輕 → H₂ 可燃 → 燃燒生成水" },
  { id: "c7", subject: "chemistry", term: "O 氧", hint: "支持燃燒，也是細胞呼吸的重要反應物", extra: "空氣中 O₂ 約占體積 21%", sound: "氧氣養火", image: "氧拿著扇子幫火焰加油，又跑進細胞發電廠", anchor: "O₂ 約占空氣 21%，支持燃燒並參與細胞呼吸", chain: "空氣成分 → 助燃 → 細胞呼吸" },
  { id: "c8", subject: "chemistry", term: "C 碳", hint: "能形成多樣化合物，是有機物骨架核心", extra: "同素異形體包括鑽石與石墨", sound: "碳會搭骨架", image: "同一群碳原子換隊形，一邊變鑽石一邊變鉛筆芯", anchor: "C 能形成多種有機化合物；鑽石與石墨是同素異形體", chain: "多樣鍵結 → 有機骨架 → 鑽石與石墨" },
  { id: "c9", subject: "chemistry", term: "N 氮", hint: "空氣中含量最多的氣體元素", extra: "N₂ 約占空氣體積 78%，化性在常溫下較安定", sound: "氮占大半", image: "氮坐滿空氣電影院七成八座位，卻安靜得不想反應", anchor: "N₂ 約占空氣體積 78%，常溫下相對安定", chain: "空氣最多 → N₂ 三鍵 → 常溫較安定" },
  { id: "c10", subject: "chemistry", term: "K 鉀", hint: "活潑的鹼金屬，遇水反應劇烈", extra: "鉀離子是神經與肌肉功能的重要電解質", sound: "鉀碰水會炸", image: "鉀穿紫色焰火衣跳進水盆，立刻上演暴走秀", anchor: "K 是活潑鹼金屬，遇水劇烈；K⁺ 是重要電解質", chain: "鹼金屬 → 遇水劇烈 → 鉀離子參與生理功能" },
  { id: "c11", subject: "chemistry", term: "Ca 鈣", hint: "鈣化合物是骨骼與牙齒的重要成分", extra: "Ca²⁺ 也參與肌肉收縮、神經傳遞與凝血", sound: "鈣蓋骨架", image: "鈣拿水泥蓋骨頭大樓，還兼任肌肉電鈴和凝血工班", anchor: "鈣化合物構成骨骼牙齒；Ca²⁺ 參與肌肉收縮、神經傳遞與凝血", chain: "構成骨骼 → 鈣離子傳訊 → 幫助凝血" },
  { id: "c12", subject: "chemistry", term: "Mg 鎂", hint: "輕金屬，燃燒發出強烈白光", extra: "鎂離子是葉綠素分子的中心元素", sound: "鎂冒白光", image: "鎂拿超亮白色閃光燈，轉身坐進葉綠素正中央", anchor: "Mg 燃燒發強白光；Mg²⁺ 位於葉綠素中心", chain: "輕金屬 → 白光燃燒 → 葉綠素中心" },
  { id: "c13", subject: "chemistry", term: "Al 鋁", hint: "質輕且表面氧化膜能提供保護", extra: "延展性佳，常用於包材、建材與運輸工具", sound: "鋁有保護膜", image: "鋁穿透明氧化鋁雨衣，輕輕飛進罐頭和飛機工廠", anchor: "Al 質輕、延展性佳，表面緻密氧化膜可抗進一步腐蝕", chain: "質量輕 → 氧化膜保護 → 用途廣泛" },
  { id: "c14", subject: "chemistry", term: "Si 矽", hint: "類金屬，是半導體工業的重要材料", extra: "二氧化矽是砂與玻璃的主要成分之一", sound: "矽是晶片心", image: "矽一半站導體、一半站絕緣體，腳下還踩著玻璃沙灘", anchor: "Si 是重要半導體材料；SiO₂ 是砂與玻璃的重要成分", chain: "類金屬 → 半導體晶片 → 二氧化矽與玻璃" },
  { id: "c15", subject: "chemistry", term: "P 磷", hint: "生命體必需元素，是 DNA、ATP 與磷脂的成分", extra: "磷酸鈣也存在於骨骼與牙齒", sound: "磷領能量票", image: "磷拿著 ATP 電池，串起 DNA 階梯又跑去補骨頭", anchor: "P 是 DNA、ATP、磷脂及骨骼礦物的重要成分", chain: "核酸骨架 → ATP 能量 → 磷脂與骨骼" },
  { id: "c16", subject: "chemistry", term: "S 硫", hint: "黃色非金屬，燃燒可生成二氧化硫", extra: "硫也是部分胺基酸與蛋白質的成分", sound: "硫留黃衣", image: "硫穿黃衣點火後放出嗆鼻氣體，又鑽進蛋白質打結", anchor: "S 是黃色非金屬；燃燒生成 SO₂，亦存在部分胺基酸", chain: "黃色固體 → 燃燒成 SO₂ → 進入蛋白質" },
  { id: "c17", subject: "chemistry", term: "Cu 銅", hint: "導電與導熱性佳，延展性良好", extra: "表面久置可形成綠色銅鏽；常用於電線", sound: "銅通電", image: "銅拉成長電線送電，老了就在表面披上綠外套", anchor: "Cu 導電導熱、延展性佳，常用於電線並可形成綠色銅鏽", chain: "導電佳 → 拉成電線 → 表面形成銅鏽" },
  { id: "c18", subject: "chemistry", term: "Zn 鋅", hint: "可鍍在鐵表面以防鏽", extra: "也是人體所需微量元素；與酸反應可放出氫氣", sound: "鋅先擋鏽", image: "鋅拿盾牌蓋住鐵，遇到酸又吹出一串氫氣泡泡", anchor: "Zn 可作鍍鋅層保護鐵；與酸反應能產生 H₂", chain: "鍍鋅保護 → 犧牲防蝕 → 遇酸放氫" },
  { id: "c19", subject: "chemistry", term: "Ag 銀", hint: "導電性極佳，具有金屬光澤", extra: "表面可因含硫物質形成黑色硫化銀而失去光澤", sound: "銀贏導電", image: "銀拿導電冠軍盃，卻被硫偷偷披上一層黑斗篷", anchor: "Ag 的導電性極佳；遇含硫物質可生成黑色 Ag₂S", chain: "導電冠軍 → 金屬光澤 → 硫化變黑" },
  { id: "c20", subject: "chemistry", term: "Hg 汞", hint: "常溫下呈液態的金屬", extra: "汞及其化合物有毒，應避免接觸與吸入蒸氣", sound: "汞滾成液珠", image: "銀亮汞珠在桌上滾來滾去，旁邊舉著有毒警告牌", anchor: "Hg 是常溫液態金屬，汞與汞蒸氣具毒性", chain: "液態金屬 → 易形成汞蒸氣 → 有毒需防護" },
  { id: "c21", subject: "chemistry", term: "Pb 鉛", hint: "密度大、柔軟且有毒的重金屬", extra: "可用於鉛酸電池與輻射屏蔽，但暴露會傷害神經系統", sound: "鉛很沉", image: "鉛穿超重防輻射背心，卻被神經系統貼上危險標籤", anchor: "Pb 是有毒重金屬，可用於鉛酸電池與輻射屏蔽", chain: "密度大 → 可阻擋輻射 → 重金屬毒性" },
  { id: "c22", subject: "chemistry", term: "I 碘", hint: "甲狀腺合成甲狀腺素所需的微量元素", extra: "碘的昇華蒸氣呈紫色；缺乏可能造成甲狀腺問題", sound: "碘點甲狀腺", image: "碘搭紫色蒸氣電梯，直達甲狀腺荷爾蒙工廠", anchor: "I 是合成甲狀腺素所需微量元素，碘蒸氣呈紫色", chain: "微量攝取 → 合成甲狀腺素 → 影響代謝" },
  { id: "c23", subject: "chemistry", term: "Ne 氖", hint: "惰性氣體，通電時發出橙紅色光", extra: "常用於霓虹燈與指示燈", sound: "氖亮霓虹", image: "氖拒絕化學交友，通電後卻穿橙紅燈衣上台", anchor: "Ne 是惰性氣體，放電時發橙紅光，常用於霓虹燈", chain: "化性安定 → 通電發光 → 霓虹燈" },
  { id: "c24", subject: "chemistry", term: "Ar 氬", hint: "空氣中含量最多的惰性氣體", extra: "化性安定，可作焊接保護氣體與燈泡填充氣", sound: "氬安靜護焊", image: "氬撐起透明防護罩，讓焊接火花在裡面安心工作", anchor: "Ar 約占空氣 0.93%，是空氣中最多的惰性氣體，可作保護氣體", chain: "空氣成分 → 化性安定 → 焊接保護" },
  { id: "c25", subject: "chemistry", term: "Br 溴", hint: "常溫下呈紅棕色液態的非金屬元素", extra: "溴蒸氣有毒且具刺激性；單質需在專業條件下處理", sound: "溴冒棕霧", image: "溴端著紅棕液體，背後冒出刺激性棕色警報雲", anchor: "Br₂ 是常溫紅棕色液態非金屬，蒸氣有毒且刺激", chain: "紅棕液體 → 易揮發成棕色蒸氣 → 有毒刺激" },
];

const byId = new Map(EXPANDED_MNEMONIC_ITEMS.map(item => [item.id, item]));

export function getExpandedMnemonicReferences(
  itemId: string,
  style: ExpandedStyleId,
): [simple: string, absurd: string, exam: string] | undefined {
  const item = byId.get(itemId);
  if (!item) return undefined;

  const references: Record<ExpandedStyleId, [string, string, string]> = {
    homophone: [
      `${item.term} →「${item.sound}」：${item.hint}`,
      `${item.term} 聽成「${item.sound}」，腦中立刻出現：${item.image}`,
      `${item.term} →「${item.sound}」；考點：${item.anchor}`,
    ],
    rhyme: [
      `${item.term}，${item.sound}；意思是「${item.hint}」，唸完記得穩`,
      `${item.term} 節奏響：「${item.sound}」；${item.image}，怪畫面忘不了`,
      `${item.term} 考試句：${item.anchor}；關鍵成一行，作答不慌張`,
    ],
    meme: [
      `沒人：…… ${item.term}：我是「${item.hint}」代表。`,
      `老師：低調一點。${item.term}：不行，我腦內正在上演「${item.image}」。`,
      `考題版 ${item.term}：${item.anchor}。`,
    ],
    "story-chain": [
      `${item.term} 關鍵鏈：${item.chain}`,
      `${item.term} 小劇場：${item.image}；一路串回「${item.chain}」`,
      `${item.term} 得分鏈：${item.chain}；核心事實是「${item.anchor}」`,
    ],
  };

  return references[style];
}
