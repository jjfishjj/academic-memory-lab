export type ElementSceneBackdrop = "sky" | "lab" | "city" | "nature" | "factory" | "space" | "clinic" | "stage" | "water";

export interface ElementMemoryScene {
  backdrop: ElementSceneBackdrop;
  actors: [string, string, string];
  action: string;
}

// 每一筆都是獨立構圖規格；Canvas 依背景、三個角色與動作標語繪成一張專屬場景。
export const ELEMENT_MEMORY_SCENES: Record<number, ElementMemoryScene> = {
  1: { backdrop: "sky", actors: ["🎈", "☁️", "☀️"], action: "超輕氣球升空" },
  2: { backdrop: "sky", actors: ["🎈", "🎈", "🌙"], action: "兩顆氦球安靜飄" },
  3: { backdrop: "city", actors: ["🔋", "📱", "⚡"], action: "鋰電池替城市充電" },
  4: { backdrop: "lab", actors: ["🛡️", "🥽", "✈️"], action: "防塵盾守護輕合金" },
  5: { backdrop: "lab", actors: ["🥛", "🔥", "🧱"], action: "耐熱玻璃走出火爐" },
  6: { backdrop: "stage", actors: ["💎", "✏️", "⬡"], action: "鑽石與石墨同台" },
  7: { backdrop: "factory", actors: ["🥔", "🛡️", "💨"], action: "氮氣守住零食袋" },
  8: { backdrop: "nature", actors: ["🫧", "🏃", "🌳"], action: "氧氣泡追上跑者" },
  9: { backdrop: "clinic", actors: ["🦷", "🪥", "🛡️"], action: "氟化物替牙齒披甲" },
  10: { backdrop: "city", actors: ["🌃", "🏮", "✨"], action: "霓虹點亮夜市入口" },
  11: { backdrop: "stage", actors: ["🧂", "🍚", "💧"], action: "食鹽袋裡找到鈉" },
  12: { backdrop: "stage", actors: ["✨", "🥽", "🎇"], action: "鎂光耀眼先戴護目鏡" },
  13: { backdrop: "stage", actors: ["🍙", "🥫", "🪶"], action: "鋁箔包住輕巧飯糰" },
  14: { backdrop: "city", actors: ["💻", "🏙️", "⚡"], action: "矽晶片城市跑電流" },
  15: { backdrop: "nature", actors: ["🔥", "🌾", "🧬"], action: "紅磷點火也餵農田" },
  16: { backdrop: "nature", actors: ["🌋", "🟡", "🛞"], action: "黃色硫在火山顧輪胎" },
  17: { backdrop: "water", actors: ["🏊", "🛡️", "🫧"], action: "氯守衛巡視泳池" },
  18: { backdrop: "factory", actors: ["🤫", "🔥", "🫧"], action: "氬氣罩安靜護焊" },
  19: { backdrop: "stage", actors: ["🍌", "💪", "⚽"], action: "鉀香蕉傳球給肌肉" },
  20: { backdrop: "clinic", actors: ["🦴", "🥛", "🏋️"], action: "鈣骨架喝奶深蹲" },
  21: { backdrop: "sky", actors: ["🛩️", "🔍", "🪶"], action: "鈧掃描輕合金飛機" },
  22: { backdrop: "space", actors: ["🦿", "🚀", "🛡️"], action: "鈦機械腿走進太空船" },
  23: { backdrop: "city", actors: ["🔩", "🌉", "💪"], action: "V 字釩鋼撐起大橋" },
  24: { backdrop: "factory", actors: ["🪞", "🛡️", "✨"], action: "鉻把金屬擦得晶亮" },
  25: { backdrop: "factory", actors: ["🔨", "🔋", "🦾"], action: "錳猛將鍛鋼又充電" },
  26: { backdrop: "city", actors: ["🏗️", "🩸", "🏢"], action: "鐵鋼梁蓋樓也運氧" },
  27: { backdrop: "stage", actors: ["🎨", "🏺", "🔋"], action: "鈷藍畫家替陶瓷上色" },
  28: { backdrop: "stage", actors: ["🪙", "🍴", "✨"], action: "鎳硬幣走進不鏽鋼廚房" },
  29: { backdrop: "city", actors: ["🔌", "🏙️", "💡"], action: "銅電線點亮整座城市" },
  30: { backdrop: "factory", actors: ["🛡️", "🌧️", "🔩"], action: "鋅雨衣替鋼擋鏽雨" },
  31: { backdrop: "lab", actors: ["🤲", "⛄", "💡"], action: "鎵雪人在掌心融化" },
  32: { backdrop: "city", actors: ["🌐", "👓", "✨"], action: "鍺沿光纖送出亮點" },
  33: { backdrop: "lab", actors: ["⚠️", "🔒", "🧤"], action: "砷站在上鎖實驗櫃" },
  34: { backdrop: "stage", actors: ["🧴", "☀️", "🔆"], action: "硒洗髮瓶遇見感光板" },
  35: { backdrop: "lab", actors: ["🧪", "🟥", "🌬️"], action: "紅棕溴鎖進通風櫃" },
  36: { backdrop: "space", actors: ["💡", "🦸", "🌌"], action: "氪超人坐進閃光燈" },
  37: { backdrop: "lab", actors: ["💎", "👑", "💧"], action: "銣王冠躲開水滴" },
  38: { backdrop: "sky", actors: ["🎆", "🔴", "🧲"], action: "鍶把煙火染成鮮紅" },
  39: { backdrop: "city", actors: ["💡", "🛣️", "🔮"], action: "釔在 Y 字路點亮螢光" },
  40: { backdrop: "factory", actors: ["🛡️", "☢️", "🦷"], action: "鋯陶瓷甲守護燃料棒" },
  41: { backdrop: "city", actors: ["🧲", "🚄", "〰️"], action: "鈮超導磁鐵托起列車" },
  42: { backdrop: "factory", actors: ["🔧", "🔥", "⚙️"], action: "鉬扳手在高溫機器工作" },
  43: { backdrop: "clinic", actors: ["🏥", "☢️", "🔍"], action: "鎝在核醫影像留下亮點" },
  44: { backdrop: "factory", actors: ["⚙️", "🎼", "🏭"], action: "釕指揮催化齒輪加速" },
  45: { backdrop: "city", actors: ["🚗", "👾", "✨"], action: "銠觸媒縮小廢氣怪獸" },
  46: { backdrop: "city", actors: ["🚙", "🥅", "🎈"], action: "鈀濾網攔廢氣抱氫球" },
  47: { backdrop: "stage", actors: ["🥈", "🔌", "✨"], action: "銀牌牽著高導電電線" },
  48: { backdrop: "factory", actors: ["☣️", "🔋", "♻️"], action: "鎘電池進專用回收箱" },
  49: { backdrop: "city", actors: ["📱", "👆", "✨"], action: "銦藏在透明觸控薄膜" },
  50: { backdrop: "factory", actors: ["🥫", "🪛", "🛡️"], action: "錫替罐頭穿上保護衣" },
  51: { backdrop: "factory", actors: ["🧯", "🧥", "🔥"], action: "銻穿阻燃衣拉安全繩" },
  52: { backdrop: "nature", actors: ["☀️", "🔋", "🌡️"], action: "碲把陽光與溫差變電" },
  53: { backdrop: "clinic", actors: ["🦋", "🟣", "🧂"], action: "碘蝴蝶守護甲狀腺" },
  54: { backdrop: "space", actors: ["🚀", "💡", "💨"], action: "氙離子推進器飛向太空" },
};

export function getElementMemoryScene(number: number) {
  return ELEMENT_MEMORY_SCENES[number] ?? null;
}
