import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, CalendarClock, ChevronLeft, Search } from "lucide-react";
import { Link } from "wouter";
import { MRT_LINES, ALL_MRT_STATIONS, type MrtLineId } from "@/lib/mrtData";
import { loadMrtProgress, reviewLabel, type MrtProgress } from "@/lib/mrtProgress";

type StatusFilter = "review" | "wrong" | "due" | "all";

export default function MrtWrongBook() {
  const [progress, setProgress] = useState<MrtProgress>({ lines: {}, stations: {}, segments: {}, lineExams: {}, branches: {} });
  const [lineFilter, setLineFilter] = useState<"all" | MrtLineId>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("review");
  const [query, setQuery] = useState("");

  useEffect(() => setProgress(loadMrtProgress()), []);

  const rows = useMemo(() => ALL_MRT_STATIONS.filter((station) => !station.preview).map((station) => {
    const saved = progress.stations[station.code];
    const accuracy = saved ? Math.round((saved.correct / saved.attempts) * 100) : 0;
    const due = Boolean(saved && new Date(saved.nextReviewAt).getTime() <= Date.now());
    const wrong = Boolean(saved && (!saved.lastResult || accuracy < 80));
    return { station, saved, accuracy, due, wrong };
  }).filter((row) => {
    if (!row.saved) return false;
    if (lineFilter !== "all" && row.station.lineId !== lineFilter) return false;
    if (query && !`${row.station.code}${row.station.name}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter === "review" && !row.due && !row.wrong) return false;
    if (statusFilter === "wrong" && !row.wrong) return false;
    if (statusFilter === "due" && !row.due) return false;
    return true;
  }).sort((a, b) => Number(b.due) - Number(a.due) || a.accuracy - b.accuracy), [progress, lineFilter, statusFilter, query]);

  const learnedCount = Object.keys(progress.stations).length;

  return <div className="min-h-screen">
    <header className="sticky top-0 z-40 bg-[#FAF6EE]/90 backdrop-blur border-b border-border"><div className="container h-14 flex items-center justify-between">
      <Link href="/train/mrt" className="text-sm inline-flex items-center gap-1 hover:text-primary"><ChevronLeft className="w-4 h-4" />捷運任務板</Link>
      <strong className="font-display">捷運錯題本</strong><span className="text-xs text-muted-foreground">已學 {learnedCount} 站</span>
    </div></header>
    <main className="container max-w-5xl py-8">
      <p className="font-hand text-2xl text-primary">review the weak links ✎</p>
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-2">把容易斷掉的站，重新接回來</h1>
      <p className="text-muted-foreground mt-3">優先顯示已到期、最近答錯或正確率低於 80% 的車站。</p>

      <div className="paper-card p-4 sm:p-5 mt-7 grid md:grid-cols-[1fr_auto] gap-4">
        <label className="relative"><Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋站碼或站名" className="w-full rounded-xl border bg-white pl-10 pr-4 py-3" /></label>
        <div className="flex flex-wrap gap-2">{(["review", "wrong", "due", "all"] as StatusFilter[]).map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-full px-4 py-2 text-sm font-bold ${statusFilter === status ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{status === "review" ? "需要複習" : status === "wrong" ? "錯題／弱項" : status === "due" ? "今天到期" : "全部已學"}</button>)}</div>
      </div>
      <div className="flex gap-2 overflow-x-auto py-5">{["all", ...MRT_LINES.map((line) => line.id)].map((id) => <button key={id} onClick={() => setLineFilter(id as "all" | MrtLineId)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold border ${lineFilter === id ? "border-primary text-primary bg-primary/10" : "bg-white"}`}>{id === "all" ? "全部路線" : id}</button>)}</div>

      {rows.length === 0 ? <div className="paper-card p-10 text-center"><BookOpenCheck className="w-12 h-12 mx-auto text-primary" /><h2 className="font-display font-bold text-xl mt-4">目前沒有符合條件的站</h2><p className="text-muted-foreground mt-2">先完成一輪捷運練習，或切換到其他篩選條件。</p><Link href="/train/mrt" className="inline-flex items-center gap-1 text-primary font-bold mt-5">開始練習 <ArrowRight className="w-4 h-4" /></Link></div> :
        <div className="grid sm:grid-cols-2 gap-4">{rows.map(({ station, saved, accuracy, due, wrong }) => {
          const line = MRT_LINES.find((item) => item.id === station.lineId)!;
          return <article key={station.code} className="paper-card p-5"><div className="flex items-start gap-4">
            <span className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-xs font-black" style={{ background: line.color, color: line.textColor }}>{station.code}</span>
            <div className="flex-1 min-w-0"><div className="flex justify-between gap-2"><h2 className="font-display font-bold text-xl">{station.name}</h2><span className={`text-xs rounded-full px-2 py-1 h-fit font-bold ${due ? "bg-amber-100 text-amber-900" : wrong ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{due ? "已到期" : wrong ? "弱項" : "排程中"}</span></div>
              <p className="text-sm text-muted-foreground mt-1">正確率 {accuracy}% · {saved!.correct}/{saved!.attempts} · 連對 {saved!.streak}</p>
              <p className="text-sm font-bold text-primary mt-2"><CalendarClock className="w-4 h-4 inline mr-1" />{reviewLabel(saved)}</p>
              <Link href={`/train/mrt?focus=${station.code}`} className="inline-flex items-center gap-1 font-bold text-sm mt-4 hover:text-primary">專練這一站 <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div></article>;
        })}</div>}
    </main>
  </div>;
}
