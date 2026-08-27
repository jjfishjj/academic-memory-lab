import { describe, expect, it, vi } from "vitest";
import { completeElementGuideRoute, emptyElementGuideProgress, getElementGuideBadges } from "./elementGuideProgress";

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
});
