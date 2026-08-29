import type { MrtStation } from "./mrtData";
import type { MrtProgress } from "./mrtProgress";
import type { PersonalMrtMnemonic, MrtMnemonicQuality } from "./mrtMnemonics";

export const MRT_REPAIR_HISTORY_KEY = "memodesk-mrt-repair-history";
export const MRT_REPAIR_CONFUSIONS_KEY = "memodesk-mrt-repair-confusions";
export const MRT_REPAIR_WEEKLY_GOAL_KEY = "memodesk-mrt-repair-weekly-goal";

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

export type MrtRepairConfusions = Record<string, Record<string, number>>;

export interface MrtRepairGoalStats {
  todayCompleted: boolean;
  todayAccuracy: number;
  streak: number;
  weekCompleted: number;
  weeklyGoal: number;
  weeklyRate: number;
}

export interface MrtRepairGoalRecommendation {
  currentGoal: number;
  suggestedGoal: number;
  completedDays: number;
  completionRate: number;
  direction: "raise" | "keep" | "lower";
}

export interface MrtRepairConfusionRow {
  key: string;
  sourceCode: string;
  sourceName: string;
  confusedCode: string;
  confusedName: string;
  direction: MrtRepairDirection;
  selected: string;
  count: number;
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

export function buildMrtConfusionPairQuestions(
  row: MrtRepairConfusionRow,
  stations: MrtStation[]
): MrtRepairQuestionBlueprint[] {
  const source = stations.find(station => station.code === row.sourceCode);
  const confused = stations.find(station => station.code === row.confusedCode);
  if (!source || !confused) return [];
  return buildMrtRepairQuestions([source, confused]);
}

const confusionKey = (question: MrtRepairQuestionBlueprint) =>
  `${question.station.code}:${question.direction}`;

const optionForStation = (
  station: MrtStation,
  direction: MrtRepairDirection
) => (direction === "code-to-name" ? station.name : station.code);

const stationNumber = (code: string) => Number(code.match(/\d+/)?.[0] ?? 99);

export function loadMrtRepairConfusions(): MrtRepairConfusions {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(MRT_REPAIR_CONFUSIONS_KEY) ?? "{}"
    );
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function recordMrtRepairConfusion(
  question: MrtRepairQuestionBlueprint,
  selected: string
): MrtRepairConfusions {
  const current = loadMrtRepairConfusions();
  if (selected === question.answer) return current;
  const key = confusionKey(question);
  const choices = current[key] ?? {};
  const next = {
    ...current,
    [key]: { ...choices, [selected]: (choices[selected] ?? 0) + 1 },
  };
  localStorage.setItem(MRT_REPAIR_CONFUSIONS_KEY, JSON.stringify(next));
  localStorage.setItem("memodesk-local-updated-at", new Date().toISOString());
  return next;
}

export function summarizeMrtRepairConfusions(
  confusions: MrtRepairConfusions,
  stations: MrtStation[]
): MrtRepairConfusionRow[] {
  const byCode = new Map(stations.map(station => [station.code, station]));
  const byName = new Map(stations.map(station => [station.name, station]));
  return Object.entries(confusions)
    .flatMap(([key, selections]) => {
      const separator = key.indexOf(":");
      const sourceCode = key.slice(0, separator);
      const direction = key.slice(separator + 1) as MrtRepairDirection;
      const source = byCode.get(sourceCode);
      if (!source || !["code-to-name", "name-to-code"].includes(direction))
        return [];
      return Object.entries(selections).flatMap(([selected, count]) => {
        const confused =
          direction === "code-to-name"
            ? byName.get(selected)
            : byCode.get(selected);
        if (!confused || !Number.isFinite(count) || count <= 0) return [];
        return [
          {
            key,
            sourceCode,
            sourceName: source.name,
            confusedCode: confused.code,
            confusedName: confused.name,
            direction,
            selected,
            count,
          },
        ];
      });
    })
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.sourceCode.localeCompare(b.sourceCode) ||
        a.confusedCode.localeCompare(b.confusedCode)
    );
}

