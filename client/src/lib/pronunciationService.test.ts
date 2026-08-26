import { describe, expect, it } from "vitest";
import { assessSpeech } from "./speechAssessment";
import { mergeProfessionalAssessment } from "./pronunciationService";

describe("professional pronunciation assessment", () => {
  it("replaces fallback scores and exposes phoneme detail", () => {
    const local = assessSpeech({ expected: "The city", transcript: "", language: "English", confidence: 0, durationMs: 1000, targetSeconds: 2, energyVariation: 0 });
    const merged = mergeProfessionalAssessment(local, { provider: "azure", transcript: "the city", pronunciation: 91, accuracy: 92, fluency: 83, completeness: 100, prosody: 76, words: [{ word: "city", score: 88, phonemes: [{ phoneme: "s", score: 94 }] }] }, "The city", "English");
    expect(merged.failure).toBeUndefined();
    expect(merged.scores).toEqual([76, 91, 83, 92]);
    expect(merged.phonemeWords?.[0].phonemes[0].phoneme).toBe("s");
  });
});
