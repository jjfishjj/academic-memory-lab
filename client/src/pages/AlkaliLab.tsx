import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Atom, CheckCircle2, Eye, Hand, Headphones, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ELEMENTS, type ElementItem } from "@/lib/elementData";
import { loadMemoryProfile, TALENT_OPTIONS, VARK_OPTIONS } from "@/lib/memoryProfile";

const ALKALI = ELEMENTS.filter((element) => element.category === "alkali");
const MEMORY_LINE = "鋰鈉鉀銣銫鍅，從上到下反應變大";

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = "zh-TW";
  voice.rate = 0.82;
  speechSynthesis.speak(voice);
}

function VisualColumn({ active }: { active: number | null }) {
  const periods = ["H", "Li", "Na", "K", "Rb", "Cs", "Fr"];
  return <div className="grid grid-cols-[42px_1fr] gap-2 max-w-[210px] mx-auto" aria-label="週期表第一族直欄">
    {periods.map((symbol, index) => <div key={symbol} className="contents">
      <span className="text-xs text-muted-foreground self-center text-right">第 {index + 1} 週期</span>
      <div className={`rounded-lg border-2 p-2 text-center transition-all ${index === 0 ? "bg-emerald-50 border-emerald-200" : active === index - 1 ? "bg-rose-200 border-rose-500 scale-105 shadow-md" : "bg-rose-50 border-rose-200"}`}>
        <b className="font-display text-xl">{symbol}</b>
      </div>
    </div>)}
  </div>;
}

