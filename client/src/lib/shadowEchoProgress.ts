export type ShadowAttempt = {
  lessonId: string;
  at: string;
  transcript: string;
  scores: number[];
  durationMs: number;
  mode?: string;
  provider?: "browser" | "azure";
  issues?: string[];
};

export type ShadowProgress = {
  attempts: ShadowAttempt[];
  streak: number;
  lastPracticeDate?: string;
};

const STORAGE_KEY = "memodesk-shadow-echo-progress-v1";

export function loadShadowProgress(): ShadowProgress {
  if (typeof window === "undefined") return { attempts: [], streak: 0 };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as ShadowProgress | null;
    return parsed?.attempts ? parsed : { attempts: [], streak: 0 };
  } catch {
    return { attempts: [], streak: 0 };
  }
}

export function saveShadowAttempt(attempt: ShadowAttempt): ShadowProgress {
  const previous = loadShadowProgress();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const streak = previous.lastPracticeDate === today ? previous.streak : previous.lastPracticeDate === yesterday ? previous.streak + 1 : 1;
  const progress = { attempts: [...previous.attempts, attempt].slice(-120), streak, lastPracticeDate: today };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

export function completedLessonIds(progress: ShadowProgress) {
  return new Set(progress.attempts.map((attempt) => attempt.lessonId));
}

export function shadowProgressSummary(progress: ShadowProgress) {
  const scored = progress.attempts.filter((attempt) => attempt.scores.length >= 4);
  const totals = scored.map((attempt) => Math.round(attempt.scores.slice(0, 4).reduce((sum, score) => sum + score, 0) / 4));
  const recent = totals.slice(-10);
  const previous = totals.slice(-20, -10);
  const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const issueCounts = new Map<string, number>();
  scored.forEach((attempt) => attempt.issues?.forEach((issue) => issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1)));
  return {
    attempts: scored.length,
    recentScores: recent,
    average: average(recent),
    improvement: previous.length ? average(recent) - average(previous) : 0,
    commonIssues: Array.from(issueCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3),
  };
}
