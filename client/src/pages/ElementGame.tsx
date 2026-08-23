/**
 * MemoDesk Scrapbook Academia — 元素記憶步行：把原子序、符號、中文名與故事
 * 串成可提取的記憶路徑，並以間隔複習優先安排下一站。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Atom,
  BookOpen,
  Check,
  ClipboardPenLine,
  EyeOff,
  Flame,
  Footprints,
  Lightbulb,
  MapPinned,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_STYLE, ELEMENTS, type ElementItem } from "@/lib/elementData";
import {
  getElementMnemonic,
  getNumberScene,
  getStoryChapter,
} from "@/lib/elementMemory";
import {
  getDueElements,
  getDueLabel,
  getMasteredCount,
  getReviewQueue,
  loadElementProgress,
  recordElementReview,
  saveElementProgress,
  type ElementProgress,
} from "@/lib/elementProgress";
import {
  loadMemoryProfile,
  TALENT_OPTIONS,
  VARK_OPTIONS,
  type MemoryProfile,
} from "@/lib/memoryProfile";

type Level = 20 | 36 | 118;
type RouteMode = "walk" | "draw";
type RecallMode = "choice" | "typed";
type Stage = "link" | "recall" | "feedback";
type GameStats = {
  best: number;
  correct: number;
  total: number;
  seen: number[];
};
const STATS_KEY = "memodesk-element-stats-v2";

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getStats(): GameStats {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STATS_KEY) || ""
    ) as Partial<GameStats>;
    return {
      best: parsed.best || 0,
      correct: parsed.correct || 0,
      total: parsed.total || 0,
      seen: parsed.seen || [],
    };
  } catch {
    return { best: 0, correct: 0, total: 0, seen: [] };
  }
}

function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, "");
}

function matchesTypedAnswer(value: string, item: ElementItem) {
  const answer = normalizeAnswer(value);
  return [item.symbol, item.nameZh, item.nameEn, String(item.number)].some(
    candidate => normalizeAnswer(candidate) === answer
  );
}

function personalTip(profile: MemoryProfile | null, item: ElementItem) {
  const mnemonic = getElementMnemonic(item);
  if (!profile)
    return `先說「${mnemonic.numberImage}」，再把 ${mnemonic.pun} 畫面接上 ${item.symbol}。`;
  if (profile.vark === "auditory" || profile.primaryTalent === "soundMimic")
    return `用三拍複述：「${item.number}・${mnemonic.pun}・${item.symbol}」；最後說一次 ${mnemonic.recallLine}`;
  if (profile.vark === "readWrite" || profile.primaryTalent === "textOrganizer")
    return `在手帳寫一行：「#${item.number}｜${mnemonic.pun}｜${item.symbol} ${item.nameZh}」。`;
  if (
    profile.vark === "kinesthetic" ||
    profile.primaryTalent === "actionContext"
  )
    return `先比出 ${mnemonic.numberImage} 的姿勢，再用手指畫 ${item.symbol}，讓動作接住畫面。`;
  if (profile.primaryTalent === "creativeConnector")
    return `把「${mnemonic.visual}」再誇張三倍；越荒謬越容易在提取時跳出 ${item.symbol}。`;
  return `不要背表格：沿著 ${getNumberScene(item.number).station}，看見 ${mnemonic.numberImage} 就回想 ${item.symbol}。`;
}

export default function ElementGame() {
  const [profile] = useState<MemoryProfile | null>(() => loadMemoryProfile());
  const [level, setLevel] = useState<Level>(20);
  const [routeMode, setRouteMode] = useState<RouteMode>("walk");
  const [recallMode, setRecallMode] = useState<RecallMode>("choice");
  const [position, setPosition] = useState(0);
  const [itemNumber, setItemNumber] = useState(1);
  const [options, setOptions] = useState<ElementItem[]>([]);
  const [stage, setStage] = useState<Stage>("link");
  const [answer, setAnswer] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [stats, setStats] = useState<GameStats>(() => getStats());
  const [wrong, setWrong] = useState<number[]>([]);
  const [progress, setProgress] = useState<ElementProgress>(() =>
    loadElementProgress()
  );
  const typedInputRef = useRef<HTMLInputElement>(null);

  const pool = useMemo(() => ELEMENTS.slice(0, level), [level]);
  const route = useMemo(
    () => (routeMode === "draw" ? getReviewQueue(progress, pool) : pool),
    [pool, progress, routeMode]
  );
  const item = ELEMENTS[itemNumber - 1] || pool[0] || ELEMENTS[0];
  const mnemonic = getElementMnemonic(item);
  const scene = getNumberScene(item.number);
  const vark = profile
    ? VARK_OPTIONS.find(entry => entry.id === profile.vark)
    : null;
  const talent = profile
    ? TALENT_OPTIONS.find(entry => entry.id === profile.primaryTalent)
    : null;
  const currentRoutePosition = Math.max(
    0,
    route.findIndex(candidate => candidate.number === item.number)
  );
  const currentReview = progress[item.number];
  const dueCount = getDueElements(progress, pool).length;
  const masteredCount = getMasteredCount(progress, pool);
  const progressPercent =
    routeMode === "walk"
      ? Math.round(((currentRoutePosition + 1) / pool.length) * 100)
      : Math.min(100, Math.round((round / 10) * 100));

  function prepareOptions(target: ElementItem) {
    setOptions(
      shuffle([
        target,
        ...shuffle(
          pool.filter(candidate => candidate.number !== target.number)
        ).slice(0, 3),
      ])
    );
  }

  function beginTarget(target: ElementItem, nextPosition = 0) {
    setItemNumber(target.number);
    setPosition(Math.max(0, nextPosition));
    setStage("link");
    setAnswer(null);
    setTypedAnswer("");
    prepareOptions(target);
  }

  function beginAt(nextPosition: number) {
    const safePosition =
      ((nextPosition % route.length) + route.length) % route.length;
    beginTarget(route[safePosition] || pool[0], safePosition);
  }

  useEffect(() => {
    const first = route[0] || pool[0] || ELEMENTS[0];
    setPosition(0);
    setRound(1);
    setStage("link");
    setAnswer(null);
    setTypedAnswer("");
    setItemNumber(first.number);
    prepareOptions(first);
    // route changes only when the learner intentionally changes level/mode here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, routeMode]);

  useEffect(() => {
    if (stage === "recall" && recallMode === "typed") {
      window.setTimeout(() => typedInputRef.current?.focus(), 0);
    }
  }, [recallMode, stage]);

  function beginRecall() {
    setStage("recall");
    setAnswer(null);
    setTypedAnswer("");
    prepareOptions(item);
  }

  function finishAnswer(ok: boolean, selectedNumber: number | null = null) {
    if (stage !== "recall" || answer !== null) return;
    setAnswer(ok ? item.number : (selectedNumber ?? -1));
    setStage("feedback");
    const nextCombo = ok ? combo + 1 : 0;
    const nextStats = {
      best: Math.max(stats.best, nextCombo),
      correct: stats.correct + (ok ? 1 : 0),
      total: stats.total + 1,
      seen: Array.from(new Set([...stats.seen, item.number])),
    };
    const nextProgress = recordElementReview(progress, item.number, ok);
    setCombo(nextCombo);
    setScore(currentScore => currentScore + (ok ? 120 + combo * 15 : 20));
    if (!ok) setWrong(items => Array.from(new Set([...items, item.number])));
    setStats(nextStats);
    setProgress(nextProgress);
    saveElementProgress(nextProgress);
    localStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
  }

  function choose(chosen: ElementItem) {
    finishAnswer(chosen.number === item.number, chosen.number);
  }

  function submitTyped() {
    if (!typedAnswer.trim()) return;
    finishAnswer(matchesTypedAnswer(typedAnswer, item));
  }

  function next() {
    setRound(currentRound => currentRound + 1);
    const shouldRepair = wrong.length > 0 && round % 4 === 0;
    if (shouldRepair) {
      const repairItem = ELEMENTS.find(
        candidate => candidate.number === wrong[0]
      );
      setWrong(items => items.filter(number => number !== repairItem?.number));
      if (repairItem) {
        beginTarget(repairItem, currentRoutePosition);
        return;
      }
    }
    if (routeMode === "walk") {
      const nextItem =
        pool[
          (pool.findIndex(candidate => candidate.number === item.number) + 1) %
            pool.length
        ] || pool[0];
      beginTarget(nextItem, (currentRoutePosition + 1) % pool.length);
      return;
    }
    const nextItem =
      getReviewQueue(progress, pool).find(
        candidate => candidate.number !== item.number
      ) || pool[0];
    beginTarget(nextItem, 0);
  }

  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(
      new SpeechSynthesisUtterance(
        `${mnemonic.recallLine}。元素符號 ${item.symbol}，${item.nameZh}。`
      )
    );
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const optionIndex = Number(event.key) - 1;
      if (
        stage === "recall" &&
        recallMode === "choice" &&
        optionIndex >= 0 &&
        optionIndex <= 3 &&
        options[optionIndex]
      )
        choose(options[optionIndex]);
      if (stage === "recall" && recallMode === "typed" && event.key === "Enter")
        submitTyped();
      if (stage === "link" && (event.key === "Enter" || event.key === " "))
        beginRecall();
      if (stage === "feedback" && (event.key === "Enter" || event.key === " "))
        next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    stage,
    recallMode,
    options,
    item,
    typedAnswer,
    round,
    wrong,
    routeMode,
    currentRoutePosition,
    pool,
    progress,
  ]);

  const correctAnswer = answer === item.number;

  return (
    <div className="min-h-screen pb-16 element-memory-page">
      <header className="border-b bg-[#FAF6EE]/90 backdrop-blur sticky top-0 z-20">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft /> 回首頁
            </Button>
          </Link>
          <div className="font-display font-extrabold flex items-center gap-2">
            <Atom className="text-primary" /> 元素記憶實驗室
          </div>
          <div className="text-sm font-bold text-orange-700 flex items-center gap-1">
            <Flame className="w-4" /> {combo}
          </div>
        </div>
      </header>

      <main className="container max-w-6xl pt-7">
        <section className="element-case-hero mb-6 relative overflow-hidden">
          <div className="element-clip" aria-hidden="true">
            MemoDesk 化學社
          </div>
          <div className="relative z-10 max-w-3xl">
            <p className="font-hand text-2xl text-primary">
              01–118 提取軌道 × 元素諧音劇場
            </p>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
              別背週期表，讓每個元素在你腦中有座標。
            </h1>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              先看故事、再遮住提示回想；答錯的元素會立即回到弱點佇列，答對則依
              1／3／7／14／30 天間隔再見。每天 10 分鐘，從認得變成想得起來。
            </p>
          </div>
          <div className="element-route-stamp" aria-label="記憶任務步驟">
            <span>01 看見</span>
            <i /> <span>02 提取</span>
            <i /> <span>03 間隔複習</span>
          </div>
        </section>

        <section className="paper-card p-4 mb-6 grid md:grid-cols-[1fr_1fr_auto] gap-4 element-control-sheet">
          <label className="text-sm font-bold">
            元素訓練範圍
            <select
              aria-label="元素訓練範圍"
              value={level}
              onChange={event => setLevel(Number(event.target.value) as Level)}
              className="mt-2 w-full border rounded-lg bg-white px-3 py-2"
            >
              <option value="20">校園序章 · 01–20（完整諧音故事）</option>
              <option value="36">核心隊 · 01–36（基礎週期表）</option>
              <option value="118">全週期 · 01–118（完整元素）</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            走訪方式
            <select
              aria-label="走訪方式"
              value={routeMode}
              onChange={event => {
                const nextMode = event.target.value as RouteMode;
                setRouteMode(nextMode);
              }}
              className="mt-2 w-full border rounded-lg bg-white px-3 py-2"
            >
              <option value="walk">故事步行 · 依序建立地圖</option>
              <option value="draw">弱點抽卡 · 優先複習到期元素</option>
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2 text-center self-end">
            <div className="rounded-lg bg-amber-50 p-2">
              <b className="block text-xl">{score}</b>
              <span className="text-xs">本次分數</span>
            </div>
            <div className="rounded-lg bg-rose-50 p-2">
              <b className="block text-xl">{dueCount}</b>
              <span className="text-xs">待複習</span>
            </div>
            <div className="rounded-lg bg-teal-50 p-2">
              <b className="block text-xl">{masteredCount}</b>
              <span className="text-xs">已熟練</span>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <section className="paper-card p-5 sm:p-8 relative overflow-hidden element-story-dossier">
            <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
              <span className="element-index-tab">
                {getStoryChapter(item.number)}
              </span>
              <span>
                {CATEGORY_STYLE[item.category].label} · 第 {round} 次走訪
              </span>
            </div>

            <div className="grid sm:grid-cols-[180px_1fr] gap-5 items-center mt-6">
              <div
                className={`element-tile mx-auto ${CATEGORY_STYLE[item.category].className}`}
              >
                <span className="text-xs tracking-widest">原子座標</span>
                <strong className="font-display text-6xl my-1">
                  {String(item.number).padStart(3, "0")}
                </strong>
                <span className="text-sm opacity-70">{scene.station}</span>
              </div>
              <div>
                <p className="font-hand text-2xl text-primary">
                  {mnemonic.numberImage}
                </p>
                <h2 className="font-display font-bold text-2xl mt-1">
                  先把「{mnemonic.pun}」黏到 {item.symbol}。
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {mnemonic.visual}
                </p>
                <div className="element-story-strip mt-4">
                  <WandSparkles className="w-5" />
                  <span>{mnemonic.storyBeat}</span>
                </div>
              </div>
            </div>

            {stage === "link" && (
              <div className="mt-7 element-link-card">
                <div className="flex items-start gap-3">
                  <Target className="mt-1 text-primary" />
                  <div>
                    <p className="font-bold">先做一次精準編碼：</p>
                    <p className="text-lg mt-1">「{mnemonic.recallLine}」</p>
                    <p className="text-xs mt-2 text-muted-foreground">
                      把「序號 → 中文名 → 符號」順著故事說一次，再把提示遮住。
                    </p>
                  </div>
                </div>
                <div
                  className="mt-4 flex flex-wrap items-center gap-2"
                  role="group"
                  aria-label="回想方式"
                >
                  <span className="text-sm font-bold mr-1">下一步用：</span>
                  <button
                    type="button"
                    onClick={() => setRecallMode("choice")}
                    className={`rounded-full border px-3 py-1.5 text-sm font-bold ${recallMode === "choice" ? "bg-primary text-primary-foreground" : "bg-white"}`}
                  >
                    四選一
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecallMode("typed")}
                    className={`rounded-full border px-3 py-1.5 text-sm font-bold ${recallMode === "typed" ? "bg-primary text-primary-foreground" : "bg-white"}`}
                  >
                    <ClipboardPenLine className="inline w-4 mr-1" />
                    自己輸入
                  </button>
                </div>
                <Button onClick={beginRecall} className="mt-4">
                  <EyeOff /> 遮住聯想，開始提取
                </Button>
                <p className="text-xs mt-3 text-muted-foreground">
                  鍵盤 Enter 可開始；四選一可按 1–4，答案送出後按 Enter
                  進入下一站。
                </p>
              </div>
            )}

            {stage !== "link" && (
              <div className="mt-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-display font-bold text-xl">
                    <EyeOff className="text-primary" />{" "}
                    提取時刻：這一幕指向哪個元素？
                  </div>
                  <div
                    className="flex gap-1 rounded-full bg-secondary p-1 text-xs font-bold"
                    role="group"
                    aria-label="切換回答方式"
                  >
                    <button
                      type="button"
                      onClick={() => setRecallMode("choice")}
                      className={`rounded-full px-2.5 py-1 ${recallMode === "choice" ? "bg-white shadow-sm" : ""}`}
                    >
                      選項
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecallMode("typed")}
                      className={`rounded-full px-2.5 py-1 ${recallMode === "typed" ? "bg-white shadow-sm" : ""}`}
                    >
                      自填
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  只留下座標「{scene.station}」和關鍵字「{mnemonic.pun}
                  」。先回想，再揭答案。
                </p>
                {stage === "recall" && recallMode === "typed" && (
                  <form
                    className="mt-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4"
                    onSubmit={event => {
                      event.preventDefault();
                      submitTyped();
                    }}
                  >
                    <label
                      htmlFor="element-typed-answer"
                      className="text-sm font-bold"
                    >
                      輸入元素符號、中文名、英文名或原子序
                    </label>
                    <div className="mt-2 flex flex-col sm:flex-row gap-2">
                      <input
                        id="element-typed-answer"
                        ref={typedInputRef}
                        value={typedAnswer}
                        onChange={event => setTypedAnswer(event.target.value)}
                        autoComplete="off"
                        autoCapitalize="off"
                        className="min-h-11 flex-1 rounded-lg border bg-white px-3 outline-none focus:ring-2 focus:ring-primary"
                        placeholder="例如：Fe、鐵、Iron 或 26"
                      />
                      <Button type="submit" disabled={!typedAnswer.trim()}>
                        確認回想
                      </Button>
                    </div>
                    <p className="text-xs mt-2 text-muted-foreground">
                      這一關會同時訓練「符號 ↔ 名稱 ↔ 原子序」的雙向提取。
                    </p>
                  </form>
                )}
                {stage === "recall" && recallMode === "choice" && (
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    {options.map((option, index) => {
                      const selected = answer === option.number;
                      const correct =
                        answer !== null && option.number === item.number;
                      return (
                        <button
                          key={option.number}
                          onClick={() => choose(option)}
                          disabled={stage !== "recall"}
                          className={`min-h-16 rounded-xl border-2 px-4 py-3 text-left font-bold transition ${correct ? "bg-emerald-100 border-emerald-500" : selected ? "bg-rose-100 border-rose-500" : "bg-white hover:border-primary hover:-translate-y-0.5"}`}
                        >
                          <span className="text-xs opacity-50 mr-2">
                            {index + 1}
                          </span>
                          <span className="text-lg">{option.symbol}</span>
                          <span className="mx-2 opacity-40">·</span>
                          {option.nameZh}
                          {correct && <Check className="inline w-4 ml-2" />}
                          {selected && !correct && (
                            <X className="inline w-4 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {stage === "feedback" && (
              <div
                className={`mt-5 rounded-xl p-4 ${correctAnswer ? "bg-emerald-50" : "bg-rose-50"}`}
              >
                <p className="font-bold">
                  {correctAnswer
                    ? `找回來了：${item.symbol} ${item.nameZh} 已蓋上記憶章。`
                    : `這一幕要找的是 ${item.symbol} ${item.nameZh}；把關鍵句再念一次。`}
                </p>
                {!correctAnswer && recallMode === "typed" && (
                  <p className="text-sm mt-1">
                    你的輸入：{typedAnswer || "未輸入"}
                  </p>
                )}
                <p className="text-sm mt-1">{mnemonic.recallLine}</p>
                <p className="text-xs mt-2 text-muted-foreground">
                  {correctAnswer
                    ? `下一次複習：${getDueLabel(progress[item.number])}`
                    : "這枚元素已排入待複習佇列，下一輪會優先回訪。"}
                </p>
                <Button onClick={next} className="mt-3 w-full">
                  下一站（Enter）
                </Button>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="paper-card p-5 element-route-card">
              <h3 className="font-display font-bold flex items-center gap-2">
                <MapPinned className="w-5 text-primary" /> 01–118 記憶座標法
              </h3>
              <p className="text-sm mt-3 leading-relaxed">
                01–99 以十位數對應校園區域、個位數固定道具；100–118
                使用科學館支線。先叫回場景，再把元素演員放上去。
              </p>
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm">
                <b>現在的門牌：</b>
                <br />
                {scene.station}
                <br />
                <span className="text-muted-foreground">
                  道具：{scene.object}
                </span>
              </div>
            </div>
            <div className="paper-card p-5">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Lightbulb className="w-5 text-primary" /> 你的記憶配方
              </h3>
              <p className="text-sm mt-3 leading-relaxed">
                {personalTip(profile, item)}
              </p>
              <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm">
                <b>這枚元素：</b> {getDueLabel(currentReview)}
                <br />
                <span className="text-muted-foreground">
                  正確 {currentReview?.correct || 0} 次 · 錯誤{" "}
                  {currentReview?.incorrect || 0} 次
                </span>
              </p>
              {(profile?.vark === "auditory" ||
                profile?.primaryTalent === "soundMimic") && (
                <Button
                  variant="outline"
                  onClick={speak}
                  className="mt-4 w-full"
                >
                  <Volume2 /> 聽一次故事線
                </Button>
              )}
              <Link href="/train/mrt/profile">
                <Button variant="ghost" size="sm" className="mt-2 w-full">
                  <Sparkles />{" "}
                  {profile
                    ? `${vark?.icon} ${vark?.name} × ${talent?.name}`
                    : "設定我的記憶模型"}
                </Button>
              </Link>
            </div>
            <div className="paper-card p-5">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Footprints className="w-5 text-primary" /> 本次路徑
              </h3>
              <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {routeMode === "walk"
                  ? `已走到 #${String(item.number).padStart(3, "0")}；每四站會回訪沒記牢的元素。`
                  : `弱點抽卡已準備 ${dueCount} 枚到期元素；答錯會立即回到佇列。`}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
                <div className="rounded-lg bg-slate-50 p-2">
                  <Trophy className="mx-auto w-4 text-amber-600" />
                  <b className="block">
                    {stats.correct}/{stats.total}
                  </b>
                  <span className="text-xs">本機答對</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <Target className="mx-auto w-4 text-teal-600" />
                  <b className="block">
                    {Math.round((masteredCount / pool.length) * 100)}%
                  </b>
                  <span className="text-xs">範圍熟練度</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setScore(0);
                  setCombo(0);
                  setRound(1);
                  setWrong([]);
                  beginAt(0);
                }}
                className="mt-2"
              >
                <RotateCcw /> 從第一張門牌重走
              </Button>
            </div>
          </aside>
        </div>

        <section className="mt-6 paper-card p-5 element-story-footer">
          <BookOpen className="text-primary" />
          <div>
            <p className="font-bold">故事不是標準答案；它是一把提取鑰匙。</p>
            <p className="text-sm text-muted-foreground mt-1">
              先用內建故事建立第一條路徑，再把畫面改成你更熟的校園、人物或冷笑話。你記得住、能在幾天後自己想起來的版本，才是有效版本。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
