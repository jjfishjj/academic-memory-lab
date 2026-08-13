import { beforeEach, describe, expect, it } from "vitest";
import { loadMnemonicLibrary, removeMnemonicEntryById, saveMnemonicEntry, updateMnemonicEntry } from "./mnemonicLibrary";

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
});
