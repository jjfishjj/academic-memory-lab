import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Atom,
  BookOpen,
  CheckCircle2,
  Cloud,
  Flame,
  Gamepad2,
  Map,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  loadElementProgress,
  summarizeElementProgress,
} from "@/lib/elementProgress";
import {
  CORE_FAMILIES,
  isFamilyComplete,
  loadElementCourseProgress,
} from "@/lib/elementCourseProgress";
import { ALL_TALENTS, loadTalentProgress } from "@/lib/elementTalentProgress";
import {
  currentStreak,
  dailyMissionProgress,
  loadElementActivity,
} from "@/lib/elementEngagement";
import { elementBadges } from "@/lib/elementDashboard";
const MODULES = [
  {
    href: "/periodic-table",
    icon: Map,
    title: "探索週期表",
    desc: "點選 118 元素與熟練度熱圖",
    color: "bg-teal-50 border-teal-200",
  },
  {
    href: "/elements/course",
    icon: BookOpen,
    title: "核心四族課程",
    desc: "依序攻下四條關鍵直欄",
    color: "bg-amber-50 border-amber-200",
  },
  {
    href: "/train/elements",
    icon: Atom,
    title: "元素提取測驗",
    desc: "名稱、符號、原子序雙向回想",
    color: "bg-sky-50 border-sky-200",
  },
  {
    href: "/train/elements/place",
    icon: Gamepad2,
    title: "元素歸位拖放",
    desc: "智慧混合與空白週期表",
    color: "bg-violet-50 border-violet-200",
  },
  {
    href: "/elements/talents",
    icon: Sparkles,
    title: "八大天賦遊戲",
    desc: "主副天賦雙任務與 XP 雷達",
    color: "bg-pink-50 border-pink-200",
  },
  {
    href: "/train/mrt/sync",
    icon: Cloud,
    title: "雲端同步",
    desc: "登入後跨裝置保存全部進度",
    color: "bg-slate-50 border-slate-200",
  },
];
export default function ElementDashboard() {
  const [progress] = useState(() => loadElementProgress()),
    [course] = useState(() => loadElementCourseProgress()),
    [talents] = useState(() => loadTalentProgress()),
    [activity] = useState(() => loadElementActivity());
  const summary = useMemo(() => summarizeElementProgress(progress), [progress]),
    streak = currentStreak(activity),
    missions = dailyMissionProgress(activity),
    badges = elementBadges(progress, course, talents, streak),
    earned = badges.filter(b => b.earned).length,
    totalXp = ALL_TALENTS.reduce(
      (sum, t) => sum + (talents.talents[t]?.xp || 0),
      0
    ),
    familyCount = CORE_FAMILIES.filter(f => isFamilyComplete(course, f)).length;
  return (
    <div className="min-h-screen pb-16">
      <header className="border-b bg-[#FAF6EE]/90">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/memory">
            <span className="font-display font-extrabold">← 我的記憶庫</span>
          </Link>
          <b className="font-display">週期表 · 訓練方法</b>
          <Link href="/train/mrt/sync">
            <Button variant="ghost" size="sm">
              <Cloud />
              同步
            </Button>
          </Link>
        </div>
      </header>
      <main className="container max-w-6xl pt-8">
        <section className="grid lg:grid-cols-[1.2fr_.8fr] gap-6 mb-7">
          <div className="paper-card p-6 sm:p-8 bg-[linear-gradient(135deg,#ecfdf5,#fef3c7)]">
            <p className="font-hand text-2xl text-primary">
              today's chemistry mission
            </p>
            <h1 className="font-display font-extrabold text-4xl mt-1">
              今天把幾顆元素
              <br />
              送進長期記憶？
            </h1>
            <p className="text-muted-foreground mt-3">
              系統會優先安排待複習元素，再接續族別課程與天賦遊戲。
            </p>
            <Link href="/train/elements">
              <Button className="mt-5 rounded-full">
                <RefreshCw />
                開始今日複習
              </Button>
            </Link>
          </div>
          <div className="paper-card p-5">
            <div className="flex justify-between">
              <h2 className="font-display font-bold text-xl">學習總覽</h2>
              <span className="flex items-center gap-1 text-orange-700 font-bold">
                <Flame className="w-4" />
                {streak} 天
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              {[
                { n: summary.mastered, l: "熟練元素" },
                { n: summary.due, l: "今日待複習" },
                { n: `${familyCount}/4`, l: "核心族通關" },
                { n: totalXp, l: "天賦總 XP" },
              ].map(s => (
                <div key={s.l} className="rounded-xl bg-secondary p-3">
                  <b className="text-2xl block">{s.n}</b>
                  <span className="text-xs text-muted-foreground">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">
          <div>
            <h2 className="font-display font-extrabold text-2xl mb-4">
              這個主題的訓練方法
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {MODULES.map(m => (
                <Link
                  key={m.href}
                  href={m.href}
                  className={`paper-card border p-5 flex gap-4 ${m.color}`}
                >
                  <m.icon className="w-7 h-7 text-primary shrink-0" />
                  <div>
                    <b className="font-display text-lg">{m.title}</b>
                    <p className="text-sm text-muted-foreground mt-1">
                      {m.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <aside className="paper-card p-5">
            <h2 className="font-display font-bold text-xl">每日三任務</h2>
            <p className="text-sm text-muted-foreground mt-1">
              每天完成，維持學習連續紀錄。
            </p>
            <div className="space-y-3 mt-4">
              {[
                {
                  key: "review",
                  name: "元素提取 5 題",
                  href: "/train/elements",
                },
                {
                  key: "talent",
                  name: "天賦遊戲 1 次",
                  href: "/elements/talents",
                },
                {
                  key: "practice",
                  name: "族課程或拖放 1 次",
                  href: "/elements/course",
                },
              ].map(item => {
                const m = missions[item.key as keyof typeof missions];
                return (
                  <Link
                    href={item.href}
                    key={item.key}
                    className={`block rounded-xl border p-3 ${m.done ? "bg-emerald-50 border-emerald-300" : "bg-white"}`}
                  >
                    <div className="flex justify-between">
                      <b className="text-sm">{item.name}</b>
                      {m.done && (
                        <CheckCircle2 className="w-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(m.value / m.goal) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {m.value}/{m.goal}
                    </span>
                  </Link>
                );
              })}
            </div>
          </aside>
        </section>
        <section>
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="font-hand text-xl text-primary">
                achievement cabinet
              </p>
              <h2 className="font-display font-extrabold text-2xl">
                元素成就徽章
              </h2>
            </div>
            <span className="font-bold">
              <Trophy className="inline w-4 text-amber-600" /> {earned}/
              {badges.length}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {badges.map(badge => (
              <article
                key={badge.id}
                className={`paper-card p-4 text-center ${badge.earned ? "bg-amber-50 border-amber-300" : "opacity-45 grayscale"}`}
              >
                <span className="text-3xl">{badge.icon}</span>
                <b className="font-display text-sm block mt-2">{badge.name}</b>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {badge.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
