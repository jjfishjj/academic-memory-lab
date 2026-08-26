import type { MrtStation } from "./mrtData";
import type { MrtProgress } from "./mrtProgress";
import type { PersonalMrtMnemonic, MrtMnemonicQuality } from "./mrtMnemonics";

export const MRT_REPAIR_HISTORY_KEY = "memodesk-mrt-repair-history";

export interface MrtRepairResult {
  date: string;
  stationCodes: string[];
  correctCodes: string[];
  accuracy: number;
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

export function saveMrtRepairResult(result: MrtRepairResult): void {
  let history: MrtRepairResult[] = [];
  try {
    history = JSON.parse(localStorage.getItem(MRT_REPAIR_HISTORY_KEY) ?? "[]");
  } catch {
    /* start clean */
  }
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
