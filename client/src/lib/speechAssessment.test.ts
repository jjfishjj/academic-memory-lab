import { describe, expect, it } from "vitest";
import { alignSpeech, assessSpeech } from "./speechAssessment";

describe("speech alignment", () => {
  it("marks correct, substituted and missing English words", () => {
    const diff = alignSpeech("the city comes alive after dark", "the city become alive dark", "English");
    expect(diff.some((token) => token.status === "substitute" && token.expected === "comes")).toBe(true);
    expect(diff.some((token) => token.status === "missing" && token.expected === "after")).toBe(true);
    expect(diff.filter((token) => token.status === "correct").length).toBe(4);
  });

  it("aligns Chinese by character", () => {
    const diff = alignSpeech("整座城市都活了起來", "城市活起來", "中文");
    expect(diff.some((token) => token.status === "missing")).toBe(true);
    expect(diff.some((token) => token.status === "correct" && token.expected === "城")).toBe(true);
  });
});

describe("assessSpeech", () => {
  it("rewards an accurate transcript with stable timing", () => {
    const result = assessSpeech({ expected: "The city comes alive after dark.", transcript: "the city comes alive after dark", language: "English", confidence: 0.94, durationMs: 3150, targetSeconds: 3.1, energyVariation: 0.16 });
    expect(result.scores[1]).toBeGreaterThan(95); expect(result.scores[2]).toBeGreaterThan(90); expect(result.matchedPercent).toBe(100); expect(result.failure).toBeUndefined();
  });
  it("returns actionable failure information instead of invented accuracy", () => {
    const result = assessSpeech({ expected: "入夜之後，整座城市都活了起來。", transcript: "", language: "中文", confidence: 0, durationMs: 4000, targetSeconds: 3.8, energyVariation: 0.1 });
    expect(result.scores[1]).toBe(0); expect(result.scores[3]).toBe(0); expect(result.failure?.fixes.length).toBeGreaterThan(2); expect(result.diff.some((token) => token.status === "missing")).toBe(true);
  });
});
