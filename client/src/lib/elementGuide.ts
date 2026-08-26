import { ELEMENTS, type ElementItem } from "./elementData";

export type ElementGuideType = "group" | "period";

export const GROUP_GUIDE_NAMES: Record<number, string> = {
  1: "第 1 族 · 鹼金屬路線",
  2: "第 2 族 · 鹼土金屬路線",
  3: "第 3 族 · 鈧族路線",
  4: "第 4 族 · 鈦族路線",
  5: "第 5 族 · 釩族路線",
  6: "第 6 族 · 鉻族路線",
  7: "第 7 族 · 錳族路線",
  8: "第 8 族 · 鐵族路線",
  9: "第 9 族 · 鈷族路線",
  10: "第 10 族 · 鎳族路線",
  11: "第 11 族 · 銅族路線",
  12: "第 12 族 · 鋅族路線",
  13: "第 13 族 · 硼族路線",
  14: "第 14 族 · 碳族路線",
  15: "第 15 族 · 氮族路線",
  16: "第 16 族 · 氧族路線",
  17: "第 17 族 · 鹵素路線",
  18: "第 18 族 · 惰性氣體路線",
};

export function getElementGuideSequence(type: ElementGuideType, value: number): ElementItem[] {
  if (type === "group") return ELEMENTS.filter((element) => element.group === value).sort((a, b) => a.period - b.period);
  return ELEMENTS.filter((element) => element.period === value).sort((a, b) => a.number - b.number);
}

export function getElementGuideLabel(type: ElementGuideType, value: number): string {
  return type === "group" ? GROUP_GUIDE_NAMES[value] : `第 ${value} 週期 · 橫向探索`;
}
