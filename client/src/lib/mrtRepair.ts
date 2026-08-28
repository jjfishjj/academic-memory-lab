import type { MrtStation } from "./mrtData";
import type { MrtProgress } from "./mrtProgress";
import type { PersonalMrtMnemonic, MrtMnemonicQuality } from "./mrtMnemonics";

export const MRT_REPAIR_HISTORY_KEY = "memodesk-mrt-repair-history";

export interface MrtRepairResult {
  date: string;
  stationCodes: string[];
  correctCodes: string[];
  accuracy: number;
  weakBefore?: number;
  weakAfter?: number;
}

export type MrtRepairDirection = "code-to-name" | "name-to-code";
export interface MrtRepairQuestionBlueprint {
  station: MrtStation;
  direction: MrtRepairDirection;
  prompt: string;
  answer: string;
}

export interface MrtRepairTrendPoint {
  date: string;
  repairRate: number;
  weakCount: number;
}

const dayKey = (date: Date) => date.toLocaleDateString("en-CA");

export function selectDailyRepairStations(
  stations: MrtStation[],
  progress: MrtProgress,
  mnemonics: Record<string, PersonalMrtMnemonic>,
  now = new Date(),
  count = 5
): MrtStation[] {
  const today = dayKey(now);
  return stations
    .filter(station => !station.preview)
    .map(station => {
      const saved = progress.stations[station.code];
      const accuracy = saved?.attempts ? saved.correct / saved.attempts : 0.5;
      const due =
        saved && new Date(saved.nextReviewAt).getTime() <= now.getTime();
      const hard = mnemonics[station.code]?.quality === "hard";
      const seed =
        Array.from(`${today}-${station.code}`).reduce(
          (sum, char) => sum + char.charCodeAt(0),
          0
        ) % 17;
      return {
        station,
        score:
          (hard ? 100 : 0) + (due ? 40 : 0) + (1 - accuracy) * 50 + seed / 100,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(item => item.station);
}

export function repairQuality(accuracy: number): MrtMnemonicQuality {
  return accuracy >= 0.8 ? "good" : accuracy >= 0.5 ? "okay" : "hard";
}

export function buildMrtRepairQuestions(
  stations: MrtStation[]
): MrtRepairQuestionBlueprint[] {
  return stations.flatMap(station => [
    {
      station,
      direction: "code-to-name" as const,
      prompt: station.code,
      answer: station.name,
    },
    {
      station,
      direction: "name-to-code" as const,
      prompt: station.name,
      answer: station.code,
    },
  ]);
}

export function loadMrtRepairHistory(): MrtRepairResult[] {
  try {
    const value = JSON.parse(
      localStorage.getItem(MRT_REPAIR_HISTORY_KEY) ?? "[]"
    );
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function mrtRepairTrend(
  history: MrtRepairResult[],
  now = new Date(),
  days = 30
): MrtRepairTrendPoint[] {
  const earliest = new Date(now);
  earliest.setHours(0, 0, 0, 0);
  earliest.setDate(earliest.getDate() - days + 1);
  return history
    .filter(
      item => new Date(`${item.date}T00:00:00`).getTime() >= earliest.getTime()
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(item => ({
      date: item.date,
      repairRate: item.accuracy,
      weakCount:
        item.weakAfter ??
        Math.max(0, item.stationCodes.length - item.correctCodes.length),
    }));
}

export function saveMrtRepairResult(result: MrtRepairResult): void {
  const history = loadMrtRepairHistory();
  localStorage.setItem(
    MRT_REPAIR_HISTORY_KEY,
    JSON.stringify(
      [result, ...history.filter(item => item.date !== result.date)].slice(
        0,
        60
      )
    )
  );
  localStorage.setItem("memodesk-local-updated-at", new Date().toISOString());
}
