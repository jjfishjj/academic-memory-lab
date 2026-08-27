import { beforeEach, describe, expect, it } from "vitest";
import { checkIn, earnedBadges, loadCheckIns } from "./achievements";
import { scoreTalentQuiz, TALENT_QUESTIONS } from "./talentQuiz";
import type { MrtProgress } from "./mrtProgress";
import { collectLocalSnapshot, restoreLocalSnapshot } from "./supabase";

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

describe("integrated learning features", () => {
  it("scores all 12 quiz answers and returns two different talents", () => {
    expect(TALENT_QUESTIONS).toHaveLength(12);
    const result = scoreTalentQuiz(Array(12).fill(0));
    expect(result.primaryTalent).not.toBe(result.secondaryTalent);
    expect(result.vark).toBe("visual");
  });

  it("continues a daily streak on consecutive dates", () => {
    checkIn(new Date("2026-08-04T08:00:00Z"));
    checkIn(new Date("2026-08-05T08:00:00Z"));
    expect(loadCheckIns().streak).toBe(2);
  });

  it("unlocks the all-lines badge only when six exams pass", () => {
    const progress: MrtProgress = {
      lines: {},
      stations: {},
      segments: {},
      branches: {},
      lineExams: {},
    };
    expect(
      earnedBadges(progress, { dates: [], streak: 0, bestStreak: 0 }).find(
        badge => badge.id === "all"
      )?.earned
    ).toBe(false);
    ["BR", "R", "G", "O", "BL", "Y"].forEach(id => {
      progress.lineExams[id as keyof typeof progress.lineExams] = {
        bestAccuracy: 100,
        passed: true,
      };
    });
    expect(
      earnedBadges(progress, { dates: [], streak: 0, bestStreak: 0 }).find(
        badge => badge.id === "all"
      )?.earned
    ).toBe(true);
  });

  it("round-trips the local learning snapshot", () => {
    localStorage.setItem(
      "memodesk-memory-profile-v1",
      JSON.stringify({ vark: "visual" })
    );
    localStorage.setItem(
      "memodesk-mrt-style-preferences",
      JSON.stringify({ humor: 2, story: 1, celebrity: 0 })
    );
    localStorage.setItem(
      "memodesk-mrt-mnemonic-experiments",
      JSON.stringify([{ id: "ab-1" }])
    );
    localStorage.setItem(
      "memodesk-mrt-repair-history",
      JSON.stringify([{ date: "2026-08-13", accuracy: 80 }])
    );
    localStorage.setItem(
      "memodesk-element-talent-progress-v1",
      JSON.stringify({ version: 1, talents: { visualBuilder: { xp: 35 } } })
    );
    localStorage.setItem(
      "memodesk-element-guide-progress-v1",
      JSON.stringify({ routes: { "period-1": { completedAt: "2026-08-27T00:00:00Z", completions: 1, bestQuizScore: 2 } } })
    );
    const snapshot = collectLocalSnapshot();
    localStorage.clear();
    restoreLocalSnapshot(snapshot);
    expect(
      JSON.parse(localStorage.getItem("memodesk-memory-profile-v1")!)
    ).toEqual({ vark: "visual" });
    expect(
      JSON.parse(localStorage.getItem("memodesk-mrt-style-preferences")!)
    ).toEqual({ humor: 2, story: 1, celebrity: 0 });
    expect(
      JSON.parse(localStorage.getItem("memodesk-mrt-mnemonic-experiments")!)
    ).toEqual([{ id: "ab-1" }]);
    expect(
      JSON.parse(localStorage.getItem("memodesk-mrt-repair-history")!)
    ).toEqual([{ date: "2026-08-13", accuracy: 80 }]);
    expect(
      JSON.parse(localStorage.getItem("memodesk-element-talent-progress-v1")!)
    ).toEqual({ version: 1, talents: { visualBuilder: { xp: 35 } } });
    expect(
      JSON.parse(localStorage.getItem("memodesk-element-guide-progress-v1")!)
    ).toEqual({ routes: { "period-1": { completedAt: "2026-08-27T00:00:00Z", completions: 1, bestQuizScore: 2 } } });
  });
});
