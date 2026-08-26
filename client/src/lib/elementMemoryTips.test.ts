import { describe, expect, it } from "vitest";
import { ELEMENT_MEMORY_TIPS, getElementMemoryTip } from "./elementMemoryTips";

describe("elementMemoryTips", () => {
  it("provides four complete memory cues for the first 20 elements", () => {
    expect(Object.keys(ELEMENT_MEMORY_TIPS)).toHaveLength(20);
    for (let number = 1; number <= 20; number += 1) {
      const tip = getElementMemoryTip(number);
      expect(tip).not.toBeNull();
      expect(tip?.rhyme.length).toBeGreaterThan(8);
      expect(tip?.image.length).toBeGreaterThan(8);
      expect(tip?.use.length).toBeGreaterThan(8);
      expect(tip?.confusion.length).toBeGreaterThan(8);
    }
  });

  it("does not invent a placeholder for elements not yet authored", () => {
    expect(getElementMemoryTip(21)).toBeNull();
  });
});
