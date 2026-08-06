import { beforeEach, describe, expect, it } from "vitest";
import { MRT_LINES } from "./mrtData";
import { BRANCH_CHALLENGES, MRT_SEGMENTS, dailyRecommendation, orderedRoutesForLine, segmentsForLine, validateMrtSegments } from "./mrtCourse";
import { loadMrtProgress, recordMrtAnswer, saveBranchResult, saveLineExamResult, saveSegmentResult } from "./mrtProgress";
import { ALL_MRT_STATIONS } from "./mrtData";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  get length() { return this.values.size; }
}

beforeEach(() => Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true }));

describe("MRT route course", () => {
  it("keeps every segment between five and eight stations and covers every active code", () => {
    expect(validateMrtSegments()).toEqual([]);
    MRT_SEGMENTS.forEach((segment) => expect(segment.stationCodes.length).toBeGreaterThanOrEqual(5));
    MRT_SEGMENTS.forEach((segment) => expect(segment.stationCodes.length).toBeLessThanOrEqual(8));
    MRT_LINES.forEach((line) => expect(segmentsForLine(line.id).length).toBeGreaterThan(0));
  });

  it("requires both forward and reverse scores to pass a segment", () => {
    saveSegmentResult("BL-1", 100, 60);
    expect(loadMrtProgress().segments["BL-1"].passed).toBe(false);
    saveSegmentResult("BL-1", 70, 100);
    expect(loadMrtProgress().segments["BL-1"].passed).toBe(true);
  });

  it("requires 85 percent to pass a full line exam", () => {
    saveLineExamResult("BL", 84);
    expect(loadMrtProgress().lineExams.BL?.passed).toBe(false);
    saveLineExamResult("BL", 85);
    expect(loadMrtProgress().lineExams.BL?.passed).toBe(true);
  });

  it("builds separate ordered routes for every branch", () => {
    expect(orderedRoutesForLine("R")[1]).toEqual(["R22", "R22A"]);
    expect(orderedRoutesForLine("G")[1]).toEqual(["G03", "G03A"]);
    expect(orderedRoutesForLine("O")).toHaveLength(2);
    expect(orderedRoutesForLine("O")[0].at(-1)).toBe("O21");
    expect(orderedRoutesForLine("O")[1].at(-1)).toBe("O54");
  });

  it("recommends a segment containing the most due stations", () => {
    const now = new Date("2026-08-03T08:00:00.000Z");
    recordMrtAnswer(ALL_MRT_STATIONS.find((station) => station.code === "BL07")!, false, now);
    const recommendation = dailyRecommendation(loadMrtProgress(), now);
    expect(recommendation.lineId).toBe("BL");
    expect(recommendation.segmentId).toBe("BL-2");
  });

  it("requires 80 percent to pass a branch challenge", () => {
    expect(BRANCH_CHALLENGES.map((challenge) => challenge.lineId)).toEqual(["R", "G", "O"]);
    saveBranchResult("O-branch", 79);
    expect(loadMrtProgress().branches["O-branch"].passed).toBe(false);
    saveBranchResult("O-branch", 80);
    expect(loadMrtProgress().branches["O-branch"].passed).toBe(true);
  });
});
