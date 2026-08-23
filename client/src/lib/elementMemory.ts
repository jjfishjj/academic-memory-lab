import type { ElementItem } from "./elementData";

export type NumberScene = {
  station: string;
  setting: string;
  object: string;
};

export type ElementMnemonic = {
  number: number;
  numberImage: string;
  pun: string;
  visual: string;
  storyBeat: string;
  recallLine: string;
};

// 記憶軌道採「十位數＝校園區域、個位數＝固定道具」：01–99 都能快速生成一致的故事座標。
const TENS_STATIONS = [
  "實驗室門口",
  "校園中庭",
  "社團倉庫",
  "圖書館旋梯",
  "體育館看台",
  "美術教室",
  "化學走廊",
  "宿舍廚房",
  "天台花園",
  "夜市後門",
];

const ONES_OBJECTS = [
  "圓形鐘面",
  "一根火柴",
  "一隻黃鴨",
  "一副耳機",
  "一艘小船",
  "一把鉤子",
  "一支炭筆",
  "一把鐮刀",
  "一副氧氣眼鏡",
  "一根霓虹棒",
];

const SCIENCE_STATIONS = ["科學館核磁室", "元素標本庫"];
const SCIENCE_OBJECTS = [
  "一顆閃爍晶體",
  "一枚鉗形夾",
  "一面元素徽章",
  "一支雷射筆",
  "一只防護面罩",
  "一顆隕石",
  "一張實驗標籤",
  "一台離心機",
  "一把鑷子",
  "一盞警示燈",
];

export function getNumberScene(number: number): NumberScene {
  const safeNumber = Math.max(1, Math.min(118, number));
  if (safeNumber > 99) {
    const index = safeNumber - 100;
    const station =
      SCIENCE_STATIONS[Math.floor(index / 10)] || SCIENCE_STATIONS[0];
    return {
      station: `${String(safeNumber).padStart(3, "0")} 號 ${station}`,
      setting: station,
      object: SCIENCE_OBJECTS[index % SCIENCE_OBJECTS.length],
    };
  }
  const tens = Math.floor(safeNumber / 10);
  const ones = safeNumber % 10;
  return {
    station: `${String(safeNumber).padStart(2, "0")} 號 ${TENS_STATIONS[tens]}`,
    setting: TENS_STATIONS[tens],
    object: ONES_OBJECTS[ones],
  };
}