export function clearMrtRepairConfusion(
  key: string,
  selected: string
): MrtRepairConfusions {
  const current = loadMrtRepairConfusions();
  const next = { ...current };
  const selections = { ...(next[key] ?? {}) };
  delete selections[selected];
  if (Object.keys(selections).length) next[key] = selections;
  else delete next[key];
  localStorage.setItem(MRT_REPAIR_CONFUSIONS_KEY, JSON.stringify(next));
  localStorage.setItem("memodesk-local-updated-at", new Date().toISOString());
  return next;
}

export function buildAdaptiveMrtRepairOptions(
  question: MrtRepairQuestionBlueprint,
  stations: MrtStation[],
  confusions = loadMrtRepairConfusions(),
  count = 4
): string[] {
  const previous = confusions[confusionKey(question)] ?? {};
  const candidates = stations
    .filter(
      station => !station.preview && station.code !== question.station.code
    )
    .map(station => {
      const option = optionForStation(station, question.direction);
      const sharedNameCharacters = Array.from(station.name).filter(character =>
        question.station.name.includes(character)
      ).length;
      const score =
        (previous[option] ?? 0) * 10_000 +
        (station.lineId === question.station.lineId ? 100 : 0) +
        Math.max(
          0,
          30 -
            Math.abs(
              stationNumber(station.code) - stationNumber(question.station.code)
            )
        ) +
        sharedNameCharacters * 12;
      return { option, score, code: station.code };
    })
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code))
    .slice(0, Math.max(0, count - 1))
    .map(item => item.option);
  const options = [question.answer, ...candidates];
  const offset =
    Array.from(question.prompt).reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0
    ) % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
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

export function loadMrtRepairWeeklyGoal(): number {
  const value = Number(localStorage.getItem(MRT_REPAIR_WEEKLY_GOAL_KEY));
  return [3, 5, 7].includes(value) ? value : 5;
}

export function saveMrtRepairWeeklyGoal(value: number): number {
  const next = [3, 5, 7].includes(value) ? value : 5;
  localStorage.setItem(MRT_REPAIR_WEEKLY_GOAL_KEY, JSON.stringify(next));
  localStorage.setItem("memodesk-local-updated-at", new Date().toISOString());
  return next;
}

export function mrtRepairGoalStats(
  history: MrtRepairResult[],
  now = new Date(),
  weeklyGoal = 5
): MrtRepairGoalStats {
  const today = dayKey(now);
  const byDate = new Map(history.map(item => [item.date, item]));
  const todayResult = byDate.get(today);
  const weekStart = new Date(now);
  weekStart.setHours(12, 0, 0, 0);
  const mondayOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  const weekCompleted = Array.from(byDate.keys()).filter(date => {
    const value = new Date(`${date}T12:00:00`);
    return value >= weekStart && value <= now;
  }).length;
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  if (!todayResult) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (byDate.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    todayCompleted: Boolean(todayResult),
    todayAccuracy: todayResult?.accuracy ?? 0,
    streak,
    weekCompleted,
    weeklyGoal,
    weeklyRate: Math.min(100, Math.round((weekCompleted / weeklyGoal) * 100)),
  };
}

export function recommendMrtRepairWeeklyGoal(
  history: MrtRepairResult[],
  now = new Date(),
  currentGoal = 5
): MrtRepairGoalRecommendation {
  const earliest = new Date(now);
  earliest.setHours(0, 0, 0, 0);
  earliest.setDate(earliest.getDate() - 13);
  const completedDays = new Set(
    history
      .filter(item => {
        const date = new Date(`${item.date}T12:00:00`);
        return date >= earliest && date <= now;
      })
      .map(item => item.date)
  ).size;
  const expected = currentGoal * 2;
  const completionRate = expected
    ? Math.min(100, Math.round((completedDays / expected) * 100))
    : 0;
  const goals = [3, 5, 7];
  const index = Math.max(0, goals.indexOf(currentGoal));
  const direction =
    completionRate >= 80 && index < goals.length - 1
      ? "raise"
      : completionRate < 50 && index > 0
        ? "lower"
        : "keep";
  const suggestedGoal =
    direction === "raise"
      ? goals[index + 1]
      : direction === "lower"
        ? goals[index - 1]
        : currentGoal;
  return {
    currentGoal,
    suggestedGoal,
    completedDays,
    completionRate,
    direction,
  };
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
