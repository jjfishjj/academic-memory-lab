import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, Flame, Target, Wrench } from "lucide-react";
import { Link } from "wouter";
import { MRT_LINES } from "@/lib/mrtData";
import { loadMrtProgress, type MrtProgress } from "@/lib/mrtProgress";
import { segmentsForLine } from "@/lib/mrtCourse";
import { loadPersonalMrtMnemonics } from "@/lib/mrtMnemonics";
import {
  loadMrtRepairHistory,
  loadMrtRepairWeeklyGoal,
  mrtRepairGoalStats,
  mrtRepairTrend,
  saveMrtRepairWeeklyGoal,
  type MrtRepairResult,
} from "@/lib/mrtRepair";

const EMPTY: MrtProgress = {
  lines: {},
  stations: {},
  segments: {},
  lineExams: {},
  branches: {},
};

export default function MrtDashboard() {
  const [progress, setProgress] = useState<MrtProgress>(EMPTY);
  const [hardCodes, setHardCodes] = useState<Set<string>>(new Set());
  const [repairHistory, setRepairHistory] = useState<MrtRepairResult[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  useEffect(() => {
    setProgress(loadMrtProgress());
    setHardCodes(
      new Set(
        Object.entries(loadPersonalMrtMnemonics())
          .filter(([, item]) => item.quality === "hard")
          .map(([code]) => code)
      )
    );
    setRepairHistory(loadMrtRepairHistory());
    setWeeklyGoal(loadMrtRepairWeeklyGoal());
  }, []);
  const repairTrend = useMemo(
    () => mrtRepairTrend(repairHistory),
    [repairHistory]
  );
  const repairGoals = useMemo(
    () => mrtRepairGoalStats(repairHistory, new Date(), weeklyGoal),
    [repairHistory, weeklyGoal]
  );
  const learned = Object.keys(progress.stations).length;
  const weak = Array.from(
    new Set([
      ...Array.from(hardCodes),
      ...Object.entries(progress.stations)
        .filter(
          ([, saved]) =>
            !saved.lastResult || saved.correct / saved.attempts < 0.8
        )
        .map(([code]) => code),
    ])
  )
    .map(code => [code, progress.stations[code]] as const)
    .sort(
      (a, b) =>
        (hardCodes.has(a[0]) ? -1 : 0) - (hardCodes.has(b[0]) ? -1 : 0) ||
        (a[1]?.correct ?? 0) / (a[1]?.attempts || 1) -
          (b[1]?.correct ?? 0) / (b[1]?.attempts || 1)
    )
    .slice(0, 12);
  const passedSegments = Object.values(progress.segments).filter(
    item => item.passed
  ).length;
  const totalSegments = MRT_LINES.reduce(
    (sum, line) => sum + segmentsForLine(line.id).length,
    0
  );
  const remaining = totalSegments - passedSegments;
  const estimatedDays = Math.ceil(remaining / 2);
  const calendar = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() + index);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);
        const count = Object.values(progress.stations).filter(saved => {
          const date = new Date(saved.nextReviewAt);
          return date >= day && date < next;
        }).length;
        return { day, count };
      }),
    [progress]
  );
  return (
    <main className="container max-w-6xl py-8">
      <Link
        href="/train/mrt"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="w-4 h-4" />
        捷運任務板
      </Link>
      <p className="font-hand text-2xl text-primary mt-7">
        your route analytics ✎
      </p>
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-2">
        捷運記憶分析儀表板
      </h1>
      <div className="grid sm:grid-cols-3 gap-4 mt-7">
        <div className="paper-card p-5">
          <Target className="text-primary" />
          <strong className="text-3xl block mt-3">{learned}/135</strong>
          <span className="text-sm text-muted-foreground">已學站碼</span>
        </div>
        <div className="paper-card p-5">
          <Flame className="text-orange-600" />
          <strong className="text-3xl block mt-3">
            {passedSegments}/{totalSegments}
          </strong>
          <span className="text-sm text-muted-foreground">通過小段</span>
        </div>
        <div className="paper-card p-5">
          <CalendarDays className="text-blue-600" />
          <strong className="text-3xl block mt-3">約 {estimatedDays} 天</strong>
          <span className="text-sm text-muted-foreground">
            以每日兩段估算完成
          </span>
        </div>
      </div>
      <section className="mt-9">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-2xl">
              修復目標與連續紀錄
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              每天完成一輪 5 站專班，就會累積連續天數與本週進度。
            </p>
          </div>
          <label className="text-sm font-bold">
            每週目標
            <select
              value={weeklyGoal}
              onChange={event =>
                setWeeklyGoal(
                  saveMrtRepairWeeklyGoal(Number(event.target.value))
                )
              }
              className="ml-2 rounded-lg border bg-white px-3 py-2"
            >
              <option value={3}>3 天</option>
              <option value={5}>5 天</option>
              <option value={7}>7 天</option>
            </select>
          </label>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <div className="paper-card p-5">
            <Target className="text-emerald-600" />
            <strong className="text-3xl block mt-3">
              {repairGoals.todayAccuracy}%
            </strong>
            <span className="text-sm text-muted-foreground">
              今日完成率 · {repairGoals.todayCompleted ? "已完成" : "待完成"}
            </span>
          </div>
          <div className="paper-card p-5">
            <Flame className="text-orange-600" />
            <strong className="text-3xl block mt-3">
              {repairGoals.streak} 天
            </strong>
            <span className="text-sm text-muted-foreground">連續修復紀錄</span>
          </div>
          <div className="paper-card p-5">
            <CalendarDays className="text-blue-600" />
            <div className="flex items-end justify-between mt-3">
              <strong className="text-3xl">
                {repairGoals.weekCompleted}/{repairGoals.weeklyGoal}
              </strong>
              <span className="text-sm font-bold">
                {repairGoals.weeklyRate}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted mt-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${repairGoals.weeklyRate}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground block mt-2">
              本週修復目標
            </span>
          </div>
        </div>
      </section>
      <section className="mt-9">
        <h2 className="font-display font-bold text-2xl">六線精熟度</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {MRT_LINES.map(line => {
            const active = line.stations.filter(station => !station.preview);
            const scores = active
              .map(station => progress.stations[station.code])
              .filter(Boolean);
            const mastery = scores.length
              ? Math.round(
                  (scores.reduce(
                    (sum, item) => sum + item.correct / item.attempts,
                    0
                  ) /
                    active.length) *
                    100
                )
              : 0;
            return (
              <div key={line.id} className="paper-card p-5">
                <div className="flex justify-between">
                  <strong>
                    {line.id} {line.name}
                  </strong>
                  <span>{mastery}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${mastery}%`, background: line.color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  已練 {scores.length}/{active.length} 站 · 整線最佳{" "}
                  {progress.lineExams[line.id]?.bestAccuracy ?? 0}%
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <Link
        href="/train/mrt/repair"
        className="paper-card p-5 mt-5 flex items-center gap-4 border-red-200 bg-red-50"
      >
        <Wrench className="text-red-700" />
        <span className="flex-1">
          <strong className="font-display text-lg block">
            開始今日 5 站弱點專班
          </strong>
          <small className="text-muted-foreground">
            依難記標記、錯誤率與到期狀態自動選站
          </small>
        </span>
        <span className="font-bold text-red-700">開始 →</span>
      </Link>
      <section className="mt-9">
        <h2 className="font-display font-bold text-2xl">弱站品質熱區</h2>
        {weak.length ? (
          <div className="flex flex-wrap gap-2 mt-4">
            {weak.map(([code, saved]) => {
              const station = MRT_LINES.flatMap(line => line.stations).find(
                item => item.code === code
              )!;
              const accuracy = saved
                ? Math.round((saved.correct / saved.attempts) * 100)
                : 0;
              const hard = hardCodes.has(code);
              return (
                <Link
                  key={code}
                  href={`/train/mrt/course?focus=${code}`}
                  className={`rounded-full px-4 py-2 font-bold text-sm ${hard || accuracy < 50 ? "bg-red-200 text-red-900 ring-2 ring-red-400" : "bg-amber-100 text-amber-900"}`}
                >
                  {code} {station.name} ·{" "}
                  {hard ? "手動標記難記" : `${accuracy}%`}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground mt-3">
            還沒有弱站資料；完成幾輪練習或將聯想標成「難記」後會自動生成。
          </p>
        )}
      </section>
      <section className="mt-9">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-2xl">
              最近 30 天修復趨勢
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              綠柱為當日修復率，紅點為完成後仍待修復的站數。
            </p>
          </div>
          {repairTrend.length > 0 && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
              最新 {repairTrend.at(-1)?.repairRate}%
            </span>
          )}
        </div>
        {repairTrend.length ? (
          <div className="paper-card p-5 mt-4 overflow-x-auto">
            <div className="flex items-end gap-3 min-w-max h-56 border-b pb-2">
              {repairTrend.map(point => (
                <div
                  key={point.date}
                  className="w-12 h-full flex flex-col justify-end items-center gap-1"
                  title={`${point.date}：修復率 ${point.repairRate}%、仍弱 ${point.weakCount} 站`}
                >
                  <span className="text-xs font-black text-red-700">
                    {point.weakCount}弱
                  </span>
                  <div className="w-8 flex-1 flex items-end rounded-t-lg bg-emerald-50 overflow-hidden">
                    <div
                      className="w-full rounded-t-lg bg-emerald-500"
                      style={{ height: `${Math.max(4, point.repairRate)}%` }}
                    />
                  </div>
                  <strong className="text-[10px]">{point.repairRate}%</strong>
                  <small className="text-[9px] text-muted-foreground">
                    {point.date.slice(5)}
                  </small>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="paper-card p-6 mt-4 text-muted-foreground">
            完成第一輪每日弱站修復後，這裡會開始累積趨勢。
          </div>
        )}
      </section>
      <section className="mt-9">
        <h2 className="font-display font-bold text-2xl">未來 14 天複習日曆</h2>
        <div className="grid grid-cols-7 gap-2 mt-4">
          {calendar.map(({ day, count }) => (
            <div
              key={day.toISOString()}
              className={`rounded-xl border p-3 text-center ${count ? "bg-amber-100 border-amber-300" : "bg-white"}`}
            >
              <span className="text-xs text-muted-foreground">
                {day.getMonth() + 1}/{day.getDate()}
              </span>
              <strong className="block text-xl mt-1">{count}</strong>
              <small>站</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
