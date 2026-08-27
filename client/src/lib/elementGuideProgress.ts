import type { ElementGuideType } from "./elementGuide";
import type { ElementGuideQuizDifficulty } from "./elementGuideQuiz";

export const ELEMENT_GUIDE_PROGRESS_KEY = "memodesk-element-guide-progress-v1";

export type ElementGuideRouteKey = `${ElementGuideType}-${number}`;

export interface ElementGuideQuizBest {
  score: number;
  total: number;
}

export type ElementGuideQuizBests = Partial<Record<ElementGuideQuizDifficulty, ElementGuideQuizBest>>;

export interface ElementGuideRouteProgress {
  completedAt: string;
  completions: number;
  bestQuizScore: number;
  quizBests?: ElementGuideQuizBests;
}

export interface ElementGuideProgress {
  routes: Partial<Record<ElementGuideRouteKey, ElementGuideRouteProgress>>;
}

export interface ElementGuideBadge {
  id: "first-route" | "five-routes" | "all-periods" | "all-groups" | "perfect-quiz" | "simple-perfect" | "advanced-perfect" | "confusion-perfect";
  icon: string;
  label: string;
  description: string;
  unlocked: boolean;
}

export const emptyElementGuideProgress = (): ElementGuideProgress => ({ routes: {} });

export function routeKey(type: ElementGuideType, value: number): ElementGuideRouteKey {
  return `${type}-${value}`;
}

export function loadElementGuideProgress(): ElementGuideProgress {
  try {
    const parsed = JSON.parse(localStorage.getItem(ELEMENT_GUIDE_PROGRESS_KEY) || "") as ElementGuideProgress;
    return parsed?.routes ? parsed : emptyElementGuideProgress();
  } catch {
    return emptyElementGuideProgress();
  }
}

export interface ElementGuideQuizResult {
  difficulty: ElementGuideQuizDifficulty;
  score: number;
  total: number;
}

function normalizedQuizResult(quiz?: number | ElementGuideQuizResult): ElementGuideQuizResult | null {
  if (quiz === undefined) return null;
  if (typeof quiz === "number") return { difficulty: "simple", score: Math.max(0, quiz), total: 5 };
  const total = Math.max(0, Math.floor(quiz.total));
  return { difficulty: quiz.difficulty, score: Math.min(Math.max(0, Math.floor(quiz.score)), total), total };
}

function betterQuizBest(current: ElementGuideQuizBest | undefined, incoming: ElementGuideQuizBest) {
  if (!current) return incoming;
  const currentRate = current.total > 0 ? current.score / current.total : 0;
  const incomingRate = incoming.total > 0 ? incoming.score / incoming.total : 0;
  if (incomingRate > currentRate || (incomingRate === currentRate && incoming.score > current.score)) return incoming;
  return current;
}

export function completeElementGuideRoute(progress: ElementGuideProgress, type: ElementGuideType, value: number, quiz?: number | ElementGuideQuizResult): ElementGuideProgress {
  const key = routeKey(type, value);
  const previous = progress.routes[key];
  const quizResult = normalizedQuizResult(quiz);
  const quizBests = quizResult ? {
    ...previous?.quizBests,
    [quizResult.difficulty]: betterQuizBest(previous?.quizBests?.[quizResult.difficulty], { score: quizResult.score, total: quizResult.total }),
  } : previous?.quizBests;
  const next: ElementGuideProgress = {
    routes: {
      ...progress.routes,
      [key]: {
        completedAt: new Date().toISOString(),
        completions: (previous?.completions ?? 0) + (quizResult === null ? 1 : 0),
        bestQuizScore: Math.max(previous?.bestQuizScore ?? 0, quizResult?.score ?? 0),
        ...(quizBests && { quizBests }),
      },
    },
  };
  saveElementGuideProgress(next);
  return next;
}

