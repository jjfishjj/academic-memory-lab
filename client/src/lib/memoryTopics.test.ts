import { beforeEach, describe, expect, it } from "vitest";
import {
  createMemoryTopic,
  parseMemoryPoints,
  recommendedTraining,
} from "./memoryTopics";
const store = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => store.get(k) || null,
    setItem: (k: string, v: string) => store.set(k, v),
  },
});
describe("memory topics", () => {
  beforeEach(() => store.clear());
  it("parses paired and single lines", () => {
    const p = parseMemoryPoints("H :: 氫\n氧");
    expect(p).toHaveLength(2);
    expect(p[0].answer).toBe("氫");
    expect(p[1].answer).toBe("氧");
  });
  it("requires content", () => {
    expect(() => createMemoryTopic("主題", "化學", "  ")).toThrow();
    expect(createMemoryTopic("主題", "化學", "H :: 氫").points).toHaveLength(1);
  });
  it("recommends from profile", () => {
    expect(recommendedTraining(null).id).toBe("flip");
    expect(
      recommendedTraining({
        vark: "auditory",
        primaryTalent: "textOrganizer",
        secondaryTalent: "visualBuilder",
        updatedAt: "",
      }).id
    ).toBe("speak");
  });
});
