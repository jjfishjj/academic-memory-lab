export type ShadowAttempt = {
  lessonId: string;
  at: string;
  transcript: string;
  scores: number[];
  durationMs: number;
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
