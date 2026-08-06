import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { checkIn, earnedBadges, loadCheckIns } from "@/lib/achievements";
import { loadMrtProgress } from "@/lib/mrtProgress";

export default function AchievementsPage() {
  const [state, setState] = useState(loadCheckIns()); const badges = earnedBadges(loadMrtProgress(), state); const today = new Date().toLocaleDateString("en-CA"); const checked = state.dates.includes(today);
  return <main className="container max-w-4xl py-8"><Link href="/train/mrt" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ChevronLeft className="w-4 h-4" />捷運任務板</Link><p className="font-hand text-2xl text-primary mt-7">stamps & streaks ✎</p><h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-2">成就與每日打卡</h1>
    <div className="paper-card sticky-note sticky-yellow-bg p-6 mt-7 flex flex-col sm:flex-row items-center gap-5"><span className="text-5xl">🔥</span><div className="flex-1"><strong className="text-3xl">{state.streak} 天</strong><p className="text-sm">目前連續學習 · 最佳 {state.bestStreak} 天</p></div><Button disabled={checked} onClick={() => setState(checkIn())} className="rounded-full">{checked && <Check className="w-4 h-4" />}{checked ? "今日已打卡" : "完成今日打卡"}</Button></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">{badges.map((badge) => <article key={badge.id} className={`paper-card p-5 text-center ${badge.earned ? "unlock-in border-amber-400" : "opacity-45 grayscale"}`}><span className="text-5xl">{badge.icon}</span><h2 className="font-display font-bold text-lg mt-3">{badge.name}</h2><p className="text-xs text-muted-foreground mt-1">{badge.hint}</p><span className="inline-block text-xs font-bold mt-3">{badge.earned ? "已獲得" : "尚未解鎖"}</span></article>)}</div>
  </main>;
}
