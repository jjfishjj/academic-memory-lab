import type { ElementCategory } from "./elementData";
import { recordElementActivity } from "./elementEngagement";

export const CORE_FAMILIES = ["alkali", "alkaline", "halogen", "noble"] as const satisfies readonly ElementCategory[];
export type CoreFamily = typeof CORE_FAMILIES[number];
export interface FamilyProgress { bestQuizPercent: number; placementComplete: boolean; updatedAt: string }
export interface ElementCourseProgress { version: 1; families: Partial<Record<CoreFamily, FamilyProgress>> }
const KEY = "memodesk-element-course-progress-v1";

export function loadElementCourseProgress(): ElementCourseProgress {
  try { const value = JSON.parse(localStorage.getItem(KEY) || "null") as ElementCourseProgress | null; return value?.version === 1 ? value : { version: 1, families: {} }; }
  catch { return { version: 1, families: {} }; }
}

function updateFamily(family: CoreFamily, patch: Partial<FamilyProgress>) {
  const progress = loadElementCourseProgress();
  const previous = progress.families[family] || { bestQuizPercent: 0, placementComplete: false, updatedAt: "" };
  progress.families[family] = { ...previous, ...patch, updatedAt: new Date().toISOString() };
  try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* ignore */ }
  return progress;
}

export function recordFamilyQuiz(family: CoreFamily, percent: number) {
  recordElementActivity("family");
  const previous = loadElementCourseProgress().families[family]?.bestQuizPercent || 0;
  return updateFamily(family, { bestQuizPercent: Math.max(previous, percent) });
}
export function recordFamilyPlacement(family: CoreFamily) { recordElementActivity("placement"); return updateFamily(family, { placementComplete: true }); }
export function isFamilyComplete(progress: ElementCourseProgress, family: CoreFamily) {
  const value = progress.families[family]; return Boolean(value && value.bestQuizPercent >= 80 && value.placementComplete);
}
export function isFamilyRecommendedUnlocked(progress: ElementCourseProgress, family: CoreFamily) {
  const index = CORE_FAMILIES.indexOf(family); return index === 0 || isFamilyComplete(progress, CORE_FAMILIES[index - 1]);
}
