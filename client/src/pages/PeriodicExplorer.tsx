import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, Atom, Brain, ChevronLeft, ChevronRight, Eye, FlaskConical, Image as ImageIcon, Play, RotateCcw, Route, Search, Sparkles, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_STYLE, ELEMENTS, type ElementCategory, type ElementItem } from "@/lib/elementData";
import { getElementGuideLabel, getElementGuideSequence, GROUP_GUIDE_NAMES, type ElementGuideType } from "@/lib/elementGuide";
import { getElementMemoryTip } from "@/lib/elementMemoryTips";
import { loadMemoryProfile, TALENT_OPTIONS, VARK_OPTIONS, type MemoryProfile } from "@/lib/memoryProfile";
import { getMasteryStatus, loadElementProgress, summarizeElementProgress, type ElementProgress, type MasteryStatus } from "@/lib/elementProgress";

const MASTERY_STYLE: Record<MasteryStatus, { label: string; marker: string; ring: string }> = {
  unseen: { label: "未學", marker: "bg-slate-300", ring: "" },
  learning: { label: "學習中", marker: "bg-amber-500", ring: "ring-2 ring-amber-400" },
  mastered: { label: "已熟練", marker: "bg-emerald-500", ring: "ring-2 ring-emerald-500" },
  due: { label: "待複習", marker: "bg-rose-500", ring: "ring-2 ring-rose-500 animate-pulse" },
};

function memoryHook(profile: MemoryProfile | null, element: ElementItem) {
  const position = element.group ? `第 ${element.period} 週期、第 ${element.group} 族` : `第 ${element.period} 週期的 ${CATEGORY_STYLE[element.category].label}`;
  if (!profile) return `把 #${element.number}、${element.symbol}、${element.nameZh} 和「${position}」綁成一組。`;
  if (profile.vark === "auditory" || profile.primaryTalent === "soundMimic") return `四拍唸：${element.number}・${element.symbol}・${element.nameZh}・第 ${element.period} 週期。`;
  if (profile.vark === "readWrite" || profile.primaryTalent === "textOrganizer") return `寫一列：#${element.number}｜${element.symbol}｜${element.nameZh}｜${position}。`;
  if (profile.vark === "kinesthetic" || profile.primaryTalent === "actionContext") return `先橫走到第 ${element.period} 週期，再直指${element.group ? `第 ${element.group} 族` : "下方元素列"}，最後用手寫 ${element.symbol}。`;
  if (profile.primaryTalent === "creativeConnector") return `把「${element.nameZh}」變成誇張角色，住在 ${position} 的 ${element.symbol} 房間。`;
  if (profile.primaryTalent === "systemAccumulator") return `先歸入「${CATEGORY_STYLE[element.category].label}」，再記座標：${position}。`;
  if (profile.primaryTalent === "socialOutput") return `用 20 秒教別人：${element.symbol} 是 ${element.nameZh}，位於${position}。`;
  if (profile.primaryTalent === "businessApplier") return `8 秒交付元素名片：#${element.number} ${element.symbol} ${element.nameZh}，${position}。`;
  return `把 ${element.symbol} 當成彩色門牌，貼在${position}。`;
}

function speak(element: ElementItem) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`${element.nameZh}，元素符號 ${element.symbol}，原子序 ${element.number}，第 ${element.period} 週期${element.group ? `，第 ${element.group} 族` : ""}`);
  utterance.lang = "zh-TW"; utterance.rate = .85; speechSynthesis.speak(utterance);
}

function ElementCell({ element, selected, muted, mastery, onClick }: { element: ElementItem; selected: boolean; muted: boolean; mastery: MasteryStatus; onClick: () => void }) {
  const style = CATEGORY_STYLE[element.category];
  return <button onClick={onClick} aria-label={`${element.nameZh} ${element.symbol} 原子序 ${element.number} ${MASTERY_STYLE[mastery].label}`} className={`relative min-w-[54px] min-h-[66px] rounded-lg border p-1 text-left transition-all ${style.className} ${selected ? "ring-4 ring-primary scale-105 z-10 shadow-lg" : `${MASTERY_STYLE[mastery].ring} hover:-translate-y-1 hover:shadow-md`} ${muted ? "opacity-20 grayscale" : ""}`}>
    <span className={`absolute right-1 top-1 w-2 h-2 rounded-full ${MASTERY_STYLE[mastery].marker}`} title={MASTERY_STYLE[mastery].label}/><span className="block text-[10px] leading-none opacity-70">{element.number}</span><strong className="block font-display text-xl leading-tight text-center">{element.symbol}</strong><span className="block text-[10px] text-center truncate">{element.nameZh}</span>
  </button>;
}

