import { describe, expect, it } from "vitest";
import { SHADOW_CATEGORIES, SHADOW_LESSONS, dailyLessonIds, lessonsFor } from "./shadowEchoData";

describe("shadow echo course catalog", () => {
  it("contains all supported languages and categories", () => {
    expect(new Set(SHADOW_LESSONS.map((lesson) => lesson.language))).toEqual(new Set(["English", "日本語", "中文"]));
    expect(new Set(SHADOW_LESSONS.map((lesson) => lesson.category))).toEqual(new Set(SHADOW_CATEGORIES));
  });

  it("falls back to language lessons when a filter has no exact match", () => {
    expect(lessonsFor("日本語", "Advanced", "咖啡餐飲").every((lesson) => lesson.language === "日本語")).toBe(true);
  });

  it("creates a stable three-lesson daily task", () => {
    const date = new Date("2026-08-06T00:00:00Z");
    expect(dailyLessonIds(date)).toEqual(dailyLessonIds(date));
    expect(dailyLessonIds(date)).toHaveLength(3);
  });
});
