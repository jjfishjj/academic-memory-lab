import { beforeEach, describe, expect, it } from "vitest";
import { ALL_MRT_STATIONS } from "./mrtData";
import {
  buildMrtRepairQuestions,
  buildAdaptiveMrtRepairOptions,
  clearMrtRepairConfusion,
  loadMrtRepairConfusions,
  mrtRepairGoalStats,
  recommendMrtRepairWeeklyGoal,
  recordMrtRepairConfusion,
  summarizeMrtRepairConfusions,
  selectDailyRepairStations,
  repairQuality,
  saveMrtRepairResult,
  MRT_REPAIR_HISTORY_KEY,
  mrtRepairTrend,
} from "./mrtRepair";
import type { MrtProgress } from "./mrtProgress";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  clear() {
    this.values.clear();
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  get length() {
    return this.values.size;
  }
}
beforeEach(() =>
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  })
);

describe("MRT weak-station repair", () => {
  const progress: MrtProgress = {
    lines: {},
    stations: {},
    segments: {},
    lineExams: {},
    branches: {},
  };

  it("selects five stations and puts manually hard stations first", () => {
    const chosen = selectDailyRepairStations(
      ALL_MRT_STATIONS,
      progress,
      { BL07: { sound: "板橋", favorite: false, quality: "hard" } },
      new Date("2026-08-13T08:00:00Z")
    );
    expect(chosen).toHaveLength(5);
    expect(chosen[0].code).toBe("BL07");
    const questions = buildMrtRepairQuestions(chosen);
    expect(questions).toHaveLength(10);
    expect(
      questions
        .filter(question => question.station.code === "BL07")
        .map(question => question.direction)
    ).toEqual(["code-to-name", "name-to-code"]);
  });

  it("builds a compatible 30-day repair trend", () => {
    const trend = mrtRepairTrend(
      [
        {
          date: "2026-08-12",
          stationCodes: ["BR01", "BR02"],
          correctCodes: ["BR01"],
          accuracy: 50,
        },
        {
          date: "2026-08-13",
          stationCodes: ["BR01", "BR02"],
          correctCodes: ["BR01", "BR02"],
          accuracy: 100,
          weakAfter: 0,
        },
      ],
      new Date("2026-08-13T12:00:00"),
      30
    );
    expect(trend.map(item => item.weakCount)).toEqual([1, 0]);
    expect(trend.at(-1)?.repairRate).toBe(100);
  });

  it("prioritizes a previously confused answer in adaptive options", () => {
    const station = ALL_MRT_STATIONS.find(item => item.code === "BR06")!;
    const confused = ALL_MRT_STATIONS.find(item => item.code === "BL18")!;
    const [question] = buildMrtRepairQuestions([station]);
    recordMrtRepairConfusion(question, confused.name);
    recordMrtRepairConfusion(question, confused.name);
    const options = buildAdaptiveMrtRepairOptions(
      question,
      ALL_MRT_STATIONS,
      loadMrtRepairConfusions()
    );
    expect(options).toHaveLength(4);
    expect(options).toContain(question.answer);
    expect(options).toContain(confused.name);
  });

  it("calculates today's result, streak and configurable weekly goal", () => {
    const history = ["2026-08-25", "2026-08-26", "2026-08-27"].map(
      (date, index) => ({
        date,
        stationCodes: ["BR01"],
        correctCodes: index === 2 ? ["BR01"] : [],
        accuracy: index === 2 ? 100 : 60,
      })
    );
    const stats = mrtRepairGoalStats(
      history,
      new Date("2026-08-27T18:00:00"),
      5
    );
    expect(stats.todayCompleted).toBe(true);
    expect(stats.todayAccuracy).toBe(100);
    expect(stats.streak).toBe(3);
    expect(stats.weekCompleted).toBe(3);
    expect(stats.weeklyRate).toBe(60);
  });

  it("sorts confusion pairs and clears one selected pair", () => {
    const station = ALL_MRT_STATIONS.find(item => item.code === "BR06")!;
    const confused = ALL_MRT_STATIONS.find(item => item.code === "BR07")!;
    const [question] = buildMrtRepairQuestions([station]);
    recordMrtRepairConfusion(question, confused.name);
    recordMrtRepairConfusion(question, confused.name);
    const [row] = summarizeMrtRepairConfusions(
      loadMrtRepairConfusions(),
      ALL_MRT_STATIONS
    );
    expect(row).toMatchObject({
      sourceCode: "BR06",
      confusedCode: "BR07",
      count: 2,
    });
    clearMrtRepairConfusion(row.key, row.selected);
    expect(
      summarizeMrtRepairConfusions(loadMrtRepairConfusions(), ALL_MRT_STATIONS)
    ).toEqual([]);
  });

  it("recommends raising or lowering the weekly goal from 14 days", () => {
    const completeDays = Array.from({ length: 10 }, (_, index) => ({
      date: `2026-08-${String(16 + index).padStart(2, "0")}`,
      stationCodes: ["BR01"],
      correctCodes: ["BR01"],
      accuracy: 100,
    }));
    expect(
      recommendMrtRepairWeeklyGoal(
        completeDays,
        new Date("2026-08-29T18:00:00"),
        5
      )
    ).toMatchObject({ direction: "raise", suggestedGoal: 7 });
    expect(
      recommendMrtRepairWeeklyGoal([], new Date("2026-08-29T18:00:00"), 5)
    ).toMatchObject({ direction: "lower", suggestedGoal: 3 });
  });

  it("reassesses quality and stores one result per day", () => {
    expect(repairQuality(0.8)).toBe("good");
    expect(repairQuality(0.6)).toBe("okay");
    expect(repairQuality(0.49)).toBe("hard");
    saveMrtRepairResult({
      date: "2026-08-13",
      stationCodes: ["BL07"],
      correctCodes: [],
      accuracy: 0,
    });
    saveMrtRepairResult({
      date: "2026-08-13",
      stationCodes: ["BL07"],
      correctCodes: ["BL07"],
      accuracy: 100,
    });
    expect(
      JSON.parse(localStorage.getItem(MRT_REPAIR_HISTORY_KEY)!)
    ).toHaveLength(1);
  });
});