function ElementDetails({ selected, profile, progress, onClose }: { selected: ElementItem; profile: MemoryProfile | null; progress: ElementProgress; onClose?: () => void }) {
  const mastery = getMasteryStatus(progress.elements[String(selected.number)]);
  const record = progress.elements[String(selected.number)];
  const authoredTip = getElementMemoryTip(selected.number);
  return <div className="relative">{onClose && <button type="button" onClick={onClose} aria-label="關閉元素詳情" className="absolute right-0 top-0 z-10 rounded-full border bg-background p-2"><X className="h-5 w-5" /></button>}<div className={`rounded-2xl border-2 p-5 ${CATEGORY_STYLE[selected.category].className}`}><div className="flex justify-between pr-10"><span className="text-sm">原子序 {selected.number}</span><span className="rounded-full bg-white/60 px-2 py-1 text-xs">{CATEGORY_STYLE[selected.category].label}</span></div><strong className="my-2 block text-center font-display text-7xl">{selected.symbol}</strong><h2 className="text-center font-display text-2xl font-extrabold">{selected.nameZh}</h2><p className="text-center text-sm opacity-70">{selected.nameEn}</p></div>
    <dl className="mt-4 grid grid-cols-3 gap-2 text-sm"><div className="rounded-lg bg-secondary p-3"><dt className="text-muted-foreground">週期</dt><dd className="font-bold">第 {selected.period} 週期</dd></div><div className="rounded-lg bg-secondary p-3"><dt className="text-muted-foreground">族</dt><dd className="font-bold">{selected.group ? `第 ${selected.group} 族` : "內過渡"}</dd></div><div className="rounded-lg bg-secondary p-3"><dt className="text-muted-foreground">熟練度</dt><dd className="flex items-center gap-1 font-bold"><span className={`h-2 w-2 rounded-full ${MASTERY_STYLE[mastery].marker}`}/>{MASTERY_STYLE[mastery].label}</dd></div></dl>
    {record && <div className="mt-3 rounded-xl bg-secondary/60 p-3 text-xs"><p className="flex items-center gap-1 font-bold"><Brain className="w-4"/>作答 {record.attempts} 次 · 正確 {record.correct} 次</p><p className="mt-1 text-muted-foreground">下次複習：{new Date(record.nextReviewAt).toLocaleString("zh-TW")}</p></div>}
    <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-teal-50 p-4"><p className="mb-1 text-xs font-bold text-primary">你的個人化記憶鉤子</p><p className="text-sm leading-relaxed">{memoryHook(profile,selected)}</p></div>
    {authoredTip && <section className="mt-4 space-y-2" aria-label={`${selected.nameZh}的四種記憶提示`}><div className="flex items-center justify-between"><h3 className="font-display text-sm font-extrabold">前 20 元素專屬提示</h3><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">人工校寫</span></div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="flex items-center gap-1 text-xs font-bold text-amber-800"><Sparkles className="h-3.5 w-3.5"/>諧音口訣</p><p className="mt-1 text-sm leading-relaxed">{authoredTip.rhyme}</p></div>
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3"><p className="flex items-center gap-1 text-xs font-bold text-sky-800"><ImageIcon className="h-3.5 w-3.5"/>腦中圖像</p><p className="mt-1 text-sm leading-relaxed">{authoredTip.image}</p></div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="flex items-center gap-1 text-xs font-bold text-emerald-800"><FlaskConical className="h-3.5 w-3.5"/>實際用途</p><p className="mt-1 text-sm leading-relaxed">{authoredTip.use}</p></div>
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3"><p className="flex items-center gap-1 text-xs font-bold text-rose-800"><AlertTriangle className="h-3.5 w-3.5"/>易混淆提醒</p><p className="mt-1 text-sm leading-relaxed">{authoredTip.confusion}</p></div>
    </section>}
    <Button variant="outline" className="mt-3 w-full" onClick={()=>speak(selected)}><Volume2/> 聽元素名片</Button><div className="mt-2 grid grid-cols-3 gap-2"><Link href={selected.category==="alkali"?"/alkali":"/train/elements"}><Button variant="ghost" size="sm" className="w-full">專題</Button></Link><Link href="/train/elements/place"><Button variant="outline" size="sm" className="w-full">拖放</Button></Link><Link href="/train/elements"><Button size="sm" className="w-full">測驗</Button></Link></div>
  </div>;
}

