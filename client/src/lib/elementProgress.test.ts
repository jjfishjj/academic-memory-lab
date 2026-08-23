import { describe, expect, it } from "vitest";
import { ELEMENTS } from "./elementData";
import {
  getDueElements,
  getMasteredCount,
  getReviewQueue,
  recordElementReview,
  type ElementProgress,
} from "./elementProgress";
import { getNumberScene, getStoryChapter } from "./elementMemory";

describe("element spaced repetition", () => {
  it("keeps a wrong answer due immediately and moves it to the front", () => {
    const now = Date.parse("2026-08-20T08:00:00.000Z");
    const progress = recordElementReview({}, 26, false, now);
    expect(
      getDueElements(progress, ELEMENTS.slice(0, 36), now).map(
        item => item.number
      )
    ).toContain(26);
    expect(
      getReviewQueue(progress, [ELEMENTS[0], ELEMENTS[25]], now)[0].number
    ).toBe(26);
  });

  it("uses 1, 3, 7, 14 and 30 day intervals for successful recalls", () => {
    let progress: ElementProgress = {};
    const now = Date.parse("2026-08-20T08:00:00.000Z");
    [1, 3, 7, 14, 30].forEach(days => {
      progress = recordElementReview(
        progress,
        8,
        true,
        now + (days === 1 ? 0 : days * 86_400_000)
      );
      expect(progress[8].intervalDays).toBe(days);
    });
    expect(getMasteredCount(progress, [ELEMENTS[7]])).toBe(1);
  });

  it("creates distinct coordinate scenes for the last 19 elements", () => {
    expect(getNumberScene(100).station).toContain("100 號");
    expect(getNumberScene(118).station).toContain("118 號");
    expect(getNumberScene(118).station).not.toContain("99 號");
    expect(getStoryChapter(118)).toContain("111–118");
  });
});
