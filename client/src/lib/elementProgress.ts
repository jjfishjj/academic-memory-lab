import type { ElementItem } from "./elementData";

export type ElementReview = {
  correct: number;
  incorrect: number;
  streak: number;
  intervalDays: number;
  dueAt: number;
  lastReviewedAt: number;
};

export type ElementProgress = Record<number, ElementReview>;

const STORAGE_KEY = "memodesk-element-progress-v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const INTERVALS = [1, 3, 7, 14, 30];

function emptyReview(now = Date.now()): ElementReview {
  return {
    correct: 0,
    incorrect: 0,
    streak: 0,
    intervalDays: 0,
    dueAt: now,
    lastReviewedAt: 0,
  };
}

function isReview(value: unknown): value is ElementReview {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ElementReview>;
  return [
    candidate.correct,
    candidate.incorrect,
    candidate.streak,
    candidate.intervalDays,
    candidate.dueAt,
    candidate.lastReviewedAt,
  ].every(entry => typeof entry === "number" && Number.isFinite(entry));
}

export function loadElementProgress(): ElementProgress {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) => /^\d+$/.test(key) && isReview(value)
      )
    ) as ElementProgress;
  } catch {
    return {};
  }
}

export function saveElementProgress(progress: ElementProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function recordElementReview(
  progress: ElementProgress,
  number: number,
  correct: boolean,
  now = Date.now()
): ElementProgress {
  const previous = progress[number] || emptyReview(now);
  const streak = correct ? previous.streak + 1 : 0;
  const intervalDays = correct
    ? INTERVALS[Math.min(streak - 1, INTERVALS.length - 1)]
    : 0;
  const next: ElementReview = {
    correct: previous.correct + (correct ? 1 : 0),
    incorrect: previous.incorrect + (correct ? 0 : 1),
    streak,
    intervalDays,
    dueAt: correct ? now + intervalDays * DAY_MS : now,
    lastReviewedAt: now,
  };
  return { ...progress, [number]: next };
}

export function getDueElements(
  progress: ElementProgress,
  pool: ElementItem[],
  now = Date.now()
) {
  return pool.filter(
    item => !progress[item.number] || progress[item.number].dueAt <= now
  );
}

export function getReviewQueue(
  progress: ElementProgress,
  pool: ElementItem[],
  now = Date.now()
) {
  const due = getDueElements(progress, pool, now).sort((a, b) => {
    const aReview = progress[a.number];
    const bReview = progress[b.number];
    const aPriority = aReview?.incorrect ? 0 : aReview ? 1 : 2;
    const bPriority = bReview?.incorrect ? 0 : bReview ? 1 : 2;
    const aDue = aReview?.dueAt ?? 0;
    const bDue = bReview?.dueAt ?? 0;
    return aPriority - bPriority || aDue - bDue || a.number - b.number;
  });
  const remaining = pool
    .filter(item => !due.some(candidate => candidate.number === item.number))
    .sort((a, b) => {
      const aReview = progress[a.number] || emptyReview(now);
      const bReview = progress[b.number] || emptyReview(now);
      return (
        aReview.streak - bReview.streak ||
        aReview.lastReviewedAt - bReview.lastReviewedAt ||
        a.number - b.number
      );
    });
  return [...due, ...remaining];
}

export function getMasteredCount(
  progress: ElementProgress,
  pool: ElementItem[]
) {
  return pool.filter(item => (progress[item.number]?.streak ?? 0) >= 4).length;
}

export function getDueLabel(
  review: ElementReview | undefined,
  now = Date.now()
) {
  if (!review || review.dueAt <= now) return "現在待複習";
  const days = Math.max(1, Math.ceil((review.dueAt - now) / DAY_MS));
  return `${days} 天後再見`;
}

export const ELEMENT_PROGRESS_STORAGE_KEY = STORAGE_KEY;
