import { useEffect, useMemo, useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, Download, Eye, MessageCircleWarning, NotebookPen, Share2, Trash2, X } from "lucide-react";
import { filterAndSortMnemonicEntries, loadMnemonicLibrary, mnemonicSubjectOf, removeMnemonicEntryById, selectWeakMnemonicEntries, updateMnemonicEntry } from "@/lib/mnemonicLibrary";
import type { MnemonicLibraryEntry, MnemonicLibrarySort, MnemonicLibrarySubject } from "@/lib/mnemonicLibrary";
import { SUBJECT_PACKS } from "@/lib/gameData";
import { getMnemonicReferences, MNEMONIC_STYLES } from "@/lib/templateData";
import { loadDailyWeaknessProgress, ratingTrend, saveMnemonicEntry } from "@/lib/mnemonicLibrary";
import { STREAK_BADGES, subjectRatingTrends, weaknessStreak, weeklyWeakMnemonicEntries } from "@/lib/mnemonicLibrary";
import { createMnemonicBackup } from "@/lib/mnemonicLibrary";
import { shareStreakBadge } from "@/lib/shareCard";
import { toast } from "sonner";

interface Props { onTrainEntries: (entries: MnemonicLibraryEntry[], label: string, daily?: boolean) => void; }

export default function MnemonicLibraryPanel({ onTrainEntries }: Props) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(loadMnemonicLibrary);
  const [subject, setSubject] = useState<"all" | MnemonicLibrarySubject>("all");
  const [sort, setSort] = useState<MnemonicLibrarySort>("updated");
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const [unlockedBadge, setUnlockedBadge] = useState<(typeof STREAK_BADGES)[number] | null>(null);
  const favorites = useMemo(() => entries.filter(entry => entry.bookmarked).length, [entries]);
  const hard = useMemo(() => entries.filter(entry => entry.feedback === "hard").length, [entries]);
  const lowRated = useMemo(() => entries.filter(entry => entry.rating > 0 && entry.rating < 3).length, [entries]);
  const weakEntries = useMemo(() => selectWeakMnemonicEntries(entries), [entries]);
  const daily = useMemo(() => loadDailyWeaknessProgress(entries), [entries]);
  const dailyEntries = useMemo(() => daily.itemIds.flatMap(itemId => {
    const entry = weakEntries.find(candidate => candidate.itemId === itemId);
    return entry ? [entry] : [];
  }), [daily.itemIds, weakEntries]);
  const streak = useMemo(() => weaknessStreak(), [daily.completedIds]);
  const weeklyWeak = useMemo(() => weeklyWeakMnemonicEntries(entries), [entries]);
  const trends = useMemo(() => subjectRatingTrends(entries, trendDays), [entries, trendDays]);
  const visibleEntries = useMemo(() => filterAndSortMnemonicEntries(entries, subject, sort), [entries, sort, subject]);
  const detailItem = useMemo(() => SUBJECT_PACKS.flatMap(pack => pack.items).find(item => item.id === detailItemId), [detailItemId]);

  const refresh = () => setEntries(loadMnemonicLibrary());
  const toggleFavorite = (id: string, bookmarked: boolean) => {
    updateMnemonicEntry(id, { bookmarked: !bookmarked }); refresh();
  };
  const toggleHard = (id: string, reported: boolean) => {
    updateMnemonicEntry(id, { feedback: reported ? undefined : "hard", ...(reported ? {} : { rating: 1 }) }); refresh();
  };
  const discard = (id: string) => { removeMnemonicEntryById(id); refresh(); };
  const updateNote = (id: string, note: string) => {
    setEntries(current => current.map(entry => entry.id === id ? { ...entry, note } : entry));
    updateMnemonicEntry(id, { note });
  };
  useEffect(() => {
    const earned = [...STREAK_BADGES].reverse().find(badge => streak >= badge.days);
    if (!earned) return;
    const key = "memodesk-mnemonic-last-badge";
    if (Number(localStorage.getItem(key) ?? 0) < earned.days) { setUnlockedBadge(earned); localStorage.setItem(key, String(earned.days)); }
  }, [streak]);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(createMnemonicBackup(entries), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.download = `memodesk-backup-${new Date().toISOString().slice(0, 10)}.json`; link.href = url; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000); toast.success("JSON 備份已下載");
  };

  return (
    <section className="paper-card mb-8 overflow-hidden" aria-labelledby="mnemonic-library-title">
      <button type="button" onClick={() => setOpen(value => !value)} className="flex w-full items-center gap-3 p-4 text-left sm:p-5">
        <span className="text-3xl">📒</span><span className="min-w-0 flex-1">
          <strong id="mnemonic-library-title" className="block font-display text-lg">我的口訣庫</strong>
          <span className="text-sm text-muted-foreground">{entries.length} 句 · {favorites} 個收藏 · {hard} 句待改善 · {lowRated} 句低於 3 星</span>
        </span>{open ? <ChevronUp /> : <ChevronDown />}
      </button>
      {open && (
        <div className="border-t border-dashed border-amber-300 p-4 sm:p-5">
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <button type="button" disabled={!favorites} onClick={() => onTrainEntries(entries.filter(entry => entry.bookmarked), "只練收藏")}
              className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-left font-bold text-amber-900 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-amber-950/50 dark:text-amber-100">
              🔖 只練收藏 <span className="block text-xs font-normal">{favorites ? `${favorites} 句已收藏口訣` : "先收藏一條口訣即可開始"}</span>
            </button>
            <button type="button" disabled={!hard} onClick={() => onTrainEntries(entries.filter(entry => entry.feedback === "hard"), "只練不好記")}
              className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-left font-bold text-rose-900 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-rose-950/50 dark:text-rose-100">
              🧠 只練不好記 <span className="block text-xs font-normal">{hard ? `${hard} 句待改善口訣` : "標記不好記後會出現在這裡"}</span>
            </button>
            <button type="button" disabled={!weakEntries.length} onClick={() => onTrainEntries(weakEntries, "自動弱項複習")}
              className="rounded-xl border-2 border-violet-300 bg-violet-50 p-3 text-left font-bold text-violet-900 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-violet-950/50 dark:text-violet-100">
              ⚡ 自動弱項複習 <span className="block text-xs font-normal">{weakEntries.length ? `${weakEntries.length} 句：不好記優先，再練 1–2 星` : "目前沒有弱項，繼續保持！"}</span>
            </button>
            <button type="button" disabled={!weeklyWeak.length} onClick={() => onTrainEntries(weeklyWeak, "本週最弱 10 題")}
              className="rounded-xl border-2 border-sky-300 bg-sky-50 p-3 text-left font-bold text-sky-900 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-sky-950/50 dark:text-sky-100">
              📉 本週最弱 10 題 <span className="block text-xs font-normal">{weeklyWeak.length ? `最近 7 天共 ${weeklyWeak.length} 題` : "本週尚未產生弱項"}</span>
            </button>
          </div>
          <div className="mb-4 rounded-xl border-2 border-teal-300 bg-teal-50 p-4 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><b>📅 今日弱項任務</b><p className="text-xs">已完成 {daily.completedIds.length} / {daily.itemIds.length} 題</p></div>
              <button type="button" disabled={!dailyEntries.length || daily.completedIds.length >= daily.itemIds.length} onClick={() => onTrainEntries(dailyEntries.filter(entry => !daily.completedIds.includes(entry.itemId)), "今日弱項任務", true)} className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-45">{daily.itemIds.length && daily.completedIds.length >= daily.itemIds.length ? "今天完成了 ✓" : "開始今日任務"}</button>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-teal-100 dark:bg-teal-900"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${daily.itemIds.length ? daily.completedIds.length / daily.itemIds.length * 100 : 0}%` }} /></div>
            {!daily.itemIds.length && <p className="mt-2 text-xs">目前沒有低於 3 星或不好記的項目，今天可以放心休息。</p>}
          </div>
          <div className="mb-4 rounded-xl border-2 border-orange-300 bg-orange-50 p-4 text-orange-950 dark:bg-orange-950/50 dark:text-orange-100">
            <div className="flex flex-wrap items-center gap-3"><span className="text-3xl">🔥</span><div><b>連續完成 {streak} 天</b><p className="text-xs">完成每日弱項清單即可延續紀錄</p></div></div>
            <div className="mt-3 grid grid-cols-5 gap-1.5">{STREAK_BADGES.map(badge => <div key={badge.days} className={`rounded-lg border p-2 text-center ${streak >= badge.days ? "border-orange-400 bg-white/70" : "border-orange-200 opacity-40 grayscale"}`} title={`${badge.days} 天：${badge.name}`}><span className="text-xl">{badge.emoji}</span><span className="block text-[10px] font-bold">{badge.days}天</span></div>)}</div>
          </div>
          <div className="mb-4 rounded-xl border-2 border-indigo-200 bg-white/70 p-4 dark:border-indigo-900 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center justify-between gap-2"><b>📈 各科評分進步趨勢</b><div className="flex rounded-full border bg-background p-1"><button type="button" onClick={() => setTrendDays(7)} className={`rounded-full px-3 py-1 text-xs font-bold ${trendDays === 7 ? "bg-indigo-600 text-white" : ""}`}>7 天</button><button type="button" onClick={() => setTrendDays(30)} className={`rounded-full px-3 py-1 text-xs font-bold ${trendDays === 30 ? "bg-indigo-600 text-white" : ""}`}>30 天</button></div></div>
            {trends.length ? <div className="mt-3 grid gap-3 md:grid-cols-2">{trends.map(series => {
              const color = { english:"#2563eb", history:"#9333ea", chemistry:"#ea580c", biology:"#059669", geography:"#0891b2", custom:"#64748b" }[series.subject];
              const points = series.points.map((point, index) => `${12 + index * (176 / Math.max(series.points.length - 1, 1))},${88 - (point.rating - 1) * 18}`).join(" ");
              return <div key={series.subject} className="rounded-lg bg-muted/60 p-3"><div className="flex justify-between text-xs font-bold"><span>{{english:"英文",history:"歷史",chemistry:"化學",biology:"生物",geography:"地理",custom:"自訂"}[series.subject]}</span><span>{series.points[0].rating.toFixed(1)} → {series.points.at(-1)!.rating.toFixed(1)}</span></div><svg viewBox="0 0 200 100" className="mt-2 h-24 w-full" role="img" aria-label={`${series.subject}評分趨勢折線圖`}><path d="M12 16V88H188" fill="none" stroke="currentColor" strokeOpacity=".2"/><polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>{series.points.map((point,index)=><circle key={`${point.date}-${index}`} cx={12 + index * (176 / Math.max(series.points.length - 1, 1))} cy={88 - (point.rating - 1) * 18} r="4" fill={color}><title>{point.date}：{point.rating.toFixed(1)} 星</title></circle>)}</svg></div>;
            })}</div> : <p className="mt-2 text-xs text-muted-foreground">最近 {trendDays} 天內，同一科目累積兩個不同日期的評分後，這裡會出現折線圖。</p>}
          </div>
          <button type="button" onClick={exportBackup} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-slate-50 p-3 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100"><Download className="h-4 w-4" />匯出每日進度、筆記與評分 JSON 備份</button>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-bold text-muted-foreground">科目
              <select value={subject} onChange={event => setSubject(event.target.value as "all" | MnemonicLibrarySubject)} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm text-foreground">
                <option value="all">全部科目</option><option value="english">英文</option><option value="history">歷史</option><option value="chemistry">化學</option><option value="biology">生物</option><option value="geography">地理</option><option value="custom">自訂</option>
              </select>
            </label>
            <label className="text-xs font-bold text-muted-foreground">排序
              <select value={sort} onChange={event => setSort(event.target.value as MnemonicLibrarySort)} className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm text-foreground">
                <option value="updated">最近更新</option><option value="rating-low">評分低到高</option><option value="rating-high">評分高到低</option>
              </select>
            </label>
          </div>
          {entries.length === 0 ? <p className="rounded-xl bg-amber-50 p-5 text-center text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">完成口訣並評分或收藏後，會保存在這裡。</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleEntries.map(entry => <article key={entry.id} className="rounded-xl border-2 border-amber-200 bg-white/70 p-4 dark:border-amber-900 dark:bg-slate-900/60">
                <div className="flex items-start justify-between gap-2"><div><p className="font-display font-bold">{entry.term}</p><p className="text-xs text-muted-foreground">{{english:"英文",history:"歷史",chemistry:"化學",biology:"生物",geography:"地理",custom:"自訂"}[mnemonicSubjectOf(entry.itemId)]} · {entry.styleName} · {entry.rating ? `${entry.rating}/5 星` : "未評分"}</p>{entry.ratingHistory && entry.ratingHistory.length > 1 && <p className={`mt-1 text-xs font-bold ${ratingTrend(entry) > 0 ? "text-emerald-700" : ratingTrend(entry) < 0 ? "text-rose-700" : "text-muted-foreground"}`}>趨勢 {ratingTrend(entry) > 0 ? `↑ +${ratingTrend(entry)}` : ratingTrend(entry) < 0 ? `↓ ${ratingTrend(entry)}` : "持平"} · {entry.ratingHistory.map(point => point.rating).join(" → ")} 星</p>}</div>{entry.feedback === "hard" && <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">待改善</span>}</div>
                <p className="my-3 font-hand text-lg">「{entry.mnemonic}」</p>
                {entry.bookmarked && <label className="mb-3 block text-xs font-bold text-muted-foreground"><NotebookPen className="mr-1 inline h-3.5 w-3.5" />個人筆記
                  <textarea value={entry.note ?? ""} maxLength={300} onChange={event => updateNote(entry.id, event.target.value)} placeholder="例如：考前先想哪個畫面？容易和什麼混淆？" className="mt-1 min-h-16 w-full resize-y rounded-lg border bg-background p-2 text-sm font-normal text-foreground" />
                  <span className="block text-right text-[10px]">{entry.note?.length ?? 0}/300</span>
                </label>}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button type="button" disabled={mnemonicSubjectOf(entry.itemId) === "custom"} onClick={() => setDetailItemId(entry.itemId)} className="rounded-lg border p-2 text-xs font-bold hover:bg-teal-50 disabled:opacity-40 dark:hover:bg-teal-950"><Eye className="mx-auto mb-1 h-4 w-4" />12 句詳情</button>
                  <button type="button" onClick={() => toggleFavorite(entry.id, entry.bookmarked)} aria-pressed={entry.bookmarked} className="rounded-lg border p-2 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950"><Bookmark className={`mx-auto mb-1 h-4 w-4 ${entry.bookmarked ? "fill-amber-500 text-amber-600" : ""}`} />{entry.bookmarked ? "已收藏" : "收藏"}</button>
                  <button type="button" onClick={() => toggleHard(entry.id, entry.feedback === "hard")} aria-pressed={entry.feedback === "hard"} className="rounded-lg border p-2 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950"><MessageCircleWarning className="mx-auto mb-1 h-4 w-4" />{entry.feedback === "hard" ? "取消回報" : "不好記"}</button>
                  <button type="button" onClick={() => discard(entry.id)} className="rounded-lg border p-2 text-xs font-bold text-red-700 hover:bg-red-50 dark:hover:bg-red-950"><Trash2 className="mx-auto mb-1 h-4 w-4" />淘汰</button>
                </div>
              </article>)}
            </div>
          )}
          {entries.length > 0 && visibleEntries.length === 0 && <p className="rounded-xl bg-muted p-5 text-center text-sm">這個科目還沒有保存的口訣。</p>}
          {detailItem && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="mnemonic-detail-title">
            <div className="mx-auto max-w-4xl rounded-2xl bg-background p-5 shadow-2xl sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-primary">完整參考答案 · 4 模式 × 3 風格</p><h2 id="mnemonic-detail-title" className="font-display text-2xl font-extrabold">{detailItem.term}</h2><p className="text-sm text-muted-foreground">{detailItem.hint}{detailItem.extra ? ` — ${detailItem.extra}` : ""}</p></div><button type="button" onClick={() => setDetailItemId(null)} aria-label="關閉題目詳情" className="rounded-full border p-2"><X /></button></div>
              <div className="grid gap-4 md:grid-cols-2">{MNEMONIC_STYLES.map(style => <section key={style.id} className="rounded-xl border-2 border-amber-200 p-4"><h3 className="mb-3 font-display font-bold">{style.emoji} {style.name}</h3>{getMnemonicReferences(detailItem, style).map((reference, index) => <div key={reference} className="mb-2 rounded-lg bg-muted/70 p-3 text-sm"><div className="flex items-center justify-between gap-2"><b>{{0:"🌱 簡單",1:"🤯 荒謬",2:"🎯 考試型"}[index as 0|1|2]}</b><button type="button" onClick={() => { saveMnemonicEntry({ itemId: detailItem.id, term: detailItem.term, hint: detailItem.hint, styleId: style.id, styleName: style.name, mnemonic: reference, rating: 0, bookmarked: true }); refresh(); toast.success("已收藏這句參考答案"); }} className="rounded-full border border-amber-300 bg-background px-2 py-1 text-xs font-bold text-amber-800 dark:text-amber-200"><Bookmark className="mr-1 inline h-3 w-3" />收藏</button></div><p className="mt-1">{reference}</p></div>)}</section>)}</div>
            </div>
          </div>}
          {unlockedBadge && <div className="fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-orange-950/65 p-4" role="dialog" aria-modal="true" aria-labelledby="badge-unlocked-title">
            <div className="relative w-full max-w-sm animate-[bounce_.7s_ease-out_1] rounded-3xl border-4 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-200 p-7 text-center text-orange-950 shadow-2xl">
              <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-3xl"><span className="absolute left-5 top-8 animate-bounce text-2xl">✨</span><span className="absolute right-7 top-16 animate-pulse text-3xl">🎉</span><span className="absolute bottom-16 left-10 animate-pulse text-2xl">⭐</span></div>
              <p className="text-sm font-black uppercase tracking-widest text-orange-700">badge unlocked!</p><div className="my-3 text-8xl drop-shadow-lg">{unlockedBadge.emoji}</div>
              <h2 id="badge-unlocked-title" className="font-display text-3xl font-extrabold">{unlockedBadge.name}</h2><p className="mt-2">連續完成 <b>{streak} 天</b>弱項訓練</p>
              <div className="relative z-10 mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={async () => { const result = await shareStreakBadge(unlockedBadge, streak); if (result === "shared") toast.success("勳章分享卡已送出"); if (result === "downloaded") toast.success("勳章分享卡已下載"); }} className="rounded-full bg-orange-700 px-4 py-2 font-bold text-white"><Share2 className="mr-1 inline h-4 w-4" />分享勳章</button><button type="button" onClick={() => setUnlockedBadge(null)} className="rounded-full border-2 border-orange-500 bg-white/70 px-4 py-2 font-bold">收下勳章</button></div>
            </div>
          </div>}
        </div>
      )}
    </section>
  );
}
