import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Atom, BookOpen, Check, Flame, RotateCcw, Sparkles, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ELEMENTS, CATEGORY_STYLE, type ElementItem } from "@/lib/elementData";
import { loadMemoryProfile, TALENT_OPTIONS, VARK_OPTIONS, type MemoryProfile } from "@/lib/memoryProfile";

type Mode = "symbol" | "name" | "number";
type Level = 20 | 36 | 118;
type GameStats = { best: number; correct: number; total: number };
const STATS_KEY = "memodesk-element-stats-v1";

function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - .5); }
function getStats(): GameStats { try { return JSON.parse(localStorage.getItem(STATS_KEY) || "") } catch { return { best: 0, correct: 0, total: 0 } } }

function personalTip(profile: MemoryProfile | null, item: ElementItem) {
  if (!profile) return `把 ${item.number}、${item.symbol}、${item.nameZh} 唸成一組。`;
  if (profile.vark === "auditory" || profile.primaryTalent === "soundMimic") return `三拍唸：${item.number}・${item.symbol}・${item.nameZh}。`;
  if (profile.vark === "readWrite" || profile.primaryTalent === "textOrganizer") return `寫成一行：#${item.number}｜${item.symbol}｜${item.nameZh}。`;
  if (profile.vark === "kinesthetic" || profile.primaryTalent === "actionContext") return `用手指寫出 ${item.symbol}，再比出原子序 ${item.number}。`;
  if (profile.primaryTalent === "systemAccumulator") return `歸類到「${CATEGORY_STYLE[item.category].label}」，錯題稍後再出現。`;
  if (profile.primaryTalent === "creativeConnector") return `把 ${item.symbol} 變成一個誇張畫面，連到「${item.nameZh}」。`;
  if (profile.primaryTalent === "socialOutput") return `假裝教同學：為什麼 ${item.symbol} 就是 ${item.nameZh}？`;
  if (profile.primaryTalent === "businessApplier") return `限時 8 秒交付：#${item.number} ${item.symbol} ${item.nameZh}。`;
  return `把 ${item.symbol} 當成彩色門牌，貼在第 ${item.number} 號位置。`;
}

