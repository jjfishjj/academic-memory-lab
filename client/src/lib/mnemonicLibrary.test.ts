import { beforeEach, describe, expect, it } from "vitest";
import { completeDailyWeaknessItem, createMnemonicBackup, filterAndSortMnemonicEntries, loadDailyWeaknessProgress, loadMnemonicLibrary, mnemonicSubjectOf, previewMnemonicBackup, ratingTrend, removeMnemonicEntryById, restoreMnemonicBackup, saveMnemonicEntry, selectWeakMnemonicEntries, subjectRatingTrends, updateMnemonicEntry, weaknessStreak, weeklyMnemonicSummary, weeklyWeakMnemonicEntries } from "./mnemonicLibrary";
import { loadElementGuideProgress } from "./elementGuideProgress";

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

  it("完成每日清單後累積連續天數", () => {
    const weak = [{ ...entry, id: "one", itemId: "b1", rating: 1, updatedAt: "2026-08-13" }];
    completeDailyWeaknessItem("b1", weak, new Date(2026, 7, 12));
    completeDailyWeaknessItem("b1", weak, new Date(2026, 7, 13));
    expect(weaknessStreak(new Date(2026, 7, 14))).toBe(2);
  });

  it("產生本週最弱去重題庫與各科評分趨勢", () => {
    const items = [
      { ...entry, id: "b-one", itemId: "b1", rating: 1, updatedAt: "2026-08-13T10:00:00Z", ratingHistory: [{ rating: 1, at: "2026-08-12T10:00:00Z" }, { rating: 3, at: "2026-08-13T10:00:00Z" }] },
      { ...entry, id: "b-two", itemId: "b1", rating: 2, updatedAt: "2026-08-13T11:00:00Z" },
      { ...entry, id: "old", itemId: "g1", rating: 1, updatedAt: "2026-07-01T10:00:00Z" },
    ];
    expect(weeklyWeakMnemonicEntries(items, new Date("2026-08-14T12:00:00Z")).map(item => item.itemId)).toEqual(["b1"]);
    expect(subjectRatingTrends(items, 7, new Date("2026-08-14T12:00:00Z"))[0]).toMatchObject({ subject: "biology", points: [{ rating: 1 }, { rating: 3 }] });
  });

  it("個人筆記可保存並更新", () => {
    saveMnemonicEntry(entry);
    updateMnemonicEntry(loadMnemonicLibrary()[0].id, { note: "考前先想起台電發電機" });
    expect(loadMnemonicLibrary()[0].note).toBe("考前先想起台電發電機");
  });

  it("7／30 天趨勢會排除區間外評分", () => {
    const item = { ...entry, id: "trend", updatedAt: "2026-08-14", ratingHistory: [
      { rating: 1, at: "2026-07-20T10:00:00Z" }, { rating: 2, at: "2026-08-10T10:00:00Z" }, { rating: 4, at: "2026-08-14T10:00:00Z" },
    ] };
    expect(subjectRatingTrends([item], 7, new Date("2026-08-15T12:00:00Z"))[0].points.map(point => point.rating)).toEqual([2, 4]);
    expect(subjectRatingTrends([item], 30, new Date("2026-08-15T12:00:00Z"))[0].points.map(point => point.rating)).toEqual([1, 2, 4]);
  });

  it("JSON 備份包含收藏、筆記、評分、每日進度與完成日期", () => {
    saveMnemonicEntry({ ...entry, note: "我的筆記", ratingHistory: [{ rating: 2, at: "2026-08-14T10:00:00Z" }] });
    localStorage.setItem("memodesk-element-guide-progress-v1", JSON.stringify({ routes: { "period-1": { completedAt: "2026-08-14T12:00:00Z", completions: 1, bestQuizScore: 2 } } }));
    const backup = createMnemonicBackup(loadMnemonicLibrary(), new Date(2026, 7, 15));
    expect(backup).toMatchObject({ version: 1, library: [{ note: "我的筆記" }], dailyProgress: { date: "2026-08-15" }, completedDays: [], elementGuideProgress: { routes: { "period-1": { bestQuizScore: 2 } } } });
  });

  it("可還原合法 JSON 備份並拒絕錯誤格式", () => {
    saveMnemonicEntry({ ...entry, note: "還原筆記" });
    const backup = createMnemonicBackup();
    localStorage.clear();
    restoreMnemonicBackup(backup);
    expect(loadMnemonicLibrary()[0].note).toBe("還原筆記");
    expect(loadElementGuideProgress().routes).toEqual({});
    expect(() => restoreMnemonicBackup({ version: 2 })).toThrow("不是支援");
  });

  it("合併 JSON 備份時保留導覽路線的較高完成次數與測驗分數", () => {
    localStorage.setItem("memodesk-element-guide-progress-v1", JSON.stringify({ routes: { "group-1": { completedAt: "2026-08-20T00:00:00Z", completions: 3, bestQuizScore: 2 } } }));
    const backup = createMnemonicBackup();
    backup.elementGuideProgress = { routes: { "group-1": { completedAt: "2026-08-21T00:00:00Z", completions: 1, bestQuizScore: 5 }, "period-2": { completedAt: "2026-08-21T00:00:00Z", completions: 1, bestQuizScore: 4 } } };
    restoreMnemonicBackup(backup, "merge");
    expect(loadElementGuideProgress().routes).toMatchObject({
      "group-1": { completedAt: "2026-08-21T00:00:00Z", completions: 3, bestQuizScore: 5 },
      "period-2": { completions: 1, bestQuizScore: 4 },
    });
  });

  it("匯入前會計算差異，智慧合併保留本機獨有資料並採用較新版本", () => {
    saveMnemonicEntry({ ...entry, mnemonic: "本機獨有" });
    const localOnly = loadMnemonicLibrary()[0];
    const older = { ...entry, id: "shared", mnemonic: "舊版", updatedAt: "2026-08-01T00:00:00Z" };
    localStorage.setItem("memodesk-mnemonic-library", JSON.stringify([localOnly, { ...older, mnemonic: "本機新版", updatedAt: "2026-08-15T00:00:00Z" }]));
    const backup = { version: 1 as const, exportedAt: "2026-08-16T00:00:00Z", library: [older, { ...older, id: "new", mnemonic: "備份新增" }], dailyProgress: { date: "2026-08-16", itemIds: [], completedIds: [] }, completedDays: ["2026-08-15"] };
    expect(previewMnemonicBackup(backup)).toMatchObject({ added: 1, updated: 1, unchanged: 0, localOnly: 1 });
    restoreMnemonicBackup(backup, "merge");
    expect(loadMnemonicLibrary().map(item => item.mnemonic)).toEqual(expect.arrayContaining(["本機獨有", "本機新版", "備份新增"]));
  });

  it("產生最近七天學習摘要", () => {
    const items = [{ ...entry, id: "recent", updatedAt: "2026-08-15T10:00:00Z", rating: 4, ratingHistory: [{ rating: 2, at: "2026-08-14" }, { rating: 4, at: "2026-08-15" }] }];
    expect(weeklyMnemonicSummary(items, new Date("2026-08-16T12:00:00Z"))).toMatchObject({ saved: 1, reviewed: 1, averageRating: 4, improved: 1, strongestSubject: "biology" });
  });
});
