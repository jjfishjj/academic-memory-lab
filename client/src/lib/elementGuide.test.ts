import { describe, expect, it } from "vitest";
import { getElementGuideSequence } from "./elementGuide";

describe("elementGuide", () => {
  it("walks every group from top to bottom", () => {
    for (let group = 1; group <= 18; group += 1) {
      const sequence = getElementGuideSequence("group", group);
      expect(sequence.length).toBeGreaterThan(0);
      expect(sequence.every((element) => element.group === group)).toBe(true);
      expect(sequence.map((element) => element.period)).toEqual([...sequence.map((element) => element.period)].sort((a, b) => a - b));
    }
  });

  it("walks all seven periods in atomic-number order", () => {
    const expectedCounts = [2, 8, 8, 18, 18, 32, 32];
    for (let period = 1; period <= 7; period += 1) {
      const sequence = getElementGuideSequence("period", period);
      expect(sequence).toHaveLength(expectedCounts[period - 1]);
      expect(sequence.every((element) => element.period === period)).toBe(true);
      expect(sequence.map((element) => element.number)).toEqual([...sequence.map((element) => element.number)].sort((a, b) => a - b));
    }
  });
});
