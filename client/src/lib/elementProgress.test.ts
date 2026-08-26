import { beforeEach, describe, expect, it } from "vitest";
import { ELEMENT_REVIEW_DAYS, getMasteryStatus, loadElementProgress, prioritizeElements, recordElementAnswer, repairElementForRound, summarizeElementProgress, updateElementRepairQueue } from "./elementProgress";
import { ELEMENTS } from "./elementData";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null; }
  get length() { return this.values.size; }
}

beforeEach(() => Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true }));

describe("element mastery and spaced review", () => {
  it("keeps a wrong element due and prioritizes it", () => {
    const now = new Date("2026-08-13T08:00:00.000Z");
    recordElementAnswer(ELEMENTS[7], false, now);
    const progress = loadElementProgress();
    expect(getMasteryStatus(progress.elements["8"], now)).toBe("due");
    expect(prioritizeElements([ELEMENTS[0], ELEMENTS[7]], progress, now)[0].number).toBe(8);
  });

  it("advances through 1, 3 and 7 day review intervals", () => {
    let now = new Date("2026-08-13T08:00:00.000Z");
    recordElementAnswer(ELEMENTS[0], true, now);
    expect(loadElementProgress().elements["1"].nextReviewAt).toBe(new Date(now.getTime() + ELEMENT_REVIEW_DAYS[0] * 86_400_000).toISOString());
    now = new Date("2026-08-14T08:00:00.000Z"); recordElementAnswer(ELEMENTS[0], true, now);
    now = new Date("2026-08-17T08:00:00.000Z"); recordElementAnswer(ELEMENTS[0], true, now);
    expect(loadElementProgress().elements["1"].intervalIndex).toBe(2);
    expect(getMasteryStatus(loadElementProgress().elements["1"], now)).toBe("mastered");
  });

  it("summarizes all 118 elements including unseen ones", () => {
    recordElementAnswer(ELEMENTS[0], false, new Date("2026-08-13T08:00:00.000Z"));
    const summary = summarizeElementProgress(loadElementProgress(), new Date("2026-08-13T08:00:00.000Z"));
    expect(summary.due).toBe(1); expect(summary.unseen).toBe(117);
  });

  it("removes a repaired mistake and filters mistakes outside the active range", () => {
    expect(updateElementRepairQueue([3, 26], 3, true, 20)).toEqual([]);
    expect(updateElementRepairQueue([3, 26], 8, false, 20)).toEqual([3, 8]);
  });

  it("schedules repairs on the actual fourth round only", () => {
    expect(repairElementForRound([8], 3, 20)).toBeUndefined();
    expect(repairElementForRound([8], 4, 20)).toBe(8);
    expect(repairElementForRound([26, 8], 4, 20)).toBe(8);
    expect(repairElementForRound([8], 5, 20)).toBeUndefined();
  });
});
