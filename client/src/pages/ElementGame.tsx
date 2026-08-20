/**
 * MemoDesk Scrapbook Academia — 元素記憶步行：黃色情境索引＋粉色故事演出，
 * 將原子序號、諧音與畫面串成可走訪的校園案卷，而非單純配對題庫。
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Atom,
  BookOpen,
  Check,
  EyeOff,
  Flame,
  Footprints,
  Lightbulb,
  MapPinned,
  RotateCcw,
  Sparkles,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_STYLE, ELEMENTS, type ElementItem } from "@/lib/elementData";
import { getElementMnemonic, getNumberScene, getStoryChapter } from "@/lib/elementMemory";
import { loadMemoryProfile, TALENT_OPTIONS, VARK_OPTIONS, type MemoryProfile } from "@/lib/memoryProfile";

type Level = 20 | 36 | 118;
type RouteMode = "walk" | "draw";
type Stage = "link" | "recall" | "feedback";
type GameStats = { best: number; correct: number; total: number; seen: number[] };
const STATS_KEY = "memodesk-element-stats-v2";

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getStats(): GameStats {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) || "") as Partial<GameStats>;
    return { best: parsed.best || 0, correct: parsed.correct || 0, total: parsed.total || 0, seen: parsed.seen || [] };
  } catch {
    return { best: 0, correct: 0, total: 0, seen: [] };
  }
}

function personalTip(profile: MemoryProfile | null, item: ElementItem) {
  const mnemonic = getElementMnemonic(item);
  if (!profile) return `先說「${mnemonic.numberImage}」，再把 ${mnemonic.pun} 畫面接上 ${item.symbol}。`;
  if (profile.vark === "auditory" || profile.primaryTalent === "soundMimic") return `用三拍複述：「${item.number}・${mnemonic.pun}・${item.symbol}」；最後說一次 ${mnemonic.recallLine}`;
  if (profile.vark === "readWrite" || profile.primaryTalent === "textOrganizer") return `在手帳寫一行：「#${item.number}｜${mnemonic.pun}｜${item.symbol} ${item.nameZh}」。`;
  if (profile.vark === "kinesthetic" || profile.primaryTalent === "actionContext") return `先比出 ${mnemonic.numberImage} 的姿勢，再用手指畫 ${item.symbol}，讓動作接住畫面。`;
  if (profile.primaryTalent === "creativeConnector") return `把「${mnemonic.visual}」再誇張三倍；越荒謬越容易在提取時跳出 ${item.symbol}。`;
  return `不要背表格：沿著 ${getNumberScene(item.number).station}，看見 ${mnemonic.numberImage} 就回想 ${item.symbol}。`;
}

export default function ElementGame() {
  const [profile] = useState<MemoryProfile | null>(() => loadMemoryProfile());
  const [level, setLevel] = useState<Level>(20);
  const [routeMode, setRouteMode] = useState<RouteMode>("walk");
  const [position, setPosition] = useState(0);
  const [options, setOptions] = useState<ElementItem[]>([]);
  const [stage, setStage] = useState<Stage>("link");
  const [answer, setAnswer] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [stats, setStats] = useState<GameStats>(() => getStats());
  const [wrong, setWrong] = useState<number[]>([]);
  const pool = useMemo(() => ELEMENTS.slice(0, level), [level]);
  const item = pool[Math.min(position, pool.length - 1)] || ELEMENTS[0];
  const mnemonic = getElementMnemonic(item);
  const scene = getNumberScene(item.number);
  const vark = profile ? VARK_OPTIONS.find((entry) => entry.id === profile.vark) : null;
  const talent = profile ? TALENT_OPTIONS.find((entry) => entry.id === profile.primaryTalent) : null;

  function prepareOptions(target: ElementItem) {
    setOptions(shuffle([target, ...shuffle(pool.filter((candidate) => candidate.number !== target.number)).slice(0, 3)]));
  }

  function beginAt(nextPosition: number) {
    const safePosition = Math.max(0, Math.min(pool.length - 1, nextPosition));
    setPosition(safePosition);
    setStage("link");
    setAnswer(null);
    prepareOptions(pool[safePosition]);
  }

  useEffect(() => {
    setPosition(0);
    setRound(1);
    setStage("link");
    setAnswer(null);
    prepareOptions(pool[0]);
    // pool changes only when user intentionally changes level
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  function beginRecall() {
    setStage("recall");
    setAnswer(null);
    prepareOptions(item);
  }

  function choose(chosen: ElementItem) {
    if (stage !== "recall" || answer !== null) return;
    const ok = chosen.number === item.number;
    setAnswer(chosen.number);
    setStage("feedback");
    const nextCombo = ok ? combo + 1 : 0;
    const nextStats = {
      best: Math.max(stats.best, nextCombo),
      correct: stats.correct + (ok ? 1 : 0),
      total: stats.total + 1,
      seen: Array.from(new Set([...stats.seen, item.number])),
    };
    setCombo(nextCombo);
    setScore((currentScore) => currentScore + (ok ? 120 + combo * 15 : 20));
    if (!ok) setWrong((items) => Array.from(new Set([...items, item.number])));
    setStats(nextStats);
    localStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
  }

  function next() {
    setRound((currentRound) => currentRound + 1);
    const shouldRepair = wrong.length > 0 && round % 4 === 0;
    if (shouldRepair) {
      const repairNumber = wrong[0];
      setWrong((items) => items.filter((number) => number !== repairNumber));
      beginAt(repairNumber - 1);
      return;
    }
    if (routeMode === "walk") {
      beginAt((position + 1) % pool.length);
      return;
    }
    beginAt(Math.floor(Math.random() * pool.length));
  }

  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${mnemonic.recallLine}。元素符號 ${item.symbol}，${item.nameZh}。`));
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const optionIndex = Number(event.key) - 1;
      if (stage === "recall" && optionIndex >= 0 && optionIndex <= 3 && options[optionIndex]) choose(options[optionIndex]);
      if (stage === "link" && (event.key === "Enter" || event.key === " ")) beginRecall();
      if (stage === "feedback" && (event.key === "Enter" || event.key === " ")) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, options, item, round, wrong, routeMode, position, pool]);

  const progress = routeMode === "walk" ? Math.round(((position + 1) / pool.length) * 100) : Math.min(100, Math.round((round / 10) * 100));
  const correctAnswer = answer === item.number;

  return (
    <div className="min-h-screen pb-16 element-memory-page">
      <header className="border-b bg-[#FAF6EE]/90 backdrop-blur sticky top-0 z-20">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/"><Button variant="ghost"><ArrowLeft /> 回首頁</Button></Link>
          <div className="font-display font-extrabold flex items-center gap-2"><Atom className="text-primary" /> 元素記憶實驗室</div>
          <div className="text-sm font-bold text-orange-700 flex items-center gap-1"><Flame className="w-4" /> {combo}</div>
        </div>
      </header>

      <main className="container max-w-6xl pt-7">
        <section className="element-case-hero mb-6 relative overflow-hidden">
          <div className="element-clip" aria-hidden="true">MemoDesk 化學社</div>
          <div className="relative z-10 max-w-3xl">
            <p className="font-hand text-2xl text-primary">01–99 記憶軌道 × 元素諧音劇場</p>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl">別背週期表，帶元素走一趟校園故事。</h1>
            <p className="text-muted-foreground mt-2 leading-relaxed">每一號都有固定的校園座標；把序號物件、中文諧音和元素符號黏成一幕戲。先看故事，再把提示遮住提取——這才是能帶走的記憶路徑。</p>
          </div>
          <div className="element-route-stamp" aria-label="記憶任務步驟"><span>01</span><i /> <span>諧音</span><i /> <span>提取</span></div>
        </section>

        <section className="paper-card p-4 mb-6 grid md:grid-cols-[1fr_1fr_auto] gap-4 element-control-sheet">
          <label className="text-sm font-bold">元素軌道範圍
            <select aria-label="元素軌道範圍" value={level} onChange={(event) => setLevel(Number(event.target.value) as Level)} className="mt-2 w-full border rounded-lg bg-white px-3 py-2">
              <option value="20">校園序章 · 01–20（完整諧音故事）</option>
              <option value="36">核心隊 · 01–36（故事路徑延伸）</option>
              <option value="118">全週期 · 01–118（01–99 記憶座標）</option>
            </select>
          </label>
          <label className="text-sm font-bold">走訪方式
            <select aria-label="走訪方式" value={routeMode} onChange={(event) => { const nextMode = event.target.value as RouteMode; setRouteMode(nextMode); beginAt(nextMode === "walk" ? 0 : Math.floor(Math.random() * pool.length)); }} className="mt-2 w-full border rounded-lg bg-white px-3 py-2">
              <option value="walk">故事步行 · 依序串起一段劇情</option>
              <option value="draw">抽卡複習 · 隨機回訪校園座標</option>
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2 text-center self-end">
            <div className="rounded-lg bg-amber-50 p-2"><b className="block text-xl">{score}</b><span className="text-xs">旅程分數</span></div>
            <div className="rounded-lg bg-rose-50 p-2"><b className="block text-xl">{wrong.length}</b><span className="text-xs">待重訪</span></div>
            <div className="rounded-lg bg-teal-50 p-2"><b className="block text-xl">{stats.seen.length}</b><span className="text-xs">已收元素</span></div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <section className="paper-card p-5 sm:p-8 relative overflow-hidden element-story-dossier">
            <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
              <span className="element-index-tab">{getStoryChapter(item.number)}</span>
              <span>{CATEGORY_STYLE[item.category].label} · 第 {round} 次走訪</span>
            </div>

            <div className="grid sm:grid-cols-[180px_1fr] gap-5 items-center mt-6">
              <div className={`element-tile mx-auto ${CATEGORY_STYLE[item.category].className}`}>
                <span className="text-xs tracking-widest">原子座標</span>
                <strong className="font-display text-6xl my-1">{String(item.number).padStart(2, "0")}</strong>
                <span className="text-sm opacity-70">{scene.station}</span>
              </div>
              <div>
                <p className="font-hand text-2xl text-primary">{mnemonic.numberImage}</p>
                <h2 className="font-display font-bold text-2xl mt-1">先把「{mnemonic.pun}」黏到 {item.symbol}。</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{mnemonic.visual}</p>
                <div className="element-story-strip mt-4"><WandSparkles className="w-5" /><span>{mnemonic.storyBeat}</span></div>
              </div>
            </div>

            {stage === "link" && (
              <div className="mt-7 element-link-card">
                <div><p className="font-bold">把這句複述一次：</p><p className="text-lg mt-1">「{mnemonic.recallLine}」</p></div>
                <Button onClick={beginRecall} className="mt-4"><EyeOff /> 遮住聯想，開始提取</Button>
                <p className="text-xs mt-3 text-muted-foreground">鍵盤 Enter 也可以直接進入提取。</p>
              </div>
            )}

            {stage !== "link" && (
              <div className="mt-7">
                <div className="flex items-center gap-2 font-display font-bold text-xl"><EyeOff className="text-primary" /> 提取時刻：這一幕指向哪個元素？</div>
                <p className="text-sm text-muted-foreground mt-1">只留下座標「{scene.station}」和關鍵字「{mnemonic.pun}」。選出你要找回的元素。</p>
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {options.map((option, index) => {
                    const selected = answer === option.number;
                    const correct = answer !== null && option.number === item.number;
                    return (
                      <button key={option.number} onClick={() => choose(option)} disabled={stage !== "recall"} className={`min-h-16 rounded-xl border-2 px-4 py-3 text-left font-bold transition ${correct ? "bg-emerald-100 border-emerald-500" : selected ? "bg-rose-100 border-rose-500" : "bg-white hover:border-primary hover:-translate-y-0.5"}`}>
                        <span className="text-xs opacity-50 mr-2">{index + 1}</span>
                        <span className="text-lg">{option.symbol}</span><span className="mx-2 opacity-40">·</span>{option.nameZh}
                        {correct && <Check className="inline w-4 ml-2" />}{selected && !correct && <X className="inline w-4 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {stage === "feedback" && (
              <div className={`mt-5 rounded-xl p-4 ${correctAnswer ? "bg-emerald-50" : "bg-rose-50"}`}>
                <p className="font-bold">{correctAnswer ? `找回來了：${item.symbol} ${item.nameZh} 已蓋上記憶章。` : `這一幕要找的是 ${item.symbol} ${item.nameZh}；把關鍵句再念一次。`}</p>
                <p className="text-sm mt-1">{mnemonic.recallLine}</p>
                <Button onClick={next} className="mt-3 w-full">下一站（Enter）</Button>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="paper-card p-5 element-route-card">
              <h3 className="font-display font-bold flex items-center gap-2"><MapPinned className="w-5 text-primary" /> 01–99 校園座標法</h3>
              <p className="text-sm mt-3 leading-relaxed">十位數決定校園區域，個位數決定固定道具。走到同一個號碼，就能先叫回相同的場景，再把元素演員放上去。</p>
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm"><b>現在的門牌：</b><br />{scene.station}<br /><span className="text-muted-foreground">道具：{scene.object}</span></div>
            </div>
            <div className="paper-card p-5">
              <h3 className="font-display font-bold flex items-center gap-2"><Lightbulb className="w-5 text-primary" /> 你的記憶配方</h3>
              <p className="text-sm mt-3 leading-relaxed">{personalTip(profile, item)}</p>
              {(profile?.vark === "auditory" || profile?.primaryTalent === "soundMimic") && <Button variant="outline" onClick={speak} className="mt-4 w-full"><Volume2 /> 聽一次故事線</Button>}
              <Link href="/train/mrt/profile"><Button variant="ghost" size="sm" className="mt-2 w-full"><Sparkles /> {profile ? `${vark?.icon} ${vark?.name} × ${talent?.name}` : "設定我的記憶模型"}</Button></Link>
            </div>
            <div className="paper-card p-5">
              <h3 className="font-display font-bold flex items-center gap-2"><Footprints className="w-5 text-primary" /> 本次路徑</h3>
              <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="text-sm text-muted-foreground mt-2">{routeMode === "walk" ? `已走到 #${String(item.number).padStart(2, "0")}；每四站會回訪一枚沒記牢的元素。` : "抽卡模式會把錯誤元素優先放回下一輪故事。"}</p>
              <Button variant="ghost" size="sm" onClick={() => { setScore(0); setCombo(0); setRound(1); setWrong([]); beginAt(0); }} className="mt-2"><RotateCcw /> 從第一張門牌重走</Button>
            </div>
          </aside>
        </div>

        <section className="mt-6 paper-card p-5 element-story-footer">
          <BookOpen className="text-primary" /><div><p className="font-bold">故事不是標準答案；它是一把提取鑰匙。</p><p className="text-sm text-muted-foreground mt-1">先用內建諧音走過 1–20，再把畫面改成你更熟的校園、人物或冷笑話。你記得住的版本，才是有效版本。</p></div>
        </section>
      </main>
    </div>
  );
}
