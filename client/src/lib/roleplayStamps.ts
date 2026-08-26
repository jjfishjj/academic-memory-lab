/** MemoDesk 劇本章戳收藏：同一劇本只收藏一枚，會保留較佳結局、稀有度與最近完成時間。 */
import { markLocalDataUpdated } from "@/lib/supabase";

export type RoleplayStampRarity = "common" | "rare" | "epic" | "legendary";
export type RoleplayStamp = { scriptId: string; scriptName: string; emoji: string; label: string; ending: "perfect" | "solved" | "twist"; score: number; collectedAt: string; rarity?: RoleplayStampRarity; condition?: string; bestCombo?: number; hintCount?: number };
export type RoleplayStampAssessment = { rarity: RoleplayStampRarity; condition: string };
export type RoleplayMilestone = { id: string; count: number; emoji: string; name: string; description: string };
const STORAGE_KEY = "memodesk-roleplay-stamps-v1";

export const STAMP_RARITY_META: Record<RoleplayStampRarity, { label: string; tone: string; description: string }> = {
  common: { label: "常見", tone: "stone", description: "完成五幕並留下結案回想" },
  rare: { label: "稀有", tone: "teal", description: "回想正確率達 60%" },
  epic: { label: "史詩", tone: "pink", description: "完美結局，且至少連擊 3 次" },
  legendary: { label: "傳奇", tone: "amber", description: "全對、零提示、完美結局" },
};

export const ROLEPLAY_MILESTONES: RoleplayMilestone[] = [
  { id: "first-case", count: 1, emoji: "🔎", name: "第一宗案件", description: "收下第一枚劇本章戳" },
  { id: "story-hopper", count: 3, emoji: "🗺️", name: "場景漫遊者", description: "完成 3 個不同劇本" },
  { id: "case-archivist", count: 5, emoji: "📜", name: "案件典藏員", description: "完成 5 個不同劇本" },
  { id: "club-legend", count: 8, emoji: "🏆", name: "手帳社傳奇", description: "集滿全部 8 枚劇本章戳" },
];

export function assessRoleplayStamp(input: { ending: RoleplayStamp["ending"]; score: number; bestCombo: number; hintCount: number }): RoleplayStampAssessment {
  if (input.ending === "perfect" && input.score === 100 && input.hintCount === 0) return { rarity: "legendary", condition: "五題全對 · 零提示 · 完美結局" };
  if (input.ending === "perfect" && input.score >= 80 && input.bestCombo >= 3) return { rarity: "epic", condition: "完美結局 · 至少連擊 ×3" };
  if (input.score >= 60) return { rarity: "rare", condition: "回想正確率達 60%" };
  return { rarity: "common", condition: "完成五幕並留下結案回想" };
}

/** 舊版本章戳沒有稀有度，依當時已保存的真實分數回推顯示，不改寫舊資料。 */
export function getStampRarity(stamp: RoleplayStamp): RoleplayStampRarity {
  return stamp.rarity ?? assessRoleplayStamp({ ending: stamp.ending, score: stamp.score, bestCombo: stamp.bestCombo ?? 0, hintCount: stamp.hintCount ?? 99 }).rarity;
}

export function newlyUnlockedMilestones(previous: RoleplayStamp[], next: RoleplayStamp[]) {
  return ROLEPLAY_MILESTONES.filter((milestone) => previous.length < milestone.count && next.length >= milestone.count);
}

export function loadRoleplayStamps(): RoleplayStamp[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as RoleplayStamp[]; } catch { return []; }
}

export function collectRoleplayStamp(stamp: RoleplayStamp) {
  const previous = loadRoleplayStamps();
  const existing = previous.find((item) => item.scriptId === stamp.scriptId);
  const endingRank = { twist: 1, solved: 2, perfect: 3 } as const;
  const next = existing
    ? previous.map((item) => item.scriptId === stamp.scriptId && (endingRank[stamp.ending] >= endingRank[item.ending] || stamp.score >= item.score) ? stamp : item)
    : [...previous, stamp];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  markLocalDataUpdated();
  return next;
}
