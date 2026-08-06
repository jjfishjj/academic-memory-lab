import { beforeEach, describe, expect, it } from "vitest";
import { flipHint, loadMemoryProfile, saveMemoryProfile } from "./memoryProfile";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  get length() { return this.values.size; }
}

beforeEach(() => Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true }));

describe("memory profile", () => {
  it("saves and restores VARK plus primary and secondary talents", () => {
    saveMemoryProfile({ vark: "auditory", primaryTalent: "soundMimic", secondaryTalent: "systemAccumulator" });
    expect(loadMemoryProfile()).toMatchObject({ vark: "auditory", primaryTalent: "soundMimic", secondaryTalent: "systemAccumulator" });
  });

  it("changes station flip hints for each VARK entry", () => {
    const base = { primaryTalent: "systemAccumulator" as const, secondaryTalent: "creativeConnector" as const, updatedAt: "" };
    expect(flipHint({ ...base, vark: "visual" }, "板橋", "BL07")).toContain("門牌");
    expect(flipHint({ ...base, vark: "auditory" }, "板橋", "BL07")).toContain("三拍");
    expect(flipHint({ ...base, vark: "readWrite" }, "板橋", "BL07")).toContain("雙欄");
    expect(flipHint({ ...base, vark: "kinesthetic" }, "板橋", "BL07")).toContain("手指");
  });
});