export default function ElementGame() {
  const [profile] = useState<MemoryProfile | null>(() => loadMemoryProfile());
  const [level, setLevel] = useState<Level>(20);
  const [mode, setMode] = useState<Mode>("symbol");
  const [current, setCurrent] = useState(0);
  const [options, setOptions] = useState<ElementItem[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [stats, setStats] = useState<GameStats>(() => getStats());
  const [wrong, setWrong] = useState<number[]>([]);
  const pool = useMemo(() => ELEMENTS.slice(0, level), [level]);
  const item = ELEMENTS[current];
  const vark = profile ? VARK_OPTIONS.find(x => x.id === profile.vark) : null;
  const talent = profile ? TALENT_OPTIONS.find(x => x.id === profile.primaryTalent) : null;

  function makeQuestion(preferred?: number) {
    const target = preferred ?? pool[Math.floor(Math.random() * pool.length)].number - 1;
    setCurrent(target); setAnswer(null);
    setOptions(shuffle([ELEMENTS[target], ...shuffle(pool.filter(x => x.number !== target + 1)).slice(0, 3)]));
  }
  useEffect(() => { makeQuestion(); }, [level, mode]);

  function choose(chosen: ElementItem) {
    if (answer !== null) return;
    const ok = chosen.number === item.number;
    setAnswer(chosen.number);
    const nextCombo = ok ? combo + 1 : 0;
    setCombo(nextCombo); if (ok) setScore(s => s + 100 + combo * 10); else setWrong(w => Array.from(new Set([...w, item.number])));
    const next = { best: Math.max(stats.best, nextCombo), correct: stats.correct + (ok ? 1 : 0), total: stats.total + 1 };
    setStats(next); localStorage.setItem(STATS_KEY, JSON.stringify(next));
  }
  function next() { setRound(r => r + 1); makeQuestion(wrong.length && round % 4 === 0 ? wrong[0] - 1 : undefined); }
  function speak() { if (!("speechSynthesis" in window)) return; speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(`${item.nameZh}，元素符號 ${item.symbol}，原子序 ${item.number}`)); }
  useEffect(() => { const onKey = (e: KeyboardEvent) => { const n = Number(e.key); if (answer === null && n >= 1 && n <= 4 && options[n - 1]) choose(options[n - 1]); if (answer !== null && (e.key === "Enter" || e.key === " ")) next(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [answer, options, item]);

  const prompt = mode === "symbol" ? item.symbol : mode === "name" ? item.nameZh : `# ${item.number}`;
  const optionText = (o: ElementItem) => mode === "symbol" ? `${o.nameZh} · ${o.nameEn}` : mode === "name" ? o.symbol : `${o.symbol} ${o.nameZh}`;

  return <div className="min-h-screen pb-16">
    <header className="border-b bg-[#FAF6EE]/90 backdrop-blur sticky top-0 z-20"><div className="container h-16 flex items-center justify-between">
      <Link href="/"><Button variant="ghost"><ArrowLeft /> 回首頁</Button></Link><div className="font-display font-extrabold flex items-center gap-2"><Atom className="text-primary" /> 元素記憶實驗室</div><div className="text-sm font-bold text-orange-700 flex items-center gap-1"><Flame className="w-4" /> {combo}</div>
    </div></header>
    <main className="container max-w-6xl pt-7">
      <section className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div><p className="font-hand text-2xl text-primary">VARK × 八大記憶天賦</p><h1 className="font-display font-extrabold text-3xl sm:text-4xl">把 118 個元素變成你的記憶隊伍</h1><p className="text-muted-foreground mt-2">看題、選答案、讀個人化提示；錯題會自動回鍋。</p></div>
        <Link href="/train/mrt/profile"><Button variant="outline"><Sparkles /> {profile ? `${vark?.icon} ${vark?.name} × ${talent?.name}` : "設定我的記憶模型"}</Button></Link>
      </section>
      <section className="paper-card p-4 mb-6 grid sm:grid-cols-3 gap-4">
        <label className="text-sm font-bold">元素範圍<select aria-label="元素範圍" value={level} onChange={e => setLevel(Number(e.target.value) as Level)} className="mt-2 w-full border rounded-lg bg-white px-3 py-2"><option value="20">新手村 · 1–20</option><option value="36">核心隊 · 1–36</option><option value="118">全週期 · 1–118</option></select></label>
        <label className="text-sm font-bold">題型<select aria-label="題型" value={mode} onChange={e => setMode(e.target.value as Mode)} className="mt-2 w-full border rounded-lg bg-white px-3 py-2"><option value="symbol">符號 → 名稱</option><option value="name">名稱 → 符號</option><option value="number">原子序 → 元素</option></select></label>
        <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-amber-50 p-2"><b className="block text-xl">{score}</b><span className="text-xs">本局分數</span></div><div className="rounded-lg bg-rose-50 p-2"><b className="block text-xl">{wrong.length}</b><span className="text-xs">待修錯題</span></div><div className="rounded-lg bg-teal-50 p-2"><b className="block text-xl">{stats.best}</b><span className="text-xs">最佳連擊</span></div></div>
      </section>
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <section className="paper-card p-5 sm:p-8 relative overflow-hidden">
          <div className="flex justify-between text-sm text-muted-foreground"><span>ROUND {round}</span><span>{CATEGORY_STYLE[item.category].label}</span></div>
          <div className={`mx-auto my-6 w-44 h-44 rounded-2xl border-2 flex flex-col items-center justify-center ${CATEGORY_STYLE[item.category].className}`}><span className="text-sm">{mode === "number" ? "原子序" : mode === "name" ? "元素名稱" : "元素符號"}</span><strong className="font-display text-6xl my-1">{prompt}</strong>{mode !== "number" && <span className="text-sm opacity-70">#{item.number}</span>}</div>
          <h2 className="font-display font-bold text-xl text-center mb-5">它對應哪一個答案？</h2>
          <div className="grid sm:grid-cols-2 gap-3">{options.map((o, i) => { const selected = answer === o.number; const correct = answer !== null && o.number === item.number; return <button key={o.number} onClick={() => choose(o)} disabled={answer !== null} className={`min-h-14 rounded-xl border-2 px-4 py-3 text-left font-bold transition ${correct ? "bg-emerald-100 border-emerald-500" : selected ? "bg-rose-100 border-rose-500" : "bg-white hover:border-primary hover:-translate-y-0.5"}`}><span className="text-xs opacity-50 mr-2">{i + 1}</span>{optionText(o)} {correct && <Check className="inline w-4" />}{selected && !correct && <X className="inline w-4" />}</button>})}</div>
          {answer !== null && <div className={`mt-5 rounded-xl p-4 ${answer === item.number ? "bg-emerald-50" : "bg-rose-50"}`}><p className="font-bold">{answer === item.number ? "答對了！記憶鍵已鎖定。" : `差一點，正解是 ${item.symbol} · ${item.nameZh}。`}</p><p className="text-sm mt-1">{personalTip(profile, item)}</p><Button onClick={next} className="mt-3 w-full">下一題（Enter）</Button></div>}
        </section>
        <aside className="space-y-4">
          <div className="paper-card p-5"><h3 className="font-display font-bold flex items-center gap-2"><BookOpen className="w-5 text-primary" /> 你的記憶配方</h3><p className="text-sm mt-3 leading-relaxed">{personalTip(profile, item)}</p>{(profile?.vark === "auditory" || profile?.primaryTalent === "soundMimic") && <Button variant="outline" onClick={speak} className="mt-4 w-full"><Volume2 /> 聽元素三拍</Button>}<p className="text-xs text-muted-foreground mt-3">動覺快捷鍵：1–4 作答，Enter 下一題。</p></div>
          <div className="paper-card p-5"><h3 className="font-display font-bold">本輪任務</h3><div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary transition-all" style={{width: `${Math.min(100, (round % 10 || 10) * 10)}%`}} /></div><p className="text-sm text-muted-foreground mt-2">每 10 題完成一個原子軌域；第 4 題會優先修復錯題。</p><Button variant="ghost" size="sm" onClick={() => { setScore(0); setCombo(0); setRound(1); setWrong([]); makeQuestion(); }} className="mt-2"><RotateCcw /> 重開本局</Button></div>
        </aside>
      </div>
    </main>
  </div>;
}
