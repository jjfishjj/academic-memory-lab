import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, BarChart3, BookOpenCheck, Brain, CalendarClock, Check, Cloud, Headphones, Map, Route, RotateCcw, Sparkles, TrainFront, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import TrainShell from "@/components/TrainShell";
import { MRT_LINES, neighborsFor, transferCodesFor, validateMrtData, type MrtLine, type MrtStation } from "@/lib/mrtData";
import { dueCountFor, learnedCountFor, loadMrtProgress, prioritizeStations, recordMrtAnswer, reviewLabel, saveMrtRun, type MrtProgress } from "@/lib/mrtProgress";

const STEPS = [
  { id: "line", label: "選路線" },
  { id: "cards", label: "雙向站卡" },
  { id: "order", label: "前後站補空" },
  { id: "done", label: "完成蓋章" },
];

type Stage = "line" | "cards" | "order" | "done";
type Question = { prompt: string; helper: string; answer: string; options: string[]; station: MrtStation };

const sample = <T,>(items: T[], count: number): T[] => [...items].sort(() => Math.random() - 0.5).slice(0, count);
const shuffle = <T,>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

function makeCardQuestions(line: MrtLine, progress: MrtProgress, focusCode?: string): Question[] {
  const activeStations = line.stations.filter((station) => !station.preview);
  const prioritized = prioritizeStations(activeStations, progress);
  const focused = focusCode ? activeStations.find((station) => station.code === focusCode) : undefined;
  const selectedStations = focused ? [focused, ...prioritized.filter((station) => station.code !== focusCode)] : prioritized;
  return selectedStations.slice(0, Math.min(8, activeStations.length)).map((station, index) => {
    const askName = index % 2 === 0;
    const distractors = sample(activeStations.filter((item) => item.code !== station.code), 3);
    return {
      prompt: askName ? station.code : station.name,
      helper: askName ? "這個站碼是哪一站？" : "這個站名的站碼是？",
      answer: askName ? station.name : station.code,
      options: shuffle([askName ? station.name : station.code, ...distractors.map((item) => askName ? item.name : item.code)]),
      station,
    };
  });
}

function makeOrderQuestions(line: MrtLine, progress: MrtProgress): Question[] {
  const eligible = line.stations.map((station, index) => ({ station, index, neighbors: neighborsFor(line, index) }))
    .filter(({ station, neighbors }) => !station.preview && (neighbors.previous || neighbors.next));
  const prioritizedCodes = prioritizeStations(eligible.map((item) => item.station), progress).map((station) => station.code);
  return [...eligible].sort((a, b) => prioritizedCodes.indexOf(a.station.code) - prioritizedCodes.indexOf(b.station.code))
    .slice(0, Math.min(6, eligible.length)).map(({ station, neighbors }) => {
    const promptParts = [neighbors.previous?.name ?? "起點", "？", neighbors.next?.name ?? "終點"];
    const distractors = sample(line.stations.filter((item) => item.code !== station.code), 3);
    return {
      prompt: promptParts.join(" → "),
      helper: "問號裡缺少哪一站？",
      answer: station.name,
      options: shuffle([station.name, ...distractors.map((item) => item.name)]),
      station,
    };
    });
}

