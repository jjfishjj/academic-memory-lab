import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, GripVertical, Lightbulb, RotateCcw, Sparkles, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_STYLE, ELEMENTS, type ElementItem } from "@/lib/elementData";
import { loadElementProgress, recordElementAnswer } from "@/lib/elementProgress";
import { isCorrectPlacement, placementKey, selectPlacementRound } from "@/lib/elementPlacement";
import { CORE_FAMILIES, recordFamilyPlacement, type CoreFamily } from "@/lib/elementCourseProgress";

type GameMode = "smart" | "blank";
type RoundSize = 6 | 7 | 8 | 10 | 12;

function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - .5); }

export default function ElementPlacementGame() {
  const familyParam = new URLSearchParams(window.location.search).get("family") as CoreFamily | null;
  const courseFamily = familyParam && CORE_FAMILIES.includes(familyParam) ? familyParam : null;
  const availableElements = courseFamily ? ELEMENTS.filter((element)=>element.category===courseFamily) : ELEMENTS;
  const initialSize = (courseFamily ? availableElements.length : 10) as RoundSize;
  const [mode, setMode] = useState<GameMode>("smart");
  const [roundSize, setRoundSize] = useState<RoundSize>(initialSize);
  const [round, setRound] = useState(() => selectPlacementRound(availableElements, loadElementProgress(), initialSize));
  const [placed, setPlaced] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState("先選一張元素卡，再拖曳或點擊正確格子。");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const targets = useMemo(() => new Set(round.map(placementKey)), [round]);
  const completed = Object.keys(placed).length === round.length;
  const main = ELEMENTS.filter((element) => element.group !== null);
  const lanthanides = ELEMENTS.filter((element) => element.category === "lanthanide" && element.number !== 57);
  const actinides = ELEMENTS.filter((element) => element.category === "actinide" && element.number !== 89);
  const deck = useMemo(() => shuffle(round).filter((element) => !Object.values(placed).includes(element.number)), [round, placed]);

  function restart(nextMode = mode, nextSize = roundSize) {
    setMode(nextMode); setRoundSize(nextSize); setRound(selectPlacementRound(availableElements, loadElementProgress(), nextSize));
    setPlaced({}); setSelected(null); setMistakes(0); setStartedAt(Date.now()); setMessage("新一局開始：優先抽出錯題與待複習元素。");
  }
  useEffect(()=>{if(completed&&courseFamily)recordFamilyPlacement(courseFamily)},[completed,courseFamily]);

  function tryPlace(elementNumber: number, targetKey: string) {
    const element = ELEMENTS[elementNumber - 1];
    if (!element || placed[targetKey]) return;
    if (isCorrectPlacement(element, targetKey)) {
      setPlaced((previous) => ({ ...previous, [targetKey]: element.number })); setSelected(null);
      recordElementAnswer(element, true); setMessage(`答對！${element.symbol} 在第 ${element.period} 週期${element.group ? `第 ${element.group} 族` : "的內過渡元素列"}。`);
    } else {
      setMistakes((value) => value + 1); recordElementAnswer(element, false);
      setMessage(`位置不對：${element.symbol} 屬於第 ${element.period} 週期${element.group ? `第 ${element.group} 族` : `的${CATEGORY_STYLE[element.category].label}列`}。`);
    }
  }

  function drop(event: DragEvent, targetKey: string) {
    event.preventDefault(); tryPlace(Number(event.dataTransfer.getData("text/element-number")), targetKey);
  }

  function Slot({ element }: { element: ElementItem }) {
    const key = placementKey(element); const placedElement = placed[key] ? ELEMENTS[placed[key] - 1] : null; const isTarget = targets.has(key);
    const hint = mode === "smart" && !isTarget ? element.symbol : "";
    return <button disabled={Boolean(placedElement)} onClick={() => selected && tryPlace(selected, key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, key)} aria-label={`第 ${element.period} 週期${element.group ? `第 ${element.group} 族` : element.nameZh}放置格`} className={`min-w-[52px] min-h-[58px] rounded-lg border-2 border-dashed flex items-center justify-center text-xs transition ${placedElement ? `${CATEGORY_STYLE[placedElement.category].className} border-solid shadow-sm` : selected ? "border-primary/60 hover:bg-teal-50" : isTarget && mode === "smart" ? "border-amber-300 bg-amber-50/50" : "border-slate-200 bg-white/35"}`}>
      {placedElement ? <span><b className="font-display text-lg block">{placedElement.symbol}</b>{placedElement.nameZh}</span> : <span className="text-muted-foreground/40">{hint}</span>}
    </button>;
  }

  return <div className="min-h-screen pb-16 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,.10),transparent_32%)]">
    <header className="sticky top-0 z-30 border-b bg-[#FAF6EE]/90 backdrop-blur"><div className="container h-16 flex items-center justify-between"><Link href={courseFamily?`/elements/course?family=${courseFamily}`:"/periodic-table"}><Button variant="ghost" size="sm"><ArrowLeft/> {courseFamily?"族課程":"週期表"}</Button></Link><div className="font-display font-extrabold">{courseFamily?`${CATEGORY_STYLE[courseFamily].label}歸位` : "元素歸位挑戰"}</div><span className="text-sm font-bold text-primary">{Object.keys(placed).length}/{round.length}</span></div></header>
    <main className="container max-w-[1500px] pt-7">
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5"><div><p className="font-hand text-2xl text-primary">drag · place · remember</p><h1 className="font-display font-extrabold text-3xl sm:text-4xl">把元素送回它的週期座標</h1><p className="text-muted-foreground mt-2">電腦可拖曳；手機先點元素卡，再點目標格。</p></div><div className="flex flex-wrap gap-2"><Button variant={mode==="smart"?"default":"outline"} onClick={()=>restart("smart",roundSize)}><Lightbulb/> 智慧混合</Button><Button variant={mode==="blank"?"default":"outline"} onClick={()=>restart("blank",roundSize)}><Sparkles/> 空白挑戰</Button></div></section>

      <section className="paper-card p-4 mb-5 grid sm:grid-cols-[1fr_auto_auto] gap-3 items-center"><p className={`text-sm font-bold ${message.startsWith("位置不對")?"text-rose-700":"text-foreground"}`}>{message}</p>{courseFamily?<span className="text-sm">本族全部 {round.length} 張</span>:<label className="text-sm">每局 <select value={roundSize} onChange={(event)=>restart(mode,Number(event.target.value) as RoundSize)} className="border rounded-lg bg-white px-2 py-1"><option value="8">8 張</option><option value="10">10 張</option><option value="12">12 張</option></select></label>}<span className="text-sm text-muted-foreground">錯放 {mistakes} 次</span></section>

      <section className="paper-card p-4 mb-5"><div className="flex items-center gap-2 mb-3"><GripVertical className="w-4 text-primary"/><h2 className="font-display font-bold">待歸位元素卡</h2></div>{deck.length ? <div className="flex flex-wrap gap-2">{deck.map((element)=><button draggable onDragStart={(event)=>event.dataTransfer.setData("text/element-number",String(element.number))} onClick={()=>setSelected(selected===element.number?null:element.number)} key={element.number} className={`rounded-xl border-2 px-3 py-2 flex items-center gap-2 ${CATEGORY_STYLE[element.category].className} ${selected===element.number?"ring-4 ring-primary -translate-y-1":"hover:-translate-y-1"}`}><span className="text-xs opacity-60">#{element.number}</span><b className="font-display text-xl">{element.symbol}</b><span>{element.nameZh}</span></button>)}</div> : <p className="text-emerald-700 font-bold">所有元素都已歸位！</p>}</section>

      <section className="paper-card p-3 sm:p-5 overflow-x-auto"><div className="min-w-[1050px]"><div className="grid grid-cols-[28px_repeat(18,minmax(52px,1fr))] gap-1 mb-1"><span/>{Array.from({length:18},(_,index)=><span key={index} className="text-center text-xs text-muted-foreground">{index+1}</span>)}</div><div className="grid grid-cols-[28px_repeat(18,minmax(52px,1fr))] grid-rows-7 gap-1">{Array.from({length:7},(_,index)=><span key={index} style={{gridRow:index+1,gridColumn:1}} className="self-center text-center text-xs text-muted-foreground">{index+1}</span>)}{main.map((element)=><div key={element.number} style={{gridRow:element.period,gridColumn:(element.group||0)+1}}><Slot element={element}/></div>)}</div>
        <div className="mt-5 space-y-1"><div className="grid grid-cols-[100px_repeat(14,minmax(52px,1fr))] gap-1"><span className="text-xs self-center text-right pr-2">鑭系</span>{lanthanides.map((element)=><Slot key={element.number} element={element}/>)}</div><div className="grid grid-cols-[100px_repeat(14,minmax(52px,1fr))] gap-1"><span className="text-xs self-center text-right pr-2">錒系</span>{actinides.map((element)=><Slot key={element.number} element={element}/>)}</div></div></div></section>

      {completed && <section className="paper-card mt-5 p-7 text-center border-emerald-300"><CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto"/><h2 className="font-display font-extrabold text-3xl mt-2">歸位完成！</h2><p className="text-muted-foreground mt-2 flex items-center justify-center gap-4"><span><Timer className="w-4 inline"/> {Math.max(1,Math.round((Date.now()-startedAt)/1000))} 秒</span><span><Trophy className="w-4 inline"/> 錯放 {mistakes} 次</span></p><div className="flex flex-wrap justify-center gap-3 mt-5"><Button variant="outline" onClick={()=>restart()}><RotateCcw/> 再玩一局</Button>{courseFamily?<Link href={`/elements/course?family=${courseFamily}`}><Button>返回課程蓋章</Button></Link>:mode==="smart"&&<Button onClick={()=>restart("blank",roundSize)}>進入空白挑戰</Button>}</div></section>}
    </main>
  </div>;
}