export default function AlkaliLab() {
  const [profile] = useState(() => loadMemoryProfile());
  const [selected, setSelected] = useState(0);
  const [quiz, setQuiz] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [complete, setComplete] = useState(false);
  const current = ALKALI[selected];
  const question = ALKALI[quiz % ALKALI.length];
  const options = useMemo(() => [question, ALKALI[(quiz + 2) % 6], ALKALI[(quiz + 4) % 6]].sort((a, b) => a.number - b.number), [quiz, question]);
  const vark = profile ? VARK_OPTIONS.find((item) => item.id === profile.vark) : null;
  const talent = profile ? TALENT_OPTIONS.find((item) => item.id === profile.primaryTalent) : null;

  function choose(item: ElementItem) {
    if (answer !== null) return;
    setAnswer(item.number);
    if (item.number === question.number) setCorrect((value) => value + 1);
  }
  function next() {
    if (quiz === 5) { setComplete(true); return; }
    setQuiz((value) => value + 1); setAnswer(null);
  }
  useEffect(() => { setSelected(quiz % ALKALI.length); }, [quiz]);

  return <div className="min-h-screen pb-16 bg-[radial-gradient(circle_at_top_right,rgba(251,113,133,.13),transparent_38%)]">
    <header className="sticky top-0 z-20 border-b bg-[#FAF6EE]/90 backdrop-blur"><div className="container h-16 flex items-center justify-between gap-3">
      <Link href="/"><Button variant="ghost" size="sm"><ArrowLeft /> 首頁</Button></Link>
      <div className="font-display font-extrabold flex items-center gap-2"><Atom className="text-rose-600" /> 第 1 族記憶任務</div>
      <Link href="/train/elements"><Button variant="outline" size="sm" className="hidden sm:flex">全週期挑戰 <ArrowRight /></Button></Link>
    </div></header>

    <main className="container max-w-6xl pt-8">
      <section className="grid lg:grid-cols-[1.2fr_.8fr] items-center gap-8 mb-10">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-rose-100 text-rose-800 px-3 py-1 text-sm font-bold mb-4">ALKALI METALS · 鹼金屬</div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">先攻下一直欄，<br/><span className="text-rose-600">再征服整張週期表。</span></h1>
          <p className="text-lg text-muted-foreground leading-relaxed mt-4 max-w-2xl">第 1 族像一支個性逐漸火爆的隊伍：由上往下原子越大，和水的反應通常越劇烈。用位置、聲音、文字與動作一次記住六個鹼金屬。</p>
          <div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => document.getElementById("learn")?.scrollIntoView({behavior:"smooth"})}><Sparkles /> 開始 5 分鐘任務</Button><Button variant="outline" onClick={() => speak(MEMORY_LINE)}><Volume2 /> 播放口訣</Button></div>
          <p className="mt-4 text-sm text-muted-foreground">你的模式：{profile ? `${vark?.icon} ${vark?.name} × ${talent?.icon} ${talent?.name}` : "尚未設定，先以混合模式體驗"}</p>
        </div>
        <div className="paper-card p-6 relative"><div className="washi washi-pink"/><p className="font-hand text-2xl text-rose-600 text-center mb-3">Group 1 · top to bottom</p><VisualColumn active={selected} /><p className="text-xs text-center text-muted-foreground mt-3">氫位於第一族，但不是鹼金屬。</p></div>
      </section>

      <section id="learn" className="scroll-mt-24 mb-10"><div className="flex items-end justify-between gap-3 mb-5"><div><p className="font-hand text-2xl text-primary">step 1 · build the chain</p><h2 className="font-display font-extrabold text-3xl">六張元素卡，串成一條直線</h2></div><span className="text-sm text-muted-foreground">點卡片探索</span></div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">{ALKALI.map((element, index) => <button key={element.number} onClick={() => setSelected(index)} className={`rounded-xl border-2 p-3 min-h-32 text-left transition-all ${selected === index ? "bg-rose-100 border-rose-500 -translate-y-2 shadow-lg" : "bg-white border-rose-100 hover:border-rose-300"}`}><span className="text-xs opacity-60">#{element.number}</span><strong className="block font-display text-4xl text-rose-700 my-1">{element.symbol}</strong><b>{element.nameZh}</b><span className="block text-[11px] text-muted-foreground truncate">{element.nameEn}</span></button>)}</div>
        <div className="paper-card mt-5 p-5 grid md:grid-cols-[1fr_auto] gap-4 items-center"><div><p className="text-sm text-muted-foreground">目前元素</p><h3 className="font-display text-2xl font-extrabold">#{current.number} {current.symbol} · {current.nameZh}</h3><p className="mt-2">位置鉤子：第 {selected + 2} 週期、第 1 族；把它接在「{selected === 0 ? "氫" : ALKALI[selected - 1].nameZh}」的下一格。</p></div><Button variant="outline" onClick={() => speak(`${current.nameZh}，元素符號 ${current.symbol}，原子序 ${current.number}`)}><Headphones /> 聽元素卡</Button></div>
      </section>

      <section className="mb-10"><p className="font-hand text-2xl text-primary">step 2 · your VARK recipe</p><h2 className="font-display font-extrabold text-3xl mb-5">四種入口，同一個提取目標</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[
          {icon:<Eye/>, title:"視覺 Visual", text:"盯著粉紅第一族直欄，由上往下指：Li → Na → K → Rb → Cs → Fr。"},
          {icon:<Headphones/>, title:"聽覺 Auditory", text:`唸三次：「${MEMORY_LINE}」。第三次遮住文字。`},
          {icon:<span className="font-bold">Aa</span>, title:"讀寫 Read/Write", text:"寫兩欄：符號 Li Na K Rb Cs Fr；中文 鋰鈉鉀銣銫鍅。"},
          {icon:<Hand/>, title:"動覺 Kinesthetic", text:"手由高往低點六下；越往下動作越大，代表反應性增強。"},
        ].map((card) => <article key={card.title} className="paper-card p-5"><div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-3">{card.icon}</div><h3 className="font-display font-bold">{card.title}</h3><p className="text-sm text-muted-foreground leading-relaxed mt-2">{card.text}</p></article>)}</div>
      </section>

      <section className="paper-card p-5 sm:p-8"><div className="flex items-center justify-between gap-3"><div><p className="font-hand text-2xl text-primary">step 3 · active recall</p><h2 className="font-display font-extrabold text-3xl">關提示，六題驗收</h2></div><span className="font-display font-bold text-xl text-rose-600">{correct} / 6</span></div>
        {!complete ? <div className="mt-6"><p className="text-sm text-muted-foreground">QUESTION {quiz + 1} / 6</p><div className="my-5 text-center"><span className="text-sm">哪個元素的符號是</span><strong className="block font-display text-7xl text-rose-700">{question.symbol}</strong></div><div className="grid sm:grid-cols-3 gap-3">{options.map((option) => { const isCorrect = answer !== null && option.number === question.number; const isWrong = answer === option.number && option.number !== question.number; return <button key={option.number} disabled={answer !== null} onClick={() => choose(option)} className={`rounded-xl border-2 p-4 font-bold ${isCorrect ? "bg-emerald-100 border-emerald-500" : isWrong ? "bg-rose-100 border-rose-500" : "bg-white hover:border-rose-400"}`}>{option.nameZh} · #{option.number}</button>})}</div>{answer !== null && <div className="mt-5 rounded-xl bg-secondary p-4"><p className="font-bold">{answer === question.number ? "答對！" : `正解是 ${question.nameZh}。`} <span className="font-normal">請說完整：#{question.number} {question.symbol} {question.nameZh}。</span></p><Button className="mt-3 w-full" onClick={next}>{quiz === 5 ? "查看結果" : "下一題"}</Button></div>}</div> : <div className="text-center py-10"><CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto"/><h3 className="font-display font-extrabold text-3xl mt-3">第一族任務完成</h3><p className="text-muted-foreground mt-2">你答對 {correct} / 6 題。現在把這條直欄帶進全週期表。</p><div className="flex flex-wrap justify-center gap-3 mt-5"><Button variant="outline" onClick={() => {setQuiz(0);setAnswer(null);setCorrect(0);setComplete(false)}}><RotateCcw /> 再練一次</Button><Link href="/train/elements"><Button>挑戰 118 元素 <ArrowRight /></Button></Link></div></div>}
      </section>
    </main>
  </div>;
}
