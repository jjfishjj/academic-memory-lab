/** MemoDesk 劇本章戳收藏：同一劇本只收藏一枚，會保留較佳結局與最近完成時間。 */
import { markLocalDataUpdated } from "@/lib/supabase";

export type RoleplayStamp = { scriptId: string; scriptName: string; emoji: string; label: string; ending: "perfect" | "solved" | "twist"; score: number; collectedAt: string };
const STORAGE_KEY = "memodesk-roleplay-stamps-v1";

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
