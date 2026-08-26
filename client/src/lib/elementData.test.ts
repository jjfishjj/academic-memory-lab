import { describe, expect, it } from "vitest";
import { ELEMENTS } from "./elementData";

describe("118 元素週期表座標", () => {
  it("包含原子序 1–118，且符號、中文名與英文名不重複", () => {
    expect(ELEMENTS).toHaveLength(118);
    expect(ELEMENTS.map(element => element.number)).toEqual(Array.from({ length: 118 }, (_, index) => index + 1));
    expect(new Set(ELEMENTS.map(element => element.symbol)).size).toBe(118);
    expect(new Set(ELEMENTS.map(element => element.nameZh)).size).toBe(118);
    expect(new Set(ELEMENTS.map(element => element.nameEn)).size).toBe(118);
  });

  it("主表座標限制在 18 族 × 7 週期且沒有重疊", () => {
    const main = ELEMENTS.filter(element => element.group !== null);
    expect(main.every(element => element.period >= 1 && element.period <= 7 && element.group! >= 1 && element.group! <= 18)).toBe(true);
    expect(new Set(main.map(element => `${element.period}:${element.group}`)).size).toBe(main.length);
    expect(ELEMENTS.find(element => element.symbol === "H")).toMatchObject({ period: 1, group: 1 });
    expect(ELEMENTS.find(element => element.symbol === "He")).toMatchObject({ period: 1, group: 18 });
    expect(ELEMENTS.find(element => element.symbol === "Og")).toMatchObject({ period: 7, group: 18 });
  });

  it("鑭系與錒系各有 14 個下方展開元素", () => {
    expect(ELEMENTS.filter(element => element.category === "lanthanide" && element.group === null)).toHaveLength(14);
    expect(ELEMENTS.filter(element => element.category === "actinide" && element.group === null)).toHaveLength(14);
  });
});
