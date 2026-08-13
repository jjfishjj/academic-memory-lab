export type MrtLineId = "BR" | "R" | "G" | "O" | "BL" | "Y";

export interface MrtStation {
  code: string;
  name: string;
  lineId: MrtLineId;
  branch?: string;
  preview?: boolean;
}

export interface MrtLine {
  id: MrtLineId;
  name: string;
  color: string;
  textColor: string;
  direction: string;
  stations: MrtStation[];
}

const makeStations = (
  lineId: MrtLineId,
  entries: Array<[string, string, string?]>,
): MrtStation[] => entries.map(([code, name, branch]) => ({ code, name, lineId, branch }));

export const MRT_LINES: MrtLine[] = [
  {
    id: "BR", name: "文湖線", color: "#B08247", textColor: "#fff", direction: "動物園 → 南港展覽館",
    stations: makeStations("BR", [
      ["BR01", "動物園"], ["BR02", "木柵"], ["BR03", "萬芳社區"], ["BR04", "萬芳醫院"],
      ["BR05", "辛亥"], ["BR06", "麟光"], ["BR07", "六張犁"], ["BR08", "科技大樓"],
      ["BR09", "大安"], ["BR10", "忠孝復興"], ["BR11", "南京復興"], ["BR12", "中山國中"],
      ["BR13", "松山機場"], ["BR14", "大直"], ["BR15", "劍南路"], ["BR16", "西湖"],
      ["BR17", "港墘"], ["BR18", "文德"], ["BR19", "內湖"], ["BR20", "大湖公園"],
      ["BR21", "葫洲"], ["BR22", "東湖"], ["BR23", "南港軟體園區"], ["BR24", "南港展覽館"],
    ]),
  },
  {
    id: "R", name: "淡水信義線", color: "#E3002C", textColor: "#fff", direction: "廣慈／奉天宮 → 淡水",
    stations: [
      { code: "R01", name: "廣慈／奉天宮", lineId: "R", preview: true },
      ...makeStations("R", [
        ["R02", "象山"], ["R03", "台北101／世貿"], ["R04", "信義安和"], ["R05", "大安"],
        ["R06", "大安森林公園"], ["R07", "東門"], ["R08", "中正紀念堂"], ["R09", "台大醫院"],
        ["R10", "台北車站"], ["R11", "中山"], ["R12", "雙連"], ["R13", "民權西路"],
        ["R14", "圓山"], ["R15", "劍潭"], ["R16", "士林"], ["R17", "芝山"], ["R18", "明德"],
        ["R19", "石牌"], ["R20", "唭哩岸"], ["R21", "奇岩"], ["R22", "北投"],
        ["R23", "復興崗"], ["R24", "忠義"], ["R25", "關渡"], ["R26", "竹圍"],
        ["R27", "紅樹林"], ["R28", "淡水"], ["R22A", "新北投", "新北投支線"],
      ]),
    ],
  },
  {
    id: "G", name: "松山新店線", color: "#008659", textColor: "#fff", direction: "新店 → 松山",
    stations: makeStations("G", [
      ["G01", "新店"], ["G02", "新店區公所"], ["G03", "七張"], ["G04", "大坪林"],
      ["G05", "景美"], ["G06", "萬隆"], ["G07", "公館"], ["G08", "台電大樓"], ["G09", "古亭"],
      ["G10", "中正紀念堂"], ["G11", "小南門"], ["G12", "西門"], ["G13", "北門"],
      ["G14", "中山"], ["G15", "松江南京"], ["G16", "南京復興"], ["G17", "台北小巨蛋"],
      ["G18", "南京三民"], ["G19", "松山"], ["G03A", "小碧潭", "小碧潭支線"],
    ]),
  },
  {
    id: "O", name: "中和新蘆線", color: "#F8A100", textColor: "#402500", direction: "南勢角 → 迴龍／蘆洲",
    stations: makeStations("O", [
      ["O01", "南勢角", "共同主幹"], ["O02", "景安", "共同主幹"], ["O03", "永安市場", "共同主幹"],
      ["O04", "頂溪", "共同主幹"], ["O05", "古亭", "共同主幹"], ["O06", "東門", "共同主幹"],
      ["O07", "忠孝新生", "共同主幹"], ["O08", "松江南京", "共同主幹"], ["O09", "行天宮", "共同主幹"],
      ["O10", "中山國小", "共同主幹"], ["O11", "民權西路", "共同主幹"], ["O12", "大橋頭", "分岔站"],
      ["O13", "台北橋", "迴龍方向"], ["O14", "菜寮", "迴龍方向"], ["O15", "三重", "迴龍方向"],
      ["O16", "先嗇宮", "迴龍方向"], ["O17", "頭前庄", "迴龍方向"], ["O18", "新莊", "迴龍方向"],
      ["O19", "輔大", "迴龍方向"], ["O20", "丹鳳", "迴龍方向"], ["O21", "迴龍", "迴龍方向"],
      ["O50", "三重國小", "蘆洲方向"], ["O51", "三和國中", "蘆洲方向"], ["O52", "徐匯中學", "蘆洲方向"],
      ["O53", "三民高中", "蘆洲方向"], ["O54", "蘆洲", "蘆洲方向"],
    ]),
  },
  {
    id: "BL", name: "板南線", color: "#0070BD", textColor: "#fff", direction: "頂埔 → 南港展覽館",
    stations: makeStations("BL", [
      ["BL01", "頂埔"], ["BL02", "永寧"], ["BL03", "土城"], ["BL04", "海山"], ["BL05", "亞東醫院"],
      ["BL06", "府中"], ["BL07", "板橋"], ["BL08", "新埔"], ["BL09", "江子翠"], ["BL10", "龍山寺"],
      ["BL11", "西門"], ["BL12", "台北車站"], ["BL13", "善導寺"], ["BL14", "忠孝新生"],
      ["BL15", "忠孝復興"], ["BL16", "忠孝敦化"], ["BL17", "國父紀念館"], ["BL18", "市政府"],
      ["BL19", "永春"], ["BL20", "後山埤"], ["BL21", "昆陽"], ["BL22", "南港"], ["BL23", "南港展覽館"],
    ]),
  },
  {
    id: "Y", name: "環狀線", color: "#FFD400", textColor: "#3a3100", direction: "大坪林 → 新北產業園區",
    stations: makeStations("Y", [
      ["Y07", "大坪林"], ["Y08", "十四張"], ["Y09", "秀朗橋"], ["Y10", "景平"], ["Y11", "景安"],
      ["Y12", "中和"], ["Y13", "橋和"], ["Y14", "中原"], ["Y15", "板新"], ["Y16", "板橋"],
      ["Y17", "新埔民生"], ["Y18", "頭前庄"], ["Y19", "幸福"], ["Y20", "新北產業園區"],
    ]),
  },
];

