import { MRT_LINES } from "./mrtData";
import type { MrtProgress } from "./mrtProgress";

export interface CheckInState { dates: string[]; streak: number; bestStreak: number }
const KEY = "memodesk-achievements-v1";
const dayKey = (date = new Date()) => date.toLocaleDateString("en-CA");
export function loadCheckIns(): CheckInState { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : { dates: [], streak: 0, bestStreak: 0 }; } catch { return { dates: [], streak: 0, bestStreak: 0 }; } }
export function checkIn(now = new Date()): CheckInState { const current = loadCheckIns(); const today = dayKey(now); if (current.dates.includes(today)) return current; const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1); const streak = current.dates.includes(dayKey(yesterday)) ? current.streak + 1 : 1; const next = { dates: [...current.dates, today].slice(-365), streak, bestStreak: Math.max(current.bestStreak, streak) }; localStorage.setItem(KEY, JSON.stringify(next)); localStorage.setItem("memodesk-local-updated-at", now.toISOString()); return next; }

export function earnedBadges(progress: MrtProgress, checkIns: CheckInState) {
  const badges = MRT_LINES.map((line) => ({ id: `line-${line.id}`, name: `${line.id} ${line.name}章`, icon: "🚇", earned: Boolean(progress.lineExams[line.id]?.passed), hint: "通過整線背誦" }));
  badges.push({ id: "branch", name: "分支高手", icon: "🔀", earned: ["R-branch", "G-branch", "O-branch"].every((id) => progress.branches[id]?.passed), hint: "通過三個分支專項" });
  badges.push({ id: "all", name: "全網站務員", icon: "🏅", earned: MRT_LINES.every((line) => progress.lineExams[line.id]?.passed), hint: "六線全部通過" });
  badges.push({ id: "streak7", name: "七日連續學習", icon: "🔥", earned: checkIns.bestStreak >= 7, hint: "連續打卡 7 天" });
  return badges;
}
