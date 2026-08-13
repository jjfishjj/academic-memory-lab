import type { ExpandedMnemonicItem, ExpandedStyleId } from "./expandedMnemonicData";

export const SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS: ExpandedMnemonicItem[] = [
  { id: "b1", subject: "biology", term: "粒線體", hint: "進行細胞呼吸並產生多數 ATP", extra: "具有雙層膜與自身 DNA", sound: "粒線體，力氣電池", image: "粒線體背著發電機替細胞充滿 ATP", anchor: "粒線體是細胞呼吸與 ATP 生成的重要場所", chain: "分解養分 → 電子傳遞 → 生成 ATP" },
  { id: "b2", subject: "biology", term: "葉綠體", hint: "植物與藻類進行光合作用的胞器", extra: "葉綠素吸收光能，製造有機養分", sound: "葉綠體，陽光料理", image: "葉綠體戴太陽帽把光煮成葡萄糖", anchor: "葉綠體利用光能進行光合作用", chain: "吸收光能 → 固定二氧化碳 → 製造糖" },
  { id: "b3", subject: "biology", term: "核糖體", hint: "依照 mRNA 資訊合成蛋白質", extra: "可游離於細胞質或附著粗糙內質網", sound: "核糖體，合成蛋白機", image: "核糖體照著 mRNA 菜單串起胺基酸", anchor: "核糖體是蛋白質合成場所", chain: "讀取 mRNA → 接合胺基酸 → 形成蛋白質" },
  { id: "b4", subject: "biology", term: "細胞膜", hint: "選擇性控制物質進出細胞", extra: "主要由磷脂雙層與蛋白質組成", sound: "細胞膜，門禁嚴", image: "細胞膜當海關逐一檢查進出分子", anchor: "細胞膜具有選擇性通透性", chain: "辨識物質 → 控制進出 → 維持恆定" },
  { id: "b5", subject: "biology", term: "DNA 複製", hint: "以原有 DNA 為模板製造相同 DNA", extra: "採半保留複製，每個新分子保留一股舊鏈", sound: "一股舊，一股新", image: "DNA 拉鍊打開後，每半邊各找新搭檔", anchor: "DNA 採半保留方式複製", chain: "雙股解開 → 互補配對 → 形成兩個 DNA" },
  { id: "b6", subject: "biology", term: "有絲分裂", hint: "產生兩個遺傳物質大致相同的子細胞", extra: "與生長、修復及無性生殖有關", sound: "有絲分裂，一變二同款", image: "一個細胞影印成兩個同款分身", anchor: "有絲分裂產生兩個染色體套數相同的子細胞", chain: "染色體複製 → 排列分離 → 細胞分裂" },
  { id: "b7", subject: "biology", term: "減數分裂", hint: "形成染色體套數減半的生殖細胞", extra: "包含兩次分裂並增加遺傳變異", sound: "減數分裂，套數減半", image: "染色體連闖兩關，最後分成四隊", anchor: "減數分裂使染色體套數減半並形成配子", chain: "複製一次 → 分裂兩次 → 形成單套配子" },
  { id: "b8", subject: "biology", term: "孟德爾分離律", hint: "一對等位基因形成配子時彼此分離", extra: "每個配子只得到其中一個等位基因", sound: "成對基因，配子分離", image: "一對基因搭檔在配子月台各上不同車", anchor: "等位基因在配子形成時彼此分離", chain: "等位基因成對 → 減數分裂 → 分到不同配子" },
  { id: "b9", subject: "biology", term: "轉錄", hint: "以 DNA 為模板合成 RNA", extra: "真核細胞主要在細胞核內進行", sound: "轉錄先抄 RNA", image: "RNA 抄寫員在細胞核影印 DNA 指令", anchor: "轉錄是由 DNA 資訊合成 RNA", chain: "DNA 解開 → RNA 互補配對 → 形成 RNA" },
  { id: "b10", subject: "biology", term: "轉譯", hint: "核糖體依 mRNA 密碼合成蛋白質", extra: "tRNA 攜帶胺基酸對應密碼子", sound: "轉譯再做蛋白質", image: "核糖體翻譯官把 mRNA 翻成胺基酸句子", anchor: "轉譯依 mRNA 密碼子排列胺基酸", chain: "讀密碼子 → tRNA 送胺基酸 → 合成蛋白質" },
  { id: "b11", subject: "biology", term: "酵素", hint: "降低活化能、加快生化反應", extra: "具有專一性，反應後通常可重複使用", sound: "酵素降門檻", image: "酵素把反應高牆壓成矮門檻", anchor: "酵素以降低活化能來加快反應", chain: "結合受質 → 降低活化能 → 釋放產物" },
  { id: "b12", subject: "biology", term: "滲透作用", hint: "水經選擇性通透膜移動的現象", extra: "水由低溶質濃度側淨移向高溶質濃度側", sound: "水往濃處走", image: "水分子排隊穿膜去支援濃溶液", anchor: "滲透是水跨膜由低溶質濃度側淨移向高濃度側", chain: "兩側濃度不同 → 水跨膜 → 趨向平衡" },
  { id: "b13", subject: "biology", term: "主動運輸", hint: "消耗能量逆濃度梯度運送物質", extra: "常由膜蛋白協助並使用 ATP", sound: "主動搬運要付 ATP", image: "膜蛋白搬家工逆著人潮扛貨上坡", anchor: "主動運輸消耗能量逆濃度梯度移動物質", chain: "辨識物質 → 消耗 ATP → 逆梯度運送" },
  { id: "b14", subject: "biology", term: "抗體", hint: "由 B 細胞分化的漿細胞製造，可專一結合抗原", extra: "參與體液免疫反應", sound: "抗體鎖抗原", image: "Y 字抗體拿專屬鑰匙鎖住入侵者", anchor: "抗體可專一辨識並結合抗原", chain: "辨識抗原 → 漿細胞製造 → 專一結合" },
  { id: "b15", subject: "biology", term: "胰島素", hint: "促進細胞攝取葡萄糖並降低血糖", extra: "由胰臟胰島 β 細胞分泌", sound: "胰島素，血糖往下住", image: "胰島素拿門卡讓葡萄糖進入細胞", anchor: "胰島素由 β 細胞分泌並促進血糖下降", chain: "血糖升高 → 分泌胰島素 → 細胞攝糖" },
  { id: "b16", subject: "biology", term: "腎元", hint: "腎臟構造與功能的基本單位", extra: "經過過濾、再吸收與分泌形成尿液", sound: "腎元三關做尿液", image: "腎元工廠先濾、再收、最後分泌", anchor: "腎元經過濾、再吸收與分泌調節體液", chain: "腎小球過濾 → 腎小管再吸收 → 分泌排出" },
  { id: "b17", subject: "biology", term: "突觸", hint: "神經元彼此或與效應器傳遞訊息的接點", extra: "化學突觸以神經傳遞物跨越突觸間隙", sound: "突觸跨縫傳訊", image: "神經訊息搭小船跨過突觸縫隙", anchor: "化學突觸以神經傳遞物傳遞訊號", chain: "動作電位到達 → 釋放傳遞物 → 下一細胞反應" },
  { id: "b18", subject: "biology", term: "自然選擇", hint: "較適應環境的可遺傳性狀較易傳至後代", extra: "作用於族群中的個體差異，跨世代改變族群", sound: "環境篩選，適者多傳", image: "環境拿篩子，留下更能繁殖的性狀", anchor: "自然選擇使有利的可遺傳性狀在族群中增加", chain: "族群有變異 → 生存繁殖差異 → 性狀頻率改變" },
  { id: "b19", subject: "biology", term: "食物鏈", hint: "呈現生物間能量與物質轉移的取食關係", extra: "箭頭由被吃者指向取食者，表示能量流向", sound: "誰被吃，箭頭指給誰", image: "草把能量接力棒交給兔，再交給鷹", anchor: "食物鏈箭頭表示能量由被食者流向取食者", chain: "生產者 → 初級消費者 → 高級消費者" },
  { id: "b20", subject: "biology", term: "生態金字塔", hint: "呈現各營養階層的能量、數量或生物量", extra: "能量金字塔向上層逐級減少且不會倒置", sound: "能量往上層層少", image: "每爬一層金字塔，能量背包就縮一圈", anchor: "能量在營養階層間傳遞時逐級減少", chain: "生產者能量最多 → 傳遞有損失 → 高層較少" },

  { id: "g1", subject: "geography", term: "板塊構造學說", hint: "岩石圈由多個板塊組成並持續移動", extra: "板塊交界常發生地震、火山與造山運動", sound: "板塊在移動", image: "地球拼圖坐在軟流圈輸送帶上滑動", anchor: "岩石圈板塊移動，交界處地質活動頻繁", chain: "板塊移動 → 交界互動 → 地震火山造山" },
  { id: "g2", subject: "geography", term: "聚合型板塊邊界", hint: "兩板塊相向移動，可能隱沒或碰撞", extra: "常形成海溝、火山弧或褶皺山脈", sound: "聚合相撞造山", image: "兩塊地殼迎面撞車，擠出一座山", anchor: "聚合邊界板塊相向，造成隱沒或碰撞", chain: "相向移動 → 隱沒或碰撞 → 海溝火山山脈" },
  { id: "g3", subject: "geography", term: "張裂型板塊邊界", hint: "兩板塊背向分離，岩漿上湧形成新地殼", extra: "常見於中洋脊與大陸裂谷", sound: "張裂分開造新殼", image: "地殼拉開拉鍊，岩漿補上一條新地板", anchor: "張裂邊界板塊分離並形成新地殼", chain: "板塊分離 → 岩漿上湧 → 新地殼形成" },
  { id: "g4", subject: "geography", term: "轉形斷層", hint: "兩板塊水平錯動，地殼不增不減", extra: "摩擦累積能量，釋放時常引發地震", sound: "水平錯身震一下", image: "兩張巨大砂紙肩並肩反向滑過", anchor: "轉形邊界以水平錯動為主，常發生地震", chain: "水平錯動 → 應力累積 → 地震釋放" },
  { id: "g5", subject: "geography", term: "河流侵蝕基準面", hint: "河流向下侵蝕所能達到的最低界面", extra: "最終基準面通常是海平面", sound: "河下切，海面喊停", image: "河流拿鏟子向下挖，海平面舉起停止牌", anchor: "海平面通常是河流侵蝕的最終基準面", chain: "河流下切 → 接近基準面 → 下蝕減弱" },
  { id: "g6", subject: "geography", term: "沖積扇", hint: "河流出山口後流速下降、沉積物呈扇狀堆積", extra: "顆粒通常由扇頂向扇緣變細", sound: "出山變慢，泥沙展扇", image: "河流衝出山口，打開一把泥沙扇子", anchor: "河流出山口流速降低，形成扇狀沉積", chain: "離開山谷 → 流速下降 → 扇狀沉積" },
  { id: "g7", subject: "geography", term: "三角洲", hint: "河流入海或入湖時沉積形成的低平地形", extra: "沉積旺盛時河道常分流", sound: "河入海，泥沙蓋三角", image: "河口把泥沙積木堆成三角形陸地", anchor: "河流入海流速下降，泥沙沉積形成三角洲", chain: "河流入海 → 流速降低 → 沉積擴地" },
  { id: "g8", subject: "geography", term: "喀斯特地形", hint: "可溶性岩石受水溶蝕形成的地形", extra: "石灰岩區常見洞穴、鐘乳石與石筍", sound: "石灰遇水，洞穴出土", image: "雨水拿吸管把石灰岩喝出地下宮殿", anchor: "含酸性的水溶蝕石灰岩可形成喀斯特地形", chain: "水含弱酸 → 溶蝕石灰岩 → 洞穴鐘乳石" },
  { id: "g9", subject: "geography", term: "焚風", hint: "氣流越山後在背風坡下沉增溫而乾燥", extra: "迎風坡凝結降水後，背風坡空氣較暖乾", sound: "越山下沉，又乾又熱", image: "濕風翻過山後，把雨衣脫掉變吹風機", anchor: "焚風在背風坡下沉增溫，呈現乾熱特性", chain: "迎風抬升降水 → 越過山頂 → 背風下沉增溫" },
  { id: "g10", subject: "geography", term: "季風", hint: "因海陸熱力差異而隨季節改變方向的大尺度風", extra: "夏季與冬季的盛行風向通常相反", sound: "季節一換，風向也換", image: "風拿著夏冬兩張車票來回換方向", anchor: "季風因海陸熱力差異而季節性轉向", chain: "海陸受熱不同 → 氣壓配置改變 → 風向季節轉換" },
  { id: "g11", subject: "geography", term: "聖嬰現象", hint: "赤道中東太平洋海表溫度異常偏暖", extra: "信風與海氣環流改變，影響全球降水與氣候", sound: "東太平洋變暖，天氣跟著亂", image: "太平洋東側泡熱水澡，全球天氣開始換座位", anchor: "聖嬰是赤道中東太平洋海溫異常偏暖現象", chain: "海溫偏暖 → 信風環流改變 → 全球氣候異常" },
  { id: "g12", subject: "geography", term: "反聖嬰現象", hint: "赤道中東太平洋海表溫度異常偏冷", extra: "常伴隨信風增強，影響全球氣候型態", sound: "東太平洋變冷，信風加油", image: "太平洋東側開強冷氣，信風拿電風扇加速", anchor: "反聖嬰是赤道中東太平洋海溫異常偏冷現象", chain: "海溫偏冷 → 信風增強 → 氣候型態改變" },
  { id: "g13", subject: "geography", term: "都市熱島", hint: "都市氣溫高於周圍郊區的現象", extra: "建材蓄熱、人工排熱與綠地不足都是因素", sound: "城市像熱鍋", image: "柏油和水泥把白天熱量存進巨大暖暖包", anchor: "都市建材蓄熱與人工排熱等造成熱島效應", chain: "吸熱建材多 → 散熱慢 → 都市較郊區熱" },
  { id: "g14", subject: "geography", term: "人口轉型", hint: "社會由高出生高死亡轉向低出生低死亡", extra: "通常伴隨工業化、都市化與醫療改善", sound: "先降死亡，再降出生", image: "人口圖表先關死亡水龍頭，再轉小出生水龍頭", anchor: "人口轉型通常先死亡率下降，之後出生率下降", chain: "死亡率先降 → 人口快速增長 → 出生率下降" },
  { id: "g15", subject: "geography", term: "扶養比", hint: "非工作年齡人口相對工作年齡人口的比例", extra: "可分幼年扶養比與老年扶養比", sound: "工作人口肩上扛多少", image: "一群工作者肩上坐著兒童與老人數比例", anchor: "扶養比衡量非工作年齡人口相對工作年齡人口的負擔", chain: "計算幼老人口 → 除以工作年齡人口 → 評估扶養負擔" },
  { id: "g16", subject: "geography", term: "核心—邊陲理論", hint: "解釋核心地區與邊陲地區不均衡的權力與資源關係", extra: "核心常集中資本、技術與決策功能", sound: "核心吸資源，邊陲供原料", image: "磁鐵城市把資金技術吸到中心，外圍只剩原料車", anchor: "核心集中資本技術，與邊陲形成不均衡關係", chain: "核心累積優勢 → 吸引資源 → 區域差距擴大" },
  { id: "g17", subject: "geography", term: "比較利益", hint: "專門生產機會成本較低的產品並進行交換", extra: "即使一方各項效率都高，分工仍可能互利", sound: "機會成本低，就專心做", image: "兩國不比誰全能，只比放棄哪項比較少", anchor: "比較利益取決於較低的機會成本", chain: "比較機會成本 → 專業分工 → 交換互利" },
  { id: "g18", subject: "geography", term: "產業群聚", hint: "相關企業與機構集中於特定地區", extra: "可共享人才、供應鏈、知識與基礎設施", sound: "企業住一起，人才資訊都省力", image: "公司們搬進同一社區，共用人才與零件外送", anchor: "產業群聚透過共享資源與知識產生聚集效益", chain: "企業集中 → 資源共享 → 創新與效率提升" },
  { id: "g19", subject: "geography", term: "碳足跡", hint: "產品、活動或個人造成的溫室氣體排放總量", extra: "通常以二氧化碳當量表示", sound: "走過活動，留下碳腳印", image: "每次搭車購物都在地上留下一枚 CO₂ 腳印", anchor: "碳足跡以二氧化碳當量衡量相關溫室氣體排放", chain: "盤查活動 → 換算溫室氣體 → 加總碳當量" },
  { id: "g20", subject: "geography", term: "永續發展", hint: "滿足當代需求且不損害後代滿足需求的能力", extra: "兼顧環境、社會與經濟面向", sound: "今天夠用，明天也留路", image: "三腳凳用環境、社會、經濟一起撐住未來", anchor: "永續發展兼顧當代需求與後代發展機會", chain: "滿足當代 → 保護資源環境 → 保留後代機會" },
];

