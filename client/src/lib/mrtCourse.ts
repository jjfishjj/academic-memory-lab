import { MRT_LINES, type MrtLineId, type MrtStation } from "./mrtData";
import type { MrtProgress } from "./mrtProgress";

export interface MrtSegment {
  id: string;
  lineId: MrtLineId;
  name: string;
  stationCodes: string[];
}

export interface BranchChallenge {
  id: string;
  lineId: MrtLineId;
  title: string;
  description: string;
  questions: Array<{ prompt: string; answerCode: string; optionCodes: string[] }>;
}

export const BRANCH_CHALLENGES: BranchChallenge[] = [
  {
    id: "R-branch", lineId: "R", title: "新北投支線", description: "在北投辨認主線與 R22A 支線。",
    questions: [
      { prompt: "從 R22 北投前往新北投，下一站是？", answerCode: "R22A", optionCodes: ["R22A", "R23", "R21"] },
      { prompt: "R22A 新北投返回主線，會先回到哪一站？", answerCode: "R22", optionCodes: ["R22", "R21", "R23"] },
    ],
  },
  {
    id: "G-branch", lineId: "G", title: "小碧潭支線", description: "在七張辨認 G03A 支線。",
    questions: [
      { prompt: "從 G03 七張前往小碧潭，下一站是？", answerCode: "G03A", optionCodes: ["G03A", "G04", "G02"] },
      { prompt: "G03A 小碧潭返回主線，會先回到哪一站？", answerCode: "G03", optionCodes: ["G03", "G02", "G04"] },
    ],
  },
  {
    id: "O-branch", lineId: "O", title: "大橋頭雙分支", description: "從 O12 分辨迴龍與蘆洲兩個方向。",
    questions: [
      { prompt: "O12 大橋頭往迴龍方向，下一站是？", answerCode: "O13", optionCodes: ["O13", "O50", "O11"] },
      { prompt: "O12 大橋頭往蘆洲方向，下一站是？", answerCode: "O50", optionCodes: ["O50", "O13", "O11"] },
      { prompt: "O50 三重國小回到共同主幹，上一站是？", answerCode: "O12", optionCodes: ["O12", "O13", "O51"] },
    ],
  },
];

const definitions: Record<MrtLineId, Array<[string, string[]]>> = {
  BR: [
    ["動物園到麟光", ["BR01", "BR02", "BR03", "BR04", "BR05", "BR06"]],
    ["六張犁到中山國中", ["BR07", "BR08", "BR09", "BR10", "BR11", "BR12"]],
    ["松山機場到文德", ["BR13", "BR14", "BR15", "BR16", "BR17", "BR18"]],
    ["內湖到南港展覽館", ["BR19", "BR20", "BR21", "BR22", "BR23", "BR24"]],
  ],
  R: [
    ["象山到東門", ["R02", "R03", "R04", "R05", "R06", "R07"]],
    ["中正紀念堂到民權西路", ["R08", "R09", "R10", "R11", "R12", "R13"]],
    ["圓山到石牌", ["R14", "R15", "R16", "R17", "R18", "R19"]],
    ["唭哩岸到忠義", ["R20", "R21", "R22", "R23", "R24"]],
    ["忠義到淡水", ["R24", "R25", "R26", "R27", "R28"]],
  ],
  G: [
    ["新店到萬隆", ["G01", "G02", "G03", "G04", "G05", "G06"]],
    ["公館到北門", ["G07", "G08", "G09", "G10", "G11", "G12", "G13"]],
    ["中山到松山", ["G14", "G15", "G16", "G17", "G18", "G19"]],
  ],
  O: [
    ["南勢角到東門", ["O01", "O02", "O03", "O04", "O05", "O06"]],
    ["忠孝新生到大橋頭", ["O07", "O08", "O09", "O10", "O11", "O12"]],
    ["台北橋到頭前庄", ["O13", "O14", "O15", "O16", "O17"]],
    ["頭前庄到迴龍", ["O17", "O18", "O19", "O20", "O21"]],
    ["蘆洲支線", ["O12", "O50", "O51", "O52", "O53", "O54"]],
  ],
  BL: [
    ["頂埔到府中", ["BL01", "BL02", "BL03", "BL04", "BL05", "BL06"]],
    ["板橋到台北車站", ["BL07", "BL08", "BL09", "BL10", "BL11", "BL12"]],
    ["善導寺到市政府", ["BL13", "BL14", "BL15", "BL16", "BL17", "BL18"]],
    ["永春到南港展覽館", ["BL19", "BL20", "BL21", "BL22", "BL23"]],
  ],
  Y: [
    ["大坪林到中原", ["Y07", "Y08", "Y09", "Y10", "Y11", "Y12", "Y13", "Y14"]],
    ["板新到新北產業園區", ["Y15", "Y16", "Y17", "Y18", "Y19", "Y20"]],
  ],
};

