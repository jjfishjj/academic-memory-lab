import { beforeEach, describe, expect, it } from "vitest";
import { loadMrtProgress, prioritizeStations, recordMrtAnswer, REVIEW_INTERVAL_DAYS } from "./mrtProgress";
import type { MrtStation } from "./mrtData";

const station = (code: string): MrtStation => ({ code, name: code, lineId: "BL" });

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  get length() { return this.values.size; }
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true });
});

describe("MRT spaced repetition", () => {
  it("keeps a wrong station due immediately and prioritizes it", () => {
    const now = new Date("2026-08-03T08:00:00.000Z");
    recordMrtAnswer(station("BL07"), false, now);
    const progress = loadMrtProgress();
    expect(progress.stations.BL07.nextReviewAt).toBe(now.toISOString());
    expect(prioritizeStations([station("BL08"), station("BL07")], progress, now)[0].code).toBe("BL07");
  });

  it("uses 1, 3, 7 and 14 day intervals across successful review days", () => {
    const target = station("BL07");
    let now = new Date("2026-08-03T08:00:00.000Z");
    recordMrtAnswer(target, true, now);
    expect(loadMrtProgress().stations.BL07.intervalIndex).toBe(0);

    REVIEW_INTERVAL_DAYS.slice(1).forEach((_, expectedIndex) => {
      now = new Date(now.getTime() + (expectedIndex === 0 ? 1 : REVIEW_INTERVAL_DAYS[expectedIndex]) * 86_400_000);
      recordMrtAnswer(target, true, now);
      expect(loadMrtProgress().stations.BL07.intervalIndex).toBe(expectedIndex + 1);
    });
  });

  it("does not advance twice when answered correctly on the same day", () => {
    const target = station("BL07");
    recordMrtAnswer(target, true, new Date("2026-08-03T08:00:00.000Z"));
    recordMrtAnswer(target, true, new Date("2026-08-03T09:00:00.000Z"));
    expect(loadMrtProgress().stations.BL07.intervalIndex).toBe(0);
  });
});
