import type { ElementGuideType } from "./elementGuide";

export const ELEMENT_GUIDE_PROGRESS_KEY = "memodesk-element-guide-progress-v1";

export type ElementGuideRouteKey = `${ElementGuideType}-${number}`;

export interface ElementGuideRouteProgress {
  completedAt: string;
  completions: number;
  bestQuizScore: number;
}

export interface ElementGuideProgress {
  routes: Partial<Record<ElementGuideRouteKey, ElementGuideRouteProgress>>;
}

export interface ElementGuideBadge {
  id: "first-route" | "five-routes" | "all-periods" | "all-groups" | "perfect-quiz";
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

export function completeElementGuideRoute(progress: ElementGuideProgress, type: ElementGuideType, value: number, quizScore?: number): ElementGuideProgress {
  const key = routeKey(type, value);
  const previous = progress.routes[key];
  const next: ElementGuideProgress = {
    routes: {
      ...progress.routes,
      [key]: {
        completedAt: new Date().toISOString(),
        completions: (previous?.completions ?? 0) + (quizScore === undefined ? 1 : 0),
        bestQuizScore: Math.max(previous?.bestQuizScore ?? 0, quizScore ?? 0),
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
    routes[key as ElementGuideRouteKey] = current ? {
      completedAt: current.completedAt >= record.completedAt ? current.completedAt : record.completedAt,
      completions: Math.max(current.completions, record.completions),
      bestQuizScore: Math.max(current.bestQuizScore, record.bestQuizScore),
    } : record;
  });
  return { routes };
}

export function getElementGuideBadges(progress: ElementGuideProgress): ElementGuideBadge[] {
  const keys = Object.keys(progress.routes);
  const completedGroups = keys.filter(key => key.startsWith("group-")).length;
  const completedPeriods = keys.filter(key => key.startsWith("period-")).length;
  const hasPerfectQuiz = Object.values(progress.routes).some(record => (record?.bestQuizScore ?? 0) >= 5);
  return [
    { id: "first-route", icon: "🧭", label: "第一條路", description: "完成任一族或週期導覽", unlocked: keys.length >= 1 },
    { id: "five-routes", icon: "🥾", label: "元素健行者", description: "完成 5 條不同路線", unlocked: keys.length >= 5 },
    { id: "all-periods", icon: "🌈", label: "七週期巡禮", description: "完成全部 7 個週期", unlocked: completedPeriods >= 7 },
    { id: "all-groups", icon: "🏛️", label: "十八族館長", description: "完成全部 18 個族", unlocked: completedGroups >= 18 },
    { id: "perfect-quiz", icon: "🏆", label: "路線滿分王", description: "任一路線測驗獲得 5 分", unlocked: hasPerfectQuiz },
  ];
}
