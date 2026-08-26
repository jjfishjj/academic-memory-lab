import { describe, expect, it } from "vitest";
import { ELEMENTS } from "./elementData";
import { isCorrectPlacement, placementKey, selectPlacementRound } from "./elementPlacement";
import type { ElementProgress } from "./elementProgress";

describe("element placement game", () => {
  it("uses period/group keys and distinct f-block slots", () => {
    expect(placementKey(ELEMENTS[25])).toBe("p4-g8");
    expect(placementKey(ELEMENTS[57])).toBe("lanthanide-58");
    expect(placementKey(ELEMENTS[89])).toBe("actinide-90");
  });

  it("accepts only the exact target slot", () => {
    expect(isCorrectPlacement(ELEMENTS[7], "p2-g16")).toBe(true);
    expect(isCorrectPlacement(ELEMENTS[7], "p3-g16")).toBe(false);
  });

  it("selects due elements before unseen and mastered elements", () => {
    const progress: ElementProgress = { version: 1, elements: {
      "1": { attempts: 1, correct: 0, streak: 0, intervalIndex: 0, lastAnsweredAt: "2026-08-13T00:00:00.000Z", nextReviewAt: "2026-08-13T00:00:00.000Z" },
      "2": { attempts: 3, correct: 3, streak: 3, intervalIndex: 2, lastAnsweredAt: "2026-08-13T00:00:00.000Z", nextReviewAt: "2099-01-01T00:00:00.000Z" },
    }};
    expect(selectPlacementRound(ELEMENTS.slice(0, 3), progress, 1, () => .5)[0].number).toBe(1);
  });
});