export const ELEMENT_MNEMONICS: Record<number, ElementMnemonic> = {
  1: {
    number: 1,
    numberImage: "01 是一根火柴",
    pun: "氫／輕",
    visual: "一顆輕飄飄的 H 氣球綁在火柴上",
    storyBeat: "火柴一劃，輕氣球衝出實驗室。",
    recallLine: "火柴上飛走的『輕』氣球，就是 01 氫 H。",
  },
  2: {
    number: 2,
    numberImage: "02 是一隻黃鴨",
    pun: "氦／嘿",
    visual: "黃鴨吸了氦氣，用高音喊 HEY",
    storyBeat: "鴨子一開口，整條走廊都是高音『嘿～』。",
    recallLine: "會高音喊嘿的鴨子，就是 02 氦 He。",
  },
  3: {
    number: 3,
    numberImage: "03 是一副耳機",
    pun: "鋰／栗",
    visual: "耳機裡滾出三顆栗子，排成 Li",
    storyBeat: "你戴上耳機，栗子叮叮咚咚撞成 Li。",
    recallLine: "耳機裡的栗子，是 03 鋰 Li。",
  },
  4: {
    number: 4,
    numberImage: "04 是一艘小船",
    pun: "鈹／貝",
    visual: "一隻熊 Be 抱著發亮貝殼坐上小船",
    storyBeat: "熊船長把貝殼別在 Be 胸前。",
    recallLine: "船上的熊抱貝殼，是 04 鈹 Be。",
  },
  5: {
    number: 5,
    numberImage: "05 是一把鉤子",
    pun: "硼／球",
    visual: "鉤子勾住一顆寫著 B 的硼球",
    storyBeat: "硼球被鉤住，卻一直蹦蹦跳。",
    recallLine: "鉤住的硼球，就是 05 硼 B。",
  },
  6: {
    number: 6,
    numberImage: "06 是一支炭筆",
    pun: "碳／炭",
    visual: "炭筆畫出一隻大象，鼻子彎成 C",
    storyBeat: "大象用炭筆在牆上圈出 C。",
    recallLine: "炭筆畫的 C 大象，就是 06 碳 C。",
  },
  7: {
    number: 7,
    numberImage: "07 是一把鐮刀",
    pun: "氮／蛋",
    visual: "忍者 N 用鐮刀切開一顆氮氣蛋",
    storyBeat: "蛋殼噴出氣體，忍者在煙霧裡留下 N。",
    recallLine: "鐮刀與蛋的忍者，是 07 氮 N。",
  },
  8: {
    number: 8,
    numberImage: "08 是一副氧氣眼鏡",
    pun: "氧／養",
    visual: "戴 8 字眼鏡的魚大口吸氧",
    storyBeat: "魚說：『養足氧氣，我才能游出 O。』",
    recallLine: "氧氣眼鏡和 O 魚，是 08 氧 O。",
  },
  9: {
    number: 9,
    numberImage: "09 是一根霓虹棒",
    pun: "氟／敷",
    visual: "兔子用氟牙膏敷滿 F 形牙齒",
    storyBeat: "霓虹棒一亮，兔子的 F 牙閃閃發光。",
    recallLine: "敷氟牙膏的兔子，是 09 氟 F。",
  },
  10: {
    number: 10,
    numberImage: "10 是兩根霓虹棒",
    pun: "氖／霓",
    visual: "兩根霓虹棒拼成 Ne 招牌",
    storyBeat: "夜晚的 Ne 招牌把入口照成粉藍色。",
    recallLine: "霓虹 Ne 招牌，就是 10 氖 Ne。",
  },
  11: {
    number: 11,
    numberImage: "11 是一雙筷子",
    pun: "鈉／拿",
    visual: "兩根筷子正在『拿』起 Na 鹽罐",
    storyBeat: "筷子說：『拿鹽！Na！』",
    recallLine: "拿起鹽罐的筷子，是 11 鈉 Na。",
  },
  12: {
    number: 12,
    numberImage: "12 是一座時鐘",
    pun: "鎂／美",
    visual: "12 點的美鏡子照出 Mg 皇冠",
    storyBeat: "鏡中的『美』同學把 Mg 皇冠戴好。",
    recallLine: "十二點照鏡子的美人，是 12 鎂 Mg。",
  },
  13: {
    number: 13,
    numberImage: "13 是一張雨傘票",
    pun: "鋁／旅",
    visual: "Al 鋁罐撐傘去旅行",
    storyBeat: "旅行鋁罐把車票夾在 Al 標誌裡。",
    recallLine: "撐傘旅行的鋁罐，是 13 鋁 Al。",
  },
  14: {
    number: 14,
    numberImage: "14 是一把晶片鑰匙",
    pun: "矽／系",
    visual: "一枚 Si 矽晶片鑰匙插進 14 號門",
    storyBeat: "門牌說：『進入矽系統，請出示 Si。』",
    recallLine: "晶片鑰匙開 14 號門，是 14 矽 Si。",
  },
  15: {
    number: 15,
    numberImage: "15 是一盞滿月燈",
    pun: "磷／鱗",
    visual: "P 魚的鱗片在月下發出磷光",
    storyBeat: "月燈一亮，P 魚的鱗光帶你轉彎。",
    recallLine: "月下發磷光的鱗片，是 15 磷 P。",
  },
  16: {
    number: 16,
    numberImage: "16 是一顆石榴",
    pun: "硫／流",
    visual: "硫黃小龍讓黃色河流繞著 S 流",
    storyBeat: "石榴裂開，黃色硫河流出一個 S。",
    recallLine: "流出 S 的硫黃河，是 16 硫 S。",
  },
  17: {
    number: 17,
    numberImage: "17 是一頂泳池帽",
    pun: "氯／綠",
    visual: "Cl 小丑戴綠泳帽跳進泳池",
    storyBeat: "他喊：『綠色泳池，Cl 先消毒！』",
    recallLine: "綠泳帽的泳池小丑，是 17 氯 Cl。",
  },
  18: {
    number: 18,
    numberImage: "18 是一條麻花繩",
    pun: "氬／阿",
    visual: "阿哥 Ar 把麻花繩扭成氣球狗",
    storyBeat: "阿哥扭一下，Ar 氣球狗就跳到門邊。",
    recallLine: "阿哥扭出的氣球狗，是 18 氬 Ar。",
  },
  19: {
    number: 19,
    numberImage: "19 是一支高爾夫球桿",
    pun: "鉀／腳",
    visual: "K 鉀先生用大腳把球踢進洞",
    storyBeat: "球桿還沒揮，鉀先生的腳先踢出 K。",
    recallLine: "用腳踢球的 K 先生，是 19 鉀 K。",
  },
  20: {
    number: 20,
    numberImage: "20 是一隻天鵝",
    pun: "鈣／蓋",
    visual: "Ca 天鵝用骨頭盾牌蓋住蛋",
    storyBeat: "天鵝把『鈣骨盾』蓋在 20 號巢上。",
    recallLine: "蓋著骨頭盾的天鵝，是 20 鈣 Ca。",
  },
};

export function getElementMnemonic(item: ElementItem): ElementMnemonic {
  const detailed = ELEMENT_MNEMONICS[item.number];
  if (detailed) return detailed;

  const scene = getNumberScene(item.number);
  return {
    number: item.number,
    numberImage: `${scene.station} 的 ${scene.object}`,
    pun: `${item.symbol} 的聲音標記`,
    visual: `把 ${item.nameZh} 的 ${item.symbol} 標誌貼到${scene.object}上`,
    storyBeat: `在${scene.setting}，${scene.object}替你保管 ${item.number} 號 ${item.nameZh}。`,
    recallLine: `${scene.station} 的 ${scene.object}，存著 #${item.number} ${item.symbol} ${item.nameZh}。`,
  };
}

export function getStoryChapter(number: number) {
  if (number <= 10) return "第一章｜晨間實驗室：從火柴氣球到霓虹招牌";
  if (number <= 20) return "第二章｜午休走廊：從鹽罐筷子到天鵝骨盾";
  const start = Math.floor((number - 1) / 10) * 10 + 1;
  return `第 ${Math.floor((number - 1) / 10) + 1} 章｜${String(start).padStart(2, "0")}–${String(Math.min(start + 9, 118)).padStart(2, "0")} 號元素記憶軌道`;
}