export default function PeriodicExplorer() {
  const [profile] = useState<MemoryProfile | null>(() => loadMemoryProfile());
  const [selected, setSelected] = useState<ElementItem>(ELEMENTS[0]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ElementCategory | "all">("all");
  const [masteryFilter, setMasteryFilter] = useState<MasteryStatus | "all">("all");
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [guideType, setGuideType] = useState<ElementGuideType>("group");
  const [guideValue, setGuideValue] = useState(1);
  const [guideActive, setGuideActive] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);
  const [progress] = useState(() => loadElementProgress());
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const summary = useMemo(() => summarizeElementProgress(progress), [progress]);
  const vark = profile ? VARK_OPTIONS.find((item) => item.id === profile.vark) : null;
  const talent = profile ? TALENT_OPTIONS.find((item) => item.id === profile.primaryTalent) : null;
  const matches = useMemo(() => new Set(ELEMENTS.filter((element) => {
    const text = `${element.number} ${element.symbol} ${element.nameZh} ${element.nameEn}`.toLowerCase();
    const mastery = getMasteryStatus(progress.elements[String(element.number)]);
    return (!query.trim() || text.includes(query.trim().toLowerCase())) && (category === "all" || element.category === category) && (masteryFilter === "all" || mastery === masteryFilter);
  }).map((element) => element.number)), [query, category, masteryFilter, progress]);
  const resultElements = useMemo(() => ELEMENTS.filter(element => matches.has(element.number)), [matches]);
  const guideSequence = useMemo(() => getElementGuideSequence(guideType, guideValue), [guideType, guideValue]);
  const guideNumbers = useMemo(() => new Set(guideSequence.map(element => element.number)), [guideSequence]);
  const guideLabel = getElementGuideLabel(guideType, guideValue);
  const hasFilters = Boolean(query.trim() || category !== "all" || masteryFilter !== "all");
  const main = ELEMENTS.filter((element) => element.group !== null);
  const lanthanides = ELEMENTS.filter((element) => element.category === "lanthanide" && element.number !== 57);
  const actinides = ELEMENTS.filter((element) => element.category === "actinide" && element.number !== 89);
  const selectElement = (element: ElementItem) => { setSelected(element); if (guideActive && guideNumbers.has(element.number)) setGuideIndex(guideSequence.findIndex(item => item.number === element.number)); if (window.innerWidth < 1280) setMobileDetailsOpen(true); };
  const moveResult = (direction: -1 | 1) => {
    if (!resultElements.length) return;
    const currentIndex = resultElements.findIndex(element => element.number === selected.number);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + resultElements.length) % resultElements.length;
    selectElement(resultElements[nextIndex]);
  };
  const resetFilters = () => { setQuery(""); setCategory("all"); setMasteryFilter("all"); };
  const startGuide = () => { const first = guideSequence[0]; if (!first) return; resetFilters(); setGuideIndex(0); setGuideActive(true); setSelected(first); setMobileDetailsOpen(window.innerWidth < 1280); };
  const moveGuide = (direction: -1 | 1) => { const nextIndex = Math.min(Math.max(guideIndex + direction, 0), guideSequence.length - 1); const next = guideSequence[nextIndex]; if (!next) return; setGuideIndex(nextIndex); setSelected(next); if (window.innerWidth < 1280) setMobileDetailsOpen(true); };
  const chooseGuideType = (type: ElementGuideType) => { setGuideType(type); setGuideValue(1); setGuideIndex(0); setGuideActive(false); };

  return <div className="min-h-screen pb-16">
    <header className="sticky top-0 z-30 border-b bg-[#FAF6EE]/90 backdrop-blur"><div className="container h-16 flex items-center justify-between gap-3"><Link href="/"><Button variant="ghost" size="sm"><ArrowLeft /> 首頁</Button></Link><div className="font-display font-extrabold flex items-center gap-2"><Atom className="text-primary" /> 互動週期表</div><div className="hidden sm:flex gap-2"><Link href="/elements/talents"><Button variant="outline" size="sm">天賦遊戲</Button></Link><Link href="/elements/course"><Button variant="outline" size="sm">核心四族</Button></Link><Link href="/train/elements/place"><Button variant="outline" size="sm">拖放</Button></Link><Link href="/train/elements"><Button size="sm">測驗</Button></Link></div></div></header>
    <main className="container max-w-[1500px] pt-7">
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6"><div><p className="font-hand text-2xl text-primary">explore · connect · recall</p><h1 className="font-display font-extrabold text-3xl sm:text-4xl">118 個元素，一張可探索的記憶地圖</h1><p className="text-muted-foreground mt-2">點元素查看座標、分類與依你的學習模型生成的記憶鉤子。</p></div><Link href="/train/mrt/profile"><Button variant="outline"><Sparkles /> {profile ? `${vark?.icon} ${vark?.name} × ${talent?.name}` : "設定我的記憶模型"}</Button></Link></section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">{(["unseen","learning","mastered","due"] as MasteryStatus[]).map((status)=><button key={status} onClick={()=>setMasteryFilter(masteryFilter===status?"all":status)} className={`paper-card p-3 text-left ${masteryFilter===status?"ring-2 ring-primary":""}`}><span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${MASTERY_STYLE[status].marker}`}/><span className="text-sm text-muted-foreground">{MASTERY_STYLE[status].label}</span><b className="block text-2xl mt-1">{summary[status]}</b></button>)}</section>
      <section className="paper-card mb-5 overflow-hidden" aria-label="族與週期導覽模式"><div className="border-b bg-gradient-to-r from-teal-50 to-amber-50 p-4 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary"><Route className="h-4 w-4"/>guided tour</p><h2 className="mt-1 font-display text-xl font-extrabold">族／週期導覽模式</h2><p className="mt-1 text-sm text-muted-foreground">選一條路線，依序認識元素，不再被 118 格一次淹沒。</p></div><div className="flex rounded-xl border bg-white p-1" role="group" aria-label="導覽方向"><button type="button" aria-pressed={guideType === "group"} onClick={()=>chooseGuideType("group")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition ${guideType === "group" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>直向看族</button><button type="button" aria-pressed={guideType === "period"} onClick={()=>chooseGuideType("period")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition ${guideType === "period" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>橫向看週期</button></div></div></div>
        <div className="p-4 sm:p-5"><div className="flex flex-col gap-3 md:flex-row md:items-center"><label className="flex-1 text-xs font-bold text-muted-foreground">選擇路線<select aria-label="選擇導覽路線" value={guideValue} onChange={event=>{setGuideValue(Number(event.target.value));setGuideIndex(0);setGuideActive(false);}} className="mt-1 block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-foreground">{guideType === "group" ? Object.entries(GROUP_GUIDE_NAMES).map(([value,label])=><option key={value} value={value}>{label}</option>) : Array.from({length:7},(_,index)=><option key={index+1} value={index+1}>第 {index+1} 週期 · {getElementGuideSequence("period",index+1).length} 個元素</option>)}</select></label><div className="rounded-xl bg-secondary/60 px-4 py-2.5 text-sm"><span className="text-muted-foreground">本路線</span><b className="ml-2">{guideSequence.length} 個元素</b></div><Button onClick={guideActive ? ()=>setGuideActive(false) : startGuide} className="md:self-end">{guideActive ? <><X/>結束導覽</> : <><Play/>開始導覽</>}</Button></div>
          {guideActive && <div className="mt-4 rounded-2xl border-2 border-primary/30 bg-teal-50 p-4" aria-live="polite"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-primary">{guideLabel}</p><p className="mt-1 font-display text-lg font-extrabold">第 {guideIndex+1} 站：{guideSequence[guideIndex]?.nameZh} {guideSequence[guideIndex]?.symbol}</p></div><span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-bold">{guideIndex+1} / {guideSequence.length}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${((guideIndex+1)/guideSequence.length)*100}%`}}/></div><div className="mt-3 flex items-center justify-between"><Button variant="outline" size="sm" disabled={guideIndex===0} onClick={()=>moveGuide(-1)}><ChevronLeft/>上一站</Button><p className="hidden text-xs text-muted-foreground sm:block">在右側名片查看提示，再前往下一站</p>{guideIndex === guideSequence.length-1 ? <Button size="sm" onClick={()=>setGuideActive(false)}><Eye/>完成導覽</Button> : <Button size="sm" onClick={()=>moveGuide(1)}>下一站<ChevronRight/></Button>}</div></div>}
        </div>
      </section>
      <section className="paper-card mb-5 p-4"><div className="flex flex-col gap-3 md:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-3 w-4 text-muted-foreground"/><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && resultElements[0]) selectElement(resultElements[0]); }} placeholder="搜尋：氧、O、Oxygen 或 8" className="w-full rounded-xl border bg-white py-2.5 pl-10 pr-10"/>{query && <button type="button" aria-label="清除搜尋" onClick={() => setQuery("")} className="absolute right-3 top-3"><X className="w-4"/></button>}</label><select aria-label="元素分類" value={category} onChange={(event) => setCategory(event.target.value as ElementCategory | "all")} className="rounded-xl border bg-white px-4 py-2.5"><option value="all">全部分類 · 118</option>{Object.entries(CATEGORY_STYLE).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select><div className="flex items-center justify-between gap-2"><span className="text-sm text-muted-foreground">符合 {matches.size} 個</span>{hasFilters && <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold"><RotateCcw className="h-3.5 w-3.5"/>重設</button>}</div></div>
        {resultElements.length > 0 && resultElements.length <= 12 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="搜尋結果">{resultElements.map(element => <button type="button" key={element.number} onClick={() => selectElement(element)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${selected.number === element.number ? "border-primary bg-primary text-primary-foreground" : "bg-white"}`}>{element.number} · {element.symbol} {element.nameZh}</button>)}</div>}
        {!resultElements.length && <div className="mt-3 rounded-xl border border-dashed border-rose-300 bg-rose-50 p-4 text-center text-sm text-rose-800">找不到符合條件的元素。可改用元素符號、中文、英文或原子序搜尋。<button type="button" onClick={resetFilters} className="ml-2 font-bold underline">清除篩選</button></div>}
      </section>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_330px] gap-5 items-start">
        <section className="paper-card overflow-hidden p-3 sm:p-5" aria-label="18 族 7 週期元素週期表">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-display font-bold">18 族 × 7 週期</h2><p className="text-xs text-muted-foreground">手機可左右滑動；點擊元素開啟完整名片</p></div><div className="flex gap-1"><button type="button" aria-label="週期表向左捲動" onClick={() => tableScrollRef.current?.scrollBy({left:-420,behavior:"smooth"})} className="rounded-full border p-2"><ChevronLeft className="h-4 w-4"/></button><button type="button" aria-label="週期表向右捲動" onClick={() => tableScrollRef.current?.scrollBy({left:420,behavior:"smooth"})} className="rounded-full border p-2"><ChevronRight className="h-4 w-4"/></button></div></div>
          <div ref={tableScrollRef} className="overflow-x-auto pb-2"><div className="min-w-[1080px]"><div className="mb-1.5 grid grid-cols-[32px_repeat(18,minmax(54px,1fr))] gap-1.5"><span className="sticky left-0 z-20 bg-background"/><>{Array.from({length:18},(_,index)=><span key={index} className="text-center text-xs text-muted-foreground">{index+1}</span>)}</></div>
            <div className="grid grid-cols-[32px_repeat(18,minmax(54px,1fr))] grid-rows-7 gap-1.5">{Array.from({length:7},(_,index)=><span key={index} className="sticky left-0 z-20 self-center bg-background text-center text-xs text-muted-foreground" style={{gridRow:index+1,gridColumn:1}}>{index+1}</span>)}{main.map((element)=><div key={element.number} style={{gridRow:element.period,gridColumn:(element.group || 0)+1}}><ElementCell element={element} selected={selected.number===element.number} muted={!matches.has(element.number) || (guideActive && !guideNumbers.has(element.number))} mastery={getMasteryStatus(progress.elements[String(element.number)])} onClick={()=>selectElement(element)}/></div>)}</div>
            <div className="mt-5 space-y-2"><div className="grid grid-cols-[110px_repeat(14,minmax(54px,1fr))] gap-1.5"><span className="self-center pr-2 text-right text-xs">鑭系 58–71</span>{lanthanides.map((element)=><ElementCell key={element.number} element={element} selected={selected.number===element.number} muted={!matches.has(element.number) || (guideActive && !guideNumbers.has(element.number))} mastery={getMasteryStatus(progress.elements[String(element.number)])} onClick={()=>selectElement(element)}/>)}</div><div className="grid grid-cols-[110px_repeat(14,minmax(54px,1fr))] gap-1.5"><span className="self-center pr-2 text-right text-xs">錒系 90–103</span>{actinides.map((element)=><ElementCell key={element.number} element={element} selected={selected.number===element.number} muted={!matches.has(element.number) || (guideActive && !guideNumbers.has(element.number))} mastery={getMasteryStatus(progress.elements[String(element.number)])} onClick={()=>selectElement(element)}/>)}</div></div>
          </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-5">{Object.entries(CATEGORY_STYLE).map(([key, value])=><button key={key} onClick={()=>setCategory(category===key?"all":key as ElementCategory)} className={`rounded-full border px-2.5 py-1 text-xs ${value.className} ${category===key?"ring-2 ring-primary":""}`}>{value.label}</button>)}</div>
        </section>

        <aside className="paper-card hidden p-5 xl:sticky xl:top-20 xl:block"><div className="mb-3 flex items-center justify-between"><button type="button" aria-label={guideActive?"導覽上一站":"上一個符合元素"} onClick={()=>guideActive?moveGuide(-1):moveResult(-1)} disabled={guideActive?guideIndex===0:!resultElements.length} className="rounded-full border p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4"/></button><span className="text-xs text-muted-foreground">{guideActive?`${guideLabel} · ${guideIndex+1} / ${guideSequence.length}`:`${resultElements.findIndex(element=>element.number===selected.number)+1 || "—"} / ${resultElements.length}`}</span><button type="button" aria-label={guideActive?"導覽下一站":"下一個符合元素"} onClick={()=>guideActive?moveGuide(1):moveResult(1)} disabled={guideActive?guideIndex===guideSequence.length-1:!resultElements.length} className="rounded-full border p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4"/></button></div><ElementDetails selected={selected} profile={profile} progress={progress}/></aside>
      </div>
      {mobileDetailsOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 p-3 xl:hidden" role="dialog" aria-modal="true" aria-label={`${selected.nameZh}元素詳情`}><div className="mx-auto mt-6 max-w-md rounded-3xl bg-background p-5 shadow-2xl"><div className="mb-3 flex items-center justify-between pr-12"><button type="button" aria-label={guideActive?"導覽上一站":"上一個符合元素"} onClick={()=>guideActive?moveGuide(-1):moveResult(-1)} disabled={guideActive?guideIndex===0:!resultElements.length} className="rounded-full border p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4"/></button><span className="text-xs text-muted-foreground">{guideActive?`${guideLabel} · ${guideIndex+1} / ${guideSequence.length}`:"瀏覽符合條件的元素"}</span><button type="button" aria-label={guideActive?"導覽下一站":"下一個符合元素"} onClick={()=>guideActive?moveGuide(1):moveResult(1)} disabled={guideActive?guideIndex===guideSequence.length-1:!resultElements.length} className="rounded-full border p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4"/></button></div><ElementDetails selected={selected} profile={profile} progress={progress} onClose={()=>setMobileDetailsOpen(false)}/></div></div>}
    </main>
  </div>;
}
