import { beforeEach, describe, expect, it } from "vitest";
import { ALL_MRT_STATIONS } from "./mrtData";
import {
  buildMrtRepairQuestions,
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