export function saveElementGuideProgress(progress: ElementGuideProgress) {
  try {
    localStorage.setItem(ELEMENT_GUIDE_PROGRESS_KEY, JSON.stringify(progress));
    localStorage.setItem("memodesk-local-updated-at", new Date().toISOString());
  } catch { /* ignore unavailable storage */ }
  return progress;
}

export function mergeElementGuideProgress(local: ElementGuideProgress, incoming: ElementGuideProgress): ElementGuideProgress {
  const routes = { ...local.routes };
  Object.entries(incoming.routes).forEach(([key, record]) => {
    if (!record) return;
    const current = routes[key as ElementGuideRouteKey];
    const quizBests = current ? (["simple", "advanced", "confusion"] as ElementGuideQuizDifficulty[]).reduce<ElementGuideQuizBests>((result, difficulty) => {
      const localBest = current.quizBests?.[difficulty];
      const incomingBest = record.quizBests?.[difficulty];
      if (localBest || incomingBest) result[difficulty] = localBest && incomingBest ? betterQuizBest(localBest, incomingBest) : (localBest ?? incomingBest);
      return result;
    }, {}) : record.quizBests;
    routes[key as ElementGuideRouteKey] = current ? {
      completedAt: current.completedAt >= record.completedAt ? current.completedAt : record.completedAt,
      completions: Math.max(current.completions, record.completions),
      bestQuizScore: Math.max(current.bestQuizScore, record.bestQuizScore),
      ...(quizBests && Object.keys(quizBests).length > 0 && { quizBests }),
    } : record;
  });
  return { routes };
}

export function getElementGuideBadges(progress: ElementGuideProgress): ElementGuideBadge[] {
  const keys = Object.keys(progress.routes);
  const completedGroups = keys.filter(key => key.startsWith("group-")).length;
  const completedPeriods = keys.filter(key => key.startsWith("period-")).length;
  const hasPerfectQuiz = Object.values(progress.routes).some(record => (record?.bestQuizScore ?? 0) >= 5);
  const perfectByDifficulty = (difficulty: ElementGuideQuizDifficulty) => Object.values(progress.routes).some(record => {
    const best = record?.quizBests?.[difficulty];
    return Boolean(best && best.total > 0 && best.score === best.total);
  });
  return [
    { id: "first-route", icon: "🧭", label: "第一條路", description: "完成任一族或週期導覽", unlocked: keys.length >= 1 },
    { id: "five-routes", icon: "🥾", label: "元素健行者", description: "完成 5 條不同路線", unlocked: keys.length >= 5 },
    { id: "all-periods", icon: "🌈", label: "七週期巡禮", description: "完成全部 7 個週期", unlocked: completedPeriods >= 7 },
    { id: "all-groups", icon: "🏛️", label: "十八族館長", description: "完成全部 18 個族", unlocked: completedGroups >= 18 },
    { id: "perfect-quiz", icon: "🏆", label: "路線滿分王", description: "任一路線測驗獲得 5 分", unlocked: hasPerfectQuiz },
    { id: "simple-perfect", icon: "🌱", label: "簡單滿分", description: "任一簡單測驗全部答對", unlocked: perfectByDifficulty("simple") },
    { id: "advanced-perfect", icon: "🚀", label: "進階滿分", description: "任一進階測驗全部答對", unlocked: perfectByDifficulty("advanced") },
    { id: "confusion-perfect", icon: "🔎", label: "辨析滿分", description: "任一易混淆測驗全部答對", unlocked: perfectByDifficulty("confusion") },
  ];
}

export function getElementGuideQuizBest(progress: ElementGuideProgress, type: ElementGuideType, value: number, difficulty: ElementGuideQuizDifficulty) {
  const record = progress.routes[routeKey(type, value)];
  const exact = record?.quizBests?.[difficulty];
  if (exact) return exact;
  if (difficulty === "simple" && record?.bestQuizScore) return { score: record.bestQuizScore, total: 5 };
  return { score: 0, total: 0 };
}
