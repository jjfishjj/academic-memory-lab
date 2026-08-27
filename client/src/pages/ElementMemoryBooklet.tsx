import { ArrowLeft, Printer } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CATEGORY_STYLE, ELEMENTS } from "@/lib/elementData";
import { elementMemoryCardTheme } from "@/lib/elementMemoryCard";
import { getElementMemoryScene } from "@/lib/elementMemoryScenes";
import { getElementMemoryTip } from "@/lib/elementMemoryTips";
import { MNEMONIC_PROFILE_NAME_KEY } from "@/lib/mnemonicLibrary";

export default function ElementMemoryBooklet() {
  const learnerName = localStorage.getItem(MNEMONIC_PROFILE_NAME_KEY)?.trim() || "記憶手帳學員";
  const cards = ELEMENTS.filter(element => element.number <= 54).flatMap(element => {
    const tip = getElementMemoryTip(element.number);
    const scene = getElementMemoryScene(element.number);
    return tip && scene ? [{ element, tip, scene, theme: elementMemoryCardTheme(element) }] : [];
  });

  return <main className="min-h-screen bg-[#f7f0e5] pb-16 print:bg-white print:pb-0">
    <style>{`@page{size:A4 portrait;margin:10mm}@media print{.booklet-toolbar{display:none!important}.booklet-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:6mm}.booklet-card{height:82mm;break-inside:avoid;page-break-inside:avoid;box-shadow:none!important}.booklet-card:nth-child(6n){break-after:page}.booklet-title{display:none!important}}`}</style>
    <header className="booklet-toolbar sticky top-0 z-20 border-b bg-[#FAF6EE]/95 backdrop-blur"><div className="container flex min-h-16 items-center justify-between gap-3 py-2"><Link href="/periodic-table"><Button variant="ghost"><ArrowLeft/>回互動週期表</Button></Link><Button onClick={()=>window.print()}><Printer/>列印／存成 PDF</Button></div></header>
    <section className="booklet-title container max-w-5xl py-8 text-center"><p className="font-hand text-xl text-primary">MemoDesk printable cards</p><h1 className="font-display text-3xl font-extrabold">前 54 元素 A4 圖像記憶手冊</h1><p className="mt-2 text-sm text-muted-foreground">學員：{learnerName} · 建議 A4、直向、背景圖形開啟；每頁 6 張，共 9 頁。</p></section>
    <section className="booklet-grid mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2 print:max-w-none print:px-0" aria-label="54 張元素列印圖卡">
      {cards.map(({ element, tip, scene, theme }) => <article key={element.number} className="booklet-card overflow-hidden rounded-3xl border-2 bg-white shadow-sm" style={{borderColor:theme.accent}}>
        <div className="flex items-center justify-between px-4 py-2 text-white" style={{backgroundColor:theme.accent}}><b className="text-sm">#{element.number} {element.symbol} · {element.nameZh}</b><span className="text-[10px]">{CATEGORY_STYLE[element.category].label}</span></div>
        <div className="grid grid-cols-[112px_1fr] gap-3 p-3">
          <div className="relative flex min-h-28 items-center justify-center overflow-hidden rounded-2xl" style={{background:`linear-gradient(145deg,${theme.soft},${theme.background})`}}><span className="absolute left-2 top-2 text-2xl">{scene.actors[1]}</span><span className="text-6xl">{scene.actors[0]}</span><span className="absolute right-2 top-2 text-2xl">{scene.actors[2]}</span><span className="absolute inset-x-2 bottom-2 rounded-full bg-white/85 px-2 py-1 text-center text-[9px] font-bold" style={{color:theme.accentDark}}>{scene.action}</span></div>
          <div><h2 className="font-display text-2xl font-extrabold">{element.nameEn}</h2><p className="mt-1 text-xs font-bold" style={{color:theme.accentDark}}>{tip.rhyme}</p><p className="mt-2 text-[10px] leading-relaxed text-slate-600">{tip.image}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-2 px-3 pb-3 text-[10px] leading-relaxed"><div className="rounded-xl bg-emerald-50 p-2"><b className="block text-emerald-800">🧪 用途</b>{tip.use}</div><div className="rounded-xl bg-rose-50 p-2"><b className="block text-rose-800">⚠ 易混淆</b>{tip.confusion}</div></div>
      </article>)}
    </section>
  </main>;
}