export const MRT_SEGMENTS: MrtSegment[] = Object.entries(definitions).flatMap(([lineId, groups]) =>
  groups.map(([name, stationCodes], index) => ({ id: `${lineId}-${index + 1}`, lineId: lineId as MrtLineId, name, stationCodes })),
);

export function segmentsForLine(lineId: MrtLineId): MrtSegment[] {
  return MRT_SEGMENTS.filter((segment) => segment.lineId === lineId);
}

export function stationsForSegment(segment: MrtSegment): MrtStation[] {
  const line = MRT_LINES.find((item) => item.id === segment.lineId);
  return segment.stationCodes.map((code) => line?.stations.find((station) => station.code === code)).filter(Boolean) as MrtStation[];
}

export function validateMrtSegments(): string[] {
  const errors: string[] = [];
  MRT_SEGMENTS.forEach((segment) => {
    if (segment.stationCodes.length < 5 || segment.stationCodes.length > 8) errors.push(`${segment.id} 不是 5–8 站`);
    if (stationsForSegment(segment).length !== segment.stationCodes.length) errors.push(`${segment.id} 包含不存在的站碼`);
  });
  MRT_LINES.forEach((line) => {
    const activeCodes = line.stations.filter((station) => !station.preview).map((station) => station.code);
    const branchCodes = branchChallengeForLine(line.id)?.questions.flatMap((question) => [question.answerCode, ...question.optionCodes]) ?? [];
    const covered = new Set([...segmentsForLine(line.id).flatMap((segment) => segment.stationCodes), ...branchCodes]);
    activeCodes.forEach((code) => { if (!covered.has(code)) errors.push(`${line.id} 未涵蓋 ${code}`); });
  });
  return errors;
}

export function branchChallengeForLine(lineId: MrtLineId): BranchChallenge | undefined {
  return BRANCH_CHALLENGES.find((challenge) => challenge.lineId === lineId);
}

export function orderedRoutesForLine(lineId: MrtLineId): string[][] {
  const line = MRT_LINES.find((item) => item.id === lineId)!;
  const active = line.stations.filter((station) => !station.preview).map((station) => station.code);
  if (lineId === "R") return [active.filter((code) => code !== "R22A"), ["R22", "R22A"]];
  if (lineId === "G") return [active.filter((code) => code !== "G03A"), ["G03", "G03A"]];
  if (lineId === "O") {
    const trunk = active.filter((code) => Number(code.slice(1)) <= 12);
    return [[...trunk, ...active.filter((code) => /^O(1[3-9]|2[0-1])$/.test(code))], [...trunk, ...active.filter((code) => /^O5[0-4]$/.test(code))]];
  }
  return [active];
}

export function dailyRecommendation(progress: MrtProgress, now = new Date()): { lineId: MrtLineId; segmentId: string; reason: string } {
  const dueCounts = MRT_SEGMENTS.map((segment) => ({
    segment,
    due: segment.stationCodes.filter((code) => {
      const saved = progress.stations[code];
      return saved && new Date(saved.nextReviewAt).getTime() <= now.getTime();
    }).length,
  })).sort((a, b) => b.due - a.due);
  if (dueCounts[0]?.due > 0) return { lineId: dueCounts[0].segment.lineId, segmentId: dueCounts[0].segment.id, reason: `${dueCounts[0].due} 站今天到期` };

  for (const line of MRT_LINES) {
    const segments = segmentsForLine(line.id);
    const next = segments.find((segment, index) => !progress.segments[segment.id]?.passed && (index === 0 || progress.segments[segments[index - 1].id]?.passed));
    if (next) return { lineId: line.id, segmentId: next.id, reason: progress.segments[next.id] ? "繼續完成尚未通過的小段" : "今天解鎖一個新小段" };
  }
  return { lineId: "BR", segmentId: "BR-1", reason: "六線皆完成，維持熟練度" };
}
