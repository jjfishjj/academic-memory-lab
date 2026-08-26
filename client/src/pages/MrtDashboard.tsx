import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, Flame, Target, Wrench } from "lucide-react";
import { Link } from "wouter";
import { MRT_LINES } from "@/lib/mrtData";
import { loadMrtProgress, type MrtProgress } from "@/lib/mrtProgress";
import { segmentsForLine } from "@/lib/mrtCourse";
import { loadPersonalMrtMnemonics } from "@/lib/mrtMnemonics";

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
  useEffect(() => {
    setProgress(loadMrtProgress());
    setHardCodes(
      new Set(
        Object.entries(loadPersonalMrtMnemonics())
          .filter(([, item]) => item.quality === "hard")
          .map(([code]) => code)
      )
    );
  }, []);
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
