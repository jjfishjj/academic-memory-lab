import { describe, expect, it } from "vitest";
import { ELEMENTS } from "./elementData";
import { elementMemoryCardFilename, elementMemoryCardMetadata, elementMemoryCardTheme, elementMemoryIllustration } from "./elementMemoryCard";
import { getElementMemoryTip } from "./elementMemoryTips";
import { ELEMENT_MEMORY_SCENES } from "./elementMemoryScenes";

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

  it("uses a distinct category palette and an authored scene illustration through element 54", () => {
    expect(elementMemoryCardTheme(ELEMENTS[0])).not.toEqual(elementMemoryCardTheme(ELEMENTS[1]));
    expect(elementMemoryCardTheme(ELEMENTS[20]).accent).toBe("#c99022");
    const xenonTip = getElementMemoryTip(54)!;
    expect(elementMemoryIllustration(xenonTip)).toBe("🚀");
    expect(elementMemoryCardFilename(ELEMENTS[53])).toBe("memodesk-element-54-Xe.png");
  });

  it("defines 54 independent original Canvas scene compositions", () => {
    const scenes = Object.values(ELEMENT_MEMORY_SCENES);
    expect(scenes).toHaveLength(54);
    expect(new Set(scenes.map(scene => `${scene.backdrop}|${scene.actors.join("|")}|${scene.action}`)).size).toBe(54);
    expect(ELEMENT_MEMORY_SCENES[1].action).toContain("氣球");
    expect(ELEMENT_MEMORY_SCENES[54].action).toContain("氙");
  });
});
