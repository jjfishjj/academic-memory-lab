import { describe, expect, it, vi } from "vitest";
import { completeElementGuideRoute, emptyElementGuideProgress, getElementGuideBadges, getElementGuideQuizBest, mergeElementGuideProgress } from "./elementGuideProgress";

describe("elementGuideProgress", () => {
  it("tracks unique completed routes and completion count", () => {
    vi.stubGlobal("localStorage", { setItem: vi.fn(), getItem: vi.fn() });
    const once = completeElementGuideRoute(emptyElementGuideProgress(), "group", 1);
    const twice = completeElementGuideRoute(once, "group", 1);
    expect(Object.keys(twice.routes)).toHaveLength(1);
    expect(twice.routes["group-1"]?.completions).toBe(2);
  });

  it("unlocks route and perfect-quiz badges", () => {
    vi.stubGlobal("localStorage", { setItem: vi.fn(), getItem: vi.fn() });
    const completed = completeElementGuideRoute(emptyElementGuideProgress(), "period", 2, 5);
    const badges = getElementGuideBadges(completed);
    expect(badges.find(badge => badge.id === "first-route")?.unlocked).toBe(true);
    expect(badges.find(badge => badge.id === "perfect-quiz")?.unlocked).toBe(true);
  });

  it("keeps independent best results and badges for all three quiz difficulties", () => {
    vi.stubGlobal("localStorage", { setItem: vi.fn(), getItem: vi.fn() });
    let progress = completeElementGuideRoute(emptyElementGuideProgress(), "period", 1);
    progress = completeElementGuideRoute(progress, "period", 1, { difficulty: "simple", score: 2, total: 2 });
    progress = completeElementGuideRoute(progress, "period", 1, { difficulty: "advanced", score: 1, total: 2 });
    progress = completeElementGuideRoute(progress, "period", 1, { difficulty: "confusion", score: 2, total: 2 });
    progress = completeElementGuideRoute(progress, "period", 1, { difficulty: "advanced", score: 0, total: 2 });

    expect(getElementGuideQuizBest(progress, "period", 1, "simple")).toEqual({ score: 2, total: 2 });
    expect(getElementGuideQuizBest(progress, "period", 1, "advanced")).toEqual({ score: 1, total: 2 });
    expect(getElementGuideQuizBest(progress, "period", 1, "confusion")).toEqual({ score: 2, total: 2 });
    const badges = getElementGuideBadges(progress);
    expect(badges.find(badge => badge.id === "simple-perfect")?.unlocked).toBe(true);
    expect(badges.find(badge => badge.id === "advanced-perfect")?.unlocked).toBe(false);
    expect(badges.find(badge => badge.id === "confusion-perfect")?.unlocked).toBe(true);
  });

  it("merges the best result of each difficulty without losing old records", () => {
    const local = { routes: { "group-1": { completedAt: "2026-08-20T00:00:00Z", completions: 2, bestQuizScore: 4, quizBests: { simple: { score: 4, total: 5 } } } } };
    const incoming = { routes: { "group-1": { completedAt: "2026-08-21T00:00:00Z", completions: 1, bestQuizScore: 5, quizBests: { advanced: { score: 5, total: 5 } } } } };
    expect(mergeElementGuideProgress(local, incoming).routes["group-1"]).toMatchObject({
      completedAt: "2026-08-21T00:00:00Z",
      completions: 2,
      bestQuizScore: 5,
      quizBests: { simple: { score: 4, total: 5 }, advanced: { score: 5, total: 5 } },
    });
  });
});