export default function TrainMrt() {
  const [stage, setStage] = useState<Stage>("line");
  const [line, setLine] = useState<MrtLine | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [progress, setProgress] = useState<MrtProgress>({ lines: {}, stations: {}, segments: {}, lineExams: {}, branches: {} });
  const dataErrors = useMemo(() => validateMrtData(), []);

  useEffect(() => { setProgress(loadMrtProgress()); }, []);

  const stepIndex = STEPS.findIndex((item) => item.id === stage);
  const current = questions[questionIndex];

  const chooseLine = (chosen: MrtLine, focusCode?: string) => {
    const latestProgress = loadMrtProgress();
    setLine(chosen);
    setProgress(latestProgress);
    setQuestions(makeCardQuestions(chosen, latestProgress, focusCode));
    setQuestionIndex(0);
    setSelected(null);
    setCorrect(0);
    setAttempts(0);
    setStage("cards");
  };

  useEffect(() => {
    const focusCode = new URLSearchParams(window.location.search).get("focus");
    if (!focusCode) return;
    const focusedLine = MRT_LINES.find((item) => item.stations.some((station) => station.code === focusCode));
    if (focusedLine) chooseLine(focusedLine, focusCode);
  }, []);

  const answer = (option: string) => {
    if (selected || !current) return;
    setSelected(option);
    setAttempts((value) => value + 1);
    const isCorrect = option === current.answer;
    if (isCorrect) setCorrect((value) => value + 1);
    setProgress(recordMrtAnswer(current.station, isCorrect));
  };

  const next = () => {
    if (!line) return;
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((value) => value + 1);
      setSelected(null);
      return;
    }
    if (stage === "cards") {
      const latestProgress = loadMrtProgress();
      setQuestions(makeOrderQuestions(line, latestProgress));
      setQuestionIndex(0);
      setSelected(null);
      setStage("order");
      return;
    }
    const updated = saveMrtRun(line.id, correct, attempts);
    setProgress(updated);
    setStage("done");
  };

  const restart = () => {
    setLine(null);
    setQuestions([]);
    setQuestionIndex(0);
    setSelected(null);
    setStage("line");
  };

  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
  const transferCodes = current ? transferCodesFor(current.station) : [];
  const currentReview = current ? progress.stations[current.station.code] : undefined;
  const totalDue = MRT_LINES.reduce((sum, item) => sum + dueCountFor(item.stations.filter((station) => !station.preview), progress), 0);

  return (
    <TrainShell
      title="台北捷運全站記憶"
      steps={STEPS}
      stepIndex={stepIndex}
      stepColor={(id) => id === "cards" ? "bg-blue-100" : id === "order" ? "bg-amber-100" : id === "done" ? "bg-emerald-100" : "bg-white"}
      badge={line ? `${line.id} · ${correct}/${attempts}` : "MRT beta"}
    >
      {stage === "line" && (
        <section>
          <p className="font-hand text-2xl text-primary mb-2">pick a line, build a route memory ✎</p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-3">今天先把一條線貼進腦袋</h1>
          <p className="text-muted-foreground mb-5 max-w-2xl">每輪 14 題：系統先出已到期與曾答錯的站，再補入尚未學過的站。答對後依 1、3、7、14 天逐步延長複習。</p>

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-900 px-4 py-2 text-sm font-bold mb-8">
            <CalendarClock className="w-4 h-4" /> 今天共有 {totalDue} 站待複習
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            <Link href="/train/mrt/course" className="paper-card p-4 flex items-center gap-3 group"><Route className="w-7 h-7 text-primary" /><span className="flex-1"><strong className="font-display block">完整路線課程</strong><span className="text-xs text-muted-foreground">分段解鎖、順背、逆背、整線驗收</span></span><ArrowRight className="w-4 h-4 group-hover:text-primary" /></Link>
            <Link href="/train/mrt/errors" className="paper-card p-4 flex items-center gap-3 group"><BookOpenCheck className="w-7 h-7 text-amber-700" /><span className="flex-1"><strong className="font-display block">捷運錯題本</strong><span className="text-xs text-muted-foreground">查看到期站與低正確率弱項</span></span><ArrowRight className="w-4 h-4 group-hover:text-primary" /></Link>
            <Link href="/train/mrt/profile" className="paper-card p-4 flex items-center gap-3 group"><Brain className="w-7 h-7 text-purple-700" /><span className="flex-1"><strong className="font-display block">VARK＋八大天賦</strong><span className="text-xs text-muted-foreground">設定個人翻牌、提示與練習方式</span></span><ArrowRight className="w-4 h-4 group-hover:text-primary" /></Link>
            <Link href="/train/mrt/dashboard" className="paper-card p-4 flex items-center gap-3 group"><BarChart3 className="w-7 h-7 text-blue-700" /><span className="flex-1"><strong className="font-display block">學習分析儀表板</strong><span className="text-xs text-muted-foreground">精熟度、弱站熱區與複習日曆</span></span><ArrowRight className="w-4 h-4 group-hover:text-primary" /></Link>
            <Link href="/train/mrt/audio" className="paper-card p-4 flex items-center gap-3 group sm:col-span-2"><Headphones className="w-7 h-7 text-pink-700" /><span className="flex-1"><strong className="font-display block">報站音訊模式</strong><span className="text-xs text-muted-foreground">聽音辨站、三拍跟讀與節奏記憶</span></span><ArrowRight className="w-4 h-4 group-hover:text-primary" /></Link>
            <Link href="/train/mrt/achievements" className="paper-card p-4 flex items-center gap-3 group"><Award className="w-7 h-7 text-amber-700" /><span className="flex-1"><strong className="font-display block">成就與每日打卡</strong><span className="text-xs text-muted-foreground">連續學習、六線章與全網站務員</span></span><ArrowRight className="w-4 h-4" /></Link>
            <Link href="/train/mrt/sync" className="paper-card p-4 flex items-center gap-3 group"><Cloud className="w-7 h-7 text-sky-700" /><span className="flex-1"><strong className="font-display block">Supabase 雲端同步</strong><span className="text-xs text-muted-foreground">登入後同步手機與電腦進度</span></span><ArrowRight className="w-4 h-4" /></Link>
          </div>

          {dataErrors.length > 0 && (
            <div role="alert" className="paper-card p-4 mb-6 border-red-300 bg-red-50 text-red-800">
              資料暫時無法使用：{dataErrors.join("、")}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            {MRT_LINES.map((item, index) => {
              const activeStations = item.stations.filter((station) => !station.preview);
              const saved = progress.lines[item.id];
              const activeCount = activeStations.length;
              const dueCount = dueCountFor(activeStations, progress);
              const learnedCount = learnedCountFor(activeStations, progress);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={dataErrors.length > 0}
                  onClick={() => chooseLine(item)}
                  className={`paper-card ${index % 2 ? "tilt-r" : "tilt-l"} p-5 text-left disabled:opacity-50 group`}
                  aria-label={`開始${item.name}訓練`}
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex shrink-0 items-center justify-center rounded-full w-13 h-13 font-black text-sm shadow-sm" style={{ background: item.color, color: item.textColor }}>{item.id}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <strong className="font-display text-xl">{item.name}</strong>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                      </span>
                      <span className="block text-sm text-muted-foreground mt-1">{item.direction}</span>
                      <span className="flex flex-wrap gap-2 mt-3 text-xs font-bold">
                        <span className="bg-white/70 rounded-full px-2.5 py-1">{activeCount} 個營運站碼</span>
                        <span className={`rounded-full px-2.5 py-1 ${dueCount ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}>{dueCount} 待複習</span>
                        <span className="bg-blue-100 text-blue-800 rounded-full px-2.5 py-1">已學 {learnedCount}/{activeCount}</span>
                        {saved && <span className="bg-emerald-100 text-emerald-800 rounded-full px-2.5 py-1">最佳 {saved.bestAccuracy}% · {saved.completedRuns} 輪</span>}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-7">資料版本 2026-08-03 · R01 廣慈／奉天宮目前以試運轉預覽標示，不納入隨機題。</p>
        </section>
      )}

      {(stage === "cards" || stage === "order") && current && line && (
        <section className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5 text-sm font-bold">
            <span className="inline-flex items-center gap-2"><TrainFront className="w-4 h-4" /> {line.name}</span>
            <span>第 {questionIndex + 1} / {questions.length} 題</span>
          </div>

          <div className="paper-card relative p-7 sm:p-10 text-center overflow-hidden">
            <div className="washi" style={{ background: line.color }} />
            <span className="inline-block rounded-full px-3 py-1 text-xs font-black mb-5" style={{ background: line.color, color: line.textColor }}>
              {stage === "cards" ? "雙向站卡" : "前後站補空"}
            </span>
            <p className="text-sm text-muted-foreground mb-3">{current.helper}</p>
            <h2 className="font-display font-black text-3xl sm:text-4xl break-words mb-8">{current.prompt}</h2>

            <div className="grid sm:grid-cols-2 gap-3">
              {current.options.map((option) => {
                const isAnswer = option === current.answer;
                const isPicked = option === selected;
                const feedback = selected ? (isAnswer ? "border-emerald-500 bg-emerald-50 text-emerald-900" : isPicked ? "border-red-400 bg-red-50 text-red-800" : "opacity-55") : "hover:border-primary hover:bg-primary/5";
                return (
                  <button key={option} type="button" onClick={() => answer(option)} disabled={Boolean(selected)}
                    className={`rounded-xl border-2 p-4 font-display font-bold text-lg transition-all ${feedback}`}>
                    <span className="inline-flex items-center justify-center gap-2">
                      {selected && isAnswer && <Check className="w-5 h-5" />}
                      {selected && isPicked && !isAnswer && <X className="w-5 h-5" />}
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {selected && (
              <div className="mt-7 pt-6 border-t border-dashed text-left">
                <p className={`font-display font-bold ${selected === current.answer ? "text-emerald-700" : "text-red-700"}`}>
                  {selected === current.answer ? "答對了，記憶路線接上了！" : `正確答案是 ${current.answer}`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {current.station.code} · {current.station.name}
                  {transferCodes.length > 0 && ` · 可轉乘 ${transferCodes.join("、")}`}
                  {current.station.branch && ` · ${current.station.branch}`}
                </p>
                <p className={`text-sm font-bold mt-2 ${selected === current.answer ? "text-primary" : "text-amber-700"}`}>
                  <CalendarClock className="w-4 h-4 inline mr-1" />
                  {selected === current.answer ? reviewLabel(currentReview) : "已加入錯題，下一輪優先出現"}
                </p>
                <Button onClick={next} className="mt-5 rounded-full font-bold w-full sm:w-auto">
                  {stage === "order" && questionIndex === questions.length - 1 ? "查看成績" : "下一題"} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {stage === "done" && line && (
        <section className="max-w-xl mx-auto text-center">
          <div className="paper-card relative p-8 sm:p-12">
            <div className="washi washi-yellow" />
            <div className="mx-auto w-20 h-20 rounded-full border-4 border-primary text-primary flex items-center justify-center stamp-in mb-6 -rotate-6">
              <Check className="w-10 h-10" />
            </div>
            <p className="font-hand text-2xl text-primary">route memory stamped!</p>
            <h1 className="font-display font-extrabold text-3xl mt-2">{line.name}本輪完成</h1>
            <p className="text-5xl font-black mt-6">{accuracy}%</p>
            <p className="text-muted-foreground mt-2">答對 {correct} / {attempts} 題</p>
            <div className="grid grid-cols-2 gap-3 mt-7 text-sm">
              <div className="sticky-note sticky-yellow-bg p-4"><strong className="block text-xl">{progress.lines[line.id]?.bestAccuracy ?? accuracy}%</strong>最佳正確率</div>
              <div className="sticky-note sticky-pink-bg p-4"><strong className="block text-xl">{progress.lines[line.id]?.completedRuns ?? 1}</strong>完成輪數</div>
            </div>
            <p className="text-sm text-muted-foreground mt-5"><CalendarClock className="w-4 h-4 inline mr-1" />本線目前有 {dueCountFor(line.stations.filter((station) => !station.preview), progress)} 站待複習</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
              <Button onClick={() => chooseLine(line)} className="rounded-full font-bold"><Sparkles className="w-4 h-4" /> 再練一輪</Button>
              <Button onClick={restart} variant="outline" className="rounded-full font-bold"><Map className="w-4 h-4" /> 換一條線</Button>
            </div>
          </div>
          <button type="button" onClick={restart} className="mt-6 text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><RotateCcw className="w-4 h-4" /> 返回路線任務板</button>
        </section>
      )}
    </TrainShell>
  );
}
