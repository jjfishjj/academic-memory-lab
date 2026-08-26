import type { ElementItem } from "./elementData";
import { getMasteryStatus, type ElementProgress } from "./elementProgress";

export function placementKey(element: ElementItem) {
  if (element.group !== null) return `p${element.period}-g${element.group}`;
  return `${element.category}-${element.number}`;
}

export function selectPlacementRound(elements: ElementItem[], progress: ElementProgress, count: number, random = Math.random) {
  const priority = { due: 0, learning: 1, unseen: 2, mastered: 3 } as const;
  return [...elements]
    .map((element) => ({ element, rank: priority[getMasteryStatus(progress.elements[String(element.number)])], noise: random() }))
    .sort((a, b) => a.rank - b.rank || a.noise - b.noise)
    .slice(0, count)
    .map(({ element }) => element);
}

export function isCorrectPlacement(element: ElementItem, targetKey: string) {
  return placementKey(element) === targetKey;
}
