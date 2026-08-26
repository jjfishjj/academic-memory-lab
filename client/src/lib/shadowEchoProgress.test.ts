import { beforeEach, describe, expect, it } from "vitest";
import { loadShadowProgress, saveShadowAttempt, shadowProgressSummary } from "./shadowEchoProgress";

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

beforeEach(() => Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true }));

describe("Shadow Echo progress", () => {
  it("keeps old records compatible and aggregates common issues", () => {
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
    saveShadowAttempt({ lessonId: "one", at: "2026-08-13", transcript: "hello", scores: [70, 80, 90, 100], durationMs: 1000, issues: ["/θ/", "city"] });
    saveShadowAttempt({ lessonId: "two", at: "2026-08-13", transcript: "world", scores: [80, 80, 80, 80], durationMs: 900, issues: ["/θ/"] });
    const summary = shadowProgressSummary(loadShadowProgress());
    expect(summary.attempts).toBe(2);
    expect(summary.average).toBe(83);
    expect(summary.commonIssues[0]).toEqual(["/θ/", 2]);
  });
});
