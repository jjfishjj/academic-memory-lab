import { beforeEach, describe, expect, it } from "vitest";
import { completeDailyWeaknessItem, filterAndSortMnemonicEntries, loadDailyWeaknessProgress, loadMnemonicLibrary, mnemonicSubjectOf, ratingTrend, removeMnemonicEntryById, saveMnemonicEntry, selectWeakMnemonicEntries, updateMnemonicEntry } from "./mnemonicLibrary";

const entry = {
  itemId: "b1", term: "粒線體", hint: "產生 ATP", styleId: "homophone", styleName: "諧音梗",
  mnemonic: "粒線體，力氣電池", rating: 4, bookmarked: false,
};

describe("口訣庫狀態", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key), clear: () => values.clear(),
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() { return values.size; },
    } satisfies Storage });
  });

  it("保存收藏與不好記回報，重新載入後仍存在", () => {
    saveMnemonicEntry(entry);
    const id = loadMnemonicLibrary()[0].id;
    updateMnemonicEntry(id, { bookmarked: true, feedback: "hard", rating: 1 });
    expect(loadMnemonicLibrary()[0]).toMatchObject({ bookmarked: true, feedback: "hard", rating: 1 });
  });

  it("可淘汰指定口訣", () => {
    saveMnemonicEntry(entry);
    removeMnemonicEntryById(loadMnemonicLibrary()[0].id);
    expect(loadMnemonicLibrary()).toEqual([]);
  });

  it("辨識科目並優先安排不好記與低星弱項", () => {
    expect(["e3", "h2", "c9", "b1", "g4", "user-1"].map(mnemonicSubjectOf)).toEqual(["english", "history", "chemistry", "biology", "geography", "custom"]);
    const now = new Date().toISOString();
    const items = [
      { ...entry, id: "one", updatedAt: now, rating: 2, feedback: undefined },
      { ...entry, id: "hard", updatedAt: now, rating: 4, feedback: "hard" as const },
      { ...entry, id: "good", updatedAt: now, rating: 5, feedback: undefined },
    ];
    expect(selectWeakMnemonicEntries(items).map(item => item.id)).toEqual(["hard", "one"]);
  });

  it("可依科目篩選並按評分排序", () => {
    const items = [
      { ...entry, id: "b", itemId: "b1", rating: 2, updatedAt: "2026-01-01" },
      { ...entry, id: "g", itemId: "g1", rating: 5, updatedAt: "2026-02-01" },
    ];
    expect(filterAndSortMnemonicEntries(items, "biology", "updated").map(item => item.id)).toEqual(["b"]);
    expect(filterAndSortMnemonicEntries(items, "all", "rating-high").map(item => item.id)).toEqual(["g", "b"]);
  });

  it("每日弱項最多五題並保存完成進度", () => {
    const items = Array.from({ length: 7 }, (_, index) => ({ ...entry, id: `id-${index}`, itemId: `b${index + 1}`, rating: 1, updatedAt: `2026-01-0${index + 1}` }));
    const today = new Date(2026, 7, 13);
    const progress = loadDailyWeaknessProgress(items, today);
    expect(progress.itemIds).toHaveLength(5);
    const next = completeDailyWeaknessItem(progress.itemIds[0], items, today);
    expect(next.completedIds).toContain(progress.itemIds[0]);
  });

  it("重新評分會保留歷史並計算進步幅度", () => {
    saveMnemonicEntry({ ...entry, rating: 2 });
    saveMnemonicEntry({ ...entry, rating: 4 });
    const saved = loadMnemonicLibrary()[0];
    expect(saved.ratingHistory?.map(point => point.rating)).toEqual([2, 4]);
    expect(ratingTrend(saved)).toBe(2);
  });
});