export const ALL_MRT_STATIONS = MRT_LINES.flatMap((line) => line.stations);

export function transferCodesFor(station: MrtStation): string[] {
  return ALL_MRT_STATIONS
    .filter((candidate) => candidate.name === station.name && candidate.code !== station.code)
    .map((candidate) => candidate.code);
}

export function neighborsFor(line: MrtLine, stationIndex: number): { previous?: MrtStation; next?: MrtStation } {
  const station = line.stations[stationIndex];
  if (!station) return {};

  if (line.id === "R" && station.code === "R22A") {
    return { previous: line.stations.find((item) => item.code === "R22") };
  }
  if (line.id === "G" && station.code === "G03A") {
    return { previous: line.stations.find((item) => item.code === "G03") };
  }
  if (line.id === "O" && station.code === "O50") {
    return { previous: line.stations.find((item) => item.code === "O12"), next: line.stations[22] };
  }
  if (line.id === "O" && station.code === "O12") {
    return { previous: line.stations[10], next: line.stations[12] };
  }

  return { previous: line.stations[stationIndex - 1], next: line.stations[stationIndex + 1] };
}

export function validateMrtData(): string[] {
  const errors: string[] = [];
  const codes = new Set<string>();
  ALL_MRT_STATIONS.forEach((station) => {
    if (codes.has(station.code)) errors.push(`重複站碼：${station.code}`);
    codes.add(station.code);
    if (!station.name.trim()) errors.push(`缺少站名：${station.code}`);
  });
  const expectedCounts: Record<MrtLineId, number> = { BR: 24, R: 29, G: 20, O: 26, BL: 23, Y: 14 };
  MRT_LINES.forEach((line) => {
    if (line.stations.length !== expectedCounts[line.id]) {
      errors.push(`${line.id} 預期 ${expectedCounts[line.id]} 站，實際 ${line.stations.length} 站`);
    }
  });
  return errors;
}
