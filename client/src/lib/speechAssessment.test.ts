import { describe, expect, it } from "vitest";
import { assessSpeech } from "./speechAssessment";

describe("assessSpeech", () => {
  it("rewards an accurate transcript with stable timing", () => {
    const result = assessSpeech({ expected: "The city comes alive after dark.", transcript: "the city comes alive after dark", language: "English", confidence: 0.94, durationMs: 3150, targetSeconds: 3.1, energyVariation: 0.16 });
    expect(result.scores[1]).toBeGreaterThan(95);
    expect(result.scores[2]).toBeGreaterThan(90);
    expect(result.matchedPercent).toBe(100);
  });

  it("penalizes missing or reordered content", () => {
    const result = assessSpeech({ expected: "Every small step makes a real difference.", transcript: "every difference", language: "English", confidence: 0.6, durationMs: 9000, targetSeconds: 3.9, energyVariation: 0.01 });
    expect(result.scores[3]).toBeLessThan(55);
    expect(result.scores[2]).toBeLessThan(40);
  });

  it("does not invent accuracy when recognition is empty", () => {
    const result = assessSpeech({ expected: "入夜之後，整座城市都活了起來。", transcript: "", language: "中文", confidence: 0, durationMs: 4000, targetSeconds: 3.8, energyVariation: 0.1 });
    expect(result.scores[1]).toBe(0);
    expect(result.scores[3]).toBe(0);
  });
});
