import type { MrtLineId, MrtStation } from "./mrtData";

export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14] as const;

export interface MrtLineProgress {
  attempts: number;
  correct: number;
  bestAccuracy: number;
  completedRuns: number;
  lastStudiedAt?: string;
}

export interface MrtStationProgress {
  attempts: number;
  correct: number;
  streak: number;
  intervalIndex: number;
  nextReviewAt: string;
  lastAnsweredAt: string;
  lastResult: boolean;
}

export interface MrtProgress {
  lines: Partial<Record<MrtLineId, MrtLineProgress>>;
  stations: Record<string, MrtStationProgress>;
  segments: Record<string, MrtSegmentProgress>;
  lineExams: Partial<Record<MrtLineId, MrtExamProgress>>;
  branches: Record<string, MrtExamProgress>;
}

export interface MrtSegmentProgress {
  bestForward: number;
  bestReverse: number;
  passed: boolean;
  completedAt?: string;
}

export interface MrtExamProgress {
  bestAccuracy: number;
  passed: boolean;
  completedAt?: string;
}

const STORAGE_KEY = "memodesk-mrt-progress-v2";
const LEGACY_STORAGE_KEY = "memodesk-mrt-progress-v1";

const emptyProgress = (): MrtProgress => ({ lines: {}, stations: {}, segments: {}, lineExams: {}, branches: {} });

export function loadMrtProgress(): MrtProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MrtProgress>;
      return { lines: parsed.lines ?? {}, stations: parsed.stations ?? {}, segments: parsed.segments ?? {}, lineExams: parsed.lineExams ?? {}, branches: parsed.branches ?? {} };
    }
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) return { lines: JSON.parse(legacy), stations: {}, segments: {}, lineExams: {}, branches: {} };
  } catch { /* start clean if browser storage is malformed */ }
  return emptyProgress();
}

function persist(progress: MrtProgress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); localStorage.setItem("memodesk-local-updated-at", new Date().toISOString()); } catch { /* ignore */ }
}

function isSameLocalDay(first?: string, second?: string): boolean {
  if (!first || !second) return false;
  return new Date(first).toDateString() === new Date(second).toDateString();
}

export function recordMrtAnswer(station: MrtStation, isCorrect: boolean, now = new Date()): MrtProgress {
  const progress = loadMrtProgress();
  const current = progress.stations[station.code];
  let intervalIndex = 0;

  if (isCorrect && current?.lastResult) {
    intervalIndex = isSameLocalDay(current.lastAnsweredAt, now.toISOString())
      ? current.intervalIndex
      : Math.min(current.intervalIndex + 1, REVIEW_INTERVAL_DAYS.length - 1);
  }

  const nextReview = isCorrect
    ? new Date(now.getTime() + REVIEW_INTERVAL_DAYS[intervalIndex] * 86_400_000)
    : now;

  progress.stations[station.code] = {
    attempts: (current?.attempts ?? 0) + 1,
    correct: (current?.correct ?? 0) + (isCorrect ? 1 : 0),
    streak: isCorrect ? (current?.streak ?? 0) + 1 : 0,
    intervalIndex,
    nextReviewAt: nextReview.toISOString(),
    lastAnsweredAt: now.toISOString(),
    lastResult: isCorrect,
  };
  persist(progress);
  return progress;
}

export function saveMrtRun(lineId: MrtLineId, correct: number, attempts: number): MrtProgress {
  const progress = loadMrtProgress();
  const current = progress.lines[lineId] ?? { attempts: 0, correct: 0, bestAccuracy: 0, completedRuns: 0 };
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
  progress.lines[lineId] = {
    attempts: current.attempts + attempts,
    correct: current.correct + correct,
    bestAccuracy: Math.max(current.bestAccuracy, accuracy),
    completedRuns: current.completedRuns + 1,
    lastStudiedAt: new Date().toISOString(),
  };
  persist(progress);
  return progress;
}

export function saveSegmentResult(segmentId: string, forward: number, reverse: number): MrtProgress {
  const progress = loadMrtProgress();
  const current = progress.segments[segmentId] ?? { bestForward: 0, bestReverse: 0, passed: false };
  const bestForward = Math.max(current.bestForward, forward);
  const bestReverse = Math.max(current.bestReverse, reverse);
  const passed = bestForward >= 80 && bestReverse >= 80;
  progress.segments[segmentId] = {
    bestForward,
    bestReverse,
    passed,
    completedAt: passed ? current.completedAt ?? new Date().toISOString() : undefined,
  };
  persist(progress);
  return progress;
}

export function saveLineExamResult(lineId: MrtLineId, accuracy: number): MrtProgress {
  const progress = loadMrtProgress();
  const current = progress.lineExams[lineId] ?? { bestAccuracy: 0, passed: false };
  const bestAccuracy = Math.max(current.bestAccuracy, accuracy);
  const passed = bestAccuracy >= 85;
  progress.lineExams[lineId] = { bestAccuracy, passed, completedAt: passed ? current.completedAt ?? new Date().toISOString() : undefined };
  persist(progress);
  return progress;
}

export function saveBranchResult(challengeId: string, accuracy: number): MrtProgress {
  const progress = loadMrtProgress();
  const current = progress.branches[challengeId] ?? { bestAccuracy: 0, passed: false };
  const bestAccuracy = Math.max(current.bestAccuracy, accuracy);
  const passed = bestAccuracy >= 80;
  progress.branches[challengeId] = { bestAccuracy, passed, completedAt: passed ? current.completedAt ?? new Date().toISOString() : undefined };
  persist(progress);
  return progress;
}

export function dueCountFor(stations: MrtStation[], progress: MrtProgress, now = new Date()): number {
  return stations.filter((station) => {
    const saved = progress.stations[station.code];
    return saved && new Date(saved.nextReviewAt).getTime() <= now.getTime();
  }).length;
}

export function learnedCountFor(stations: MrtStation[], progress: MrtProgress): number {
  return stations.filter((station) => Boolean(progress.stations[station.code])).length;
}

export function prioritizeStations(stations: MrtStation[], progress: MrtProgress, now = new Date()): MrtStation[] {
  const scored = stations.map((station) => {
    const saved = progress.stations[station.code];
    const isDue = saved && new Date(saved.nextReviewAt).getTime() <= now.getTime();
    const accuracy = saved ? saved.correct / saved.attempts : 1;
    const bucket = isDue ? 0 : saved && (!saved.lastResult || accuracy < 0.8) ? 1 : !saved ? 2 : 3;
    return { station, bucket, accuracy, random: Math.random() };
  });
  return scored.sort((a, b) => a.bucket - b.bucket || a.accuracy - b.accuracy || a.random - b.random).map((item) => item.station);
}

export function reviewLabel(saved?: MrtStationProgress, now = new Date()): string {
  if (!saved) return "尚未排程";
  const review = new Date(saved.nextReviewAt);
  if (review.getTime() <= now.getTime()) return "現在重新複習";
  const days = Math.max(1, Math.ceil((review.getTime() - now.getTime()) / 86_400_000));
  return `${days} 天後複習`;
}
