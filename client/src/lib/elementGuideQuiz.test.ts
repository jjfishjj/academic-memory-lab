import { describe, expect, it } from "vitest";
import { getElementGuideSequence } from "./elementGuide";
import { buildElementGuideQuiz } from "./elementGuideQuiz";

describe("elementGuideQuiz", () => {
  it("builds five answerable questions for a long route", () => {
    const quiz = buildElementGuideQuiz(getElementGuideSequence("period", 4));
    expect(quiz).toHaveLength(5);
    quiz.forEach(question => {
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.answer);
    });
  });

  it("uses every element when a route has fewer than five stops", () => {
    const quiz = buildElementGuideQuiz(getElementGuideSequence("period", 1));
    expect(quiz).toHaveLength(2);
  });
});