export function getScienceGeographyReferences(itemId: string, styleId: ExpandedStyleId): [string, string, string] | undefined {
  const item = SCIENCE_GEOGRAPHY_MNEMONIC_ITEMS.find(candidate => candidate.id === itemId);
  if (!item) return undefined;
  const simple = {
    homophone: `${item.term} →「${item.sound}」：${item.hint}`,
    rhyme: `${item.term} 記一句：${item.sound}；${item.chain}`,
    meme: `看到 ${item.term}，腦中貼上「${item.sound}」：${item.hint}`,
    "story-chain": `${item.term} 記憶鏈：${item.chain}`,
  }[styleId];
  const absurd = {
    homophone: `${item.term} →「${item.sound}」：${item.image}，荒謬到忘不了`,
    rhyme: `${item.term} 一登場，${item.image}；再唸「${item.sound}」`,
    meme: `沒人：…… ${item.term}：${item.image}。記住「${item.sound}」`,
    "story-chain": `${item.term} 荒謬劇情：${item.image} → ${item.chain}`,
  }[styleId];
  const exam = {
    homophone: `${item.term} 考試鉤子「${item.sound}」；得分句：${item.anchor}`,
    rhyme: `${item.term} 答題節奏：${item.chain}；結論：${item.anchor}`,
    meme: `考卷問 ${item.term}，別被梗帶走：${item.anchor}`,
    "story-chain": `${item.term} 作答鏈：${item.chain}；完整寫成：${item.anchor}`,
  }[styleId];
  return [simple, absurd, exam];
}
