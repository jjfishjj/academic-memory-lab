/**
 * 設計風格提醒：MemoDesk「週記攤頁」。沿用米白紙、teal 墨水、黃粉便利貼與蓋章節奏，
 * 將跨週數據排成手帳索引卡，而非冷硬的企業儀表板。
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, CalendarDays, ChartNoAxesCombined, ClipboardCheck, Download, Sparkles, Target } from "lucide-react";
import { ABILITIES, loadUnifiedReport, type UnifiedReport, WEAKNESS_ACTIONS } from "@/lib/unifiedStats";
import { downloadShadowEchoWeeklyPdf } from "@/lib/shadowEchoWeeklyPdf";

const moduleNames = { "dual-card": "雙卡任務", mnemonic: "口訣", roleplay: "劇本殺", gesture: "手勢", memgenius: "MemGenius", "shadow-echo": "Shadow Echo" } as const;
const colorByIndex = ["#0f766e", "#d9879f", "#d9a441", "#6d8f83", "#5c7c9f", "#b26757"];

function formatStamp(date: string) {
  const value = new Date(date);
  return `${value.getMonth() + 1}/${value.getDate()} ${value.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

export default function UnifiedProgressPage() {
  const [report, setReport] = useState<UnifiedReport>(() => loadUnifiedReport());
  useEffect(() => {
    const refresh = () => setReport(loadUnifiedReport());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  const maxWeek = Math.max(1, ...report.weeks.map((week) => week.count));
  const maxAbility = Math.max(1, ...ABILITIES.map((ability) => report.abilityTotals[ability]));
  const practiced = ABILITIES.filter((ability) => report.abilityTotals[ability] > 0).sort((a, b) => report.abilityTotals[b] - report.abilityTotals[a]);
  const recommendation = report.weakest ? WEAKNESS_ACTIONS[report.weakest] : null;
  const sourceText = useMemo(() => report.sources.map((source) => moduleNames[source]).join("、"), [report.sources]);
  const shadowSessions = useMemo(() => report.sessions.filter((session) => session.module === "shadow-echo"), [report.sessions]);
  const [exporting, setExporting] = useState(false);
  const exportShadowWeekly = async () => { setExporting(true); try { await downloadShadowEchoWeeklyPdf(report); } finally { setExporting(false); } };

  return <main className="ud-page">
    <header className="ud-topbar"><Link href="/" className="ud-brand"><span>MD</span><b>記憶手帳社 MemoDesk</b><small>跨週練習週記</small></Link><Link href="/" className="ud-back"><ArrowLeft /> 回到書桌</Link></header>
    <section className="ud-hero container">
      <div><p className="ud-kicker"><ChartNoAxesCombined /> REAL PRACTICE LOG</p><h1>把每次練習，<br /><em>貼回你的學習週記。</em></h1><p>這一頁只整理你裝置中實際完成的訓練紀錄；沒有日期的舊版累積能力值仍會保留在總覽，但不會被編造成跨週活動。</p></div>
      <div className="ud-hero-stamp"><CalendarDays /><b>{report.sessions.length}</b><span>筆有日期的練習</span><small>{report.lifetimeRuns > 0 ? `另有 ${report.lifetimeRuns} 次既有模板完成總計` : "完成一次訓練，就會多一枚日期章"}</small></div>
    </section>

    <section className="ud-content container">
      <div className="ud-week-card">
        <div className="ud-section-head"><div><small>6-WEEK ACTIVITY</small><h2>每週練習節奏</h2></div><span>{report.weeks.reduce((sum, week) => sum + week.count, 0)} 次 · 近六週</span></div>
        <div className="ud-week-bars" aria-label="最近六週練習次數">{report.weeks.map((week) => <div key={week.key}><div className="ud-bar-track"><i style={{ height: `${Math.max(6, (week.count / maxWeek) * 100)}%` }} /><b>{week.count || "—"}</b></div><small>{week.label}</small><em>{week.count ? `${week.minutes} 分` : "尚無"}</em></div>)}</div>
      </div>

      <aside className="ud-action-card">
        <p><Target /> 待補強索引</p>{recommendation ? <><h2>{report.weakest}</h2><strong>{recommendation.title}</strong><span>{recommendation.detail}</span><Link href={recommendation.route}>安排下一輪 <ArrowRight /></Link></> : <><h2>開始你的第一頁</h2><span>完成任一訓練後，這裡會依你的真實紀錄指出下一個值得補強的能力。</span><Link href="/game">開啟雙卡任務 <ArrowRight /></Link></>}
      </aside>

      <aside className="ud-pdf-card">
        <p><Download /> Shadow Echo 週記</p><h2>夜自習朗讀存檔</h2><span>目前收錄 <b>{shadowSessions.length}</b> 次實際完成的跟讀紀錄；下載後可保存、列印或帶去複盤。</span><button type="button" onClick={exportShadowWeekly} disabled={exporting}>{exporting ? "正在排版…" : "下載 PDF 週記"} <Download /></button><small>PDF 只含本機 Shadow Echo 實際完成時間與評分。</small>
      </aside>

      <section className="ud-ability-card">
        <div className="ud-section-head"><div><small>ABILITY LEDGER</small><h2>能力累積與本週新增</h2></div><span>點數代表實際練習覆蓋度</span></div>
        {practiced.length ? <div className="ud-ability-list">{practiced.map((ability) => <div key={ability}><div><b>{ability}</b><small>本週 +{Math.round(report.abilityThisWeek[ability] * 10) / 10}</small></div><i><em style={{ width: `${Math.max(3, (report.abilityTotals[ability] / maxAbility) * 100)}%` }} /></i><strong>{Math.round(report.abilityTotals[ability] * 10) / 10}</strong></div>)}</div> : <div className="ud-empty"><Sparkles /> 尚未有可整理的能力紀錄。完成一輪雙卡、口訣、劇本、手勢、MemGenius 或 Shadow Echo 訓練後再回來看看。</div>}
      </section>

      <section className="ud-log-card">
        <div className="ud-section-head"><div><small>RECENT STAMPS</small><h2>最近完成章</h2></div><span>{sourceText || "尚未偵測到完成紀錄"}</span></div>
        {report.sessions.length ? <div className="ud-log-list">{report.sessions.slice(0, 8).map((session, index) => <div key={session.id}><i style={{ background: colorByIndex[index % colorByIndex.length] }} /><span><b>{session.label}</b><small>{moduleNames[session.module]} · {formatStamp(session.at)}</small></span>{session.score !== undefined && <em>{session.score}%</em>}</div>)}</div> : <div className="ud-empty"><ClipboardCheck /> 你的完成章會出現在這裡。</div>}
      </section>
    </section>
  </main>;
}
