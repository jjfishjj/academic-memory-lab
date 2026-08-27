import { describe, expect, it } from "vitest";
import { ELEMENTS } from "./elementData";
import { elementMemoryCardFilename, elementMemoryCardMetadata } from "./elementMemoryCard";

describe("elementMemoryCard", () => {
  it("creates a stable PNG filename", () => {
    expect(elementMemoryCardFilename(ELEMENTS[0])).toBe("memodesk-element-01-H.png");
    expect(elementMemoryCardFilename(ELEMENTS[19])).toBe("memodesk-element-20-Ca.png");
  });

  it("normalizes the learner, route and quiz metadata printed on the card", () => {
    expect(elementMemoryCardMetadata({ learnerName: " 小明 ", routeLabel: " 第 1 週期 ", quizScore: 7, quizTotal: 5 })).toEqual({
      learnerName: "小明",
      routeLabel: "第 1 週期",
      quizLabel: "最佳測驗 5 / 5",
    });
    expect(elementMemoryCardMetadata({ learnerName: "", routeLabel: "", quizScore: 0, quizTotal: 0 })).toEqual({
      learnerName: "記憶手帳學員",
      routeLabel: "自由探索",
      quizLabel: "尚未進行路線測驗",
    });
  });
});
