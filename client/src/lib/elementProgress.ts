import type { ElementItem } from "./elementData";
import { recordElementActivity } from "./elementEngagement";

export const ELEMENT_PROGRESS_KEY = "memodesk-element-progress-v1";
export const ELEMENT_REVIEW_DAYS = [1, 3, 7, 14, 30] as const;

export interface ElementMastery {
  attempts: number;
  correct: number;
  streak: number;
  intervalIndex: number;
  lastAnsweredAt: string;
  nextReviewAt: string;
}

export interface ElementProgress {
  version: 1;
  elements: Record<string, ElementMastery>;
}

export type MasteryStatus = "unseen" | "learning" | "mastered" | "due";

const emptyProgress = (): ElementProgress => ({ version: 1, elements: {} });

export function loadElementProgress(): ElementProgress {
  try {
    const parsed = JSON.parse(localStorage.getItem(ELEMENT_PROGRESS_KEY) || "null") as ElementProgress | null;
    return parsed?.version === 1 && parsed.elements ? parsed : emptyProgress();
  } catch { return emptyProgress(); }
}

export function saveElementProgress(progress: ElementProgress) {
  try { localStorage.setItem(ELEMENT_PROGRESS_KEY, JSON.stringify(progress)); } catch { /* storage can be unavailable */ }
  return progress;
}

export function recordElementAnswer(element: ElementItem, isCorrect: boolean, now = new Date()) {
  recordElementActivity("answers", 1, now);
  const progress = loadElementProgress();
  const key = String(element.number);
  const previous = progress.elements[key];
  const sameDay = previous?.lastAnsweredAt?.slice(0, 10) === now.toISOString().slice(0, 10);
  const intervalIndex = isCorrect
    ? Math.min(ELEMENT_REVIEW_DAYS.length - 1, previous ? previous.intervalIndex + (sameDay ? 0 : 1) : 0)
    : 0;
  const nextReviewAt = isCorrect
    ? new Date(now.getTime() + ELEMENT_REVIEW_DAYS[intervalIndex] * 86_400_000).toISOString()
    : now.toISOString();
  progress.elements[key] = {
    attempts: (previous?.attempts || 0) + 1,
    correct: (previous?.correct || 0) + (isCorrect ? 1 : 0),
    streak: isCorrect ? (previous?.streak || 0) + 1 : 0,
    intervalIndex,
    lastAnsweredAt: now.toISOString(),
    nextReviewAt,
  };
  return saveElementProgress(progress);
}

export function getMasteryStatus(record: ElementMastery | undefined, now = new Date()): MasteryStatus {
  if (!record) return "unseen";
  if (new Date(record.nextReviewAt).getTime() <= now.getTime()) return "due";
  if (record.streak >= 3 && record.correct / record.attempts >= .8) return "mastered";
  return "learning";
}

export function summarizeElementProgress(progress: ElementProgress, now = new Date()) {
  const counts: Record<MasteryStatus, number> = { unseen: 0, learning: 0, mastered: 0, due: 0 };
  for (let number = 1; number <= 118; number += 1) counts[getMasteryStatus(progress.elements[String(number)], now)] += 1;
  return counts;
}

export function prioritizeElements(elements: ElementItem[], progress: ElementProgress, now = new Date()) {
  const priority: Record<MasteryStatus, number> = { due: 0, learning: 1, unseen: 2, mastered: 3 };
  return [...elements].sort((a, b) => priority[getMasteryStatus(progress.elements[String(a.number)], now)] - priority[getMasteryStatus(progress.elements[String(b.number)], now)]);
}

/** Keeps the in-session repair queue unique, bounded to the active range, and removable after recovery. */
export function updateElementRepairQueue(queue: number[], elementNumber: number, isCorrect: boolean, level: number) {
  const inRange = queue.filter(number => number >= 1 && number <= level && number !== elementNumber);
  return isCorrect || elementNumber > level ? inRange : Array.from(new Set([...inRange, elementNumber]));
}

/** Round 4, 8, 12… are repair rounds when an in-range mistake is waiting. */
export function repairElementForRound(queue: number[], round: number, level: number) {
  if (round % 4 !== 0) return undefined;
  return queue.find(number => number >= 1 && number <= level);
}
